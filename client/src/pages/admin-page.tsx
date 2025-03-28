import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { RateInfo } from "@/components/ui/rate-card";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CollectionManager } from "@/components/admin/collection-manager";

const rateSchema = z.object({
  type: z.string(),
  current: z.coerce.number(),
  high: z.coerce.number(),
  low: z.coerce.number(),
  category: z.string()
});

type RateFormData = z.infer<typeof rateSchema>;

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("gold");
  const [selectedRate, setSelectedRate] = useState<RateInfo | null>(null);
  
  const { data: rates, isLoading } = useQuery<RateInfo[]>({
    queryKey: ["/api/rates"],
  });

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
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Rate updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rates"] });
      // Reset form
      setSelectedRate(null);
      form.reset({
        type: "",
        current: 0,
        high: 0,
        low: 0,
        category: activeTab
      });
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
    data.category = activeTab;
    updateRateMutation.mutate(data);
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setLocation("/");
      }
    });
  };

  if (isLoading || !rates) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow bg-gray-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              className="p-0 text-gray-700" 
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              <span>Back</span>
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="rates" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-md mb-4">
              <TabsTrigger value="rates" className="data-[state=active]:bg-amber-100">Rate Management</TabsTrigger>
              <TabsTrigger value="collections" className="data-[state=active]:bg-amber-100">Collections</TabsTrigger>
            </TabsList>
            
            <TabsContent value="rates">
              <Card className="shadow">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b">
                  <CardTitle className="text-amber-800">Rate Management</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs defaultValue="gold" className="w-full" onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 rounded-none">
                      <TabsTrigger value="gold" className="data-[state=active]:bg-amber-100">Gold Rates</TabsTrigger>
                      <TabsTrigger value="silver" className="data-[state=active]:bg-gray-200">Silver Rates</TabsTrigger>
                    </TabsList>
                    
                    <div className="p-4">
                      <div className="mb-4">
                        <h3 className="text-sm font-medium mb-2">Select rate to update:</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {rates
                            .filter(rate => rate.category === activeTab)
                            .map(rate => (
                              <Button 
                                key={rate.id} 
                                variant={selectedRate?.id === rate.id ? "default" : "outline"}
                                size="sm"
                                className={selectedRate?.id === rate.id ? "border-2 border-amber-500" : ""}
                                onClick={() => handleSelectRate(rate)}
                              >
                                {rate.type}
                              </Button>
                            ))
                          }
                        </div>
                      </div>
                      
                      {selectedRate && (
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                              control={form.control}
                              name="type"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Rate Type</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Enter rate type" />
                                  </FormControl>
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
                      )}
                    </div>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="collections">
              <Card className="shadow">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b">
                  <CardTitle className="text-amber-800">Collection Management</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <CollectionManager />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
}
