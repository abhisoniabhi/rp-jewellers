import { Card, CardContent } from "@/components/ui/card";
import { BadgeCheck } from "lucide-react";
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

  const getIcon = () => {
    switch (rate.icon) {
      case "cube": return "fas fa-cube";
      case "chevron-up": return "fas fa-chevron-up";
      case "coin": return "fas fa-coins";
      case "calculator": return "fas fa-calculator";
      default: return "fas fa-cube";
    }
  };

  return (
    <Card className={cn("shadow-md", className)}>
      <CardContent className="p-4">
        <div className="flex items-center mb-2">
          <div className={`w-6 h-6 rounded-md ${getIconColor()} flex items-center justify-center mr-2`}>
            <i className={`${getIcon()} ${getIconTextColor()} text-xs`}></i>
          </div>
          <h3 className="text-sm font-medium">{rate.type}</h3>
        </div>
        <div className="flex items-baseline">
          <i className="fas fa-rupee-sign text-lg mr-1"></i>
          <span className="text-2xl font-bold">{rate.current}</span>
          <span className="ml-2 text-green-500">
            <BadgeCheck className="h-4 w-4" />
          </span>
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>H: {rate.high}</span>
          <span>L: {rate.low}</span>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Updated: {rate.updatedAt}
        </div>
      </CardContent>
    </Card>
  );
}
