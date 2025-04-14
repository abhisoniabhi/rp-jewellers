import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [location, setLocation] = useLocation();
  const { firebaseUser, firebaseLoading } = useAuth();

  useEffect(() => {
    // Don't redirect if we're loading auth state or already on the login page
    if (firebaseLoading || 
        location === '/firebase-login' ||
        location.startsWith('/login') || 
        location === '/auth') {
      return;
    }
    
    // Redirect to login if no user
    if (!firebaseUser) {
      setLocation('/firebase-login');
    }
  }, [firebaseUser, firebaseLoading, location, setLocation]);

  // If on login page and logged in, redirect to home
  useEffect(() => {
    if (firebaseUser && 
       !firebaseLoading && 
       (location === '/firebase-login' || location === '/login' || location === '/auth')) {
      setLocation('/');
    }
  }, [firebaseUser, firebaseLoading, location, setLocation]);

  // Return children as is - we handle redirects in the effects
  return <>{children}</>;
};