import { Shield, ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import rpLogo from "../../assets/rp-logo.jpg";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function Header() {
  const auth = useAuth();
  const user = auth?.user;

  return (
    <header className="bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md">
      <div className="container mx-auto px-3 sm:px-4 py-1.5">
        <div className="flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <img 
                src={rpLogo} 
                alt="RP Jewellers Logo" 
                className="h-9 w-9 object-contain mr-2 rounded-full border-2 border-amber-300"
              />
              <h1 className="font-bold text-lg sm:text-xl tracking-wide">
                RP Jewellers
              </h1>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/order">
              <Button variant="ghost" size="sm" className="text-white hover:bg-amber-500/20 p-1">
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </Link>
            
            {user && (
              <Link href="/admin">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white hover:bg-amber-500/20 hidden sm:flex p-1"
                >
                  <Shield className="h-5 w-5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
