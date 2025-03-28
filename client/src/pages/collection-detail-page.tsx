import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";
import { Collection } from "@shared/schema";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Button } from "@/components/ui/button";
import { wsClient, WS_EVENTS } from "@/lib/websocket";
import { queryClient } from "@/lib/queryClient";

export default function CollectionDetailPage() {
  const [, params] = useRoute("/collections/:id");
  const collectionId = params?.id ? parseInt(params.id) : null;
  
  // Set up WebSocket connection for real-time updates
  useEffect(() => {
    wsClient.connect();
    
    return () => {
      // No need to disconnect since other components might be using it
    };
  }, []);
  
  const { 
    data: collection, 
    isLoading, 
    error 
  } = useQuery<Collection>({
    queryKey: ["/api/collections", collectionId],
    enabled: !!collectionId, // Only run query if we have an ID
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-xl font-bold text-red-600 mb-2">Error Loading Collection</h1>
        <p className="text-gray-700">{error?.message || "Collection not found"}</p>
        <Link href="/">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back Home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow bg-gray-100">
        <div className="container mx-auto px-3 py-4">
          <div className="mb-4 flex items-center">
            <Link href="/">
              <Button variant="ghost" className="p-0 mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-amber-800">{collection.name}</h1>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {collection.imageUrl && (
              <div className="h-48 w-full overflow-hidden">
                <img 
                  src={collection.imageUrl} 
                  alt={collection.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="p-4">
              <h2 className="text-xl font-bold text-amber-800 mb-2">{collection.name}</h2>
              
              {collection.description && (
                <p className="text-gray-700 mb-4">{collection.description}</p>
              )}
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-amber-50 p-3 rounded-md">
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="text-lg font-semibold text-amber-800">{collection.createdAt}</p>
                </div>
                
                <div className="bg-amber-50 p-3 rounded-md">
                  <p className="text-sm text-gray-500">Collection Type</p>
                  <p className="text-lg font-semibold text-amber-800">{collection.featured ? "Featured" : "Standard"}</p>
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button className="bg-amber-600 hover:bg-amber-700">
                  Contact For Inquiry
                </Button>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-bold text-amber-800 mb-3">Product Gallery</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {/* Sample product images - replace with actual data when available */}
              <div className="rounded-md overflow-hidden aspect-square shadow-sm hover:shadow-md transition-shadow">
                <img 
                  src={`${collection.imageUrl}?v=1`} 
                  alt={`${collection.name} Product 1`}
                  className="object-cover w-full h-full hover:scale-105 transition-transform" 
                />
              </div>
              <div className="rounded-md overflow-hidden aspect-square shadow-sm hover:shadow-md transition-shadow">
                <img 
                  src={`${collection.imageUrl}?v=2`} 
                  alt={`${collection.name} Product 2`}
                  className="object-cover w-full h-full hover:scale-105 transition-transform" 
                />
              </div>
              <div className="rounded-md overflow-hidden aspect-square shadow-sm hover:shadow-md transition-shadow">
                <img 
                  src={`${collection.imageUrl}?v=3`} 
                  alt={`${collection.name} Product 3`}
                  className="object-cover w-full h-full hover:scale-105 transition-transform" 
                />
              </div>
              <div className="rounded-md overflow-hidden aspect-square shadow-sm hover:shadow-md transition-shadow">
                <img 
                  src={`${collection.imageUrl}?v=4`} 
                  alt={`${collection.name} Product 4`}
                  className="object-cover w-full h-full hover:scale-105 transition-transform" 
                />
              </div>
              <div className="rounded-md overflow-hidden aspect-square shadow-sm hover:shadow-md transition-shadow">
                <img 
                  src={`${collection.imageUrl}?v=5`} 
                  alt={`${collection.name} Product 5`}
                  className="object-cover w-full h-full hover:scale-105 transition-transform" 
                />
              </div>
              <div className="rounded-md overflow-hidden aspect-square shadow-sm hover:shadow-md transition-shadow">
                <img 
                  src={`${collection.imageUrl}?v=6`} 
                  alt={`${collection.name} Product 6`}
                  className="object-cover w-full h-full hover:scale-105 transition-transform" 
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-bold text-amber-800 mb-3">Features</h3>
            <ul className="list-disc pl-5 text-gray-700 space-y-2">
              <li>Authentic jewelry designs</li>
              <li>Exquisite craftsmanship</li>
              <li>Quality assurance certificate</li>
              <li>Free maintenance for 1 year</li>
              <li>Premium collection with unique designs</li>
            </ul>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-bold text-amber-800 mb-3">Available Options</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-md shadow-sm">
                <h4 className="font-semibold text-amber-700">Custom Sizing</h4>
                <p className="text-sm text-gray-600">Available for all items</p>
              </div>
              <div className="bg-white p-3 rounded-md shadow-sm">
                <h4 className="font-semibold text-amber-700">Engraving</h4>
                <p className="text-sm text-gray-600">Available for selected items</p>
              </div>
              <div className="bg-white p-3 rounded-md shadow-sm">
                <h4 className="font-semibold text-amber-700">Gift Wrapping</h4>
                <p className="text-sm text-gray-600">Available for all orders</p>
              </div>
              <div className="bg-white p-3 rounded-md shadow-sm">
                <h4 className="font-semibold text-amber-700">Customization</h4>
                <p className="text-sm text-gray-600">Consult with our designers</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
}