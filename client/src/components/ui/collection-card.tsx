import React, { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collection } from "@shared/schema";
import { motion } from "framer-motion";

interface CollectionCardProps {
  collection: Collection;
  className?: string;
  isAdmin?: boolean;
  onClick?: () => void;
  onAddProduct?: (e: React.MouseEvent, collection: Collection) => void;
}

export function CollectionCard({ collection, className, isAdmin = false, onClick, onAddProduct }: CollectionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const CardComponent = () => (
    <motion.div
      initial={{ opacity: 1 }}
      whileHover={{ 
        scale: 1.03,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      className="h-full"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card className={`overflow-hidden h-full ${className} cursor-pointer border-amber-100 shadow-sm ${isHovered ? 'shadow-lg border-amber-200' : ''}`}>
        <div className="relative aspect-square overflow-hidden">
          <motion.div
            animate={isHovered ? { scale: 1.08 } : { scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full w-full"
          >
            <img 
              src={collection.imageUrl} 
              alt={collection.name}
              className="object-cover w-full h-full transition-all duration-500" 
            />
          </motion.div>
          
          {collection.featured === 1 && (
            <motion.div
              initial={{ y: 0, x: 0 }}
              animate={isHovered ? { y: -5, x: -5 } : { y: 0, x: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute top-1 sm:top-2 right-1 sm:right-2"
            >
              <Badge 
                variant="secondary" 
                className="bg-amber-500 text-white hover:bg-amber-600 text-3xs xs:text-xs py-0 px-1.5 sm:px-2 flex items-center gap-0.5 sm:gap-1"
              >
                <Sparkles className="h-2 w-2 xs:h-2.5 xs:w-2.5" />
                <span className="hidden xs:inline">Featured</span>
                <span className="xs:hidden">New</span>
              </Badge>
            </motion.div>
          )}
          
          {/* Add Product Button - shown only for admin when hovering */}
          {isAdmin && onAddProduct && (
            <motion.div 
              className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 via-black/30 to-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ 
                  y: isHovered ? 0 : 20, 
                  opacity: isHovered ? 1 : 0 
                }}
                transition={{ 
                  duration: 0.3, 
                  delay: 0.1 
                }}
              >
                <Button
                  variant="default"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white shadow-lg text-xs sm:text-sm h-7 sm:h-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddProduct(e, collection);
                  }}
                  data-collection-add-product="true"
                >
                  <Plus className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  Add Product
                </Button>
              </motion.div>
            </motion.div>
          )}
        </div>
        
        <motion.div
          animate={isHovered ? { backgroundColor: "#FFF7E6" } : { backgroundColor: "white" }}
          transition={{ duration: 0.3 }}
        >
          <CardHeader className="pb-0.5 xs:pb-1 pt-1.5 xs:pt-2 px-2 xs:px-3">
            <motion.h3 
              className="text-xs xs:text-sm font-medium truncate text-amber-900"
              animate={isHovered ? { color: "#9A3412" } : { color: "#78350F" }}
            >
              {collection.name}
            </motion.h3>
          </CardHeader>
          
          {collection.description && (
            <CardContent className="py-0 px-2 xs:px-3">
              <p className="text-muted-foreground text-3xs xs:text-xs line-clamp-1 xs:line-clamp-2">{collection.description}</p>
            </CardContent>
          )}
          
          <CardFooter className="pt-0.5 xs:pt-1 pb-1.5 xs:pb-2 px-2 xs:px-3">
            <motion.span 
              className="text-amber-600 text-3xs xs:text-xs font-medium flex items-center"
              animate={isHovered ? { x: isAdmin ? 0 : 5 } : { x: 0 }}
            >
              {isAdmin ? (
                <>
                  <ShoppingBag className="h-2.5 w-2.5 xs:h-3 xs:w-3 mr-1" />
                  <span>Manage Products</span>
                </>
              ) : (
                <div className="flex items-center">
                  <span>View</span> 
                  <motion.span className="ml-0.5" animate={isHovered ? { x: 3 } : { x: 0 }}>→</motion.span>
                </div>
              )}
            </motion.span>
          </CardFooter>
        </motion.div>
      </Card>
    </motion.div>
  );

  if (isAdmin && onClick) {
    return <div onClick={onClick}><CardComponent /></div>;
  }

  return (
    <Link href={`/collections/${collection.id}`}>
      <CardComponent />
    </Link>
  );
}