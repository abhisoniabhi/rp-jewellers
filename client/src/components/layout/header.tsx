import { Bell, Bluetooth, Wifi, Battery, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import rpLogo from "../../assets/rp-logo.jpg";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function Header() {
  const [currentTime, setCurrentTime] = useState<string>("");
  const auth = useAuth();
  const user = auth?.user;

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
    <header className="bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex items-center mr-2 sm:mr-3">
              <img 
                src={rpLogo} 
                alt="RP Jewellers Logo" 
                className="h-8 w-8 sm:h-10 sm:w-10 object-contain mr-1 sm:mr-2 rounded-full border-2 border-amber-300"
              />
              <h1 className="font-playfair text-lg sm:text-xl font-bold">
                <span className="sm:inline hidden">RP Jewellers</span>
                <span className="sm:hidden">RP Jewels</span>
              </h1>
            </div>
            <span className="text-3xs sm:text-xs bg-yellow-300 text-amber-800 px-1.5 sm:px-2 py-0.5 rounded font-medium whitespace-nowrap">Today's Rates</span>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            {user && (
              <Link href="/admin">
                <Button className="h-7 sm:h-8 bg-amber-800 hover:bg-amber-900 px-1.5 sm:px-2 mr-1 sm:mr-2 hidden sm:flex">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="text-xs">Admin</span>
                </Button>
              </Link>
            )}
            
            <div className="flex items-center space-x-0.5 sm:space-x-2">
              <span id="current-time" className="text-xs sm:text-sm">{currentTime}</span>
              {/* Hide these icons on small screens */}
              <Bell className="h-3 w-3 sm:h-4 sm:w-4 hidden xs:inline-block" />
              <Bluetooth className="h-3 w-3 sm:h-4 sm:w-4 hidden sm:inline-block" />
              <Wifi className="h-3 w-3 sm:h-4 sm:w-4" />
              <div className="w-5 sm:w-8 text-xs hidden xs:block">
                <div className="flex h-3 items-end space-x-0.5">
                  <div className="w-0.5 sm:w-1 h-1 bg-white rounded-sm"></div>
                  <div className="w-0.5 sm:w-1 h-1.5 bg-white rounded-sm"></div>
                  <div className="w-0.5 sm:w-1 h-2 bg-white rounded-sm"></div>
                  <div className="w-0.5 sm:w-1 h-2.5 bg-white rounded-sm"></div>
                </div>
              </div>
              <Battery className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
