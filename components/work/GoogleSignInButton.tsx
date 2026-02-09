import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../src/lib/work/AuthContext';

interface GoogleSignInButtonProps {
  label?: string;
  className?: string;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  label = 'Sign in with Google',
  className = '',
}) => {
  const { renderGoogleButton, isGsiLoaded, devMode } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Render Google's native button once loaded
    if (isGsiLoaded && buttonRef.current) {
      // Clear any previous button
      buttonRef.current.innerHTML = '';
      renderGoogleButton(buttonRef.current);
    }
  }, [isGsiLoaded, renderGoogleButton]);

  if (devMode) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Container for Google's native button */}
      <div ref={buttonRef} className="flex justify-center" />
      {/* Loading state */}
      {!isGsiLoaded && (
        <div className="flex justify-center items-center h-[44px]">
          <span className="w-5 h-5 border-2 border-slate-600 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default GoogleSignInButton;
