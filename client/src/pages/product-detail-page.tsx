import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Product, Collection, Rate, Setting } from "@shared/schema";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Star, Heart, Award, Share2, Receipt, MapPin, MessageSquare, ShoppingBag } from "lucide-react";
import { InvoiceGenerator } from "@/components/invoice/invoice-generator-new";
import { useToast } from "@/hooks/use-toast";

export default function ProductDetailPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { productId } = useParams<{ productId: string }>();
  
  // Fetch the specific product
  const { 
    data: product, 
    isLoading: productLoading, 
    error: productError 
  } = useQuery<Product>({
    queryKey: ["/api/products", Number(productId)],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) throw new Error("Failed to fetch product");
      return res.json();
    }
  });
  
  // If we have a product, fetch its collection
  const { 
    data: collection, 
    isLoading: collectionLoading 
  } = useQuery<Collection>({
    queryKey: ["/api/collections", product?.collectionId],
    enabled: !!product?.collectionId,
    queryFn: async () => {
      const res = await fetch(`/api/collections/${product?.collectionId}`);
      if (!res.ok) throw new Error("Failed to fetch collection");
      return res.json();
    }
  });
  
  // Fetch rates for invoice calculation
  const {
    data: rates,
    isLoading: ratesLoading
  } = useQuery<Rate[]>({
    queryKey: ["/api/rates"],
  });
  
  // Fetch store settings
  const {
    data: settings,
    isLoading: settingsLoading
  } = useQuery({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    }
  });
  
  const isLoading = productLoading || collectionLoading || ratesLoading || settingsLoading;
  
  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow bg-gray-50">
          <div className="container mx-auto px-4 py-6">
            <div className="mb-4">
              <Skeleton className="h-8 w-24" />
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="aspect-square w-full">
                <Skeleton className="h-full w-full" />
              </div>
              <div className="p-4">
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-6 w-1/2 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </main>
        <BottomNavigation />
      </div>
    );
  }
  
  // Handle error state
  if (productError || !product) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow bg-gray-50 flex items-center justify-center">
          <div className="text-center p-4">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Product Not Found</h1>
            <p className="text-gray-600 mb-4">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => setLocation("/")} variant="outline">
              Return to Home
            </Button>
          </div>
        </main>
        <BottomNavigation />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow bg-gray-50">
        <div className="container mx-auto px-2 py-2 pb-16">
          {/* Back navigation */}
          <div className="mb-2">
            <Button 
              variant="ghost" 
              className="flex items-center text-amber-800 hover:text-amber-600 p-0 h-auto"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-2 w-2 mr-1" />
              <span className="text-[9px]">Back</span>
            </Button>
          </div>
          
          {/* Product image and basic info */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-2">
            <div className="relative">
              <div className="aspect-square w-full max-h-[200px] sm:max-h-[250px]">
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Badges overlay */}
              <div className="absolute top-2 right-2 flex flex-col gap-1">
                {product.featured === 1 && (
                  <Badge className="bg-amber-500 text-white border-none text-[9px]">
                    Featured
                  </Badge>
                )}
                {product.inStock === 1 ? (
                  <Badge className="bg-green-500 text-white border-none text-[9px]">
                    In Stock
                  </Badge>
                ) : (
                  <Badge className="bg-red-500 text-white border-none text-[9px]">
                    Out of Stock
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="p-2">
              <h1 className="text-sm font-bold text-amber-800">{product.name}</h1>
              
              {/* Collection tag */}
              {collection && (
                <Link href={`/collections/${collection.id}`}>
                  <div className="inline-block cursor-pointer mt-1">
                    <Badge variant="outline" className="text-[9px] bg-amber-50 border-amber-200 text-amber-800">
                      {collection.name}
                    </Badge>
                  </div>
                </Link>
              )}
              
              {/* Price and details in a flex container */}
              <div className="mt-1 flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-amber-600">{product.price}%</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.weight > 0 && (
                      <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-800 text-[9px]">
                        {product.weight}g
                      </Badge>
                    )}
                    {product.category && (
                      <Badge variant="outline" className="bg-green-50 border-green-200 text-green-800 text-[9px]">
                        {product.category}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <Button size="icon" variant="outline" className="rounded-full h-6 w-6 border-amber-200">
                    <Heart className="h-3 w-3 text-red-500" />
                  </Button>
                  <Button size="icon" variant="outline" className="rounded-full h-6 w-6 border-amber-200">
                    <Share2 className="h-3 w-3 text-blue-500" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Product description */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden p-2 mb-2">
            <h2 className="text-[11px] font-semibold text-amber-800 mb-1">Description</h2>
            <p className="text-[9px] text-gray-700">
              {product.description || "No description available for this product."}
            </p>
          </div>
          
          {/* Product features */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden p-2 mb-2">
            <h2 className="text-[11px] font-semibold text-amber-800 mb-1">Features</h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1">
                <Award className="h-2 w-2 text-amber-600" />
                <span className="text-[9px]">Premium Quality</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-2 w-2 text-amber-600" />
                <span className="text-[9px]">Hallmarked</span>
              </div>
            </div>
          </div>
          
          {/* Related collection */}
          {collection && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden p-2 mb-2">
              <h2 className="text-[11px] font-semibold text-amber-800 mb-1">From Collection</h2>
              <div className="flex items-center gap-2">
                <img 
                  src={collection.imageUrl} 
                  alt={collection.name} 
                  className="w-10 h-10 object-cover rounded-lg"
                />
                <div>
                  <h3 className="font-medium text-amber-800 text-[9px]">{collection.name}</h3>
                  <p className="text-[9px] text-gray-500 line-clamp-1">{collection.description}</p>
                  <Link href={`/collections/${collection.id}`}>
                    <span className="text-[9px] text-amber-600 hover:underline cursor-pointer">
                      View Collection
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          {/* Invoice Generator */}
          {rates && rates.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden p-2 mb-2">
              <h2 className="text-[11px] font-semibold text-amber-800 mb-1">
                <div className="flex items-center gap-1">
                  <Receipt className="h-2 w-2 text-amber-600" />
                  <span>For Jewellers</span>
                </div>
              </h2>
              <p className="text-[9px] text-gray-700 mb-1">
                Generate a professional invoice for this product with your shop details and current gold rates.
              </p>
              <InvoiceGenerator product={product} collection={collection} rates={rates} />
            </div>
          )}
          
          {/* Add to Order Button */}
          <div className="fixed bottom-16 left-0 right-0 px-2 z-10">
            <Button 
              className="w-full bg-amber-500 hover:bg-amber-600 text-white h-8 text-[10px] shadow-md"
              onClick={() => {
                setLocation(`/order?productId=${product.id}`);
                toast({
                  title: "Added to order",
                  description: `${product.name} has been added to your order.`,
                });
              }}
            >
              <ShoppingBag className="h-3 w-3 mr-1" />
              Add to Order
            </Button>
          </div>
          
          {/* Call to action buttons */}
          <div className="mt-3 mb-12">
            <div className="container mx-auto flex gap-2">
              <Button 
                className="w-1/2 bg-amber-600 hover:bg-amber-700 h-7 text-[9px]"
                onClick={() => {
                  // Get the WhatsApp number from settings, or use fallback
                  let whatsappNumber = "919876543210"; // Default fallback
                  
                  if (settings && settings.length > 0) {
                    const whatsappSetting = settings.find((s: Setting) => s.key === "whatsappNumber");
                    if (whatsappSetting) {
                      whatsappNumber = whatsappSetting.value.replace(/\+/g, ''); // Remove + if present
                    }
                  }
                  
                  // Get store name if available from settings
                  let storeName = "the jeweler";
                  if (settings && settings.length > 0) {
                    const storeNameSetting = settings.find((s: Setting) => s.key === "storeName");
                    if (storeNameSetting) {
                      storeName = storeNameSetting.value;
                    }
                  }
                  
                  // Create WhatsApp message with product details
                  const message = `Hi ${storeName}, I'm interested in the ${product.name}. Could you provide more information?`;
                  const encodedMessage = encodeURIComponent(message);
                  
                  // Open WhatsApp with the pre-filled message
                  window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
                }}
              >
                <MessageSquare className="h-2 w-2 mr-1" />
                Inquire Now
              </Button>
              <Button 
                className="w-1/2 h-7 text-[9px]" 
                variant="outline"
                onClick={() => {
                  // Get the store location from settings, or use fallback
                  if (settings && settings.length > 0) {
                    const locationSetting = settings.find((s: Setting) => s.key === "storeLocation");
                    
                    if (locationSetting && locationSetting.value) {
                      // Check if it's a Google Maps URL
                      if (locationSetting.value.includes('google.com/maps')) {
                        window.open(locationSetting.value, '_blank');
                      } 
                      // Check if it's a coordinate pair
                      else if (locationSetting.value.includes(',')) {
                        window.open(`https://www.google.com/maps?q=${locationSetting.value}`, '_blank');
                      }
                      // Otherwise search by address
                      else {
                        const addressSetting = settings.find((s: Setting) => s.key === "storeAddress");
                        const searchQuery = addressSetting ? addressSetting.value : "jewelry shop";
                        window.open(`https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`, '_blank');
                      }
                    } else {
                      // Fallback to default search
                      window.open('https://www.google.com/maps/search/jewelry+shop', '_blank');
                    }
                  } else {
                    // Fallback if no settings
                    window.open('https://www.google.com/maps/search/jewelry+shop', '_blank');
                  }
                }}
              >
                <MapPin className="h-2 w-2 mr-1" />
                Visit Shop
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
}