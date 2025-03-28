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
  ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Product form schema
const productFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().nullable().optional(),
  price: z.coerce.number().min(0, "Price cannot be negative").default(0),
  category: z.string().min(1, "Category is required"),
  imageUrl: z.string().url("Please enter a valid URL"),
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
    form.reset({
      name: product.name,
      description: product.description || "",
      price: product.price || 0,
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
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack} 
            className="rounded-full hover:bg-amber-100"
          >
            <ArrowLeft className="h-5 w-5 text-amber-700" />
          </Button>
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold text-amber-800 mb-0.5 flex items-center gap-1.5">
              <ShoppingBag className="h-5 w-5 text-amber-600" />
              Products in {collection.name}
            </h2>
            <p className="text-sm text-amber-600/80">
              Manage products for this collection
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="default" 
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => {
                setCurrentProduct(null);
                form.reset({
                  name: "",
                  description: "",
                  price: 0,
                  category: "",
                  imageUrl: "",
                  collectionId: collection.id,
                  inStock: true
                });
              }}>
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
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
                
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-amber-900">Image URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://example.com/image.jpg" 
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
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCloseDialog}
                    className="border-amber-300"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isEditing ? "Update Product" : "Create Product"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {products && products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="group bg-white rounded-md shadow-sm overflow-hidden border border-amber-100 hover:shadow-md transition-all duration-300">
              <div className="aspect-square bg-amber-50 relative overflow-hidden">
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-amber-300">
                    <ImageIcon className="w-16 h-16" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end">
                  <div className="w-full p-3 flex justify-between items-center">
                    <div>
                      {product.inStock === 1 ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-none">In Stock</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-none">Out of Stock</Badge>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-white hover:bg-amber-50"
                        onClick={() => handleEdit(product)}
                      >
                        <Pencil className="h-4 w-4 text-amber-800" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDelete(product)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-amber-800 truncate">{product.name}</h3>
                <div className="flex items-center justify-between mt-1">
                  {product.price ? (
                    <p className="text-amber-600 font-bold">₹{product.price.toLocaleString()}</p>
                  ) : (
                    <p className="text-amber-400">No price set</p>
                  )}
                  {product.category && (
                    <div className="flex items-center text-xs text-amber-600/80">
                      <Tag className="h-3 w-3 mr-1" />
                      {product.category}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-md bg-amber-50/30 border-amber-100">
          <span className="inline-block p-4 bg-amber-100 rounded-full mb-3">
            <ShoppingBag className="h-6 w-6 text-amber-600" />
          </span>
          <p className="text-amber-800">No products found in this collection. Add your first product to get started.</p>
        </div>
      )}
    </div>
  );
}