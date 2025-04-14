import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  auth, 
  signIn, 
  signUp, 
  signOut, 
  signInWithPhone, 
  createRecaptchaVerifier,
  onAuthStateChange,
  requestNotificationPermission
} from "../lib/firebase";
import { User as FirebaseUser, ConfirmationResult, RecaptchaVerifier } from "firebase/auth";

// Add phone-specific interfaces
interface PhoneLoginData {
  phoneNumber: string;
}

interface OtpVerificationData {
  otp: string;
}

type LoginData = Pick<InsertUser, "username" | "password">;

type AuthContextType = {
  // Original backend authentication
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
  
  // Firebase authentication
  firebaseUser: FirebaseUser | null;
  firebaseLoading: boolean;
  firebaseError: Error | null;
  
  // Email login
  emailLogin: (email: string, password: string) => Promise<FirebaseUser>;
  emailSignUp: (email: string, password: string) => Promise<FirebaseUser>;
  firebaseSignOut: () => Promise<void>;
  
  // Phone login
  phoneLogin: (phoneNumber: string, recaptchaContainer: string) => Promise<ConfirmationResult>;
  confirmOtp: (otp: string) => Promise<FirebaseUser | null>;
  
  // State management for phone auth flow
  confirmationResult: ConfirmationResult | null;
  recaptchaVerifier: RecaptchaVerifier | null;
  
  // Push notifications
  requestNotifications: () => Promise<string | null>;
  fcmToken: string | null;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [firebaseLoading, setFirebaseLoading] = useState<boolean>(true);
  const [firebaseError, setFirebaseError] = useState<Error | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  // Original backend authentication
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setFirebaseUser(user);
      setFirebaseLoading(false);
      
      // If user is authenticated with Firebase, we can request notification permission
      if (user) {
        requestNotifications();
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Function to request notifications
  const requestNotifications = async () => {
    try {
      const token = await requestNotificationPermission();
      if (token) {
        setFcmToken(token);
        
        // Here you could send this token to your backend
        // await apiRequest("POST", "/api/fcm-token", { token });
        
        console.log("FCM token stored:", token);
      }
      return token;
    } catch (error) {
      console.error("Error requesting notifications:", error);
      return null;
    }
  };

  // Backend login
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Firebase email login
  const emailLogin = async (email: string, password: string): Promise<FirebaseUser> => {
    try {
      const userCredential = await signIn(email, password);
      toast({
        title: "Login successful",
        description: `Welcome back, ${userCredential.user.email}!`,
      });
      return userCredential.user;
    } catch (error: any) {
      setFirebaseError(error);
      toast({
        title: "Firebase login failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const emailSignUp = async (email: string, password: string): Promise<FirebaseUser> => {
    try {
      const userCredential = await signUp(email, password);
      toast({
        title: "Account created",
        description: `Welcome, ${userCredential.user.email}!`,
      });
      return userCredential.user;
    } catch (error: any) {
      setFirebaseError(error);
      toast({
        title: "Firebase signup failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const firebaseSignOut = async (): Promise<void> => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error: any) {
      setFirebaseError(error);
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Phone authentication
  const phoneLogin = async (phoneNumber: string, recaptchaContainerId: string): Promise<ConfirmationResult> => {
    try {
      // Create recaptcha verifier
      const verifier = createRecaptchaVerifier(recaptchaContainerId);
      setRecaptchaVerifier(verifier);
      
      // Sign in with phone number
      const result = await signInWithPhone(phoneNumber, verifier);
      setConfirmationResult(result);
      
      toast({
        title: "OTP Sent",
        description: `Verification code sent to ${phoneNumber}`,
      });
      
      return result;
    } catch (error: any) {
      setFirebaseError(error);
      toast({
        title: "Phone verification failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const confirmOtp = async (otp: string): Promise<FirebaseUser | null> => {
    if (!confirmationResult) {
      toast({
        title: "Verification failed",
        description: "Please request a new verification code",
        variant: "destructive",
      });
      return null;
    }
    
    try {
      const result = await confirmationResult.confirm(otp);
      toast({
        title: "Phone verified",
        description: "You have successfully logged in",
      });
      return result.user;
    } catch (error: any) {
      setFirebaseError(error);
      toast({
        title: "Invalid code",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        // Original backend auth
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        
        // Firebase auth
        firebaseUser,
        firebaseLoading,
        firebaseError,
        
        // Email auth methods
        emailLogin,
        emailSignUp,
        firebaseSignOut,
        
        // Phone auth methods
        phoneLogin,
        confirmOtp,
        confirmationResult,
        recaptchaVerifier,
        
        // Push notifications
        requestNotifications,
        fcmToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  // Get the auth context but don't throw an error if it's not available
  const context = useContext(AuthContext);
  
  // If context is null, return a default value that won't break the app
  if (!context) {
    return {
      // Backend auth defaults
      user: null,
      isLoading: false,
      error: null,
      loginMutation: {} as UseMutationResult<SelectUser, Error, LoginData>,
      logoutMutation: {} as UseMutationResult<void, Error, void>,
      registerMutation: {} as UseMutationResult<SelectUser, Error, InsertUser>,
      
      // Firebase auth defaults
      firebaseUser: null,
      firebaseLoading: false,
      firebaseError: null,
      
      // Email auth methods
      emailLogin: async () => { throw new Error("Auth context not initialized"); },
      emailSignUp: async () => { throw new Error("Auth context not initialized"); },
      firebaseSignOut: async () => { throw new Error("Auth context not initialized"); },
      
      // Phone auth methods
      phoneLogin: async () => { throw new Error("Auth context not initialized"); },
      confirmOtp: async () => { throw new Error("Auth context not initialized"); },
      confirmationResult: null,
      recaptchaVerifier: null,
      
      // Push notifications
      requestNotifications: async () => null,
      fcmToken: null,
    } as AuthContextType;
  }
  
  return context;
}
