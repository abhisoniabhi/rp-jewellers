import React, { useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocation } from 'wouter';

const FirebaseLoginPage: React.FC = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const {
    emailLogin,
    emailSignUp,
    phoneLogin,
    confirmOtp,
    firebaseUser,
    firebaseLoading
  } = useAuth();
  
  // Email login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Phone login state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  
  // Handle email login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoggingIn(true);
    try {
      await emailLogin(email, password);
      setLocation('/');
    } catch (error: any) {
      console.error('Login error:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  // Handle email signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoggingIn(true);
    try {
      await emailSignUp(email, password);
      setLocation('/');
    } catch (error: any) {
      console.error('Signup error:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  // Handle phone login
  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) {
      toast({
        title: "Missing phone number",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }
    
    // Format phone number to E.164 format if not already
    const formattedPhoneNumber = phoneNumber.startsWith('+')
      ? phoneNumber
      : `+${phoneNumber}`;
    
    setIsSendingOtp(true);
    try {
      // The 'recaptcha-container' div must exist in the DOM
      await phoneLogin(formattedPhoneNumber, 'recaptcha-container');
      setIsOtpSent(true);
    } catch (error: any) {
      console.error('Phone login error:', error);
    } finally {
      setIsSendingOtp(false);
    }
  };
  
  // Handle OTP verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      toast({
        title: "Missing OTP",
        description: "Please enter the verification code",
        variant: "destructive",
      });
      return;
    }
    
    setIsVerifyingOtp(true);
    try {
      await confirmOtp(otp);
      setLocation('/');
    } catch (error: any) {
      console.error('OTP verification error:', error);
    } finally {
      setIsVerifyingOtp(false);
    }
  };
  
  // Redirect if already logged in
  if (firebaseUser && !firebaseLoading) {
    setLocation('/');
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Choose your preferred login method
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="phone">Phone</TabsTrigger>
            </TabsList>
            
            {/* Email/Password Login Tab */}
            <TabsContent value="email">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <Button 
                    onClick={handleEmailLogin} 
                    disabled={isLoggingIn}
                  >
                    {isLoggingIn ? 'Signing in...' : 'Sign in with Email'}
                  </Button>
                  <Button 
                    onClick={handleSignup} 
                    variant="outline" 
                    disabled={isLoggingIn}
                  >
                    {isLoggingIn ? 'Creating account...' : 'Create new account'}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            {/* Phone Login Tab */}
            <TabsContent value="phone">
              <div className="space-y-4">
                {!isOtpSent ? (
                  // Phone number input and OTP request
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 9876543210"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                    
                    {/* This div is needed for the reCAPTCHA */}
                    <div id="recaptcha-container"></div>
                    
                    <Button 
                      onClick={handlePhoneLogin} 
                      disabled={isSendingOtp}
                      className="w-full"
                    >
                      {isSendingOtp ? 'Sending code...' : 'Send verification code'}
                    </Button>
                  </div>
                ) : (
                  // OTP verification
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp">Verification Code</Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="123456"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Button 
                        onClick={handleVerifyOtp} 
                        disabled={isVerifyingOtp}
                        className="w-full"
                      >
                        {isVerifyingOtp ? 'Verifying...' : 'Verify code'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsOtpSent(false)}
                        className="w-full"
                      >
                        Try different number
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Secure login powered by Firebase
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default FirebaseLoginPage;