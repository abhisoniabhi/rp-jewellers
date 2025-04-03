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
      <section className="py-4 sm:py-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4 text-amber-800">Featured Collections</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square w-full rounded-md" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-4 sm:py-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4 text-amber-800">Featured Collections</h2>
        <p className="text-red-500 text-sm">Failed to load collections</p>
      </section>
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
    <section className="py-4 sm:py-6">
      <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4 text-amber-800">Featured Collections</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
        {featuredCollections.map((collection) => (
          <CollectionCard 
            key={collection.id} 
            collection={collection} 
            className="rounded-md shadow-sm transition-all hover:shadow-md hover:scale-[1.02]"
          />
        ))}
      </div>
    </section>
  );
}