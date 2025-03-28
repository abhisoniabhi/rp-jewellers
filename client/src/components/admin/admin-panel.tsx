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
  current: z.string().transform((val) => parseInt(val, 10)),
  high: z.string().transform((val) => parseInt(val, 10)),
  low: z.string().transform((val) => parseInt(val, 10)),
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
      type: "नंबर 99.99 Retail",
      current: "91700",
      high: "92000",
      low: "91650",
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
    form.setValue("current", String(rate.current));
    form.setValue("high", String(rate.high));
    form.setValue("low", String(rate.low));
    form.setValue("category", rate.category);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-md">
        <DialogHeader>
          <DialogTitle className="font-playfair text-lg font-bold text-burgundy-default">Admin Panel</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="gold" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="gold">Gold Rates</TabsTrigger>
            <TabsTrigger value="silver">Silver Rates</TabsTrigger>
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
