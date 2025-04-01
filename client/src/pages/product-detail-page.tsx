import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Product, Collection, Rate } from "@shared/schema";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Star, ShoppingCart, Heart, Award, Package, Shield, Share2, Receipt } from "lucide-react";
import { InvoiceGenerator } from "@/components/invoice/invoice-generator";

export default function ProductDetailPage() {
  const [, setLocation] = useLocation();
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
  
  const isLoading = productLoading || collectionLoading || ratesLoading;
  
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
        <div className="container mx-auto px-4 py-4 pb-24">
          {/* Back navigation */}
          <div className="mb-4">
            <Button 
              variant="ghost" 
              className="flex items-center text-amber-800 hover:text-amber-600 p-0 h-auto"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>Back</span>
            </Button>
          </div>
          
          {/* Product image and basic info */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
            <div className="relative">
              <div className="aspect-square w-full">
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Badges overlay */}
              <div className="absolute top-2 right-2 flex flex-col gap-2">
                {product.featured === 1 && (
                  <Badge className="bg-amber-500 text-white border-none">
                    Featured
                  </Badge>
                )}
                {product.inStock === 1 ? (
                  <Badge className="bg-green-500 text-white border-none">
                    In Stock
                  </Badge>
                ) : (
                  <Badge className="bg-red-500 text-white border-none">
                    Out of Stock
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="p-4">
              <h1 className="text-xl font-bold text-amber-800">{product.name}</h1>
              
              {/* Collection tag */}
              {collection && (
                <Link href={`/collections/${collection.id}`}>
                  <div className="inline-block cursor-pointer">
                    <Badge variant="outline" className="mt-1 text-xs bg-amber-50 border-amber-200 text-amber-800">
                      {collection.name}
                    </Badge>
                  </div>
                </Link>
              )}
              
              {/* Price and details in a flex container */}
              <div className="mt-4 flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-amber-600">{product.price}%</p>
                  <div className="flex gap-2">
                    {product.weight > 0 && (
                      <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-800">
                        {product.weight}g
                      </Badge>
                    )}
                    {product.karatType && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-none">
                        {product.karatType}
                      </Badge>
                    )}
                    {product.category && (
                      <Badge variant="outline" className="bg-green-50 border-green-200 text-green-800">
                        {product.category}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button size="icon" variant="outline" className="rounded-full h-10 w-10 border-amber-200">
                    <Heart className="h-5 w-5 text-red-500" />
                  </Button>
                  <Button size="icon" variant="outline" className="rounded-full h-10 w-10 border-amber-200">
                    <Share2 className="h-5 w-5 text-blue-500" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Product description */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden p-4 mb-4">
            <h2 className="text-lg font-semibold text-amber-800 mb-2">Description</h2>
            <p className="text-gray-700">
              {product.description || "No description available for this product."}
            </p>
          </div>
          
          {/* Product features */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden p-4 mb-4">
            <h2 className="text-lg font-semibold text-amber-800 mb-2">Features</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-600" />
                <span className="text-sm">Premium Quality</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-600" />
                <span className="text-sm">Hallmarked</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-600" />
                <span className="text-sm">1-Year Warranty</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-600" />
                <span className="text-sm">Gift Box Included</span>
              </div>
            </div>
          </div>
          
          {/* Related collection */}
          {collection && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden p-4 mb-4">
              <h2 className="text-lg font-semibold text-amber-800 mb-2">From Collection</h2>
              <div className="flex items-center gap-2">
                <img 
                  src={collection.imageUrl} 
                  alt={collection.name} 
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div>
                  <h3 className="font-medium text-amber-800">{collection.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-1">{collection.description}</p>
                  <Link href={`/collections/${collection.id}`}>
                    <span className="text-sm text-amber-600 hover:underline cursor-pointer">
                      View Collection
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          {/* Invoice Generator */}
          {rates && rates.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden p-4 mb-4">
              <h2 className="text-lg font-semibold text-amber-800 mb-2">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-amber-600" />
                  <span>For Jewellers</span>
                </div>
              </h2>
              <p className="text-gray-700 mb-3">
                Generate a professional invoice for this product with your shop details and current gold rates.
              </p>
              <InvoiceGenerator product={product} collection={collection} rates={rates} />
            </div>
          )}
          
          {/* Call to action buttons */}
          <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-lg">
            <div className="container mx-auto flex gap-2">
              <Button className="w-1/2 bg-amber-600 hover:bg-amber-700">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Inquire Now
              </Button>
              <Button className="w-1/2" variant="outline">
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