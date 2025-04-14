import { Link, useLocation } from "wouter";
import { Home, Phone, Settings, Shield, UserCircle, Bell, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function BottomNavigation() {
  const [location] = useLocation();
  
  const auth = useAuth();
  const user = auth?.user || null;
  const { firebaseUser } = useAuth();
  
  return (
    <nav className="bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg fixed bottom-0 left-0 right-0 z-50">
      <div className="container mx-auto px-1">
        <div className="flex justify-around items-center">
          <Link href="/">
            <div className="flex flex-col items-center py-2 xs:py-3 w-1/5 text-center">
              <div className={`w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 ${location === '/' ? 'bg-amber-500' : ''} rounded-full flex items-center justify-center mb-0.5 xs:mb-1`}>
                <Home className="text-white h-4 w-4 xs:h-4.5 xs:w-4.5 sm:h-5 sm:w-5" />
              </div>
              <span className="text-3xs xs:text-2xs">Home</span>
            </div>
          </Link>
          
          <Link href="/admin">
            <div className="flex flex-col items-center py-2 xs:py-3 w-1/5 text-center">
              <div className={`w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 ${location === '/admin' ? 'bg-amber-500' : ''} rounded-full flex items-center justify-center mb-0.5 xs:mb-1`}>
                <Shield className={`${location === '/admin' ? 'text-white' : 'text-gray-300'} h-4 w-4 xs:h-4.5 xs:w-4.5 sm:h-5 sm:w-5`} />
              </div>
              <span className="text-3xs xs:text-2xs">Admin</span>
            </div>
          </Link>
          
          <Link href="/order">
            <div className="flex flex-col items-center py-2 xs:py-3 w-1/5 text-center">
              <div className={`w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 ${location === '/order' ? 'bg-amber-500' : ''} rounded-full flex items-center justify-center mb-0.5 xs:mb-1 ${location === '/order' ? '' : 'border border-white/30'}`}>
                <Settings className={`${location === '/order' ? 'text-white' : 'text-gray-300'} h-4 w-4 xs:h-4.5 xs:w-4.5 sm:h-5 sm:w-5`} />
              </div>
              <span className="text-3xs xs:text-2xs">Order</span>
            </div>
          </Link>
          
          <Link href="/notifications">
            <div className="flex flex-col items-center py-2 xs:py-3 w-1/5 text-center">
              <div className={`w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 ${location === '/notifications' ? 'bg-amber-500' : ''} rounded-full flex items-center justify-center mb-0.5 xs:mb-1`}>
                <Bell className={`${location === '/notifications' ? 'text-white' : 'text-gray-300'} h-4 w-4 xs:h-4.5 xs:w-4.5 sm:h-5 sm:w-5`} />
              </div>
              <span className="text-3xs xs:text-2xs">Alerts</span>
            </div>
          </Link>
          
          <Link href={firebaseUser ? "/notifications" : "/firebase-login"}>
            <div className="flex flex-col items-center py-2 xs:py-3 w-1/5 text-center">
              <div className={`w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 ${location === '/firebase-login' ? 'bg-amber-500' : ''} rounded-full flex items-center justify-center mb-0.5 xs:mb-1 ${firebaseUser ? 'bg-green-600' : ''}`}>
                {firebaseUser ? (
                  <UserCircle className="text-white h-4 w-4 xs:h-4.5 xs:w-4.5 sm:h-5 sm:w-5" />
                ) : (
                  <LogIn className={`${location === '/firebase-login' ? 'text-white' : 'text-gray-300'} h-4 w-4 xs:h-4.5 xs:w-4.5 sm:h-5 sm:w-5`} />
                )}
              </div>
              <span className="text-3xs xs:text-2xs">{firebaseUser ? 'Account' : 'Login'}</span>
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
}
