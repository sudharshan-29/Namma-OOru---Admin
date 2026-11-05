import { ref, uploadBytes } from 'firebase/storage';
import { storage, auth } from '../lib/firebase';

export interface UploadResult {
  storagePath: string;
  secureMediaUrl: string;
  fileName: string;
  fileSizeBytes: number;
}

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Validates file type and size on client.
 */
export function validateMediaUpload(file: { type: string; size: number; name?: string }): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid image format (${file.type || 'unknown'}). Allowed formats: JPEG, PNG, WEBP.`,
    };
  }
  if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 10MB.`,
    };
  }
  return { valid: true };
}

/**
 * Validates and securely uploads a civic complaint photo or resolution evidence to Cloud Storage.
 * Validates file type and size on BOTH the client and trusted backend.
 * Uses secure server-controlled paths without exposing raw download tokens or unrestricted URLs.
 */
export async function uploadComplaintPhoto(
  file: File,
  complaintId: string,
  folder: 'complaints' | 'resolution' = 'complaints'
): Promise<UploadResult> {
  // 1. Client-Side Validation
  const clientValidation = validateMediaUpload(file);
  if (!clientValidation.valid) {
    throw new Error(clientValidation.error);
  }

  // 2. Strict Authentication: Must have verified Firebase Auth user
  if (!auth.currentUser) {
    throw new Error('Authentication required: You must be logged in to upload media to Namma Ooru.');
  }
  const token = await auth.currentUser.getIdToken();

  // 3. Read full file binary bytes for trusted server-side signature verification (Fail Closed)
  let fileBase64 = '';
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    fileBase64 = btoa(binary);
  } catch {
    throw new Error('Failed to read file binary buffer for security validation.');
  }

  // 4. Trusted Backend Authorization and Validation (FAIL CLOSED)
  const valRes = await fetch('/api/upload/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      mimeType: file.type,
      fileSizeBytes: file.size,
      fileName: file.name,
      fileBase64,
      complaintId,
      folder,
    }),
  });

  if (!valRes.ok) {
    let errorDetail = `Upload rejected (HTTP ${valRes.status})`;
    try {
      const errJson = await valRes.json();
      if (errJson.error) errorDetail = errJson.error;
    } catch {
      // ignore
    }
    // FAIL CLOSED: Never fall back to a client-generated path after a validation error!
    throw new Error(`Upload authorization failed: ${errorDetail}`);
  }

  const valData = await valRes.json();
  if (!valData.valid || !valData.storagePath) {
    // FAIL CLOSED: Must have backend-authorized path
    throw new Error(valData.error || 'Upload authorization failed: Storage path not provisioned by backend.');
  }

  const storagePath: string = valData.storagePath;
  const fileRef = ref(storage, storagePath);

  // 5. Protected metadata
  const metadata = {
    contentType: file.type,
    customMetadata: {
      complaintId,
      uploadedBy: auth.currentUser.uid,
      uploadedAt: new Date().toISOString(),
      folder,
      isRedacted: 'false',
    },
  };

  // 6. Upload to protected Storage bucket
  await uploadBytes(fileRef, file, metadata);

  // 7. Route media through authenticated media proxy endpoint
  const secureMediaUrl = `/api/media/complaint/${complaintId}/${folder === 'complaints' ? 'original' : 'resolution'}`;

  return {
    storagePath,
    secureMediaUrl,
    fileName: file.name,
    fileSizeBytes: file.size,
  };
}

/**
 * Helper to get an authorized image URL for a complaint
 */
export function getAuthorizedImageUrl(
  complaintId: string,
  type: 'original' | 'resolution' = 'original'
): string {
  return `/api/media/complaint/${encodeURIComponent(complaintId)}/${type}`;
}
