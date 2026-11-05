import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import type { Complaint, NotificationRecord, SystemSettings } from '../types/civic';

/**
 * Fetch all complaints directly from Firestore with error handling
 */
export async function fetchFirestoreComplaints(): Promise<Complaint[]> {
  const collectionPath = 'complaints';
  try {
    const q = query(collection(db, collectionPath), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      ...(docSnap.data() as Complaint),
      id: docSnap.id,
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}

/**
 * Fetch a single complaint by ID with error handling
 */
export async function fetchFirestoreComplaintById(id: string): Promise<Complaint | null> {
  const docPath = `complaints/${id}`;
  try {
    const docSnap = await getDoc(doc(db, 'complaints', id));
    if (!docSnap.exists()) return null;
    return {
      ...(docSnap.data() as Complaint),
      id: docSnap.id,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
  }
}

/**
 * Real-time listener for complaints with error callback handling
 */
export function subscribeToFirestoreComplaints(
  onData: (complaints: Complaint[]) => void,
  onError?: (err: any) => void
) {
  const collectionPath = 'complaints';
  const q = query(collection(db, collectionPath));
  return onSnapshot(
    q,
    (snapshot) => {
      const records = snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as Complaint),
        id: docSnap.id,
      }));
      onData(records);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, collectionPath);
    }
  );
}

/**
 * Fetch system settings from Firestore
 */
export async function fetchFirestoreSettings(): Promise<SystemSettings | null> {
  const docPath = 'settings/system';
  try {
    const docSnap = await getDoc(doc(db, 'settings', 'system'));
    if (!docSnap.exists()) return null;
    return docSnap.data() as SystemSettings;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
  }
}
