import React, { useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Collection } from "@shared/schema";
import { CollectionCard } from "@/components/ui/collection-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function FeaturedCollections() {
  const { data: collections, isLoading, error } = useQuery<Collection[]>({
    queryKey: ["/api/collections"],
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    const checkScroll = () => {
      const container = scrollContainerRef.current;
      if (container) {
        setCanScrollLeft(container.scrollLeft > 0);
        setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 5);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      checkScroll(); // Initial check
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      }
    };
  }, [collections]); // Re-run when collections change

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <section className="py-4 sm:py-6">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-amber-800">Featured Collections</h2>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2 h-full">
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
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-amber-800">Featured Collections</h2>
        </div>
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
      <div className="flex items-center justify-between mb-2 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-amber-800">Featured Collections</h2>
        <div className="flex space-x-1">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 bg-white/80 hover:bg-white border-amber-100"
            onClick={scrollLeft}
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Scroll left</span>
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 bg-white/80 hover:bg-white border-amber-100"
            onClick={scrollRight}
            disabled={!canScrollRight}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Scroll right</span>
          </Button>
        </div>
      </div>
      
      <div className="relative">
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto snap-x scroll-smooth gap-2 sm:gap-4 pb-4"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
          data-scrollbar="hide"
        >
          {featuredCollections.map((collection) => (
            <div 
              key={collection.id} 
              className="shrink-0 snap-start"
              style={{ width: 'calc(50% - 8px)', minWidth: '140px' }}
            >
              <CollectionCard 
                collection={collection} 
                className="rounded-md shadow-sm transition-all hover:shadow-md max-w-full h-full"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}