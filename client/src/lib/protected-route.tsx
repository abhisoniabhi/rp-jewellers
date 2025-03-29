import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const auth = useAuth();
  
  // Create a wrapper component that will handle authentication
  const ProtectedComponent = () => {
    // Get auth state directly inside the component to avoid any timing issues
    const { user, isLoading } = auth;
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      );
    }
    
    if (!user) {
      return <Redirect to="/auth" />;
    }
    
    return <Component />;
  };

  // Use the regular Route with our protected wrapper
  return <Route path={path} component={ProtectedComponent} />;
}
