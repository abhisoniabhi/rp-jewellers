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
import { NotificationProvider } from "@/hooks/use-notifications";
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/firebase-login" component={FirebaseLoginPage} />
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
          <Router />
          <Toaster />
        </NotificationProvider>
      </AuthProvider>
    </>
  );
}

export default App;
