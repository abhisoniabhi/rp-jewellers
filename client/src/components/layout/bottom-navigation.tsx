import { Link, useLocation } from "wouter";
import { Home, Image, Phone, Grid } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function BottomNavigation() {
  const [location] = useLocation();
  
  // Use try/catch to handle potential auth context errors
  let user = null;
  try {
    const auth = useAuth();
    user = auth.user;
  } catch (err) {
    console.log("Auth not available yet in BottomNavigation");
  }
  
  return (
    <nav className="bg-burgundy-default text-white">
      <div className="container mx-auto">
        <div className="flex justify-around items-center">
          <Link href="/">
            <a className="flex flex-col items-center py-3 w-1/4 text-center">
              <div className={`w-10 h-10 ${location === '/' ? 'bg-burgundy-light' : ''} rounded-full flex items-center justify-center mb-1`}>
                <Home className="text-white" />
              </div>
            </a>
          </Link>
          <Link href="/gallery">
            <a className="flex flex-col items-center py-3 w-1/4 text-center">
              <Image className="text-gray-300" />
            </a>
          </Link>
          <Link href="/contact">
            <a className="flex flex-col items-center py-3 w-1/4 text-center">
              <Phone className="text-gray-300" />
            </a>
          </Link>
          <Link href={user ? "/admin" : "/auth"}>
            <a className="flex flex-col items-center py-3 w-1/4 text-center">
              <Grid className="text-gray-300" />
            </a>
          </Link>
        </div>
      </div>
    </nav>
  );
}
