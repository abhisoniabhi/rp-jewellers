import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Send, Key, Shield, RefreshCw } from "lucide-react";
import rpLogo from "../assets/rp-logo.jpg";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const auth = useAuth();
  
  // Form states
  const [shopName, setShopName] = useState("");
  const [userName, setUserName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(30);
  
  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Move to next input field if current field is filled
    if (value && index < 3) {
      otpInputs.current[index + 1]?.focus();
    }
  };
  
  // Handle key press in OTP input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Move to previous input field on backspace if current field is empty
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };
  
  // Handle send OTP
  const handleSendOtp = async () => {
    // Validate form fields
    if (!shopName.trim()) {
      toast({
        title: "Shop name required",
        description: "Please enter your shop name to continue.",
        variant: "destructive",
      });
      return;
    }
    
    if (!userName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to continue.",
        variant: "destructive",
      });
      return;
    }
    
    if (!mobileNumber.trim() || !/^\d{10}$/.test(mobileNumber)) {
      toast({
        title: "Valid mobile number required",
        description: "Please enter a valid 10-digit mobile number.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Send OTP via API
      const response = await apiRequest(
        "POST",
        "/api/otp/send", 
        {
          mobileNumber,
          shopName,
          userName,
        }
      );
      
      const data = await response.json();
      
      setOtpSent(true);
      setIsLoading(false);
      
      toast({
        title: "OTP sent successfully",
        description: "A verification code has been sent to your mobile number.",
      });
      
      // Start countdown for resend
      setResendDisabled(true);
      setCountdown(30);
      
      // Only in demo mode - in production we would never receive OTP in response
      // This simulates receiving an SMS with the OTP
      if (data.otp) {
        setTimeout(() => {
          const receivedOtp = data.otp.split("");
          setOtp(receivedOtp);
        }, 2000);
      }
    } catch (error: any) {
      setIsLoading(false);
      toast({
        title: "Failed to send OTP",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  };
  
  // Handle resend OTP
  const handleResendOtp = async () => {
    if (resendDisabled) return;
    
    setIsLoading(true);
    
    try {
      // Send OTP via API again
      const response = await apiRequest(
        "POST",
        "/api/otp/send",
        {
          mobileNumber,
          shopName,
          userName,
        }
      );
      
      const data = await response.json();
      setIsLoading(false);
      setResendDisabled(true);
      setCountdown(30);
      
      toast({
        title: "OTP resent",
        description: "A new verification code has been sent to your mobile number.",
      });
      
      // Only in demo mode - in production we would never receive OTP in response
      if (data.otp) {
        setTimeout(() => {
          const receivedOtp = data.otp.split("");
          setOtp(receivedOtp);
        }, 2000);
      }
    } catch (error: any) {
      setIsLoading(false);
      toast({
        title: "Failed to resend OTP",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  };
  
  // Handle verify OTP
  const handleVerifyOtp = async () => {
    const otpValue = otp.join("");
    
    if (otpValue.length !== 4) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the complete 4-digit verification code.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Verify OTP via API
      const response = await apiRequest(
        "POST",
        "/api/otp/verify",
        {
          mobileNumber,
          otp: otpValue,
        }
      );
      
      const data = await response.json();
      
      setOtpVerified(true);
      setIsLoading(false);
      
      toast({
        title: "Verification successful",
        description: "Your mobile number has been verified.",
      });
      
      // Wait a moment before redirecting
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error: any) {
      setIsLoading(false);
      toast({
        title: "Verification failed",
        description: error.message || "Invalid OTP. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Countdown timer for resend button
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (resendDisabled && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setResendDisabled(false);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendDisabled, countdown]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-amber-200 shadow-lg overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300" />
          
          <CardHeader className="text-center pb-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex justify-center mb-4"
            >
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-amber-300 shadow-md">
                <img src={rpLogo} alt="RP Jewellers Logo" className="w-full h-full object-cover" />
              </div>
            </motion.div>
            
            <CardTitle className="text-2xl font-bold text-amber-800">RP Jewellers</CardTitle>
            <CardDescription className="text-amber-600">
              {otpSent ? (otpVerified ? "Login Successful" : "Verify Your Number") : "Login to Your Account"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <AnimatePresence mode="wait">
              {!otpSent ? (
                <motion.div
                  key="login-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="shop-name">Shop Name</Label>
                    <Input
                      id="shop-name"
                      type="text"
                      placeholder="Enter your shop name"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="border-amber-200 focus-visible:ring-amber-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="user-name">Your Name</Label>
                    <Input
                      id="user-name"
                      type="text"
                      placeholder="Enter your name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="border-amber-200 focus-visible:ring-amber-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="mobile-number">Mobile Number</Label>
                    <Input
                      id="mobile-number"
                      type="tel"
                      placeholder="Enter 10-digit mobile number"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="border-amber-200 focus-visible:ring-amber-500"
                    />
                  </div>
                  
                  <Button
                    className="w-full bg-amber-500 hover:bg-amber-600"
                    onClick={handleSendOtp}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send OTP
                      </>
                    )}
                  </Button>
                </motion.div>
              ) : !otpVerified ? (
                <motion.div
                  key="otp-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-2">
                    <p className="text-sm text-gray-600">
                      We've sent a 4-digit verification code to
                    </p>
                    <p className="font-medium text-amber-800">+91 {mobileNumber}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="otp-input">Enter Verification Code</Label>
                    <div className="flex justify-center gap-2">
                      {[0, 1, 2, 3].map((index) => (
                        <Input
                          key={index}
                          ref={(el) => (otpInputs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={otp[index]}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index)}
                          className="w-12 h-12 text-lg text-center border-amber-200 focus-visible:ring-amber-500"
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                      onClick={handleResendOtp}
                      disabled={isLoading || resendDisabled}
                    >
                      {resendDisabled ? (
                        <span className="flex items-center">
                          <RefreshCw className="mr-1 h-3 w-3" />
                          Resend in {countdown}s
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <RefreshCw className="mr-1 h-3 w-3" />
                          Resend OTP
                        </span>
                      )}
                    </Button>
                  </div>
                  
                  <Button
                    className="w-full bg-amber-500 hover:bg-amber-600"
                    onClick={handleVerifyOtp}
                    disabled={isLoading || otp.join("").length !== 4}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Key className="mr-2 h-4 w-4" />
                        Verify & Login
                      </>
                    )}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4"
                  >
                    <Shield className="h-8 w-8 text-green-600" />
                  </motion.div>
                  
                  <h3 className="text-xl font-medium text-green-700 mb-2">
                    Verification Successful
                  </h3>
                  <p className="text-gray-600 mb-4">
                    You'll be redirected to the home page shortly...
                  </p>
                  
                  <div className="flex justify-center">
                    <div className="w-8 h-8">
                      <svg
                        className="animate-spin h-8 w-8 text-amber-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}