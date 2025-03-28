import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Collection } from "@shared/schema";
import { CollectionCard } from "@/components/ui/collection-card";
import { Skeleton } from "@/components/ui/skeleton";

export function FeaturedCollections() {
  const { data: collections, isLoading, error } = useQuery<Collection[]>({
    queryKey: ["/api/collections"],
  });

  if (isLoading) {
    return (
      <div className="py-6">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Featured Collections</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Featured Collections</h2>
        <p className="text-red-500">Failed to load collections</p>
      </div>
    );
  }

  // Filter for featured collections
  const featuredCollections = collections?.filter(
    (collection) => collection.featured === 1
  );

  if (!featuredCollections || featuredCollections.length === 0) {
    return null;
  }

  return (
    <div className="py-6">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4">Featured Collections</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {featuredCollections.map((collection) => (
          <CollectionCard 
            key={collection.id} 
            collection={collection} 
            className="rounded-md shadow-sm transition-transform hover:scale-105"
          />
        ))}
      </div>
    </div>
  );
}