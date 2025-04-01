import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Product } from "@shared/schema";
import { formatIndianRupees } from "@/lib/utils";

interface ProductListProps {
  searchQuery: string;
  selectedCategory: string;
}

export function ProductList({ searchQuery, selectedCategory }: ProductListProps) {
  // Fetch products based on search or category
  const getQueryKey = () => {
    if (searchQuery) {
      return ['/api/products/search', { q: searchQuery }];
    }
    return ['/api/products'];
  };

  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: getQueryKey(),
  });

  // Filter products by category if a category is selected
  const filteredProducts = products ? 
    (selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category.toLowerCase() === selectedCategory.toLowerCase())
    ) 
    : [];

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-burgundy-default" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        Error loading products. Please try again.
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        {searchQuery 
          ? `No products found matching "${searchQuery}"`
          : selectedCategory !== 'all'
            ? `No products found in category "${selectedCategory}"`
            : "No products available"
        }
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {filteredProducts.map((product) => (
        <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden">
          <div className="h-40 bg-gray-200 relative">
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
            {product.featured === 1 && (
              <span className="absolute top-0 right-0 bg-burgundy-default text-white text-xs px-2 py-1 m-1 rounded">
                Featured
              </span>
            )}
          </div>
          <div className="p-3">
            <h3 className="font-semibold text-sm text-gray-900 truncate">{product.name}</h3>
            <p className="text-xs text-gray-500 h-8 overflow-hidden">
              {product.description}
            </p>
            <div className="mt-2 flex justify-between items-center">
              <span className="text-sm font-bold text-burgundy-default">
                ₹{formatIndianRupees(product.price)}
              </span>
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                {product.karatType}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}