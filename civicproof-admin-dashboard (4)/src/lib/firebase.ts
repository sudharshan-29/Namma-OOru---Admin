import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize the Firebase app with the provisioned configuration
export const app = initializeApp(firebaseConfig);

// CRITICAL: The app requires firebaseConfig.firestoreDatabaseId when initializing getFirestore
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Firebase Authentication
export const auth = getAuth(app);

// Cloud Storage for Firebase
export const storage = getStorage(app);

// Test connection on startup as mandated by the Firebase skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection: Client is offline or Firestore is initializing.');
    }
  }
}

testConnection();

export default { app, db, auth, storage };
