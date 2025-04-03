import { Shield } from "lucide-react";
import { Link } from "wouter";
import rpLogo from "../../assets/rp-logo.jpg";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function Header() {
  const auth = useAuth();
  const user = auth?.user;

  return (
    <header className="bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md">
      <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <img 
                src={rpLogo} 
                alt="RP Jewellers Logo" 
                className="h-10 w-10 sm:h-12 sm:w-12 object-contain mr-3 rounded-full border-2 border-amber-300"
              />
              <div>
                <h1 className="font-bold text-xl sm:text-2xl tracking-wide leading-tight">
                  RP Jewellers
                </h1>
                <p className="text-xs text-yellow-200 -mt-1">Premium Jewelry Collection</p>
              </div>
            </div>
          </Link>

          <div className="flex items-center">
            {user && (
              <Link href="/admin">
                <Button className="h-8 sm:h-9 bg-amber-800 hover:bg-amber-900 px-2 sm:px-3 hidden sm:flex">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
                  <span>Admin</span>
                </Button>
              </Link>
            )}
            
            <span className="ml-2 text-xs sm:text-sm bg-yellow-300 text-amber-800 px-2 sm:px-3 py-1 rounded-full font-medium">
              Today's Rates
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
