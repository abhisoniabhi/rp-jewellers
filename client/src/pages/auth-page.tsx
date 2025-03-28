import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { insertUserSchema } from "@shared/schema";
import { GemIcon, Check } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);
  
  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        setLocation("/");
      },
    });
  };
  
  const onRegisterSubmit = (data: RegisterFormData) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData, {
      onSuccess: () => {
        toast({
          title: "Registration successful",
          description: "Your account has been created.",
        });
        setLocation("/");
      },
    });
  };
  
  return (
    <div className="flex min-h-screen bg-gradient-to-b from-amber-50 to-amber-100">
      <div className="flex flex-col md:flex-row w-full">
        <div className="w-full md:w-1/2 p-4 flex items-center justify-center">
          <Card className="w-full max-w-md border-amber-200 shadow-md">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 border-b border-amber-200">
              <CardTitle className="text-2xl font-bold text-center text-amber-800">ShineRates</CardTitle>
              <CardDescription className="text-center text-amber-700">
                Login or register to access admin features
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-amber-100">
                  <TabsTrigger value="login" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">Login</TabsTrigger>
                  <TabsTrigger value="register" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Logging in..." : "Login"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                
                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Choose a username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Choose a password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirm your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit"
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? "Registering..." : "Register"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-amber-700 to-amber-900 text-white items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="bg-amber-300/20 p-6 rounded-lg border border-amber-300/30 backdrop-blur-sm mb-6">
              <GemIcon className="h-14 w-14 text-amber-300 mx-auto mb-4" />
              <h1 className="text-4xl font-playfair font-bold mb-4">ShineRates Premium</h1>
              <p className="text-xl mb-6">Stay updated with the latest gold and silver rates for your jewelry business</p>
            </div>
            <div className="flex flex-col space-y-6">
              <div className="flex items-center bg-amber-800/50 rounded-lg p-3">
                <div className="bg-amber-300 text-amber-900 rounded-full p-2 mr-3 flex items-center justify-center h-8 w-8">
                  <Check className="h-4 w-4" />
                </div>
                <span>Real-time rate updates</span>
              </div>
              <div className="flex items-center bg-amber-800/50 rounded-lg p-3">
                <div className="bg-amber-300 text-amber-900 rounded-full p-2 mr-3 flex items-center justify-center h-8 w-8">
                  <Check className="h-4 w-4" />
                </div>
                <span>Admin panel for rate management</span>
              </div>
              <div className="flex items-center bg-amber-800/50 rounded-lg p-3">
                <div className="bg-amber-300 text-amber-900 rounded-full p-2 mr-3 flex items-center justify-center h-8 w-8">
                  <Check className="h-4 w-4" />
                </div>
                <span>Share rates with customers easily</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
