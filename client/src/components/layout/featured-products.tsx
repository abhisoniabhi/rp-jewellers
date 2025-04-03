import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { wsClient, WS_EVENTS } from "@/lib/websocket";
import { queryClient } from "@/lib/queryClient";
import { ProductCard } from "@/components/ui/product-card";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export function FeaturedProducts() {
  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const handleAddToOrder = (product: Product) => {
    // Navigate to order page with product ID
    navigate(`/order?productId=${product.id}`);
    
    // Show success toast
    toast({
      title: "Added to order",
      description: `${product.name} has been added to your order.`,
    });
  };
  
  // Set up real-time WebSocket listener for product updates
  useEffect(() => {
    try {
      // Connect to WebSocket server
      wsClient.connect();
      
      // Subscribe to product update events
      const unsubscribe = wsClient.subscribe(WS_EVENTS.PRODUCT_UPDATED, (updatedProduct) => {
        console.log("[WebSocket] Product updated:", updatedProduct);
        
        // Update the cache immediately without waiting for refetch
        queryClient.setQueryData(
          ["/api/products"],
          (oldData: Product[] | undefined) => {
            if (!oldData) return [updatedProduct];
            return oldData.map(product => product.id === updatedProduct.id ? updatedProduct : product);
          }
        );
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
      <div className="py-6">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Featured Products</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Featured Products</h2>
        <p className="text-red-500">Failed to load products</p>
      </div>
    );
  }

  // Filter for featured products
  const featuredProducts = products?.filter(
    (product) => product.featured === 1
  );

  // If no featured products, show trending ones (for demo purposes)
  // In a real application you might want to return null or a message
  const productsToShow = featuredProducts?.length ? featuredProducts : products?.slice(0, 4);

  if (!productsToShow || productsToShow.length === 0) {
    return null;
  }

  return (
    <div className="py-6">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4">
        {featuredProducts?.length ? "Featured Products" : "Popular Products"}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {productsToShow.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product}
            onAddToOrder={handleAddToOrder}
          />
        ))}
      </div>
    </div>
  );
}

