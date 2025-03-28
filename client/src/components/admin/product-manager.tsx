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
  );
}