import React, { useState, useRef } from "react";
import { Product, Collection, Rate } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { downloadScreenshot } from "@/lib/screenshot";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, FileText, Receipt, Printer } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import html2canvas from "html2canvas";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

// Define the form schema for invoice
const invoiceFormSchema = z.object({
  shopName: z.string().min(1, "Shop name is required"),
  shopAddress: z.string().min(1, "Shop address is required"),
  shopContact: z.string().min(1, "Contact number is required"),
  customerName: z.string().min(1, "Customer name is required"),
  customerContact: z.string().optional(),
  customerAddress: z.string().optional(),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  invoiceDate: z.date({
    required_error: "Invoice date is required",
  }),
  gstNumber: z.string().optional(),
  customRate: z.coerce.number().min(0, "Rate cannot be negative").optional(),
  additionalCharges: z.coerce.number().min(0, "Charges cannot be negative").default(0),
  discount: z.coerce.number().min(0, "Discount cannot be negative").default(0),
  discountType: z.enum(["percentage", "amount"]).default("percentage"),
  notes: z.string().optional(),
  includeShopLogo: z.boolean().default(true),
  includeProductImage: z.boolean().default(true),
  includeMakingCharges: z.boolean().default(true),
  makingChargesPercentage: z.coerce.number().min(0, "Making charges cannot be negative").default(8),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface InvoiceGeneratorProps {
  product: Product;
  collection?: Collection;
  rates: Rate[];
}

export function InvoiceGenerator({ product, collection, rates }: InvoiceGeneratorProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [invoicePreview, setInvoicePreview] = useState<string | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Find default gold rate
  const defaultGoldRate = React.useMemo(() => {
    if (rates && rates.length > 0) {
      const goldRate = rates.find(r => r.category === "gold");
      return goldRate ? goldRate.current : 0;
    }
    return 0;
  }, [rates]);

  // Default values for the form
  const defaultValues: Partial<InvoiceFormValues> = {
    shopName: "RP Jewellers",
    shopAddress: "Main Market, Chandni Chowk, Delhi",
    shopContact: "+91 98765 43210",
    invoiceDate: new Date(),
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    includeShopLogo: true,
    includeProductImage: true,
    includeMakingCharges: true,
    makingChargesPercentage: 8,
    customRate: defaultGoldRate,
    additionalCharges: 0,
    discount: 0,
    discountType: "percentage"
  };

  // Set up the form
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues,
  });

  // Preview invoice
  const previewInvoice = async (data: InvoiceFormValues) => {
    setInvoicePreview(null);
    
    // Process the form after a small delay to let the component render with the latest values
    setTimeout(() => {
      if (invoiceRef.current) {
        html2canvas(invoiceRef.current, {
          scale: 2,
          logging: false,
          backgroundColor: "#ffffff"
        }).then((canvas) => {
          const dataUrl = canvas.toDataURL("image/png");
          setInvoicePreview(dataUrl);
        }).catch(err => {
          console.error("Error generating invoice preview:", err);
          toast({
            title: "Error",
            description: "Failed to generate invoice preview",
            variant: "destructive"
          });
        });
      }
    }, 100);
  };

  // Handle form submission
  const onSubmit = (data: InvoiceFormValues) => {
    previewInvoice(data);
  };

  // Download the invoice
  const handleDownload = () => {
    if (invoicePreview) {
      const shopName = form.getValues("shopName").replace(/\s+/g, "-").toLowerCase();
      const customerName = form.getValues("customerName").replace(/\s+/g, "-").toLowerCase();
      const invoiceNumber = form.getValues("invoiceNumber");
      const fileName = `invoice-${shopName}-${customerName}-${invoiceNumber}.png`;
      
      downloadScreenshot(invoicePreview, fileName);
      
      toast({
        title: "Invoice downloaded",
        description: "The invoice has been successfully downloaded",
      });
    }
  };

  // Print the invoice
  const handlePrint = () => {
    if (invoicePreview) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Invoice</title>
              <style>
                body { margin: 0; padding: 0; }
                img { max-width: 100%; height: auto; }
              </style>
            </head>
            <body>
              <img src="${invoicePreview}" onload="window.print();window.close()" />
            </body>
          </html>
        `);
        printWindow.document.close();
      } else {
        toast({
          title: "Print error",
          description: "Unable to open print window. Please check your browser settings.",
          variant: "destructive"
        });
      }
    }
  };

  // Calculate total price based on form data
  const calculateTotalPrice = (values: InvoiceFormValues) => {
    // Find gold rate from the array of rates
    let goldRate = 0;
    if (values.customRate) {
      goldRate = values.customRate;
    } else if (rates && rates.length > 0) {
      const goldRateObj = rates.find(r => r.category === "gold");
      if (goldRateObj) {
        goldRate = goldRateObj.current;
      }
    }
    
    const weight = product.weight || 0;
    const productPrice = (goldRate * weight) / 10; // Price per gram
    
    // Add making charges if enabled
    let totalPrice = productPrice;
    if (values.includeMakingCharges) {
      totalPrice += (productPrice * (values.makingChargesPercentage / 100));
    }
    
    // Add additional charges
    totalPrice += values.additionalCharges || 0;
    
    // Apply discount
    if (values.discount && values.discount > 0) {
      if (values.discountType === "percentage") {
        totalPrice = totalPrice * (1 - (values.discount / 100));
      } else {
        totalPrice = totalPrice - (values.discount || 0);
      }
    }
    
    return totalPrice > 0 ? totalPrice : 0;
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Receipt className="mr-2 h-4 w-4" />
          Generate Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
          <DialogDescription>
            Create a professional invoice for this product with your shop details.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Form Section */}
          <div className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Shop Information</h3>
                  <FormField
                    control={form.control}
                    name="shopName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shop Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Shop Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="shopAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shop Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Shop Address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="shopContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Contact Number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="gstNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GST Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="GST Number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Customer Information</h3>
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Customer Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="customerContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Contact (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Customer Contact" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="customerAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Address (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Customer Address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Invoice Details</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="invoiceNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invoice Number</FormLabel>
                          <FormControl>
                            <Input placeholder="INV-000123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="invoiceDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Invoice Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Pricing</h3>
                  <FormField
                    control={form.control}
                    name="customRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gold Rate (per 10g)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Custom Gold Rate" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                              // Trigger form state update to recalculate total
                              setTimeout(() => form.trigger(), 100);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Default: ₹{defaultGoldRate}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="includeMakingCharges"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Include Making Charges</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                setTimeout(() => form.trigger(), 100);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="makingChargesPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Making Charges (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Making Charges %" 
                              {...field}
                              disabled={!form.watch("includeMakingCharges")}
                              onChange={(e) => {
                                field.onChange(e);
                                setTimeout(() => form.trigger(), 100);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="additionalCharges"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Charges</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Additional Charges" 
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              setTimeout(() => form.trigger(), 100);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="discount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Discount" 
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                setTimeout(() => form.trigger(), 100);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="discountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount Type</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              setTimeout(() => form.trigger(), 100);
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select discount type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage (%)</SelectItem>
                              <SelectItem value="amount">Fixed Amount (₹)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Additional Options</h3>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional notes, terms, or conditions"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="includeShopLogo"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Include Shop Logo</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="includeProductImage"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Include Product Image</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  Preview Invoice
                </Button>
              </form>
            </Form>
          </div>
          
          {/* Preview Section */}
          <div className="border rounded-lg p-4 bg-gray-50 flex flex-col">
            {invoicePreview ? (
              <div className="space-y-4 flex-1 flex flex-col">
                <h3 className="text-lg font-medium">Invoice Preview</h3>
                <div className="flex-1 overflow-hidden rounded border bg-white">
                  <img 
                    src={invoicePreview} 
                    alt="Invoice Preview" 
                    className="w-full object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    className="flex-1" 
                    onClick={handleDownload}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={handlePrint}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4 text-center text-gray-500">
                <Receipt className="h-16 w-16 opacity-20" />
                <div>
                  <h3 className="text-lg font-medium">No Preview Available</h3>
                  <p>Fill out the form and click "Preview Invoice" to see your invoice here.</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Hidden invoice template for capturing */}
        <div className="hidden">
          <div
            ref={invoiceRef}
            className="p-8 bg-white"
            style={{ width: "800px", minHeight: "1000px" }}
          >
            {/* Invoice Header */}
            <div className="border-b pb-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {form.watch("includeShopLogo") && (
                  <div className="w-20 h-20 rounded-full border flex items-center justify-center bg-amber-50 text-amber-800 font-bold text-xl">
                    {form.watch("shopName").substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-amber-800">{form.watch("shopName")}</h1>
                  <p className="text-gray-600">{form.watch("shopAddress")}</p>
                  <p className="text-gray-600">Contact: {form.watch("shopContact")}</p>
                  {form.watch("gstNumber") && (
                    <p className="text-gray-600">GST: {form.watch("gstNumber")}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold text-amber-800">INVOICE</h2>
                <p className="text-gray-600">#{form.watch("invoiceNumber")}</p>
                <p className="text-gray-600">
                  Date: {format(form.watch("invoiceDate") || new Date(), "dd/MM/yyyy")}
                </p>
              </div>
            </div>
            
            {/* Customer Details */}
            <div className="mb-6">
              <h3 className="font-bold text-lg text-gray-800 mb-2">Bill To:</h3>
              <p className="font-medium">{form.watch("customerName")}</p>
              {form.watch("customerAddress") && (
                <p className="text-gray-600">{form.watch("customerAddress")}</p>
              )}
              {form.watch("customerContact") && (
                <p className="text-gray-600">Contact: {form.watch("customerContact")}</p>
              )}
            </div>
            
            {/* Product Details */}
            <div className="mb-6">
              <h3 className="font-bold text-lg text-gray-800 mb-2">Product Details:</h3>
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-5 bg-amber-50 text-amber-800 font-bold p-3">
                  <div className="col-span-2">Item</div>
                  <div>Weight</div>
                  <div>Rate</div>
                  <div>Amount</div>
                </div>
                
                <div className="grid grid-cols-5 p-3 border-b items-center">
                  <div className="col-span-2 flex gap-3">
                    {form.watch("includeProductImage") && product.imageUrl && (
                      <div className="w-16 h-16 rounded border overflow-hidden">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.category} - {product.karatType}</p>
                      {collection && (
                        <p className="text-xs text-gray-500">Collection: {collection.name}</p>
                      )}
                    </div>
                  </div>
                  <div>{product.weight}g</div>
                  <div>₹{form.watch("customRate") || defaultGoldRate}/10g</div>
                  <div>
                    ₹{((form.watch("customRate") || defaultGoldRate) * (product.weight || 0) / 10).toFixed(2)}
                  </div>
                </div>
                
                {form.watch("includeMakingCharges") && (
                  <div className="grid grid-cols-5 p-3 border-b">
                    <div className="col-span-2">Making Charges ({form.watch("makingChargesPercentage")}%)</div>
                    <div></div>
                    <div></div>
                    <div>
                      ₹{(((form.watch("customRate") || defaultGoldRate) * (product.weight || 0) / 10) * (form.watch("makingChargesPercentage") / 100)).toFixed(2)}
                    </div>
                  </div>
                )}
                
                {form.watch("additionalCharges") > 0 && (
                  <div className="grid grid-cols-5 p-3 border-b">
                    <div className="col-span-2">Additional Charges</div>
                    <div></div>
                    <div></div>
                    <div>₹{form.watch("additionalCharges").toFixed(2)}</div>
                  </div>
                )}
                
                {form.watch("discount") > 0 && (
                  <div className="grid grid-cols-5 p-3 border-b text-red-600">
                    <div className="col-span-2">
                      Discount {form.watch("discountType") === "percentage" ? `(${form.watch("discount")}%)` : ""}
                    </div>
                    <div></div>
                    <div></div>
                    <div>
                      {form.watch("discountType") === "percentage" 
                        ? `- ₹${(calculateTotalPrice({ ...form.getValues(), discount: 0 }) * (form.watch("discount") / 100)).toFixed(2)}`
                        : `- ₹${form.watch("discount").toFixed(2)}`
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Total Amount */}
            <div className="flex justify-end mb-8">
              <div className="w-1/3 border rounded-lg overflow-hidden">
                <div className="bg-amber-50 p-3 font-bold text-amber-800">Total Amount</div>
                <div className="p-3 text-xl font-bold">₹{calculateTotalPrice(form.getValues()).toFixed(2)}</div>
              </div>
            </div>
            
            {/* Notes */}
            {form.watch("notes") && (
              <div className="mb-6">
                <h3 className="font-bold text-lg text-gray-800 mb-2">Notes:</h3>
                <p className="text-gray-600 whitespace-pre-line">{form.watch("notes")}</p>
              </div>
            )}
            
            {/* Footer */}
            <div className="mt-auto pt-6 border-t text-center text-gray-500 text-sm">
              <p>Thank you for your business!</p>
              <p>{form.watch("shopName")} - {form.watch("shopContact")}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}