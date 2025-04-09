import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { RateInfo } from "@/components/ui/rate-card";
import { Textarea } from "@/components/ui/textarea";

const rateSchema = z.object({
  type: z.string(),
  current: z.string().transform((val) => parseInt(val, 10)),
  high: z.string().transform((val) => parseInt(val, 10)),
  low: z.string().transform((val) => parseInt(val, 10)),
  category: z.string()
});

const settingsSchema = z.object({
  whatsappNumber: z.string().min(10, "WhatsApp number must be at least 10 digits"),
  storeLocation: z.string(),
  storeAddress: z.string(),
  storeName: z.string()
});

type RateFormData = z.infer<typeof rateSchema>;
type SettingsFormData = z.infer<typeof settingsSchema>;

interface AdminPanelProps {
  rates: RateInfo[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminPanel({ rates, isOpen, onOpenChange }: AdminPanelProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("gold");
  
  // Fetch settings data
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    }
  });
  
  const form = useForm<RateFormData>({
    resolver: zodResolver(rateSchema),
    defaultValues: {
      type: "नंबर 99.99 Retail",
      current: 91700,
      high: 92000,
      low: 91650,
      category: "gold"
    },
  });
  
  const settingsForm = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      whatsappNumber: "",
      storeLocation: "",
      storeAddress: "",
      storeName: ""
    },
  });

  const updateRateMutation = useMutation({
    mutationFn: async (data: RateFormData) => {
      const res = await apiRequest("POST", "/api/rates/update", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Rate updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rates"] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error updating rate",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RateFormData) => {
    data.category = activeTab;
    updateRateMutation.mutate(data);
  };

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      // Update each setting one by one
      const promises = Object.entries(data).map(async ([key, value]) => {
        const res = await apiRequest("PUT", `/api/settings/${key}`, { value });
        return res.json();
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Settings updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error) => {
      toast({
        title: "Error updating settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Set settings form values when data is loaded
  useEffect(() => {
    if (settings && settings.length > 0) {
      // Convert settings array to an object by key
      const settingsMap = settings.reduce((acc: Record<string, string>, s: {key: string, value: string}) => {
        acc[s.key] = s.value;
        return acc;
      }, {} as Record<string, string>);
      
      if (settingsMap.whatsappNumber) settingsForm.setValue("whatsappNumber", settingsMap.whatsappNumber);
      if (settingsMap.storeLocation) settingsForm.setValue("storeLocation", settingsMap.storeLocation);
      if (settingsMap.storeAddress) settingsForm.setValue("storeAddress", settingsMap.storeAddress);
      if (settingsMap.storeName) settingsForm.setValue("storeName", settingsMap.storeName);
    }
  }, [settings, settingsForm]);
  
  const handleSelectRate = (rate: RateInfo) => {
    form.setValue("type", rate.type);
    form.setValue("current", rate.current);
    form.setValue("high", rate.high);
    form.setValue("low", rate.low);
    form.setValue("category", rate.category);
  };
  
  const onSettingsSubmit = (data: SettingsFormData) => {
    updateSettingsMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-3xl sm:max-w-xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4 mb-4">
          <DialogTitle className="font-playfair text-xl font-bold text-amber-700 flex items-center gap-2">
            <span>🔧</span>
            <span>Admin Control Panel</span>
          </DialogTitle>
          <DialogDescription className="text-gray-500 mt-1">
            Manage shop rates, settings and other configurations
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="gold" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger 
              value="gold" 
              onClick={() => setActiveTab("gold")}
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-white text-sm sm:text-base whitespace-nowrap px-1 sm:px-2"
            >
              <span className="mr-1">💰</span> Gold Rates
            </TabsTrigger>
            <TabsTrigger 
              value="silver" 
              onClick={() => setActiveTab("silver")}
              className="data-[state=active]:bg-gray-300 data-[state=active]:text-gray-800 text-sm sm:text-base whitespace-nowrap px-1 sm:px-2"
            >
              <span className="mr-1">🥈</span> Silver Rates
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              onClick={() => setActiveTab("settings")}
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-sm sm:text-base whitespace-nowrap px-1 sm:px-2"
            >
              <span className="mr-1">⚙️</span> Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="gold">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-amber-700 font-medium">Gold Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-amber-50 border-amber-200 focus:ring-amber-300">
                              <SelectValue placeholder="Select Gold Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {rates
                              .filter(rate => rate.category === "gold")
                              .map(rate => (
                                <SelectItem 
                                  key={rate.id} 
                                  value={rate.type}
                                  onClick={() => handleSelectRate(rate)}
                                >
                                  {rate.type}
                                </SelectItem>
                              ))}
                            <SelectItem value="new">Add New Type...</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="current"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-amber-700 font-medium">Current Rate (₹)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="Enter current rate" className="bg-amber-50 border-amber-200 focus:ring-amber-300" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="high"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-amber-700 font-medium">High (₹)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="High rate" className="bg-amber-50 border-amber-200 focus:ring-amber-300" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="low"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-amber-700 font-medium">Low (₹)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="Low rate" className="bg-amber-50 border-amber-200 focus:ring-amber-300" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row sm:justify-end mt-6 gap-2">
                  <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-2 w-full sm:w-auto" 
                    disabled={updateRateMutation.isPending}
                  >
                    {updateRateMutation.isPending ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <span>💰</span>
                        <span>Update Gold Rate</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="silver">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-gray-700 font-medium">Silver Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-50 border-gray-200 focus:ring-gray-300">
                              <SelectValue placeholder="Select Silver Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {rates
                              .filter(rate => rate.category === "silver")
                              .map(rate => (
                                <SelectItem 
                                  key={rate.id} 
                                  value={rate.type}
                                  onClick={() => handleSelectRate(rate)}
                                >
                                  {rate.type}
                                </SelectItem>
                              ))}
                            <SelectItem value="new">Add New Type...</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="current"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-gray-700 font-medium">Current Rate (₹)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="Enter current rate" className="bg-gray-50 border-gray-200 focus:ring-gray-300" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="high"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">High (₹)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="High rate" className="bg-gray-50 border-gray-200 focus:ring-gray-300" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="low"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Low (₹)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="Low rate" className="bg-gray-50 border-gray-200 focus:ring-gray-300" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row sm:justify-end mt-6 gap-2">
                  <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 flex items-center justify-center gap-2 w-full sm:w-auto" 
                    disabled={updateRateMutation.isPending}
                  >
                    {updateRateMutation.isPending ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <span>🥈</span>
                        <span>Update Silver Rate</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="settings">
            <Form {...settingsForm}>
              <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={settingsForm.control}
                    name="storeName"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-blue-700 font-medium">Store Name</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Enter your store name" 
                            className="bg-blue-50 border-blue-200 focus:ring-blue-300"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={settingsForm.control}
                    name="whatsappNumber"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-blue-700 font-medium">WhatsApp Number</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Enter WhatsApp number with country code" 
                            className="bg-blue-50 border-blue-200 focus:ring-blue-300"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={settingsForm.control}
                  name="storeAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-700 font-medium">Store Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Enter your full store address" 
                          className="bg-blue-50 border-blue-200 focus:ring-blue-300 min-h-[80px]"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={settingsForm.control}
                  name="storeLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-700 font-medium">Google Maps Location URL</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Enter Google Maps share URL" 
                          className="bg-blue-50 border-blue-200 focus:ring-blue-300"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="flex flex-col sm:flex-row sm:justify-end mt-6 gap-2">
                  <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 w-full sm:w-auto" 
                    disabled={updateSettingsMutation.isPending}
                  >
                    {updateSettingsMutation.isPending ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <span>💾</span>
                        <span>Save Settings</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}