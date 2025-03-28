import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { CategoryTabs } from "@/components/layout/category-tabs";
import { FeaturedCollection } from "@/components/layout/featured-collection";
import { RateCard, RateInfo } from "@/components/ui/rate-card";
import { ShareButton } from "@/components/ui/share-button";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { AdminTrigger } from "@/components/admin/admin-trigger";

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
      <CategoryTabs />
      <FeaturedCollection />
      
      <main className="flex-grow bg-gray-100">
        <div className="container mx-auto px-3 py-3">
          <div className="grid grid-cols-2 gap-3">
            {rates.map((rate) => (
              <RateCard key={rate.id} rate={rate} />
            ))}
          </div>
          
          <div className="mt-4 flex justify-center">
            <ShareButton />
          </div>
          
          <div className="mt-3 text-2xs text-gray-500 px-1">
            <p className="text-center">
              *Above displayed data is for information purpose only and hence cannot be used for legal purposes or doing any sort of transaction. Transactions above 50,000 is deal only via Bank mode (RTGS/NEFT/UPI/IMPS). If found misusing of our data, will eventually land accused into legal consequences.
            </p>
          </div>
        </div>
      </main>
      
      <BottomNavigation />
      
      {user && <AdminTrigger rates={rates} />}
    </div>
  );
}
