import { ArrowLeft, ArrowRight, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function FeaturedCollection() {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-100 py-4 border-b border-gray-300">
      <div className="container mx-auto px-3">
        {/* Poster Area - Can be used for banners or promotional materials */}
        <div className="mb-4 rounded-lg overflow-hidden shadow-md">
          <div className="bg-gradient-to-r from-amber-500 to-yellow-400 p-3 text-center">
            <h2 className="text-xl font-bold text-white">PROMOTIONAL POSTER AREA</h2>
            <p className="text-white text-sm">Add your shop's special offers and promotional images here</p>
          </div>
          
          <div className="bg-white p-4 flex flex-col items-center">
            <div className="w-full h-48 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center mb-2">
              <div className="text-center text-gray-500">
                <ImageIcon className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                <p>Poster Image Area</p>
                <p className="text-xs">(1:2 ratio recommended)</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Featured Collection Section */}
        <div className="relative bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex items-center justify-center p-3 bg-gradient-to-r from-amber-100 to-yellow-50">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-amber-800">NEW COLLECTION</h2>
              <h3 className="text-xl text-amber-700">AVAILABLE</h3>
              <div className="flex items-center justify-center mt-2">
                <ArrowLeft className="mr-2 h-4 w-4 text-amber-900" />
                <span className="text-xl text-amber-900 font-medium">RK LATKAN</span>
                <ArrowRight className="ml-2 h-4 w-4 text-amber-900" />
              </div>
              <p className="italic text-lg mt-1 text-amber-800">18K HUID</p>
            </div>
          </div>
          
          <div className="flex justify-between p-3 bg-white">
            <div className="bg-black w-5/12 p-1 rounded-md shadow-sm">
              <div className="w-full aspect-square bg-black flex items-center justify-center text-white">
                <span className="text-sm">Gold Earrings</span>
              </div>
              <p className="text-white text-center text-sm py-1">2.196GM</p>
            </div>
            <div className="bg-black w-5/12 p-1 rounded-md shadow-sm">
              <div className="w-full aspect-square bg-black flex items-center justify-center text-white">
                <span className="text-sm">Gold Earrings</span>
              </div>
              <p className="text-white text-center text-sm py-1">2.628GM</p>
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
