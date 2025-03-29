import { Link, useLocation } from "wouter";
import { Home, Image, Info, Phone, Settings, UserCircle } from "lucide-react";
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
    <nav className="bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg fixed bottom-0 left-0 right-0 z-50">
      <div className="container mx-auto">
        <div className="flex justify-around items-center">
          <Link href="/">
            <div className="flex flex-col items-center py-3 w-1/5 text-center">
              <div className={`w-10 h-10 ${location === '/' ? 'bg-amber-500' : ''} rounded-full flex items-center justify-center mb-1`}>
                <Home className="text-white h-5 w-5" />
              </div>
              <span className="text-2xs">Home</span>
            </div>
          </Link>
          <Link href="/gallery">
            <div className="flex flex-col items-center py-3 w-1/5 text-center">
              <div className={`w-10 h-10 ${location === '/gallery' ? 'bg-amber-500' : ''} rounded-full flex items-center justify-center mb-1`}>
                <Image className="text-gray-300 h-5 w-5" />
              </div>
              <span className="text-2xs">Gallery</span>
            </div>
          </Link>
          <Link href="/contact">
            <div className="flex flex-col items-center py-3 w-1/5 text-center">
              <div className={`w-10 h-10 ${location === '/contact' ? 'bg-amber-500' : ''} rounded-full flex items-center justify-center mb-1`}>
                <Phone className="text-gray-300 h-5 w-5" />
              </div>
              <span className="text-2xs">Contact</span>
            </div>
          </Link>
          {user && user.isAdmin && (
            <Link href="/admin">
              <div className="flex flex-col items-center py-3 w-1/5 text-center">
                <div className={`w-10 h-10 ${location === '/admin' ? 'bg-amber-500' : ''} rounded-full flex items-center justify-center mb-1`}>
                  <Settings className={`${location === '/admin' ? 'text-white' : 'text-gray-300'} h-5 w-5`} />
                </div>
                <span className="text-2xs">Admin</span>
              </div>
            </Link>
          )}
          {!user?.isAdmin && (
            <Link href="/about">
              <div className="flex flex-col items-center py-3 w-1/5 text-center">
                <div className={`w-10 h-10 ${location === '/about' ? 'bg-amber-500' : ''} rounded-full flex items-center justify-center mb-1`}>
                  <Info className="text-gray-300 h-5 w-5" />
                </div>
                <span className="text-2xs">About</span>
              </div>
            </Link>
          )}
          <Link href={user ? "/admin/account" : "/auth"}>
            <div className="flex flex-col items-center py-3 w-1/5 text-center">
              <div className={`w-10 h-10 ${location === '/auth' || location === '/admin/account' ? 'bg-amber-500' : ''} rounded-full flex items-center justify-center mb-1`}>
                <UserCircle className={`${location === '/auth' || location === '/admin/account' ? 'text-white' : 'text-gray-300'} h-5 w-5`} />
              </div>
              <span className="text-2xs">{user ? 'Account' : 'Login'}</span>
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
}
