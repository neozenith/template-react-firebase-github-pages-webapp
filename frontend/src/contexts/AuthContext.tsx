import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import {
  extractTokens,
  parseGrantedScopes,
  storeToken,
  getStoredToken,
  clearStoredToken,
  type GrantedScopes,
} from '@/lib/google-auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  accessToken: string | null;
  grantedScopes: GrantedScopes | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components -- Standard React pattern: useAuth hook must be co-located with AuthProvider
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Initialize accessToken from sessionStorage to avoid setState in effect
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    const storedToken = getStoredToken();
    if (storedToken) {
      console.log('🔑 Found stored access token during init');
    }
    return storedToken;
  });
  const [grantedScopes, setGrantedScopes] = useState<GrantedScopes | null>(
    null
  );

  useEffect(() => {
    console.log('🔵 AuthContext: Initializing...');
    console.log('📍 Current URL:', window.location.href);
    console.log('📍 Origin:', window.location.origin);
    console.log('📍 Pathname:', window.location.pathname);

    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        console.log('🔄 onAuthStateChanged fired');
        if (user) {
          console.log('✅ User authenticated:', {
            email: user.email,
            uid: user.uid,
            displayName: user.displayName,
            providerId: user.providerData[0]?.providerId,
          });
        } else {
          console.log('⚪ No user authenticated');
          // Clear token when user signs out
          clearStoredToken();
          setAccessToken(null);
          setGrantedScopes(null);
          // Check if there's an error in localStorage
          try {
            const keys = Object.keys(localStorage);
            const firebaseKeys = keys.filter((k) => k.includes('firebase'));
            console.log('🔍 Firebase localStorage keys:', firebaseKeys);
          } catch (e) {
            console.error('❌ Error checking localStorage:', e);
          }
        }
        setUser(user);
        setLoading(false);
      },
      (error) => {
        console.error('❌ onAuthStateChanged error:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      console.log('🔵 Initiating Google sign-in popup with extended scopes...');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('✅ Popup sign-in successful:', result.user.email);

      // Extract and store OAuth tokens
      const tokens = extractTokens(result);
      if (tokens?.accessToken) {
        console.log('🔑 Access token obtained');
        storeToken(tokens.accessToken);
        setAccessToken(tokens.accessToken);
      } else {
        console.warn('⚠️ No access token in credential result');
      }

      // Parse granted scopes
      const scopes = parseGrantedScopes(result);
      console.log('📋 Granted scopes:', scopes);
      setGrantedScopes(scopes);
    } catch (error) {
      console.error('❌ Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      clearStoredToken();
      setAccessToken(null);
      setGrantedScopes(null);
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    accessToken,
    grantedScopes,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
