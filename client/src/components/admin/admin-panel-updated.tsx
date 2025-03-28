import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { RateInfo } from "@/components/ui/rate-card";

const rateSchema = z.object({
  type: z.string(),
  current: z.coerce.number(),
  high: z.coerce.number(),
  low: z.coerce.number(),
  category: z.string()
});

type RateFormData = z.infer<typeof rateSchema>;

interface AdminPanelProps {
  rates: RateInfo[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminPanel({ rates, isOpen, onOpenChange }: AdminPanelProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("gold");
  
  const form = useForm<RateFormData>({
    resolver: zodResolver(rateSchema),
    defaultValues: {
      type: "नंबर 99.99 Gold",
      current: 91700,
      high: 92000,
      low: 91650,
      category: "gold"
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

  const handleSelectRate = (rate: RateInfo) => {
    form.setValue("type", rate.type);
    form.setValue("current", rate.current);
    form.setValue("high", rate.high);
    form.setValue("low", rate.low);
    form.setValue("category", rate.category);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-md border-amber-200 shadow-md">
        <DialogHeader className="bg-gradient-to-r from-amber-50 to-amber-100 border-b border-amber-200 rounded-t-lg p-4">
          <DialogTitle className="text-xl font-bold text-amber-800">Admin Panel - Update Rates</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="gold" className="w-full p-4" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-amber-100">
            <TabsTrigger value="gold" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">Gold Rates</TabsTrigger>
            <TabsTrigger value="silver" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">Silver Rates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="gold">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-amber-900">Gold Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-amber-200 focus:ring-amber-500">
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
                      <FormLabel className="text-amber-900">Current Rate (₹)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="Enter current rate" className="border-amber-200 focus-visible:ring-amber-500" />
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
                        <FormLabel className="text-amber-900">High (₹)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="High rate" className="border-amber-200 focus-visible:ring-amber-500" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="low"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-amber-900">Low (₹)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="Low rate" className="border-amber-200 focus-visible:ring-amber-500" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end pt-2">
                  <Button type="button" variant="outline" className="mr-2 border-amber-300 hover:bg-amber-50" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white" disabled={updateRateMutation.isPending}>
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
                      <FormLabel className="text-amber-900">Silver Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-amber-200 focus:ring-amber-500">
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
                      <FormLabel className="text-amber-900">Current Rate (₹)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="Enter current rate" className="border-amber-200 focus-visible:ring-amber-500" />
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
                        <FormLabel className="text-amber-900">High (₹)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="High rate" className="border-amber-200 focus-visible:ring-amber-500" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="low"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-amber-900">Low (₹)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="Low rate" className="border-amber-200 focus-visible:ring-amber-500" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end pt-2">
                  <Button type="button" variant="outline" className="mr-2 border-amber-300 hover:bg-amber-50" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white" disabled={updateRateMutation.isPending}>
                    {updateRateMutation.isPending ? "Updating..." : "Update Rate"}
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