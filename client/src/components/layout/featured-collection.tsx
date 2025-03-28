import { ArrowLeft, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function FeaturedCollection() {
  return (
    <div className="bg-blue-100 py-2 border-b border-gray-300">
      <div className="container mx-auto px-4">
        <div className="relative">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <h2 className="font-playfair text-2xl font-bold text-burgundy-dark">NEW COLLECTION</h2>
              <h3 className="font-playfair text-xl text-burgundy-dark">AVAILABLE</h3>
              <div className="flex items-center justify-center mt-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                <span className="font-playfair text-xl">RK LATKAN</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </div>
              <p className="font-playfair italic text-lg mt-1">18K HUID</p>
            </div>
          </div>
          
          <div className="flex justify-between mt-3">
            <div className="bg-black w-5/12 p-1">
              <div className="w-full aspect-square bg-black flex items-center justify-center text-white">
                <span className="text-sm">Gold Earrings</span>
              </div>
              <p className="text-white text-center text-sm">2.196GM</p>
            </div>
            <div className="bg-black w-5/12 p-1">
              <div className="w-full aspect-square bg-black flex items-center justify-center text-white">
                <span className="text-sm">Gold Earrings</span>
              </div>
              <p className="text-white text-center text-sm">2.628GM</p>
            </div>
          </div>
          
          <Badge variant="outline" className="absolute top-2 right-2 bg-green-100 px-2 py-1 rounded-md border border-green-500 text-green-700">
            NEW
          </Badge>
        </div>
      </div>
    </div>
  );
}
