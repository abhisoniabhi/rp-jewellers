import { RateInfo } from "@/components/ui/rate-card";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import rpLogo from "../../assets/rp-logo.jpg";

interface ScreenshotViewProps {
  rates: RateInfo[];
  shopName?: string;
  includeTimestamp?: boolean;
  includeWatermark?: boolean;
}

export function ScreenshotView({
  rates,
  shopName = "RP Jewellers",
  includeTimestamp = true,
  includeWatermark = true,
}: ScreenshotViewProps) {
  const goldRates = rates.filter((rate) => rate.category === "gold");
  const silverRates = rates.filter((rate) => rate.category === "silver");
  const currentDate = format(new Date(), "dd MMMM yyyy");

  return (
    <div 
      id="screenshot-container"
      className="w-full max-w-md mx-auto bg-white p-4 rounded-lg shadow-md"
    >
      <div className="flex flex-col items-center justify-center mb-4">
        <div className="flex items-center mb-2">
          <img 
            src={rpLogo} 
            alt="RP Jewellers Logo" 
            className="h-12 w-12 object-contain mr-2" 
          />
          <h1 className="text-2xl font-bold text-amber-800">{shopName}</h1>
        </div>
        {includeTimestamp && (
          <p className="text-gray-600 text-sm">{currentDate}</p>
        )}
      </div>

      {goldRates.length > 0 && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-amber-600 mb-2">Gold Rates</h2>
          <div className="grid grid-cols-1 gap-3">
            {goldRates.map((rate) => (
              <Card key={rate.id} className="overflow-hidden border border-amber-100">
                <CardContent className="p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900">{rate.type}</span>
                    <div className="flex items-center">
                      <span className="text-lg font-bold text-amber-800">₹{rate.current.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>High: ₹{rate.high.toLocaleString()}</span>
                    <span>Low: ₹{rate.low.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {silverRates.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-600 mb-2">Silver Rates</h2>
          <div className="grid grid-cols-1 gap-3">
            {silverRates.map((rate) => (
              <Card key={rate.id} className="overflow-hidden border border-gray-200">
                <CardContent className="p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900">{rate.type}</span>
                    <div className="flex items-center">
                      <span className="text-lg font-bold text-gray-700">₹{rate.current.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>High: ₹{rate.high.toLocaleString()}</span>
                    <span>Low: ₹{rate.low.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {includeWatermark && (
        <div className="mt-6 pt-2 border-t border-gray-200">
          <p className="text-center text-xs text-gray-400">
            RP Jewellers - Rates updated on {format(new Date(), "dd MMM yyyy 'at' hh:mm a")}
          </p>
        </div>
      )}
    </div>
  );
}