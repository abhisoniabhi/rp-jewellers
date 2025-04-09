import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Share2, MessageCircle } from "lucide-react";
import { Product } from "@shared/schema";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product;
  onAddToOrder?: (product: Product) => void;
  className?: string;
}

export function ProductCard({ product, onAddToOrder, className = "" }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleAddToOrder = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onAddToOrder) {
      onAddToOrder(product);
      // Navigate to order page after adding to order
      navigate('/order');
    } else {
      // If no callback is provided, navigate to order page with product ID
      navigate(`/order?productId=${product.id}`);
    }
    
    toast({
      title: "Added to order",
      description: `${product.name} has been added to your order.`,
    });
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const url = `${window.location.origin}/products/${product.id}`;
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out this product: ${product.name}`,
        url: url
      }).catch((error) => console.log('Error sharing', error));
    } else {
      navigator.clipboard.writeText(url).then(() => {
        toast({
          title: "Link copied",
          description: "Product link copied to clipboard.",
        });
      });
    }
  };

  const CardContent = () => (
    <motion.div
      initial={{ opacity: 1 }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      className="h-full"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card className={`overflow-hidden h-full border-amber-100 shadow-sm ${isHovered ? 'shadow-lg border-amber-200' : ''} ${className}`}>
        <div className="relative aspect-square overflow-hidden">
          <motion.div
            animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
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
              <Badge variant="destructive" className="text-xs px-2 py-0.5">
                Out of Stock
              </Badge>
            </div>
          )}
        </div>
        
        <div className="p-2">
          <h3 className="font-medium text-amber-800 text-xs leading-tight line-clamp-1">{product.name}</h3>
          
          <div className="flex items-center justify-between mt-1 mb-2">
            <p className="font-bold text-amber-600 text-xs">₹ {product.price}</p>
            
            <div className="flex gap-1">
              {product.weight > 0 && (
                <Badge variant="outline" className="text-[9px] px-1 py-0">
                  {product.weight}g
                </Badge>
              )}
              {product.karatType && (
                <Badge variant="secondary" className="text-[9px] px-1 py-0">
                  {product.karatType}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Action buttons moved below the image */}
          <div className="flex gap-1">
            <Button
              variant="default"
              size="sm"
              className="flex-1 h-6 px-1 bg-amber-500 hover:bg-amber-600 text-white shadow-sm border border-amber-400 text-[10px]"
              onClick={handleAddToOrder}
              disabled={product.inStock === 0}
            >
              <ShoppingBag className="h-2.5 w-2.5 mr-1" />
              Add to Order
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 h-6 px-1 bg-white/90 text-amber-800 hover:bg-white shadow-sm text-[10px]"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                const whatsappMessage = `Hi, I'm interested in the ${product.name}. Can you provide more details?`;
                window.open(`https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
              }}
            >
              <MessageCircle className="h-2.5 w-2.5 mr-1" />
              Enquire
            </Button>
            
            <Button
              variant="secondary"
              size="icon"
              className="h-6 w-6 bg-white/90 text-amber-800 hover:bg-white shadow-sm"
              onClick={handleShare}
            >
              <Share2 className="h-2.5 w-2.5" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <Link href={`/products/${product.id}`}>
      <CardContent />
    </Link>
  );
}