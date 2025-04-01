import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Loader2, ArrowLeft, Scale, Clock, Tag } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";
import { Collection, Product } from "@shared/schema";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Button } from "@/components/ui/button";
import { wsClient, WS_EVENTS } from "@/lib/websocket";
import { queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

export default function CollectionDetailPage() {
  const [, params] = useRoute("/collections/:id");
  const collectionId = params?.id ? parseInt(params.id) : null;
  
  // Fetch collection data
  const { 
    data: collection, 
    isLoading: isLoadingCollection, 
    error: collectionError 
  } = useQuery<Collection>({
    queryKey: ["/api/collections", collectionId],
    enabled: !!collectionId, // Only run query if we have an ID
  });
  
  // Fetch products for this collection
  const {
    data: products,
    isLoading: isLoadingProducts,
    error: productsError
  } = useQuery<Product[]>({
    queryKey: ["/api/collections", collectionId, "products"],
    enabled: !!collectionId,
  });

  // Set up WebSocket connection for real-time updates
  useEffect(() => {
    wsClient.connect();
    
    // Set up WebSocket event listeners for product updates
    const onProductCreated = (product: Product) => {
      if (product.collectionId === collectionId) {
        console.log("[WebSocket] Product created in this collection:", product);
        queryClient.invalidateQueries({
          queryKey: ["/api/collections", collectionId, "products"]
        });
      }
    };
    
    const onProductUpdated = (product: Product) => {
      if (product.collectionId === collectionId) {
        console.log("[WebSocket] Product updated in this collection:", product);
        // Use setQueryData to update the cache immediately without waiting for a refetch
        queryClient.setQueryData(
          ["/api/collections", collectionId, "products"],
          (oldData: Product[] | undefined) => {
            if (!oldData) return [product];
            return oldData.map(p => p.id === product.id ? product : p);
          }
        );
      }
    };
    
    const onProductDeleted = (data: { id: number }) => {
      // Since we don't know the collection ID of the deleted product,
      // invalidate the query anyway to be safe
      queryClient.invalidateQueries({
        queryKey: ["/api/collections", collectionId, "products"]
      });
    };
    
    // Subscribe to WebSocket events
    const unsubscribeCreated = wsClient.subscribe(WS_EVENTS.PRODUCT_CREATED, onProductCreated);
    const unsubscribeUpdated = wsClient.subscribe(WS_EVENTS.PRODUCT_UPDATED, onProductUpdated);
    const unsubscribeDeleted = wsClient.subscribe(WS_EVENTS.PRODUCT_DELETED, onProductDeleted);
    
    return () => {
      // Unsubscribe from WebSocket events
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
      // No need to disconnect since other components might be using it
    };
  }, [collectionId]);

  // Combined loading state and error
  const isLoading = isLoadingCollection || isLoadingProducts;
  const error = collectionError || productsError;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  // Error state
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

  // Main content
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow bg-gray-100">
        <div className="container mx-auto px-3 py-4">
          {/* Back button and title */}
          <div className="mb-4 flex items-center">
            <Link href="/">
              <Button variant="ghost" className="p-0 mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-amber-800">{collection.name}</h1>
          </div>
          
          {/* Collection details */}
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
          
          {/* Products gallery */}
          <div className="mt-6">
            <h3 className="text-lg font-bold text-amber-800 mb-3">
              Product Gallery {products && products.length > 0 && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({products.length} items)
                </span>
              )}
            </h3>
            
            {products && products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {products.map((product) => (
                  <Link href={`/products/${product.id}`} key={product.id}>
                    <div className="bg-white rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <div className="aspect-square overflow-hidden">
                        <img 
                          src={product.imageUrl || collection.imageUrl} 
                          alt={product.name}
                          className="object-cover w-full h-full hover:scale-105 transition-transform" 
                        />
                      </div>
                      <div className="p-3">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-semibold text-amber-800 truncate flex-1">{product.name}</h3>
                          {product.inStock === 1 ? (
                            <Badge className="text-xs bg-green-100 text-green-800 border-none">In Stock</Badge>
                          ) : (
                            <Badge className="text-xs bg-red-100 text-red-800 border-none">Out of Stock</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          {product.price !== undefined && (
                            <p className="text-amber-600 font-bold">
                              {product.price}%
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1">
                            {product.category && (
                              <Badge variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-800">
                                {product.category}
                              </Badge>
                            )}
                            {product.weight > 0 && (
                              <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-800">
                                {product.weight}g
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-md p-6 text-center shadow-sm">
                <p className="text-gray-500">No products available in this collection</p>
              </div>
            )}
          </div>
          
          {/* Features */}
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
          
          {/* Available options */}
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