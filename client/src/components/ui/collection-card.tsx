import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collection } from "@shared/schema";

interface CollectionCardProps {
  collection: Collection;
  className?: string;
}

export function CollectionCard({ collection, className }: CollectionCardProps) {
  return (
    <Card className={`overflow-hidden h-full ${className}`}>
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
        <button className="text-amber-600 text-xs font-medium hover:text-amber-800">
          View →
        </button>
      </CardFooter>
    </Card>
  );
}