import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
      <DialogContent className="bg-white max-w-md">
        <DialogHeader>
          <DialogTitle className="font-playfair text-lg font-bold text-burgundy-default">Admin Panel</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="gold" onClick={() => setActiveTab("gold")}>Gold Rates</TabsTrigger>
            <TabsTrigger value="silver" onClick={() => setActiveTab("silver")}>Silver Rates</TabsTrigger>
            <TabsTrigger value="settings" onClick={() => setActiveTab("settings")}>Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="gold">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gold Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
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
                    <FormItem>
                      <FormLabel>Current Rate (₹)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="Enter current rate" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="high"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>High (₹)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="High rate" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="low"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Low (₹)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="Low rate" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button type="button" variant="outline" className="mr-2" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-burgundy-default text-white" disabled={updateRateMutation.isPending}>
                    {updateRateMutation.isPending ? "Updating..." : "Update Rate"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="silver">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Silver Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
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
                    <FormItem>
                      <FormLabel>Current Rate (₹)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="Enter current rate" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="high"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>High (₹)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="High rate" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="low"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Low (₹)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="Low rate" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button type="button" variant="outline" className="mr-2" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-burgundy-default text-white" disabled={updateRateMutation.isPending}>
                    {updateRateMutation.isPending ? "Updating..." : "Update Rate"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="settings">
            <Form {...settingsForm}>
              <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-4">
                <FormField
                  control={settingsForm.control}
                  name="storeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter your store name" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={settingsForm.control}
                  name="whatsappNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter WhatsApp number with country code" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={settingsForm.control}
                  name="storeAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Address</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Enter your full store address" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={settingsForm.control}
                  name="storeLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Google Maps Location URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter Google Maps share URL" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end">
                  <Button type="button" variant="outline" className="mr-2" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-burgundy-default text-white" disabled={updateSettingsMutation.isPending}>
                    {updateSettingsMutation.isPending ? "Updating..." : "Save Settings"}
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
