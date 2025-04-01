import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Save, ArrowLeft, CreditCard, UserCircle } from "lucide-react";
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
import { eventBus, EVENTS } from "@/lib/events";

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
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("gold");
  const [selectedRate, setSelectedRate] = useState<RateInfo | null>(null);
  
  // Since we're using ProtectedRoute, we know auth is available
  const { user, logoutMutation } = useAuth();

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
    onSuccess: (data) => {
      // Show success toast
      toast({
        title: "Success!",
        description: `Rate updated successfully to ₹${data.current.toLocaleString()}`,
      });
      
      // Force a hard refresh of rates data
      queryClient.invalidateQueries({ queryKey: ["/api/rates"] });
      
      // Emit event to update rates in real-time across the app
      eventBus.publish(EVENTS.RATES_UPDATED);
      console.log("Published rate update event");
      
      // Don't reset form - allow user to see the updated values
      // Instead, update the selected rate with new data
      if (selectedRate) {
        setSelectedRate({
          ...selectedRate,
          ...data
        });
      }
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
    // Only send necessary data: type, current rate, and category
    const updateData = {
      type: data.type,
      current: data.current,
      category: activeTab
    };
    updateRateMutation.mutate(updateData as RateFormData);
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
          {/* Admin Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                className="p-0 text-gray-700" 
                onClick={() => setLocation("/")}
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                <span>Back to Home</span>
              </Button>
              <h1 className="text-2xl font-semibold text-amber-800 hidden md:block">Admin Dashboard</h1>
            </div>

            <div className="flex gap-2 items-center">
              {user && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-800 mr-1">
                  <UserCircle className="h-4 w-4" />
                  <span className="text-sm font-medium hidden md:inline-block">
                    {user.username}
                  </span>
                </div>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="border-amber-600 text-amber-700 hover:bg-amber-50"
              >
                Logout
              </Button>
            </div>
          </div>

          {/* Main Admin Tabs */}
          <Tabs defaultValue="rates" className="w-full">
            <TabsList className="grid w-full grid-cols-1 rounded-md mb-6 shadow-sm bg-amber-50 p-1.5">
              <TabsTrigger 
                value="rates" 
                className="data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-md py-2.5 transition-all font-medium"
              >
                Rate Management
              </TabsTrigger>
            </TabsList>

            {/* Rates Tab Content */}
            <TabsContent value="rates" className="space-y-4 animate-in fade-in-50 slide-in-from-left-5">
              <Card className="shadow-md border-amber-100">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b">
                  <CardTitle className="text-amber-800 flex items-center">
                    <span className="bg-amber-100 rounded-full p-1.5 mr-2">
                      <CreditCard className="h-5 w-5 text-amber-700" />
                    </span>
                    Rate Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs defaultValue="gold" className="w-full" onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
                      <TabsTrigger 
                        value="gold" 
                        className="data-[state=active]:bg-amber-100 data-[state=active]:border-b-2 data-[state=active]:border-amber-600 rounded-none text-sm px-3 py-2"
                      >
                        Gold Rates
                      </TabsTrigger>
                      <TabsTrigger 
                        value="silver" 
                        className="data-[state=active]:bg-gray-100 data-[state=active]:border-b-2 data-[state=active]:border-gray-500 rounded-none text-sm px-3 py-2"
                      >
                        Silver Rates
                      </TabsTrigger>
                    </TabsList>

                    <div className="p-6">
                      <div className="mb-6">
                        <h3 className="text-sm font-medium mb-3 text-gray-700">Select rate to update:</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {rates
                            .filter(rate => rate.category === activeTab)
                            .map(rate => (
                              <Button 
                                key={rate.id} 
                                variant={selectedRate?.id === rate.id ? "default" : "outline"}
                                size="sm"
                                className={`${selectedRate?.id === rate.id 
                                  ? 'bg-amber-100 border-2 border-amber-500 text-amber-900' 
                                  : 'hover:bg-amber-50'} justify-start text-xs whitespace-normal h-auto py-2 text-left`}
                                onClick={() => handleSelectRate(rate)}
                              >
                                <span className="line-clamp-2">{rate.type}</span>
                              </Button>
                            ))
                          }
                        </div>
                      </div>

                      {selectedRate ? (
                        <div className="border rounded-md p-4 bg-amber-50/50">
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                              <div className="space-y-4">
                                <FormField
                                  control={form.control}
                                  name="type"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-amber-900">Rate Type</FormLabel>
                                      <div className="p-2 bg-gray-50 border border-gray-200 rounded-md text-gray-700">
                                        {field.value}
                                      </div>
                                      <Input type="hidden" {...field} />
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
                              </div>

                              <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                                  <div className="text-xs text-gray-500 mb-1">Daily High (₹)</div>
                                  <div className="font-medium text-gray-800">{selectedRate?.high.toLocaleString()}</div>
                                  <Input type="hidden" {...form.register("high")} />
                                </div>

                                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                                  <div className="text-xs text-gray-500 mb-1">Daily Low (₹)</div>
                                  <div className="font-medium text-gray-800">{selectedRate?.low.toLocaleString()}</div>
                                  <Input type="hidden" {...form.register("low")} />
                                </div>
                              </div>

                              <div className="flex justify-end pt-2">
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
                        </div>
                      ) : (
                        <div className="text-center py-6 border rounded-md bg-gray-50/80 text-gray-500">
                          Select a rate from above to update its values
                        </div>
                      )}
                    </div>
                  </Tabs>
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