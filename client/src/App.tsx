import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AdminPage from "@/pages/admin-page";
import AuthPage from "@/pages/auth-page";
import CollectionDetailPage from "@/pages/collection-detail-page";
import ProductDetailPage from "@/pages/product-detail-page";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/collections/:id" component={CollectionDetailPage} />
      <Route path="/products/:productId" component={ProductDetailPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;
