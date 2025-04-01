import { useState } from "react";
import { Crown } from "lucide-react";

interface Category {
  id: number;
  name: string;
  subtitle: string;
}

const defaultCategories: Category[] = [
  { id: 1, name: "Set Jhala 18K", subtitle: "HUID" },
  { id: 2, name: "Set Jhala 18K", subtitle: "HUID" },
  { id: 3, name: "Set Jhala 18K", subtitle: "HUID" },
  { id: 4, name: "Set Jhala 18K", subtitle: "HUID" },
];

export function CategoryTabs() {
  const [activeCategory, setActiveCategory] = useState<number>(1);
  const [categories] = useState<Category[]>(defaultCategories);

  return (
    <div className="bg-burgundy-default text-white sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <div className="flex justify-between overflow-x-auto no-scrollbar">
          {categories.map((category) => (
            <div 
              key={category.id}
              className="category-tab px-4 py-3 text-center flex-shrink-0 flex flex-col items-center"
              onClick={() => setActiveCategory(category.id)}
            >
              <div className="rounded-full bg-black/20 p-1 mb-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeCategory === category.id ? 'bg-gold-default' : 'bg-gold-default/70'}`}>
                  <Crown className="h-4 w-4 text-burgundy-default" />
                </div>
              </div>
              <span className="whitespace-nowrap text-sm">{category.name}</span>
              <span className="whitespace-nowrap text-xs">{category.subtitle}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
