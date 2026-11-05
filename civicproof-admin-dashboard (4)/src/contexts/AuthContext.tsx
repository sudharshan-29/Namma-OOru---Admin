import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

export interface AdminProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'superadmin' | 'admin';
  department?: string;
  isAuthorizedAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  adminProfile: AdminProfile | null;
  loading: boolean;
  isAuthorizedAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutAdmin: () => Promise<void>;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  adminProfile: null,
  loading: true,
  isAuthorizedAdmin: false,
  signInWithGoogle: async () => {},
  signOutAdmin: async () => {},
  authError: null,
});

// Authorized admin list / bootstrapped from runtime environment
const AUTHORIZED_ADMIN_EMAILS = [
  'dhivyadharshinivijay@gmail.com', // Current runtime user email
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setAuthError(null);

      if (firebaseUser) {
        setUser(firebaseUser);

        try {
          // Inspect server-verified claims and admins collection for profile resolution
          const userEmail = (firebaseUser.email || '').toLowerCase().trim();
          const isBootstrappedAdmin =
            AUTHORIZED_ADMIN_EMAILS.some((e) => e.toLowerCase() === userEmail) &&
            Boolean(firebaseUser.emailVerified);

          let hasCustomAdminClaim = false;
          try {
            const tokenResult = await firebaseUser.getIdTokenResult();
            hasCustomAdminClaim = Boolean(
              tokenResult.claims.admin ||
                tokenResult.claims.role === 'admin' ||
                tokenResult.claims.role === 'superadmin'
            );
          } catch {
            // ignore
          }

          let adminDocData: any = null;
          try {
            const adminDocRef = doc(db, 'admins', firebaseUser.uid);
            const adminSnap = await getDoc(adminDocRef);
            if (adminSnap.exists()) {
              adminDocData = adminSnap.data();
            }
          } catch (err) {
            console.warn('Admin collection lookup note:', err);
          }

          const hasAdminPrivilege =
            hasCustomAdminClaim ||
            isBootstrappedAdmin ||
            (adminDocData && ['admin', 'superadmin'].includes(adminDocData.role));

          setAdminProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || 'Admin Official',
            role: adminDocData?.role || (isBootstrappedAdmin ? 'superadmin' : 'admin'),
            department: adminDocData?.department || 'Greater Chennai Corporation',
            isAuthorizedAdmin: Boolean(hasAdminPrivilege),
          });
        } catch (error) {
          console.error('Error resolving admin profile:', error);
          setAuthError('Failed to verify administrator privileges with Firestore.');
        }
      } else {
        setUser(null);
        setAdminProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setAuthError(null);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      if (error?.code !== 'auth/popup-closed-by-user') {
        setAuthError(error.message || 'Failed to complete Google authentication');
      }
    }
  };

  const signOutAdmin = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setAdminProfile(null);
    } catch (error: any) {
      console.error('Sign out error:', error);
    }
  };

  const isAuthorizedAdmin = Boolean(adminProfile?.isAuthorizedAdmin);

  return (
    <AuthContext.Provider
      value={{
        user,
        adminProfile,
        loading,
        isAuthorizedAdmin,
        signInWithGoogle,
        signOutAdmin,
        authError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AuthContext);
