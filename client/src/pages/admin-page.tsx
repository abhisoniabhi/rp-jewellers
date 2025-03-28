import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { AdminPanel } from "@/components/admin/admin-panel";
import { RateInfo } from "@/components/ui/rate-card";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";

export default function AdminPage() {
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const { data: rates, isLoading } = useQuery<RateInfo[]>({
    queryKey: ["/api/rates"],
  });

  useEffect(() => {
    // If admin panel is closed, redirect to home
    if (!isAdminPanelOpen && rates) {
      setIsAdminPanelOpen(true);
    }
  }, [isAdminPanelOpen, rates]);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setLocation("/");
      }
    });
  };

  if (isLoading || !rates) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-burgundy-default" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow bg-gray-100">
        <div className="container mx-auto px-4 py-6">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-burgundy-default">Admin Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Welcome, {user?.username}</p>
              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={() => setIsAdminPanelOpen(true)}
                  className="bg-burgundy-default text-white"
                >
                  Update Rates
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <AdminPanel 
            rates={rates} 
            isOpen={isAdminPanelOpen} 
            onOpenChange={setIsAdminPanelOpen} 
          />
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
}
