import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Collection,
  Product, 
  InsertProduct, 
  updateProductSchema 
} from "@shared/schema";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Loader2, 
  Plus, 
  Pencil, 
  Trash2, 
  ShoppingBag, 
  ArrowLeft,
  Tag,
  ImageIcon,
  Weight,
  Upload,
  Camera,
  Image as ImageIcon2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Product form schema
const productFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().nullable().optional(),
  price: z.coerce.number().min(0, "Price cannot be negative").default(0),
  weight: z.coerce.number().min(0, "Weight cannot be negative").default(0),
  karatType: z.enum(["18k", "22k"]).default("22k"),
  category: z.string().min(1, "Category is required"),
  imageUrl: z.string().refine(
    (val) => val.startsWith('data:image') || val.startsWith('http'), 
    { message: "Please enter a valid URL or image data" }
  ),
  collectionId: z.number(),
  inStock: z.boolean().default(true)
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductManagerProps {
  collection: Collection;
  onBack: () => void;
}

export function ProductManager({ collection, onBack }: ProductManagerProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const isEditing = !!currentProduct;

  // Form setup
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      weight: 0,
      karatType: "22k",
      category: "",
      imageUrl: "",
      collectionId: collection.id,
      inStock: true
    }
  });
  
  // Fetch products for this collection
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/collections", collection.id, "products"],
  });

  // Create product mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      const res = await apiRequest("POST", "/api/products", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/collections", collection.id, "products"] 
      });
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      setIsDialogOpen(false);
      form.reset({
        name: "",
        description: "",
        price: 0,
        weight: 0,
        karatType: "22k",
        category: "",
        imageUrl: "",
        collectionId: collection.id,
        inStock: true
      });
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
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Product> }) => {
      const res = await apiRequest("PUT", `/api/products/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/collections", collection.id, "products"] 
      });
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      setIsDialogOpen(false);
      setCurrentProduct(null);
      form.reset({
        name: "",
        description: "",
        price: 0,
        weight: 0,
        karatType: "22k",
        category: "",
        imageUrl: "",
        collectionId: collection.id,
        inStock: true
      });
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
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/collections", collection.id, "products"] 
      });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive"
      });
    }
  });

  // Form submission handler
  const onSubmit = (data: ProductFormValues) => {
    // Make sure collectionId is set
    const productData = {
      ...data,
      collectionId: collection.id,
      inStock: data.inStock ? 1 : 0
    };
    
    if (isEditing && currentProduct) {
      updateMutation.mutate({ 
        id: currentProduct.id, 
        data: productData 
      });
    } else {
      createMutation.mutate(productData as InsertProduct);
    }
  };

  // Handle edit button click
  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    
    // Convert karatType to match enum values
    const karatType = (product.karatType === "18k" || product.karatType === "22k") 
      ? product.karatType 
      : "22k";
      
    form.reset({
      name: product.name,
      description: product.description || "",
      price: product.price || 0,
      weight: product.weight || 0,
      karatType: karatType as "18k" | "22k",
      category: product.category || "",
      imageUrl: product.imageUrl || "",
      collectionId: product.collectionId,
      inStock: product.inStock === 1
    });
    setIsDialogOpen(true);
  };

  // Handle delete button click with confirmation
  const handleDelete = (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      deleteMutation.mutate(product.id);
    }
  };

  // Reset form when closing dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCurrentProduct(null);
    form.reset({
      name: "",
      description: "",
      price: 0,
      weight: 0,
      karatType: "22k",
      category: "",
      imageUrl: "",
      collectionId: collection.id,
      inStock: true
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 bg-white rounded-xl shadow-sm border border-amber-100">
      <div className="flex items-center justify-between px-6 pb-6 border-b border-amber-100">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack} 
            className="rounded-full hover:bg-amber-100"
          >
            <ArrowLeft className="h-5 w-5 text-amber-700" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold text-amber-800 flex items-center gap-1.5">
              <ShoppingBag className="h-5 w-5 text-amber-600" />
              {collection.name}
            </h2>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-5 bg-amber-50 rounded-full mb-4">
            <Plus className="h-8 w-8 text-amber-600" />
          </div>
          <h3 className="text-lg font-medium text-amber-800 mb-2">Add Products to Collection</h3>
          <p className="text-amber-600/80 max-w-md mx-auto mb-6">
            Add products to this collection to showcase them to your customers. Products can be jewelry items, accessories, or any other items you sell.
          </p>
          <Button 
            variant="default" 
            className="bg-amber-600 hover:bg-amber-700 text-white px-6"
            data-add-product-button="true"
            onClick={() => {
              setCurrentProduct(null);
              form.reset({
                name: "",
                description: "",
                price: 0,
                weight: 0,
                karatType: "22k",
                category: "",
                imageUrl: "",
                collectionId: collection.id,
                inStock: true
              });
              setIsDialogOpen(true);
            }}>
            <Plus className="mr-2 h-4 w-4" /> Add New Product
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-amber-800 flex items-center gap-2">
              {isEditing ? (
                <>
                  <Pencil className="h-5 w-5 text-amber-600" />
                  Edit Product
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-amber-600" />
                  Add New Product
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-amber-600/80">
              {isEditing 
                ? "Update the product information below." 
                : "Fill in the details to add a new jewelry product to your collection."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-amber-900">Product Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Product name" 
                        {...field} 
                        className="border-amber-200 focus-visible:ring-amber-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-amber-900">Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter a description" 
                        {...field} 
                        value={field.value || ""}
                        className="border-amber-200 focus-visible:ring-amber-500 min-h-[80px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-amber-900">Price</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-800/60">₹</span>
                          <Input 
                            type="number"
                            placeholder="0.00" 
                            {...field}
                            className="border-amber-200 focus-visible:ring-amber-500 pl-7"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-amber-900">Category</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. Rings, Necklaces" 
                          {...field} 
                          className="border-amber-200 focus-visible:ring-amber-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-amber-900">Weight (grams)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-800/60">
                            <Weight className="h-4 w-4" />
                          </span>
                          <Input 
                            type="number"
                            placeholder="0.00" 
                            {...field}
                            className="border-amber-200 focus-visible:ring-amber-500 pl-7"
                            step="0.01"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="karatType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-amber-900">Gold Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex gap-6"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem 
                                value="18k" 
                                checked={field.value === "18k"}
                                className="text-amber-600 border-amber-300"
                              />
                            </FormControl>
                            <FormLabel className="text-amber-800 font-medium cursor-pointer">
                              18K Gold
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem 
                                value="22k" 
                                checked={field.value === "22k"}
                                className="text-amber-600 border-amber-300"
                              />
                            </FormControl>
                            <FormLabel className="text-amber-800 font-medium cursor-pointer">
                              22K Gold
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => {
                  const [uploadMode, setUploadMode] = useState<'url' | 'file' | 'camera'>('url');
                  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
                  const videoRef = React.useRef<HTMLVideoElement>(null);
                  const canvasRef = React.useRef<HTMLCanvasElement>(null);
                  
                  // Handle file upload
                  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Compress and convert the image to a data URL
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const img = new Image();
                        img.onload = () => {
                          // Create a canvas to compress the image
                          const canvas = document.createElement('canvas');
                          
                          // Resize if the image is very large (> 1200px)
                          let width = img.width;
                          let height = img.height;
                          
                          if (width > 1200) {
                            const ratio = width / 1200;
                            width = 1200;
                            height = Math.floor(height / ratio);
                          }
                          
                          canvas.width = width;
                          canvas.height = height;
                          
                          // Draw and compress
                          const ctx = canvas.getContext('2d');
                          if (ctx) {
                            ctx.drawImage(img, 0, 0, width, height);
                            // Use 0.7 quality jpeg for good compression
                            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                            field.onChange(dataUrl);
                          }
                        };
                        
                        img.src = event.target?.result as string;
                      };
                      reader.readAsDataURL(file);
                    }
                  };
                  
                  // Start camera
                  const startCamera = async () => {
                    try {
                      const stream = await navigator.mediaDevices.getUserMedia({ 
                        video: { facingMode: 'environment' } 
                      });
                      setCameraStream(stream);
                      
                      if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                      }
                    } catch (err) {
                      console.error("Error accessing camera:", err);
                      alert("Could not access camera. Please make sure you've granted camera permissions.");
                      setUploadMode('file');
                    }
                  };
                  
                  // Stop camera
                  const stopCamera = () => {
                    if (cameraStream) {
                      cameraStream.getTracks().forEach(track => track.stop());
                      setCameraStream(null);
                    }
                  };
                  
                  // Take photo
                  const takePhoto = () => {
                    if (videoRef.current && canvasRef.current) {
                      const video = videoRef.current;
                      const canvas = canvasRef.current;
                      
                      // Set canvas dimensions to match video
                      canvas.width = video.videoWidth;
                      canvas.height = video.videoHeight;
                      
                      // Draw the video frame to the canvas
                      const context = canvas.getContext('2d');
                      if (context) {
                        context.drawImage(video, 0, 0, canvas.width, canvas.height);
                        
                        // Convert to data URL with compression (0.7 quality) and set as field value
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                        field.onChange(dataUrl);
                        
                        // Stop the camera stream
                        stopCamera();
                        
                        // Switch to file mode for any additional uploads
                        setUploadMode('file');
                      }
                    }
                  };
                  
                  // Clean up camera on unmount
                  React.useEffect(() => {
                    return () => {
                      stopCamera();
                    };
                  }, []);
                  
                  // Start camera when mode is changed to camera
                  React.useEffect(() => {
                    if (uploadMode === 'camera') {
                      startCamera();
                    } else {
                      stopCamera();
                    }
                  }, [uploadMode]);
                  
                  return (
                    <FormItem>
                      <FormLabel className="text-amber-900">Product Image</FormLabel>
                      
                      <div className="flex items-center mb-2 space-x-2">
                        <Button 
                          type="button" 
                          variant={uploadMode === 'url' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setUploadMode('url')}
                          className={uploadMode === 'url' ? 'bg-amber-600' : 'border-amber-200'}
                        >
                          <ImageIcon2 className="h-3.5 w-3.5 mr-1" /> URL
                        </Button>
                        <Button 
                          type="button" 
                          variant={uploadMode === 'file' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setUploadMode('file')}
                          className={uploadMode === 'file' ? 'bg-amber-600' : 'border-amber-200'}
                        >
                          <Upload className="h-3.5 w-3.5 mr-1" /> Gallery
                        </Button>
                        <Button 
                          type="button" 
                          variant={uploadMode === 'camera' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setUploadMode('camera')}
                          className={uploadMode === 'camera' ? 'bg-amber-600' : 'border-amber-200'}
                        >
                          <Camera className="h-3.5 w-3.5 mr-1" /> Camera
                        </Button>
                      </div>
                      
                      {uploadMode === 'url' && (
                        // URL Input
                        <>
                          <FormControl>
                            <Input 
                              placeholder="https://example.com/image.jpg" 
                              value={field.value} 
                              onChange={field.onChange} 
                              className="border-amber-200 focus-visible:ring-amber-500"
                            />
                          </FormControl>
                          <FormDescription className="text-amber-600/70 flex items-center gap-1 mt-1.5">
                            <ImageIcon2 className="h-3.5 w-3.5"/>
                            Enter a URL for your product image
                          </FormDescription>
                        </>
                      )}
                      
                      {uploadMode === 'file' && (
                        // File Upload
                        <>
                          <FormControl>
                            <div className="border border-amber-200 rounded-md p-4 focus-within:ring-2 focus-within:ring-amber-500 focus-within:ring-offset-2 hover:border-amber-300 transition-colors">
                              <div className="flex flex-col items-center justify-center gap-1">
                                <Upload className="h-8 w-8 text-amber-500" />
                                <p className="text-sm text-amber-700">
                                  Select from gallery or drag and drop
                                </p>
                                <label className="cursor-pointer bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded text-sm text-amber-800 transition-colors">
                                  Browse gallery
                                  <Input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handleFileUpload}
                                  />
                                </label>
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription className="text-amber-600/70 flex items-center gap-1 mt-1.5">
                            <Upload className="h-3.5 w-3.5"/>
                            Upload an image from your device
                          </FormDescription>
                        </>
                      )}
                      
                      {uploadMode === 'camera' && (
                        // Camera Capture
                        <>
                          <FormControl>
                            <div className="border border-amber-200 rounded-md p-2 overflow-hidden">
                              <div className="relative">
                                <video 
                                  ref={videoRef}
                                  autoPlay 
                                  playsInline
                                  muted
                                  className="w-full h-48 object-cover bg-black rounded"
                                />
                                <canvas ref={canvasRef} className="hidden" />
                                
                                <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                                  <Button
                                    type="button"
                                    onClick={takePhoto}
                                    size="sm"
                                    className="bg-amber-600 hover:bg-amber-700 rounded-full h-12 w-12 flex items-center justify-center"
                                  >
                                    <div className="h-8 w-8 rounded-full border-2 border-white" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription className="text-amber-600/70 flex items-center gap-1 mt-1.5">
                            <Camera className="h-3.5 w-3.5"/>
                            Take a photo with your device camera
                          </FormDescription>
                        </>
                      )}
                      
                      {field.value && (
                        <div className="mt-2 border border-amber-200 rounded-md p-2">
                          <p className="text-xs text-amber-800 mb-1">Image Preview:</p>
                          <img 
                            src={field.value} 
                            alt="Preview" 
                            className="max-h-24 object-contain mx-auto"
                            onError={(e) => {
                              // Hide the image if it fails to load
                              (e.target as HTMLImageElement).style.display = 'none';
                              // Show an error message
                              e.currentTarget.parentElement?.appendChild(
                                Object.assign(document.createElement('p'), {
                                  className: 'text-xs text-red-500 text-center mt-1',
                                  textContent: 'Error loading image. Please check the URL or upload a different image.'
                                })
                              );
                            }}
                          />
                        </div>
                      )}
                      
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              
              <FormField
                control={form.control}
                name="inStock"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-amber-200 p-3 bg-amber-50/50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-amber-900">Available in Stock</FormLabel>
                      <div className="text-sm text-amber-700/70">
                        Show this product as available for purchase
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-amber-600"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="flex items-center justify-between gap-4 pt-6 border-t border-amber-100 mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCloseDialog}
                  className="border-amber-300 flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-amber-600 hover:bg-amber-700 text-white flex-1 py-6"
                  size="lg"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-5 w-5" />
                  )}
                  {isEditing ? "Save Changes" : "Save Product"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}