import { Card, CardContent } from "@/components/ui/card";
import { BadgeCheck, Box, Coins, CircleDashed, Calculator, Award, Diamond } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RateInfo {
  id: number;
  type: string;
  current: number;
  high: number;
  low: number;
  updatedAt: string;
  icon: string;
  category: string;
}

interface RateCardProps {
  rate: RateInfo;
  className?: string;
}

export function RateCard({ rate, className }: RateCardProps) {
  const getIconColor = () => {
    if (rate.category === "gold") {
      return "bg-amber-100";
    } else {
      return "bg-gray-100";
    }
  };

  const getIconTextColor = () => {
    if (rate.category === "gold") {
      return "text-amber-600";
    } else {
      return "text-gray-600";
    }
  };

  const renderIcon = () => {
    const iconSize = rate.category === "gold" ? "h-4 w-4" : "h-3.5 w-3.5";
    const iconColor = rate.category === "gold" ? "text-amber-600" : "text-gray-600";
    const className = `${iconColor} ${iconSize}`;
    
    switch (rate.icon) {
      case "cube": return <Diamond className={className} />;
      case "chevron-up": return <Award className={className} />;
      case "coin": return <Coins className={className} />;
      case "calculator": return <Calculator className={className} />;
      default: return rate.category === "gold" ? <Diamond className={className} /> : <CircleDashed className={className} />;
    }
  };

  return (
    <Card className={cn("shadow-lg overflow-hidden border", 
      rate.category === "gold" 
        ? "border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50" 
        : "border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50", 
      className)}>
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-80"></div>
      <CardContent className="p-4">
        <div className="flex items-start mb-2.5">
          <div className={`w-7 h-7 rounded-full ${rate.category === "gold" ? "bg-amber-100" : "bg-gray-100"} 
            flex items-center justify-center mr-2.5 shrink-0 mt-0.5 shadow-sm border ${rate.category === "gold" ? "border-amber-200" : "border-gray-200"}`}>
            {renderIcon()}
          </div>
          <h3 className="text-sm font-medium leading-tight text-gray-800" style={{ wordBreak: 'break-word' }}>{rate.type}</h3>
        </div>
        
        <div className={`flex items-baseline mt-2 p-3 rounded-lg shadow-inner ${rate.category === "gold" ? "bg-amber-50 border border-amber-100" : "bg-gray-50 border border-gray-100"}`}>
          <span className={`text-base mr-0.5 ${rate.category === "gold" ? "text-amber-700" : "text-gray-700"}`}>₹</span>
          <span className={`text-xl font-bold ${rate.category === "gold" ? "text-amber-800" : "text-gray-800"}`}>{rate.current.toLocaleString()}</span>
          <span className="ml-1.5 text-green-600">
            <BadgeCheck className="h-4 w-4" />
          </span>
        </div>
        
        <div className="flex justify-between text-xs mt-3 px-1">
          <div className={`flex flex-col items-center p-1.5 rounded-md ${rate.category === "gold" ? "bg-amber-50" : "bg-gray-50"} border ${rate.category === "gold" ? "border-amber-100" : "border-gray-100"} w-[48%]`}>
            <span className={`${rate.category === "gold" ? "text-amber-600" : "text-gray-600"} text-2xs`}>High</span>
            <span className={`font-medium ${rate.category === "gold" ? "text-amber-800" : "text-gray-800"}`}>₹{rate.high.toLocaleString()}</span>
          </div>
          <div className={`flex flex-col items-center p-1.5 rounded-md ${rate.category === "gold" ? "bg-amber-50" : "bg-gray-50"} border ${rate.category === "gold" ? "border-amber-100" : "border-gray-100"} w-[48%]`}>
            <span className={`${rate.category === "gold" ? "text-amber-600" : "text-gray-600"} text-2xs`}>Low</span>
            <span className={`font-medium ${rate.category === "gold" ? "text-amber-800" : "text-gray-800"}`}>₹{rate.low.toLocaleString()}</span>
          </div>
        </div>
        
        <div className={`text-2xs mt-2.5 text-center py-1 rounded-full border ${rate.category === "gold" ? "text-amber-700 border-amber-200 bg-amber-50" : "text-gray-600 border-gray-200 bg-gray-50"}`}>
          Updated: {rate.updatedAt}
        </div>
      </CardContent>
    </Card>
  );
}
