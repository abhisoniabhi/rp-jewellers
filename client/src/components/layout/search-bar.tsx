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
    <div className="bg-amber-50 py-2 border-b border-amber-100 sticky top-0 z-10">
      <div className="container mx-auto px-4 relative">
        <div className="flex items-center">
          <div className="relative flex-1">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search for products..."
                className="pl-10 pr-10 py-2 w-full border border-amber-200 focus:border-amber-500 focus:ring-amber-500 rounded-lg"
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500 h-4 w-4" />
              {searchTerm && (
                <button 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {/* Search Results Dropdown */}
            {isSearchDropdownOpen && (
              <Card className="absolute mt-1 w-full bg-white shadow-lg rounded-md overflow-hidden z-50 max-h-80 overflow-y-auto">
                {isLoading ? (
                  <div className="flex justify-center items-center p-4">
                    <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
                    <span className="ml-2 text-sm text-gray-500">Searching...</span>
                  </div>
                ) : searchResults && searchResults.length > 0 ? (
                  <div className="p-1">
                    <div className="text-xs font-medium text-gray-500 px-3 py-1">
                      {searchResults.length} product{searchResults.length !== 1 ? 's' : ''} found
                    </div>
                    {searchResults.map((product) => (
                      <div 
                        key={product.id}
                        className="flex items-center p-2 hover:bg-amber-50 rounded cursor-pointer"
                        onClick={() => handleProductClick(product.collectionId)}
                      >
                        <div className="h-12 w-12 rounded overflow-hidden bg-amber-100 flex-shrink-0">
                          <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="font-medium text-sm text-amber-800">{product.name}</div>
                          <div className="flex items-center mt-1">
                            <span className="text-xs font-semibold text-amber-600">₹{product.price.toLocaleString()}</span>
                            <Badge variant="outline" className="ml-2 text-xs bg-amber-50 border-amber-200 text-amber-700">
                              {product.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchTerm && !isLoading ? (
                  <div className="p-4 text-center text-gray-500">
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