import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, X } from "lucide-react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Product } from "@shared/schema";

export function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [, setLocation] = useLocation();
  
  // Only trigger the search query if there's a search term with at least 2 characters
  const shouldSearch = searchTerm.trim().length >= 2;
  
  // Fetch search results
  const { data: searchResults, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/search", searchTerm],
    queryFn: async () => {
      if (!shouldSearch) return [];
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(searchTerm)}`);
      if (!res.ok) {
        throw new Error("Failed to search products");
      }
      return res.json();
    },
    enabled: shouldSearch,
    retry: false, // Don't retry on failure
  });
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Only show dropdown if there's a search term
    if (value.trim()) {
      setIsSearchDropdownOpen(true);
    } else {
      setIsSearchDropdownOpen(false);
    }
  };
  
  const clearSearch = () => {
    setSearchTerm("");
    setIsSearchDropdownOpen(false);
  };
  
  const handleProductClick = (collectionId: number) => {
    setLocation(`/collections/${collectionId}`);
    clearSearch();
  };
  
  return (
    <div className="bg-amber-50 py-1.5 sm:py-2 border-b border-amber-100 sticky top-0 z-10">
      <div className="container mx-auto px-2 sm:px-4 relative">
        <div className="flex items-center">
          <div className="relative flex-1">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search for jewelry..."
                className="pl-8 sm:pl-10 pr-8 sm:pr-10 py-1.5 sm:py-2 w-full text-sm border border-amber-200 focus:border-amber-500 focus:ring-amber-500 rounded-lg"
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-amber-500 h-3.5 sm:h-4 w-3.5 sm:w-4" />
              {searchTerm && (
                <button 
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={clearSearch}
                >
                  <X className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                </button>
              )}
            </div>
            
            {/* Search Results Dropdown */}
            {isSearchDropdownOpen && (
              <Card className="absolute mt-1 w-full bg-white shadow-lg rounded-md overflow-hidden z-50 max-h-60 sm:max-h-80 overflow-y-auto">
                {isLoading ? (
                  <div className="flex justify-center items-center p-3 sm:p-4">
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 animate-spin" />
                    <span className="ml-2 text-xs sm:text-sm text-gray-500">Searching...</span>
                  </div>
                ) : searchResults && searchResults.length > 0 ? (
                  <div className="p-1">
                    <div className="text-xs font-medium text-gray-500 px-2 sm:px-3 py-1">
                      {searchResults.length} product{searchResults.length !== 1 ? 's' : ''} found
                    </div>
                    {searchResults.map((product) => (
                      <div 
                        key={product.id}
                        className="flex items-center p-1.5 sm:p-2 hover:bg-amber-50 rounded cursor-pointer"
                        onClick={() => handleProductClick(product.collectionId)}
                      >
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded overflow-hidden bg-amber-100 flex-shrink-0">
                          <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="ml-2 sm:ml-3 flex-1">
                          <div className="font-medium text-xs sm:text-sm text-amber-800 line-clamp-1">{product.name}</div>
                          <div className="flex items-center mt-0.5 sm:mt-1">
                            <span className="text-3xs sm:text-xs font-semibold text-amber-600">₹{product.price.toLocaleString()}</span>
                            <Badge variant="outline" className="ml-1 sm:ml-2 text-3xs sm:text-xs bg-amber-50 border-amber-200 text-amber-700">
                              {product.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchTerm && !isLoading ? (
                  <div className="p-3 sm:p-4 text-center text-xs sm:text-sm text-gray-500">
                    No products found matching "{searchTerm}"
                  </div>
                ) : null}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}