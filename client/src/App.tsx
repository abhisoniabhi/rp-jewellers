import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AdminPage from "@/pages/admin-page";
import AuthPage from "@/pages/auth-page";
import LoginPage from "@/pages/login-page";
import CollectionDetailPage from "@/pages/collection-detail-page";
import ProductDetailPage from "@/pages/product-detail-page";
import OrderPage from "@/pages/order-page";
import FirebaseLoginPage from "@/pages/firebase-login-page";
import NotificationsPage from "@/pages/notifications-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthWrapper } from "./lib/auth-wrapper";
import { NotificationProvider } from "@/hooks/use-notifications";
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  return (
    <Switch>
      {/* Public routes that don't require Firebase auth */}
      <Route path="/firebase-login" component={FirebaseLoginPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Protected routes requiring Firebase auth */}
      <Route path="/" component={HomePage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/collections/:id" component={CollectionDetailPage} />
      <Route path="/products/:productId" component={ProductDetailPage} />
      <Route path="/order" component={OrderPage} />
      <Route path="/order/:orderNumber" component={OrderPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <AuthProvider>
        <NotificationProvider>
          <AuthWrapper>
            <Router />
            <Toaster />
          </AuthWrapper>
        </NotificationProvider>
      </AuthProvider>
    </>
  );
}

export default App;
