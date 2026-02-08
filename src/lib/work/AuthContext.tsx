import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface AuthUser {
  name: string;
  email: string;
  image?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: () => void;
  signOut: () => void;
  renderGoogleButton: (container: HTMLElement | null) => void;
  isGsiLoaded: boolean;
  devMode: boolean;
  devSignIn: (asAdmin?: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isLoading: true,
  signIn: () => {},
  signOut: () => {},
  renderGoogleButton: () => {},
  isGsiLoaded: false,
  devMode: false,
  devSignIn: () => {},
});

export const useAuth = () => useContext(AuthContext);

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const DEV_MODE = !GOOGLE_CLIENT_ID && import.meta.env.DEV;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
  const initializedRef = useRef(false);

  // Load persisted session
  useEffect(() => {
    try {
      const stored = localStorage.getItem('work_session');
      if (stored) {
        const session = JSON.parse(stored);
        setUser(session.user);
        setIsAdmin(session.isAdmin || false);
      }
    } catch {
      // ignore
    }
    setIsLoading(false);
  }, []);

  const handleCredentialResponse = useCallback(async (response: { credential: string }) => {
    try {
      // Decode the JWT to get user info (client-side decode for display)
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const decoded = JSON.parse(jsonPayload);

      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'sifat.morshed.dev@gmail.com';

      const session = {
        user: {
          name: decoded.name || decoded.email,
          email: decoded.email,
          image: decoded.picture,
        },
        isAdmin: decoded.email === adminEmail,
      };

      setUser(session.user);
      setIsAdmin(session.isAdmin);
      localStorage.setItem('work_session', JSON.stringify(session));
    } catch (err) {
      console.error('Auth error:', err);
    }
  }, []);

  // Initialize Google Identity Services
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn('[Work Auth] VITE_GOOGLE_CLIENT_ID is not set. Google Sign-In will not work.');
      setIsLoading(false);
      return;
    }

    if (initializedRef.current) return;

    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      // Already loaded
      // @ts-expect-error - Google Identity Services
      if (window.google?.accounts?.id) {
        // @ts-expect-error - Google Identity Services
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });
        initializedRef.current = true;
        setIsGsiLoaded(true);
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // @ts-expect-error - Google Identity Services
      window.google?.accounts?.id?.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      initializedRef.current = true;
      setIsGsiLoaded(true);
    };
    document.head.appendChild(script);
  }, [handleCredentialResponse]);

  // Render the actual Google Sign-In button into a container element
  const renderGoogleButton = useCallback(
    (container: HTMLElement | null) => {
      if (!container || !isGsiLoaded || !GOOGLE_CLIENT_ID) return;
      try {
        // @ts-expect-error - Google Identity Services
        window.google?.accounts?.id?.renderButton(container, {
          theme: 'filled_black',
          size: 'large',
          type: 'standard',
          text: 'signin_with',
          shape: 'rectangular',
          width: 300,
        });
      } catch (err) {
        console.error('Failed to render Google button:', err);
      }
    },
    [isGsiLoaded]
  );

  const signIn = () => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn('Google Client ID not configured');
      return;
    }
    // @ts-expect-error - Google Identity Services
    window.google?.accounts?.id?.prompt();
  };

  const signOut = () => {
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('work_session');
  };

  // Dev mode sign-in for local testing without Google OAuth
  const devSignIn = (asAdmin = false) => {
    const devUser: AuthUser = {
      name: asAdmin ? 'Dev Admin' : 'Dev Applicant',
      email: asAdmin ? (import.meta.env.VITE_ADMIN_EMAIL || 'sifat.morshed.dev@gmail.com') : 'dev-test@example.com',
    };
    setUser(devUser);
    setIsAdmin(asAdmin);
    localStorage.setItem('work_session', JSON.stringify({ user: devUser, isAdmin: asAdmin }));
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, isLoading, signIn, signOut, renderGoogleButton, isGsiLoaded, devMode: DEV_MODE, devSignIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
