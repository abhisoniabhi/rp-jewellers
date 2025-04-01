import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { wsClient, WS_EVENTS } from "@/lib/websocket";
import { queryClient } from "@/lib/queryClient";

export function FeaturedProducts() {
  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  
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
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <Link href={`/products/${product.id}`}>
      <motion.div
        initial={{ opacity: 1 }}
        whileHover={{ 
          scale: 1.03,
          transition: { duration: 0.3, ease: "easeOut" }
        }}
        className="h-full cursor-pointer"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <Card className={`overflow-hidden h-full border-amber-100 shadow-sm ${isHovered ? 'shadow-lg border-amber-200' : ''}`}>
          <div className="relative aspect-square overflow-hidden">
            <motion.div
              animate={isHovered ? { scale: 1.08 } : { scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full w-full"
            >
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className="object-cover w-full h-full transition-all duration-500" 
              />
            </motion.div>
            
            {product.featured === 1 && (
              <motion.div
                initial={{ y: 0, x: 0 }}
                animate={isHovered ? { y: -5, x: -5 } : { y: 0, x: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute top-2 right-2"
              >
                <Badge 
                  className="bg-amber-500 text-white hover:bg-amber-600 text-xs py-0 px-2 flex items-center gap-1"
                >
                  Featured
                </Badge>
              </motion.div>
            )}
            
            {product.inStock === 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Badge variant="destructive" className="text-sm px-2 py-1">
                  Out of Stock
                </Badge>
              </div>
            )}
          </div>
          
          <div className="p-3">
            <h3 className="font-medium text-amber-800 line-clamp-1">{product.name}</h3>
            
            <div className="flex items-center justify-between mt-2 text-sm">
              <p className="font-bold text-amber-600">{product.price}%</p>
              
              <div className="flex gap-1">
                {product.weight > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {product.weight}g
                  </Badge>
                )}
                {product.karatType && (
                  <Badge variant="secondary" className="text-xs">
                    {product.karatType}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </Link>
  );
}