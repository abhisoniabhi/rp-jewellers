import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader, Trash, Share, ShoppingBag } from 'lucide-react';
import { Order, OrderItem, Product, Setting } from '@shared/schema';

export default function OrderPage() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();
  const { orderNumber } = useParams();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isCreatingOrder, setIsCreatingOrder] = useState(!orderNumber);
  
  // Query for the order if we have an order number
  const { 
    data: order,
    isLoading: isLoadingOrder,
    error: orderError
  } = useQuery({
    queryKey: ['/api/orders/number', orderNumber],
    queryFn: async () => {
      if (!orderNumber) return null;
      const res = await fetch(`/api/orders/number/${orderNumber}`);
      if (!res.ok) {
        throw new Error('Failed to fetch order');
      }
      return res.json();
    },
    enabled: !!orderNumber
  });

  // Query for order items
  const {
    data: orderItems,
    isLoading: isLoadingItems
  } = useQuery({
    queryKey: ['/api/orders', order?.id, 'items'],
    queryFn: async () => {
      if (!order) return [];
      const res = await fetch(`/api/orders/${order.id}/items`);
      if (!res.ok) {
        throw new Error('Failed to fetch order items');
      }
      return res.json();
    },
    enabled: !!order?.id
  });

  // Query for all products to display details
  const {
    data: products,
    isLoading: isLoadingProducts
  } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const res = await fetch('/api/products');
      if (!res.ok) {
        throw new Error('Failed to fetch products');
      }
      return res.json();
    }
  });

  // Query for settings to get WhatsApp number
  const {
    data: settings,
    isLoading: isLoadingSettings
  } = useQuery({
    queryKey: ['/api/settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      if (!res.ok) {
        throw new Error('Failed to fetch settings');
      }
      return res.json();
    }
  });

  // Local cart state for creating a new order
  const [cart, setCart] = useState<{
    productId: number;
    quantity: number;
    product: Product | null;
  }[]>([]);

  // Add product to cart from the query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('productId');
    
    if (productId && products) {
      // Find the product
      const productIdNum = parseInt(productId);
      const product = products.find((p: Product) => p.id === productIdNum);
      
      if (product) {
        // Check if product is already in cart
        const existingItem = cart.find(item => item.productId === productIdNum);
        
        if (existingItem) {
          // Update quantity
          setCart(prevCart => prevCart.map(item => 
            item.productId === productIdNum 
              ? { ...item, quantity: item.quantity + 1 } 
              : item
          ));
        } else {
          // Add new item
          setCart(prevCart => [...prevCart, { 
            productId: productIdNum, 
            quantity: 1, 
            product 
          }]);
        }
        
        // Clean up the URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        toast({
          title: 'Product added to order',
          description: `${product.name} has been added to your order.`
        });
      }
    }
  }, [products, cart, toast]);

  // Create a new order
  const createOrderMutation = useMutation({
    mutationFn: async (data: { customerName: string; customerPhone: string }) => {
      const res = await apiRequest('POST', '/api/orders', data);
      return res.json();
    },
    onSuccess: (data: Order) => {
      toast({
        title: 'Order created',
        description: `Order #${data.orderNumber} has been created.`
      });
      
      // Add items to the order
      cart.forEach(item => {
        addOrderItemMutation.mutate({
          orderId: data.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.product?.price || 0
        });
      });
      
      // Navigate to the order page
      setLocation(`/order/${data.orderNumber}`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create order',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Add an item to an order
  const addOrderItemMutation = useMutation({
    mutationFn: async (data: { 
      orderId: number; 
      productId: number; 
      quantity: number;
      price: number;
    }) => {
      const res = await apiRequest('POST', `/api/orders/${data.orderId}/items`, {
        productId: data.productId,
        quantity: data.quantity,
        price: data.price
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders', order?.id, 'items'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add item to order',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Handle place order
  const handlePlaceOrder = () => {
    if (cart.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Please add items to your cart before placing an order.',
        variant: 'destructive'
      });
      return;
    }

    if (!customerName || !customerPhone) {
      toast({
        title: 'Missing information',
        description: 'Please provide your name and phone number.',
        variant: 'destructive'
      });
      return;
    }

    createOrderMutation.mutate({ customerName, customerPhone });
  };

  // Handle add to cart
  const handleAddToCart = (product: Product) => {
    // Check if product is already in cart
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      // Update quantity
      setCart(prevCart => prevCart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      // Add new item
      setCart(prevCart => [...prevCart, { 
        productId: product.id, 
        quantity: 1, 
        product 
      }]);
    }

    toast({
      title: 'Product added to order',
      description: `${product.name} has been added to your order.`
    });
  };

  // Handle remove from cart
  const handleRemoveFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };

  // Handle update quantity
  const handleUpdateQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) {
      handleRemoveFromCart(productId);
      return;
    }

    setCart(prevCart => prevCart.map(item => 
      item.productId === productId 
        ? { ...item, quantity } 
        : item
    ));
  };

  // Calculate total price
  const calculateTotal = () => {
    if (isCreatingOrder) {
      return cart.reduce((total: number, item) => {
        return total + (item.product?.price || 0) * item.quantity;
      }, 0);
    } else if (orderItems && products) {
      return orderItems.reduce((total: number, item: OrderItem) => {
        return total + item.price * item.quantity;
      }, 0);
    }
    return 0;
  };

  // Share order on WhatsApp
  const handleShareOrder = () => {
    if (!order) return;
    
    const whatsappNumber = settings?.find((s: Setting) => s.key === "whatsappNumber")?.value || "";
    if (!whatsappNumber) {
      toast({
        title: 'WhatsApp number not configured',
        description: 'Please configure a WhatsApp number in the admin settings.',
        variant: 'destructive'
      });
      return;
    }

    const storeName = settings?.find((s: Setting) => s.key === "storeName")?.value || "Our Store";
    const orderUrl = `${window.location.origin}/order/${order.orderNumber}`;
    const message = `Hi, I'd like to place an order at ${storeName}. Here's my order: ${orderUrl}`;
    
    // Open WhatsApp with the message
    window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Loading state
  if (isLoadingOrder || isLoadingItems || isLoadingProducts || isLoadingSettings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader className="h-8 w-8 animate-spin mb-4" />
        <p>Loading order information...</p>
      </div>
    );
  }

  // Error state
  if (orderError && orderNumber) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
        <p className="mb-4">The order you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => setLocation('/')}>Go Back Home</Button>
      </div>
    );
  }

  // Get display items - either from cart (new order) or from orderItems (existing order)
  const displayItems = isCreatingOrder 
    ? cart 
    : orderItems?.map((item: OrderItem) => {
        const product = products?.find((p: Product) => p.id === item.productId);
        return {
          ...item,
          product
        };
      });

  return (
    <div className="container mx-auto p-4 pb-24">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>
            {isCreatingOrder ? 'New Order' : `Order #${order?.orderNumber}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isCreatingOrder ? (
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Your Name</Label>
                  <Input 
                    id="customerName" 
                    value={customerName} 
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Phone Number</Label>
                  <Input 
                    id="customerPhone" 
                    value={customerPhone} 
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Customer</Label>
                  <p className="text-sm">{order?.customerName}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p className="text-sm">{order?.customerPhone}</p>
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <div className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {order?.status}
                </div>
              </div>
            </div>
          )}

          <Separator className="my-6" />

          <div>
            <h3 className="text-lg font-medium mb-4">Order Items</h3>
            
            {displayItems?.length === 0 ? (
              <div className="text-center py-6">
                <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">Your order is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayItems?.map((item: any) => (
                  <Card key={item.productId}>
                    <div className="flex items-center p-4">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product?.name}</h4>
                        <p className="text-sm text-gray-500">₹ {item.product?.price}</p>
                      </div>

                      {isCreatingOrder ? (
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                          >
                            +
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveFromCart(item.productId)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span>Qty: {item.quantity}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <div className="w-full flex justify-between items-center mb-4">
            <div className="text-lg font-medium">Total</div>
            <div className="text-lg font-medium">₹ {calculateTotal()}</div>
          </div>
          
          {isCreatingOrder ? (
            <Button 
              className="w-full"
              onClick={handlePlaceOrder}
              disabled={cart.length === 0 || !customerName || !customerPhone || createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Place Order'
              )}
            </Button>
          ) : (
            <Button 
              className="w-full"
              onClick={handleShareOrder}
              variant="secondary"
            >
              <Share className="mr-2 h-4 w-4" />
              Share Order on WhatsApp
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}