import { Bell, Bluetooth, Wifi, Battery } from "lucide-react";
import { useState, useEffect } from "react";
import rpLogo from "../../assets/rp-logo.jpg";

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
    <header className="bg-gradient-to-r from-amber-700 to-amber-800 text-white shadow-lg">
      {/* Status bar */}
      <div className="bg-black bg-opacity-20 py-1">
        <div className="container mx-auto px-4">
          <div className="flex justify-end items-center space-x-2">
            <span id="current-time" className="text-sm font-medium">{currentTime}</span>
            <Bell className="h-4 w-4" />
            <Bluetooth className="h-4 w-4" />
            <Wifi className="h-4 w-4" />
            <div className="w-8 text-xs">
              <div className="flex h-3 items-end space-x-0.5">
                <div className="w-1 h-1 bg-white rounded-sm"></div>
                <div className="w-1 h-1.5 bg-white rounded-sm"></div>
                <div className="w-1 h-2 bg-white rounded-sm"></div>
                <div className="w-1 h-2.5 bg-white rounded-sm"></div>
              </div>
            </div>
            <Battery className="h-4 w-4" />
          </div>
        </div>
      </div>
      
      {/* Main header */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex items-center mr-4">
              <div className="bg-white rounded-full p-0.5 shadow-md mr-3">
                <img 
                  src={rpLogo} 
                  alt="RP Jewellers Logo" 
                  className="h-11 w-11 object-contain rounded-full border-2 border-amber-300"
                />
              </div>
              <div>
                <h1 className="font-playfair text-2xl font-bold text-white tracking-wide">RP Jewellers</h1>
                <div className="mt-0.5">
                  <span className="text-xs bg-gradient-to-r from-yellow-300 to-amber-300 text-amber-900 px-2 py-0.5 rounded-sm font-medium shadow-sm">Premium Gold Rates</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
