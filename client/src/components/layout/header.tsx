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
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex items-center mr-3">
              <img 
                src={rpLogo} 
                alt="RP Jewellers Logo" 
                className="h-10 w-10 object-contain mr-2 rounded-full border-2 border-amber-300"
              />
              <h1 className="font-playfair text-xl font-bold">RP Jewellers</h1>
            </div>
            <span className="text-xs bg-yellow-300 text-amber-800 px-2 py-0.5 rounded font-medium">Today's Rates</span>
          </div>
          
          <div className="flex items-center gap-2">
            {user && (
              <Link href="/admin">
                <Button className="h-8 bg-amber-800 hover:bg-amber-900 px-2 mr-2 hidden md:flex">
                  <Shield className="h-4 w-4 mr-1" />
                  <span className="text-xs">Admin</span>
                </Button>
              </Link>
            )}
            
            <div className="flex items-center space-x-2">
              <span id="current-time" className="text-sm">{currentTime}</span>
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
      </div>
    </header>
  );
}
