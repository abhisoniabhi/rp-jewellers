import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ProductSearchProps {
  onSearch: (query: string) => void;
}

export function ProductSearch({ onSearch }: ProductSearchProps) {
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <div className="w-full px-4 py-3 bg-white shadow-sm">
      <form onSubmit={handleSearch} className="relative">
        <Input
          type="text"
          placeholder="Search for jewellery..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:border-burgundy-default focus:ring-burgundy-default"
        />
        <button 
          type="submit" 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}