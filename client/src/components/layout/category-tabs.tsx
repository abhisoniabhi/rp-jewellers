import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Crown, 
  CircleDot,
  CircleOff,
  Gem,
  Circle
} from "lucide-react";

interface CategoryTabsProps {
  onSelectCategory: (category: string) => void;
}

export function CategoryTabs({ onSelectCategory }: CategoryTabsProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Fetch product categories from the API
  const { data: categories, isLoading } = useQuery<string[]>({
    queryKey: ['/api/product-categories'],
  });

  // Get the icon for each category
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'necklace':
        return <Circle className="h-4 w-4 text-burgundy-default" />;
      case 'earrings':
        return <CircleDot className="h-4 w-4 text-burgundy-default" />;
      case 'bangles':
        return <CircleOff className="h-4 w-4 text-burgundy-default" />;
      default:
        return <Gem className="h-4 w-4 text-burgundy-default" />;
    }
  };

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    onSelectCategory(category);
  };

  // Add "All" category at the beginning
  const allCategories = ["all", ...(categories || [])];

  return (
    <div className="bg-burgundy-default text-white z-10">
      <div className="container mx-auto px-4">
        <div className="flex overflow-x-auto no-scrollbar py-2">
          {isLoading ? (
            <div className="py-3 px-4 text-center">Loading categories...</div>
          ) : (
            allCategories.map((category) => (
              <div 
                key={category}
                className="category-tab px-3 py-2 text-center flex-shrink-0 flex flex-col items-center mx-1"
                onClick={() => handleCategoryClick(category)}
              >
                <div className="rounded-full bg-black/20 p-1 mb-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeCategory === category ? 'bg-gold-default' : 'bg-gold-default/70'}`}>
                    {category === "all" ? (
                      <Crown className="h-4 w-4 text-burgundy-default" />
                    ) : (
                      getCategoryIcon(category)
                    )}
                  </div>
                </div>
                <span className="whitespace-nowrap text-sm capitalize">
                  {category === "all" ? "All Items" : category}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
