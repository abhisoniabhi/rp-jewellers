import { Card, CardContent } from "@/components/ui/card";
import { BadgeCheck, Box, ChevronUp, Circle, Calculator } from "lucide-react";
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
    switch (rate.icon) {
      case "cube": return "bg-blue-100";
      case "chevron-up": return "bg-yellow-100";
      case "coin": return "bg-gray-100";
      case "calculator": return "bg-teal-100";
      default: return "bg-blue-100";
    }
  };

  const getIconTextColor = () => {
    switch (rate.icon) {
      case "cube": return "text-blue-500";
      case "chevron-up": return "text-yellow-500";
      case "coin": return "text-gray-500";
      case "calculator": return "text-teal-500";
      default: return "text-blue-500";
    }
  };

  const renderIcon = () => {
    const className = `${getIconTextColor()} h-3 w-3`;
    
    switch (rate.icon) {
      case "cube": return <Box className={className} />;
      case "chevron-up": return <ChevronUp className={className} />;
      case "coin": return <Circle className={className} />;
      case "calculator": return <Calculator className={className} />;
      default: return <Box className={className} />;
    }
  };

  return (
    <Card className={cn("shadow-md overflow-hidden border-t-4", 
      rate.category === "gold" ? "border-t-yellow-400" : "border-t-gray-400", 
      className)}>
      <CardContent className="p-3 bg-gradient-to-br from-white to-gray-50">
        <div className="flex items-start mb-1.5">
          <div className={`w-5 h-5 rounded-md ${getIconColor()} flex items-center justify-center mr-2 shrink-0 mt-0.5 shadow-sm`}>
            {renderIcon()}
          </div>
          <h3 className="text-xs font-medium leading-tight" style={{ wordBreak: 'break-word' }}>{rate.type}</h3>
        </div>
        
        <div className="flex items-baseline mt-1.5 bg-white p-1.5 rounded-md shadow-sm">
          <span className="text-sm mr-0.5 text-gray-700">₹</span>
          <span className="text-lg font-bold">{rate.current.toLocaleString()}</span>
          <span className="ml-1 text-green-500">
            <BadgeCheck className="h-3 w-3" />
          </span>
        </div>
        
        <div className="flex justify-between text-2xs text-gray-600 mt-2 px-0.5">
          <div className="flex flex-col items-center">
            <span className="text-gray-500">High</span>
            <span className="font-medium">{rate.high.toLocaleString()}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-gray-500">Low</span>
            <span className="font-medium">{rate.low.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="text-2xs text-gray-500 mt-1.5 text-center bg-gray-50 py-0.5 rounded">
          Updated: {rate.updatedAt}
        </div>
      </CardContent>
    </Card>
  );
}
