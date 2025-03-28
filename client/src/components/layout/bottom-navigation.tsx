import { Link, useLocation } from "wouter";
import { Home, Image, Phone, ShieldCheck } from "lucide-react";
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
    <nav className="bg-amber-700 text-white shadow-lg border-t border-amber-800">
      <div className="container mx-auto">
        <div className="flex justify-around items-center">
          <Link href="/">
            <div className="flex flex-col items-center py-3 w-1/4 text-center">
              <div className={`w-10 h-10 ${location === '/' ? 'bg-amber-600' : ''} rounded-full flex items-center justify-center mb-1 transition-colors`}>
                <Home className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs text-amber-100">Home</span>
            </div>
          </Link>
          <Link href="/gallery">
            <div className="flex flex-col items-center py-3 w-1/4 text-center">
              <div className={`w-10 h-10 ${location === '/gallery' ? 'bg-amber-600' : ''} rounded-full flex items-center justify-center mb-1 transition-colors`}>
                <Image className="h-5 w-5 text-amber-200" />
              </div>
              <span className="text-xs text-amber-100">Gallery</span>
            </div>
          </Link>
          <Link href="/contact">
            <div className="flex flex-col items-center py-3 w-1/4 text-center">
              <div className={`w-10 h-10 ${location === '/contact' ? 'bg-amber-600' : ''} rounded-full flex items-center justify-center mb-1 transition-colors`}>
                <Phone className="h-5 w-5 text-amber-200" />
              </div>
              <span className="text-xs text-amber-100">Contact</span>
            </div>
          </Link>
          <Link href={user ? "/admin" : "/auth"}>
            <div className="flex flex-col items-center py-3 w-1/4 text-center">
              <div className={`w-10 h-10 ${location === '/admin' || location === '/auth' ? 'bg-amber-600' : ''} rounded-full flex items-center justify-center mb-1 transition-colors`}>
                <ShieldCheck className="h-5 w-5 text-amber-200" />
              </div>
              <span className="text-xs text-amber-100">{user ? "Admin" : "Login"}</span>
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
}
