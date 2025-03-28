import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { RateCard, RateInfo } from "@/components/ui/rate-card";
import { ShareButton } from "@/components/ui/share-button";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { AdminTrigger } from "@/components/admin/admin-trigger";
import { ScreenshotGenerator } from "@/components/screenshot/screenshot-generator";
import { FeaturedCollections } from "@/components/layout/featured-collections";
import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import { wsClient, WS_EVENTS } from "@/lib/websocket";
import rpLogo from "../assets/rp-logo.jpg";

export default function HomePage() {
  // Use try/catch to handle potential auth context errors
  let user = null;
  try {
    const auth = useAuth();
    user = auth.user;
  } catch (err) {
    console.log("Auth not available yet");
  }
  
  const { data: rates, isLoading, error } = useQuery<RateInfo[]>({
    queryKey: ["/api/rates"],
  });
  
  // Set up real-time WebSocket listener for rate updates
  useEffect(() => {
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
      unsubscribe();
    };
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
      <div className="bg-gradient-to-r from-amber-100 to-yellow-100 p-4 border-b border-amber-200">
        <div className="container mx-auto">
          <div className="h-56 w-full bg-white rounded-lg shadow-lg border border-amber-200 overflow-hidden">
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 p-4 relative">
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-300 to-yellow-400"></div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-amber-300"></div>
              
              <div className="text-center flex flex-col items-center relative z-10">
                <div className="bg-white bg-opacity-70 rounded-full p-1.5 shadow-xl mb-3">
                  <img 
                    src={rpLogo} 
                    alt="RP Jewellers Logo" 
                    className="h-28 w-28 object-contain rounded-full border-4 border-amber-300 p-1 shadow-inner" 
                  />
                </div>
                <h2 className="text-2xl font-bold text-amber-800 mb-1 font-playfair tracking-wide">RP JEWELLERS</h2>
                <p className="text-amber-700 font-medium">Today's Gold & Silver Rates</p>
                <div className="mt-2">
                  <span className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-medium border border-amber-200">
                    Updated {new Date().toLocaleDateString('en-US', {day: 'numeric', month: 'short', year: 'numeric'})}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <main className="flex-grow bg-gray-100">
        <div className="container mx-auto px-3 py-3">
          <div className="grid grid-cols-2 gap-3">
            {rates.map((rate) => (
              <RateCard key={rate.id} rate={rate} />
            ))}
          </div>
          
          <div className="mt-4 flex justify-center gap-3">
            <ShareButton />
            <ScreenshotGenerator rates={rates} />
          </div>
          
          {/* Featured Collections */}
          <FeaturedCollections />
          
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
