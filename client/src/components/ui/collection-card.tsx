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
            className="absolute top-2 right-2 bg-amber-500 text-white hover:bg-amber-600"
          >
            Featured
          </Badge>
        )}
      </div>
      <CardHeader className="pb-2 pt-4">
        <h3 className="text-lg font-medium">{collection.name}</h3>
      </CardHeader>
      {collection.description && (
        <CardContent className="py-0">
          <p className="text-muted-foreground text-sm">{collection.description}</p>
        </CardContent>
      )}
      <CardFooter className="pt-4">
        <button className="text-amber-600 text-sm font-medium hover:text-amber-800">
          View Collection →
        </button>
      </CardFooter>
    </Card>
  );
}