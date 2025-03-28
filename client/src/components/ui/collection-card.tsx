import React from "react";
import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag } from "lucide-react";
import { Collection } from "@shared/schema";

interface CollectionCardProps {
  collection: Collection;
  className?: string;
  isAdmin?: boolean;
  onClick?: () => void;
}

export function CollectionCard({ collection, className, isAdmin = false, onClick }: CollectionCardProps) {
  const CardComponent = () => (
    <Card className={`overflow-hidden h-full ${className} cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-md`}>
      <div className="relative aspect-square">
        <img 
          src={collection.imageUrl} 
          alt={collection.name}
          className="object-cover w-full h-full" 
        />
        {collection.featured === 1 && (
          <Badge 
            variant="secondary" 
            className="absolute top-2 right-2 bg-amber-500 text-white hover:bg-amber-600 text-xs py-0 px-2"
          >
            Featured
          </Badge>
        )}
      </div>
      <CardHeader className="pb-1 pt-2 px-3">
        <h3 className="text-sm font-medium truncate">{collection.name}</h3>
      </CardHeader>
      {collection.description && (
        <CardContent className="py-0 px-3">
          <p className="text-muted-foreground text-xs line-clamp-2">{collection.description}</p>
        </CardContent>
      )}
      <CardFooter className="pt-1 pb-2 px-3">
        <span className="text-amber-600 text-xs font-medium flex items-center">
          {isAdmin ? (
            <>
              <ShoppingBag className="h-3 w-3 mr-1" />
              Manage Products
            </>
          ) : (
            "View →"
          )}
        </span>
      </CardFooter>
    </Card>
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