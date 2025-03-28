import { Bell, Bluetooth, Wifi, Battery, GemIcon } from "lucide-react";
import { useState, useEffect } from "react";

export function Header() {
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-gradient-to-r from-amber-700 to-amber-800 text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <GemIcon className="h-5 w-5 text-amber-300 mr-2" />
            <h1 className="font-playfair text-xl font-bold mr-2">ShineRates</h1>
            <span className="text-xs bg-amber-300 text-amber-900 px-2 py-0.5 rounded-full font-medium">Premium</span>
          </div>
          <div className="flex items-center space-x-2">
            <span id="current-time" className="text-sm font-medium">{currentTime}</span>
            <Bell className="h-4 w-4 text-amber-200" />
            <Bluetooth className="h-4 w-4 text-amber-200" />
            <Wifi className="h-4 w-4 text-amber-200" />
            <div className="w-8 text-xs">
              <div className="flex h-3 items-end space-x-0.5">
                <div className="w-1 h-1 bg-amber-200 rounded-sm"></div>
                <div className="w-1 h-1.5 bg-amber-200 rounded-sm"></div>
                <div className="w-1 h-2 bg-amber-200 rounded-sm"></div>
                <div className="w-1 h-2.5 bg-amber-200 rounded-sm"></div>
              </div>
            </div>
            <Battery className="h-4 w-4 text-amber-200" />
          </div>
        </div>
      </div>
    </header>
  );
}
