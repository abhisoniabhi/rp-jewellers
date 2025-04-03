import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Settings } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Setting } from "@shared/schema";

// Settings schema for the form
const settingsSchema = z.object({
  storeName: z.string().min(1, "Store name is required"),
  whatsappNumber: z.string()
    .regex(/^\+?[0-9]{10,15}$/, "Please enter a valid WhatsApp number (e.g., +919876543210)"),
  storeLocation: z.string().min(1, "Store location is required"),
  storeAddress: z.string().min(1, "Store address is required"),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export function SettingsManager() {
  const { toast } = useToast();
  
  // Fetch settings data
  const { data: settings, isLoading: settingsLoading } = useQuery<Setting[]>({
    queryKey: ["/api/settings"],
  });

  // Settings form
  const settingsForm = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      storeName: "",
      whatsappNumber: "",
      storeLocation: "",
      storeAddress: ""
    },
  });

  // Set default values for settings form when settings are loaded
  useEffect(() => {
    if (settings && Array.isArray(settings)) {
      const storeName = settings.find(s => s.key === "storeName")?.value || "";
      const whatsappNumber = settings.find(s => s.key === "whatsappNumber")?.value || "";
      const storeLocation = settings.find(s => s.key === "storeLocation")?.value || "";
      const storeAddress = settings.find(s => s.key === "storeAddress")?.value || "";
      
      console.log("[Settings] Loading settings:", { storeName, whatsappNumber, storeLocation, storeAddress });
      
      settingsForm.reset({
        storeName,
        whatsappNumber,
        storeLocation,
        storeAddress
      });
    }
  }, [settings, settingsForm]);

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      console.log("[Settings] Updating settings with data:", data);
      
      // Update each setting individually
      const updatePromises = Object.entries(data).map(([key, value]) => {
        console.log(`[Settings] Updating setting ${key} to ${value} using PUT method`);
        return apiRequest("PUT", `/api/settings/${key}`, { value });
      });
      
      await Promise.all(updatePromises);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Store settings updated successfully",
      });
      
      // Refresh settings data
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error: Error) => {
      console.error("[Settings] Error updating settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive"
      });
    }
  });

  // Handle settings form submission
  const onSettingsSubmit = (data: SettingsFormData) => {
    console.log("[Settings] Submitting form with data:", data);
    updateSettingsMutation.mutate(data);
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <Card className="shadow-md border-amber-100">
      <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b">
        <CardTitle className="text-amber-800 flex items-center">
          <span className="bg-amber-100 rounded-full p-1.5 mr-2">
            <Settings className="h-5 w-5 text-amber-700" />
          </span>
          Store Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...settingsForm}>
          <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={settingsForm.control}
                name="storeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-amber-900">Store Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter your store name" className="border-amber-200 focus-visible:ring-amber-500" />
                    </FormControl>
                    <FormDescription>
                      This will be displayed at the top of invoices and on product pages.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={settingsForm.control}
                name="whatsappNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-amber-900">WhatsApp Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter WhatsApp number (e.g., +919876543210)" className="border-amber-200 focus-visible:ring-amber-500" />
                    </FormControl>
                    <FormDescription>
                      This number will be used for the "Inquire Now" button on product pages.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={settingsForm.control}
                name="storeAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-amber-900">Store Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter your store's full address" className="border-amber-200 focus-visible:ring-amber-500" />
                    </FormControl>
                    <FormDescription>
                      This address will be displayed on invoices and in store information.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={settingsForm.control}
                name="storeLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-amber-900">Google Maps Location URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter Google Maps URL" className="border-amber-200 focus-visible:ring-amber-500" />
                    </FormControl>
                    <FormDescription>
                      This link will be used for the "Visit Shop" button on product pages.
                      <br />
                      <span className="text-xs text-gray-500 mt-1 block">
                        (Tip: Open Google Maps, search for your store, click "Share", and copy the link)
                      </span>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button 
                type="submit" 
                className="bg-amber-600 hover:bg-amber-700 text-white" 
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}