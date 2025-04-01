import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Loader2, Save, ArrowLeft, CreditCard, UserCircle, ShoppingBag, Plus, 
  Pencil, Trash2, Image as ImageIcon, Weight, Tag as TagIcon, Camera,
  Grid as LayoutGrid
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { RateInfo } from "@/components/ui/rate-card";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { eventBus, EVENTS } from "@/lib/events";
import { Product, Collection, InsertProduct } from "@shared/schema";

const rateSchema = z.object({
  type: z.string(),
  current: z.coerce.number(),
  high: z.coerce.number(),
  low: z.coerce.number(),
  category: z.string()
});

const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().nullable().optional(),
  taunch: z.coerce.number().min(0, "Taunch cannot be negative").refine(
    val => Number.isFinite(val),
    { message: "Taunch must be a valid number" }
  ),
  weight: z.coerce.number().min(0, "Weight cannot be negative"),
  karatType: z.enum(["18k", "22k"]),
  category: z.string().min(1, "Category is required"),
  imageUrl: z.string().refine(
    (val) => val.startsWith('http') || val.startsWith('data:image'),
    { message: "Please enter a valid URL or upload an image" }
  ),
  collectionId: z.coerce.number(),
  inStock: z.boolean().default(true)
});

type RateFormData = z.infer<typeof rateSchema>;
type ProductFormData = z.infer<typeof productSchema>;

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("gold");
  const [selectedRate, setSelectedRate] = useState<RateInfo | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [selectedCollectionForProduct, setSelectedCollectionForProduct] = useState<Collection | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryTaunchValue, setCategoryTaunchValue] = useState<number>(0);
  
  // No longer using authentication
  const user = { username: "Admin" };

  // Fetch collections and products
  const { data: collections, isLoading: collectionsLoading } = useQuery<Collection[]>({
    queryKey: ["/api/collections"],
  });

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: rates, isLoading: ratesLoading } = useQuery<RateInfo[]>({
    queryKey: ["/api/rates"],
  });

  // Rate form
  const form = useForm<RateFormData>({
    resolver: zodResolver(rateSchema),
    defaultValues: {
      type: "",
      current: 0,
      high: 0,
      low: 0,
      category: "gold"
    },
  });

  const updateRateMutation = useMutation({
    mutationFn: async (data: RateFormData) => {
      const res = await apiRequest("POST", "/api/rates/update", data);
      return await res.json();
    },
    onSuccess: (data) => {
      // Show success toast
      toast({
        title: "Success!",
        description: `Rate updated successfully to ₹${data.current.toLocaleString()}`,
      });
      
      // Force a hard refresh of rates data
      queryClient.invalidateQueries({ queryKey: ["/api/rates"] });
      
      // Emit event to update rates in real-time across the app
      eventBus.publish(EVENTS.RATES_UPDATED);
      console.log("Published rate update event");
      
      // Don't reset form - allow user to see the updated values
      // Instead, update the selected rate with new data
      if (selectedRate) {
        setSelectedRate({
          ...selectedRate,
          ...data
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error updating rate",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSelectRate = (rate: RateInfo) => {
    setSelectedRate(rate);
    form.setValue("type", rate.type);
    form.setValue("current", Number(rate.current));
    form.setValue("high", Number(rate.high));
    form.setValue("low", Number(rate.low));
    form.setValue("category", rate.category);
  };

  const onSubmit = (data: RateFormData) => {
    // Only send necessary data: type, current rate, and category
    const updateData = {
      type: data.type,
      current: data.current,
      category: activeTab
    };
    updateRateMutation.mutate(updateData as RateFormData);
  };

  // Product form
  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      taunch: 0,
      weight: 0,
      karatType: "22k",
      category: "",
      imageUrl: "",
      collectionId: 1,
      inStock: true
    }
  });
  
  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      const res = await apiRequest("POST", "/api/products", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      
      // Close dialog and reset form
      setIsDialogOpen(false);
      productForm.reset();
      
      // Refresh products list
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive"
      });
    }
  });
  
  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Product> }) => {
      const res = await apiRequest("PATCH", `/api/products/${id}`, data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      
      // Close dialog and reset form
      setIsDialogOpen(false);
      setEditingProduct(null);
      productForm.reset();
      
      // Refresh products list
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive"
      });
    }
  });
  
  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      
      // Refresh products list
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive"
      });
    }
  });
  
  // Handle product form submission
  const onProductSubmit = (data: ProductFormData) => {
    // Map taunch field to price for backend compatibility
    const productData = {
      ...data,
      price: data.taunch, // Map taunch to price for backend
      inStock: data.inStock ? 1 : 0
    };
    
    if (editingProduct) {
      updateProductMutation.mutate({
        id: editingProduct.id,
        data: productData
      });
    } else {
      createProductMutation.mutate(productData as InsertProduct);
    }
  };
  
  // Handle edit button click
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    
    // Convert karatType to match enum values
    const karatType = (product.karatType === "18k" || product.karatType === "22k") 
      ? product.karatType 
      : "22k";
    
    productForm.reset({
      name: product.name,
      description: product.description || "",
      taunch: product.price || 0, // Using price field from DB but naming it taunch in the UI
      weight: product.weight || 0,
      karatType: karatType as "18k" | "22k",
      category: product.category || "",
      imageUrl: product.imageUrl || "",
      collectionId: product.collectionId,
      inStock: product.inStock === 1
    });
    
    setIsDialogOpen(true);
  };
  
  // Handle delete button click
  const handleDeleteProduct = (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      deleteProductMutation.mutate(product.id);
    }
  };
  
  // Handle adding a new product
  const handleAddProduct = () => {
    setEditingProduct(null);
    productForm.reset({
      name: "",
      description: "",
      taunch: 0,
      weight: 0,
      karatType: "22k",
      category: "",
      imageUrl: "",
      collectionId: 1,
      inStock: true
    });
    setIsDialogOpen(true);
  };
  
  // Handle image upload from various sources
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreviewImage(dataUrl);
      productForm.setValue("imageUrl", dataUrl);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle camera capture
  const handleCameraCapture = async () => {
    try {
      // Check if the browser supports getUserMedia
      if (!navigator.mediaDevices?.getUserMedia) {
        toast({
          title: "Error",
          description: "Your browser doesn't support camera access",
          variant: "destructive"
        });
        return;
      }
      
      // Create video and canvas elements for camera capture
      const videoElement = document.createElement('video');
      const canvasElement = document.createElement('canvas');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      videoElement.srcObject = stream;
      videoElement.play();
      
      // Wait for video to be ready
      setTimeout(() => {
        // Set canvas dimensions and draw the video frame
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        const context = canvasElement.getContext('2d');
        context?.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
        
        // Convert to data URL and stop the stream
        const dataUrl = canvasElement.toDataURL('image/jpeg');
        stream.getTracks().forEach(track => track.stop());
        
        // Set the captured image
        setPreviewImage(dataUrl);
        productForm.setValue("imageUrl", dataUrl);
        
        toast({
          title: "Success",
          description: "Image captured successfully",
        });
      }, 500);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to access camera: " + (error as Error).message,
        variant: "destructive"
      });
    }
  };
  
  // Reset form when closing dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setPreviewImage(null);
    productForm.reset();
  };
  
  // Handle updating taunch for all products in a category
  const handleCategoryTaunchUpdate = () => {
    if (!selectedCategory || categoryTaunchValue <= 0) {
      toast({
        title: "Error",
        description: "Please select a category and enter a valid taunch value",
        variant: "destructive"
      });
      return;
    }
    
    // If products aren't loaded yet, show an error
    if (!products) {
      toast({
        title: "Error",
        description: "Unable to load products. Please try again later.",
        variant: "destructive"
      });
      return;
    }
    
    // Get all products in the selected category
    const productsInCategory = products.filter(p => p.category === selectedCategory);
    
    if (productsInCategory.length === 0) {
      toast({
        title: "Error",
        description: "No products found in this category",
        variant: "destructive"
      });
      return;
    }
    
    // Confirm before updating
    if (!window.confirm(`Are you sure you want to set the taunch value to ${categoryTaunchValue}% for all ${productsInCategory.length} products in the "${selectedCategory}" category?`)) {
      return;
    }
    
    // Create a Promise for each product update
    const updatePromises = productsInCategory.map(product => 
      apiRequest("PATCH", `/api/products/${product.id}`, { price: categoryTaunchValue })
    );
    
    // Execute all updates
    Promise.all(updatePromises)
      .then(() => {
        toast({
          title: "Success",
          description: `Updated taunch value for all ${productsInCategory.length} products in the "${selectedCategory}" category`,
        });
        
        // Close the dialog and refresh the products list
        setIsCategoryDialogOpen(false);
        setSelectedCategory(null);
        setCategoryTaunchValue(0);
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      })
      .catch(error => {
        toast({
          title: "Error",
          description: error.message || "Failed to update products",
          variant: "destructive"
        });
      });
  };

  const handleLogout = () => {
    setLocation("/");
  };

  const isLoading = ratesLoading || collectionsLoading || productsLoading;
  
  if (isLoading || !rates || !collections || !products) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }
  
  // Now that products is loaded, calculate products in each collection
  const productsInCollection = products.reduce((acc, product) => {
    const collectionId = product.collectionId;
    acc[collectionId] = (acc[collectionId] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  // Calculate products in each category
  const categoryCounts = products.reduce((acc, product) => {
    if (product.category) {
      acc[product.category] = (acc[product.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow bg-gray-50">
        <div className="container mx-auto px-4 py-4">
          {/* Admin Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                className="p-0 text-gray-700" 
                onClick={() => setLocation("/")}
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                <span>Back to Home</span>
              </Button>
              <h1 className="text-2xl font-semibold text-amber-800 hidden md:block">Admin Dashboard</h1>
            </div>

            <div className="flex gap-2 items-center">
              {user && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-800 mr-1">
                  <UserCircle className="h-4 w-4" />
                  <span className="text-sm font-medium hidden md:inline-block">
                    {user.username}
                  </span>
                </div>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="border-amber-600 text-amber-700 hover:bg-amber-50"
              >
                Logout
              </Button>
            </div>
          </div>

          {/* Main Admin Tabs */}
          <Tabs defaultValue="rates" className="w-full">
            <TabsList className="grid w-full grid-cols-4 rounded-md mb-6 shadow-sm bg-amber-50 p-1.5">
              <TabsTrigger 
                value="rates" 
                className="data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-md py-2.5 transition-all font-medium text-sm"
              >
                Rates
              </TabsTrigger>
              <TabsTrigger 
                value="collections" 
                className="data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-md py-2.5 transition-all font-medium text-sm"
              >
                Collections
              </TabsTrigger>
              <TabsTrigger 
                value="categories" 
                className="data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-md py-2.5 transition-all font-medium text-sm"
              >
                Categories
              </TabsTrigger>
              <TabsTrigger 
                value="products" 
                className="data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-md py-2.5 transition-all font-medium text-sm"
              >
                Products
              </TabsTrigger>
            </TabsList>

            {/* Rates Tab Content */}
            <TabsContent value="rates" className="space-y-4 animate-in fade-in-50 slide-in-from-left-5">
              <Card className="shadow-md border-amber-100">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b">
                  <CardTitle className="text-amber-800 flex items-center">
                    <span className="bg-amber-100 rounded-full p-1.5 mr-2">
                      <CreditCard className="h-5 w-5 text-amber-700" />
                    </span>
                    Rate Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs defaultValue="gold" className="w-full" onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
                      <TabsTrigger 
                        value="gold" 
                        className="data-[state=active]:bg-amber-100 data-[state=active]:border-b-2 data-[state=active]:border-amber-600 rounded-none text-sm px-3 py-2"
                      >
                        Gold Rates
                      </TabsTrigger>
                      <TabsTrigger 
                        value="silver" 
                        className="data-[state=active]:bg-gray-100 data-[state=active]:border-b-2 data-[state=active]:border-gray-500 rounded-none text-sm px-3 py-2"
                      >
                        Silver Rates
                      </TabsTrigger>
                    </TabsList>

                    <div className="p-6">
                      <div className="mb-6">
                        <h3 className="text-sm font-medium mb-3 text-gray-700">Select rate to update:</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {rates
                            .filter(rate => rate.category === activeTab)
                            .map(rate => (
                              <Button 
                                key={rate.id} 
                                variant={selectedRate?.id === rate.id ? "default" : "outline"}
                                size="sm"
                                className={`${selectedRate?.id === rate.id 
                                  ? 'bg-amber-100 border-2 border-amber-500 text-amber-900' 
                                  : 'hover:bg-amber-50'} justify-start text-xs whitespace-normal h-auto py-2 text-left`}
                                onClick={() => handleSelectRate(rate)}
                              >
                                <span className="line-clamp-2">{rate.type}</span>
                              </Button>
                            ))
                          }
                        </div>
                      </div>

                      {selectedRate ? (
                        <div className="border rounded-md p-4 bg-amber-50/50">
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                              <div className="space-y-4">
                                <FormField
                                  control={form.control}
                                  name="type"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-amber-900">Rate Type</FormLabel>
                                      <div className="p-2 bg-gray-50 border border-gray-200 rounded-md text-gray-700">
                                        {field.value}
                                      </div>
                                      <Input type="hidden" {...field} />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="current"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-amber-900">Current Rate (₹)</FormLabel>
                                      <FormControl>
                                        <Input {...field} type="number" placeholder="Enter current rate" className="border-amber-200 focus-visible:ring-amber-500" />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                                  <div className="text-xs text-gray-500 mb-1">Daily High (₹)</div>
                                  <div className="font-medium text-gray-800">{selectedRate?.high.toLocaleString()}</div>
                                  <Input type="hidden" {...form.register("high")} />
                                </div>

                                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                                  <div className="text-xs text-gray-500 mb-1">Daily Low (₹)</div>
                                  <div className="font-medium text-gray-800">{selectedRate?.low.toLocaleString()}</div>
                                  <Input type="hidden" {...form.register("low")} />
                                </div>
                              </div>

                              <div className="flex justify-end pt-2">
                                <Button 
                                  type="submit" 
                                  className="bg-amber-600 hover:bg-amber-700 text-white" 
                                  disabled={updateRateMutation.isPending}
                                >
                                  {updateRateMutation.isPending ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      Updating...
                                    </>
                                  ) : (
                                    <>
                                      <Save className="h-4 w-4 mr-2" />
                                      Update Rate
                                    </>
                                  )}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </div>
                      ) : (
                        <div className="text-center py-6 border rounded-md bg-gray-50/80 text-gray-500">
                          Select a rate from above to update its values
                        </div>
                      )}
                    </div>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Products Tab Content */}
            <TabsContent value="products" className="space-y-4 animate-in fade-in-50 slide-in-from-left-5">
              <Card className="shadow-md border-amber-100">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b">
                  <CardTitle className="text-amber-800 flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="bg-amber-100 rounded-full p-1.5 mr-2">
                        <ShoppingBag className="h-5 w-5 text-amber-700" />
                      </span>
                      Product Management
                    </div>
                    <Button 
                      onClick={handleAddProduct}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Product
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {products.length === 0 ? (
                    <div className="text-center py-8 border rounded-md bg-gray-50/80 text-gray-500">
                      No products found. Click the "Add Product" button to create your first product.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {products.map(product => {
                        const collection = collections.find(c => c.id === product.collectionId);
                        return (
                          <div key={product.id} className="rounded-lg border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div className="aspect-square w-full overflow-hidden bg-gray-100">
                              {product.imageUrl ? (
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.name} 
                                  className="h-full w-full object-cover transition-all hover:scale-105"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center bg-gray-100">
                                  <ImageIcon className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="p-2.5">
                              <h3 className="font-semibold text-sm line-clamp-1 mb-1">{product.name}</h3>
                              
                              <div className="flex gap-1.5 items-center mb-1">
                                <Badge variant={product.inStock ? "default" : "outline"} className="text-xs px-1.5 py-0">
                                  {product.inStock ? "In Stock" : "Out"}
                                </Badge>
                                <span className="text-xs text-gray-500">{product.karatType}</span>
                              </div>
                              
                              <div className="flex justify-between mb-1 text-xs">
                                <div className="flex items-center text-amber-700">
                                  <span>Taunch: </span>
                                  <span className="font-semibold ml-1">{product.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}%</span>
                                </div>
                                
                                <div className="flex items-center text-blue-700">
                                  <span>Weight: </span>
                                  <span className="font-semibold ml-1">{product.weight}g</span>
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-1 mb-1.5">
                                {collection && (
                                  <Badge variant="outline" className="text-xs px-1.5 py-0 border-amber-200 text-amber-800 bg-amber-50">
                                    {collection.name}
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs px-1.5 py-0 border-blue-200 text-blue-800 bg-blue-50 capitalize">
                                  {product.category}
                                </Badge>
                              </div>
                              
                              <div className="flex justify-end gap-0.5">
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-6 w-6 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-full p-0"
                                  onClick={() => handleEditProduct(product)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-6 w-6 bg-red-50 text-red-700 hover:bg-red-100 rounded-full p-0"
                                  onClick={() => handleDeleteProduct(product)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Collections Tab Content */}
            <TabsContent value="collections" className="space-y-4 animate-in fade-in-50 slide-in-from-left-5">
              <Card className="shadow-md border-amber-100">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b">
                  <CardTitle className="text-amber-800 flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="bg-amber-100 rounded-full p-1.5 mr-2">
                        <LayoutGrid className="h-5 w-5 text-amber-700" />
                      </span>
                      Collection Management
                    </div>
                    <Button 
                      onClick={() => {
                        setEditingCollection(null);
                        setIsCollectionDialogOpen(true);
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Collection
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {collections.length === 0 ? (
                    <div className="text-center py-8 border rounded-md bg-gray-50/80 text-gray-500">
                      No collections found. Click the "Add Collection" button to create your first collection.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {collections.map(collection => (
                        <div key={collection.id} className="rounded-lg border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                          <div className="aspect-video w-full overflow-hidden bg-amber-50">
                            {collection.imageUrl ? (
                              <img 
                                src={collection.imageUrl} 
                                alt={collection.name} 
                                className="h-full w-full object-cover transition-all hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center bg-amber-50">
                                <LayoutGrid className="h-10 w-10 text-amber-300" />
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">{collection.name}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2">{collection.description}</p>
                              </div>
                              <div className="flex gap-1">
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-7 w-7 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                  onClick={() => {
                                    setEditingCollection(collection);
                                    setIsCollectionDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-7 w-7 bg-red-50 text-red-700 hover:bg-red-100"
                                  onClick={() => {
                                    // Confirm before deleting
                                    if (window.confirm(`Are you sure you want to delete the collection "${collection.name}"?`)) {
                                      // Delete the collection
                                      apiRequest("DELETE", `/api/collections/${collection.id}`)
                                        .then(() => {
                                          toast({
                                            title: "Collection deleted",
                                            description: "Collection has been successfully deleted.",
                                          });
                                          queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
                                        })
                                        .catch((error: Error) => {
                                          toast({
                                            title: "Error",
                                            description: error.message,
                                            variant: "destructive",
                                          });
                                        });
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center mt-4">
                              <Badge variant="outline" className="border-amber-200 text-amber-800 bg-amber-50">
                                {productsInCollection[collection.id] || 0} products
                              </Badge>
                              
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-xs h-8"
                                onClick={() => {
                                  // Logic to add product to this collection
                                  setSelectedCollectionForProduct(collection);
                                  handleAddProduct();
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Product
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Categories Tab Content */}
            <TabsContent value="categories" className="space-y-4 animate-in fade-in-50 slide-in-from-left-5">
              <Card className="shadow-md border-amber-100">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b">
                  <CardTitle className="text-amber-800 flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="bg-amber-100 rounded-full p-1.5 mr-2">
                        <TagIcon className="h-5 w-5 text-amber-700" />
                      </span>
                      Category Management
                    </div>
                    <Button 
                      onClick={() => {
                        setIsCategoryDialogOpen(true);
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Category
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(categoryCounts).map(([category, count]: [string, number]) => (
                      <div key={category} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 text-blue-700 p-2 rounded-full">
                            <TagIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-medium capitalize">{category}</h3>
                            <p className="text-sm text-gray-500">{count} products</p>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-xs h-8"
                            onClick={() => {
                              // Logic to add product to this category
                              productForm.setValue('category', category);
                              handleAddProduct();
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Product
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant="secondary"
                            className="text-xs h-8 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                            onClick={() => {
                              // Open dialog to set taunch for all products in this category
                              setSelectedCategory(category);
                              setCategoryTaunchValue(0);
                              setIsCategoryDialogOpen(true);
                            }}
                          >
                            <TagIcon className="h-3 w-3 mr-1" />
                            Set Taunch
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Product Dialog */}
          {/* Category Taunch Update Dialog */}
          <Dialog open={isCategoryDialogOpen} onOpenChange={(open) => {
            if (!open) {
              setIsCategoryDialogOpen(false);
              setSelectedCategory(null);
              setCategoryTaunchValue(0);
            }
          }}>
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle>Set Taunch Value for Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-blue-800">
                  <h4 className="font-medium mb-1 capitalize">Category: {selectedCategory}</h4>
                  <p className="text-sm text-blue-700">
                    This will update the taunch value for all products in this category.
                    <br />Total products affected: {selectedCategory ? categoryCounts[selectedCategory] || 0 : 0}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="categoryTaunchValue" className="text-sm font-medium">
                    Taunch Value (%):
                  </label>
                  <Input 
                    id="categoryTaunchValue"
                    type="number" 
                    min="0" 
                    step="0.01"
                    value={categoryTaunchValue}
                    onChange={(e) => setCategoryTaunchValue(parseFloat(e.target.value))}
                    placeholder="Enter taunch value"
                    className="focus-visible:ring-blue-500"
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCategoryDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleCategoryTaunchUpdate}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Update Taunch
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Product Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
              </DialogHeader>
              <Form {...productForm}>
                <form onSubmit={productForm.handleSubmit(onProductSubmit)} className="space-y-4">
                  <FormField
                    control={productForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter product name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={productForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Enter product description" 
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={productForm.control}
                      name="taunch"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Taunch (%)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="0" step="0.01" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={productForm.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (g)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="0" step="0.1" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={productForm.control}
                      name="karatType"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Karat Type</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="22k" id="22k" />
                                <label htmlFor="22k" className="text-sm font-medium">22K Gold</label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="18k" id="18k" />
                                <label htmlFor="18k" className="text-sm font-medium">18K Gold</label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={productForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="necklace">Necklace</SelectItem>
                              <SelectItem value="earrings">Earrings</SelectItem>
                              <SelectItem value="bangles">Bangles</SelectItem>
                              <SelectItem value="rings">Rings</SelectItem>
                              <SelectItem value="bridal">Bridal Set</SelectItem>
                              <SelectItem value="pendant">Pendant</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={productForm.control}
                    name="collectionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Collection</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a collection" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {collections.map(collection => (
                              <SelectItem key={collection.id} value={collection.id.toString()}>
                                {collection.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={productForm.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Image</FormLabel>
                        
                        {/* Image preview if available */}
                        {(field.value || previewImage) && (
                          <div className="mb-3 border rounded-md overflow-hidden">
                            <img 
                              src={previewImage || field.value} 
                              alt="Product preview" 
                              className="w-full h-48 object-contain bg-gray-50"
                            />
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* URL Input */}
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Enter image URL" 
                              className="mb-2"
                              onChange={(e) => {
                                field.onChange(e);
                                if (e.target.value && e.target.value.startsWith('http')) {
                                  setPreviewImage(null);
                                }
                              }}
                            />
                          </FormControl>
                          
                          {/* Upload options */}
                          <div className="flex flex-col md:flex-row gap-2">
                            <div className="relative">
                              <Input
                                type="file"
                                accept="image/*"
                                id="image-upload"
                                className="absolute inset-0 opacity-0 w-full cursor-pointer z-10"
                                onChange={handleImageUpload}
                              />
                              <Button 
                                type="button" 
                                variant="outline"
                                className="w-full md:w-auto"
                              >
                                <ImageIcon className="h-4 w-4 mr-2" />
                                Gallery
                              </Button>
                            </div>
                            
                            <Button 
                              type="button" 
                              variant="outline"
                              onClick={handleCameraCapture}
                              className="w-full md:w-auto"
                            >
                              <Camera className="h-4 w-4 mr-2" />
                              Camera
                            </Button>
                          </div>
                        </div>
                        
                        <FormDescription>
                          Enter an image URL or upload an image from your device
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={productForm.control}
                    name="inStock"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>In Stock</FormLabel>
                          <FormDescription>
                            Toggle to indicate if this product is currently in stock
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button variant="outline" onClick={handleCloseDialog} type="button">
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                      disabled={createProductMutation.isPending || updateProductMutation.isPending}
                    >
                      {(createProductMutation.isPending || updateProductMutation.isPending) ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          {editingProduct ? "Updating..." : "Creating..."}
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {editingProduct ? "Update Product" : "Create Product"}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}