import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { RateCard, RateInfo } from "@/components/ui/rate-card";
import { ShareButton } from "@/components/ui/share-button";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { AdminTrigger } from "@/components/admin/admin-trigger";
import { ScreenshotGenerator } from "@/components/screenshot/screenshot-generator";
import { CustomRateGenerator } from "@/components/screenshot/custom-rate-generator";
import { FeaturedCollections } from "@/components/layout/featured-collections";
import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import { wsClient, WS_EVENTS } from "@/lib/websocket";
import rpLogo from "../assets/rp-logo.jpg";

export default function HomePage() {
  // Get auth safely using optional chaining
  const auth = useAuth();
  const user = auth?.user || null;
  
  // Fetch rates data
  const { data: rates, isLoading, error } = useQuery<RateInfo[]>({
    queryKey: ["/api/rates"],
  });
  
  // Set up real-time WebSocket listener for rate updates
  useEffect(() => {
    try {
      // Connect to WebSocket server
      wsClient.connect();
      
      // Subscribe to rate update events
      const unsubscribe = wsClient.subscribe(WS_EVENTS.RATE_UPDATED, (updatedRate) => {
        console.log("Received real-time rate update via WebSocket:", updatedRate);
        
        // Refetch all rates data
        queryClient.invalidateQueries({ queryKey: ["/api/rates"] });
      });
      
      // Cleanup subscription when component unmounts
      return () => {
        try {
          unsubscribe();
        } catch (error) {
          console.error("Error unsubscribing from WebSocket:", error);
        }
      };
    } catch (error) {
      console.error("Error setting up WebSocket connection:", error);
      // Continue without real-time updates - app will still work with regular polling
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-burgundy-default" />
      </div>
    );
  }

  if (error || !rates) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-xl font-bold text-red-600 mb-2">Error Loading Rates</h1>
        <p className="text-gray-700">{error?.message || "Failed to load rates data"}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      {/* Poster area with improved styles */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-3 border-b border-amber-100">
        <div className="container mx-auto">
          <div className="h-52 w-full bg-white rounded-lg shadow-md border border-amber-100 overflow-hidden">
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-yellow-50 p-4">
              <div className="text-center flex flex-col items-center">
                <img 
                  src={rpLogo} 
                  alt="RP Jewellers Logo" 
                  className="h-24 w-24 object-contain mb-2 rounded-full border-4 border-amber-300 p-1 shadow-lg" 
                />
                <h2 className="text-xl font-bold text-amber-800 mb-1">RP JEWELLERS</h2>
                <p className="text-amber-700">Today's Gold & Silver Rates</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <main className="flex-grow bg-gray-100">
        <div className="container mx-auto px-3 py-3 pb-24">
          <div className="grid grid-cols-2 gap-3">
            {rates.map((rate) => (
              <RateCard key={rate.id} rate={rate} />
            ))}
          </div>
          
          <div className="mt-4 flex justify-center gap-3 flex-wrap">
            <ShareButton />
            <ScreenshotGenerator rates={rates} />
            <CustomRateGenerator rates={rates} />
          </div>
          
          {/* Featured Collections */}
          <FeaturedCollections />
          
          {/* Admin quick-access floating button (for mobile) */}
          {user && <AdminTrigger rates={rates} />}
          
          <div className="mt-3 text-2xs text-gray-500 px-1">
            <p className="text-center">
              *Above displayed data is for information purpose only and hence cannot be used for legal purposes or doing any sort of transaction. Transactions above 50,000 is deal only via Bank mode (RTGS/NEFT/UPI/IMPS). If found misusing of our data, will eventually land accused into legal consequences.
            </p>
          </div>
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
}
