import { useQuery } from "@tanstack/react-query";
import { Loader2, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { AdminPanel } from "@/components/admin/admin-panel-updated";
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
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow bg-gray-50">
        <div className="container mx-auto px-4 py-6">
          <Card className="mb-6 border-amber-200 shadow-md">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 border-b border-amber-200">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-6 w-6 text-amber-700" />
                <CardTitle className="text-amber-800">Admin Dashboard</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-700 mb-2">Welcome, <span className="font-semibold text-amber-900">{user?.username}</span></p>
              <p className="text-sm text-gray-500 mb-4">You have full access to update gold and silver rates</p>
              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={() => setIsAdminPanelOpen(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Update Rates
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="border-amber-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-amber-800">Gold Rate Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500">
                  {rates.filter(rate => rate.category === 'gold').length} gold rates available
                </p>
                <p className="text-xs text-gray-500">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-amber-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-amber-800">Silver Rate Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500">
                  {rates.filter(rate => rate.category === 'silver').length} silver rates available
                </p>
                <p className="text-xs text-gray-500">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </div>
          
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
