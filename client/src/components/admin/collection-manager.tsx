import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Collection, InsertCollection, updateCollectionSchema } from "@shared/schema";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Pencil, Trash2, LayoutGrid } from "lucide-react";
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
import { CollectionCard } from "@/components/ui/collection-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Form schema with validations
const collectionFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().nullable().optional(),
  imageUrl: z.string().url("Please enter a valid URL"),
  featured: z.boolean().default(false)
});

type CollectionFormValues = z.infer<typeof collectionFormSchema>;

export function CollectionManager() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCollection, setCurrentCollection] = useState<Collection | null>(null);
  const isEditing = !!currentCollection;

  // Form setup
  const form = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionFormSchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
      featured: false
    }
  });
  
  // Fetch collections
  const { data: collections, isLoading } = useQuery<Collection[]>({
    queryKey: ["/api/collections"],
  });

  // Create collection mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertCollection) => {
      const res = await apiRequest("POST", "/api/collections", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      toast({
        title: "Success",
        description: "Collection created successfully",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create collection",
        variant: "destructive"
      });
    }
  });

  // Update collection mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Collection> }) => {
      const res = await apiRequest("PUT", `/api/collections/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      toast({
        title: "Success",
        description: "Collection updated successfully",
      });
      setIsDialogOpen(false);
      setCurrentCollection(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update collection",
        variant: "destructive"
      });
    }
  });

  // Delete collection mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/collections/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      toast({
        title: "Success",
        description: "Collection deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete collection",
        variant: "destructive"
      });
    }
  });

  // Form submission handler
  const onSubmit = (data: CollectionFormValues) => {
    // Transform boolean to integer for featured field
    const transformedData = {
      ...data,
      featured: data.featured ? 1 : 0
    };
    
    if (isEditing && currentCollection) {
      updateMutation.mutate({ 
        id: currentCollection.id, 
        data: transformedData 
      });
    } else {
      createMutation.mutate(transformedData as InsertCollection);
    }
  };

  // Handle edit button click
  const handleEdit = (collection: Collection) => {
    setCurrentCollection(collection);
    form.reset({
      name: collection.name,
      description: collection.description,
      imageUrl: collection.imageUrl,
      featured: collection.featured === 1
    });
    setIsDialogOpen(true);
  };

  // Handle delete button click with confirmation
  const handleDelete = (collection: Collection) => {
    if (window.confirm(`Are you sure you want to delete "${collection.name}"?`)) {
      deleteMutation.mutate(collection.id);
    }
  };

  // Reset form when closing dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCurrentCollection(null);
    form.reset();
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
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-amber-600 bg-amber-100 p-1.5 rounded-full inline-flex">
            <LayoutGrid className="h-5 w-5" />
          </span>
          <h2 className="text-xl font-semibold text-amber-800">Manage Collections</h2>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="default" 
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => {
                setCurrentCollection(null);
                form.reset({
                  name: "",
                  description: "",
                  imageUrl: "",
                  featured: false
                });
              }}>
              <Plus className="mr-2 h-4 w-4" /> Add Collection
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle className="text-amber-800 flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Pencil className="h-5 w-5 text-amber-600" />
                    Edit Collection
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 text-amber-600" />
                    Add New Collection
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
                      <FormLabel className="text-amber-900">Collection Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Collection name" 
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
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-amber-200 p-3 bg-amber-50/50">
                      <div className="space-y-0.5">
                        <FormLabel className="text-amber-900">Featured Collection</FormLabel>
                        <div className="text-sm text-amber-700/70">
                          Show this collection on the homepage
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
                    {isEditing ? "Update Collection" : "Create Collection"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {collections && collections.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {collections.map((collection) => (
            <div key={collection.id} className="relative group overflow-hidden rounded-md shadow-sm border border-amber-100 hover:shadow-md transition-all duration-300">
              <CollectionCard collection={collection} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                  <div className="text-white font-medium">{collection.featured === 1 && "✨ Featured"}</div>
                  <div className="flex space-x-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-white hover:bg-amber-50"
                      onClick={() => handleEdit(collection)}
                    >
                      <Pencil className="h-4 w-4 text-amber-800" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(collection)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-md bg-amber-50/30 border-amber-100">
          <span className="inline-block p-4 bg-amber-100 rounded-full mb-3">
            <LayoutGrid className="h-6 w-6 text-amber-600" />
          </span>
          <p className="text-amber-800">No collections found. Add your first collection to get started.</p>
        </div>
      )}
    </div>
  );
}