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

  // Generate a sample invoice image for preview
  const previewInvoice = async (data: InvoiceFormValues) => {
    // Generate a simple preview image without html2canvas
    // This is a fallback approach since html2canvas is having issues
    const totalAmount = calculateTotalPrice(data).toFixed(2);
    
    // Create a canvas to draw the invoice preview
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 800, 800);
      
      // Header
      ctx.fillStyle = '#FDF2E3';
      ctx.fillRect(0, 0, 800, 80);
      
      // Shop name and invoice title
      ctx.fillStyle = '#B45309'; // amber-800
      ctx.font = 'bold 24px Arial';
      ctx.fillText(data.shopName, 20, 40);
      
      ctx.textAlign = 'right';
      ctx.fillText('INVOICE', 780, 40);
      
      // Reset text align
      ctx.textAlign = 'left';
      
      // Invoice details
      ctx.fillStyle = '#4B5563'; // gray-600
      ctx.font = '16px Arial';
      ctx.fillText(`#${data.invoiceNumber}`, 20, 70);
      ctx.textAlign = 'right';
      ctx.fillText(`Date: ${format(data.invoiceDate, 'dd/MM/yyyy')}`, 780, 70);
      ctx.textAlign = 'left';
      
      // Customer details
      ctx.fillStyle = '#1F2937'; // gray-800
      ctx.font = 'bold 18px Arial';
      ctx.fillText('Bill To:', 20, 120);
      
      ctx.fillStyle = '#4B5563'; // gray-600
      ctx.font = '16px Arial';
      ctx.fillText(data.customerName, 20, 150);
      if (data.customerAddress) {
        ctx.fillText(data.customerAddress, 20, 175);
      }
      if (data.customerContact) {
        ctx.fillText(`Contact: ${data.customerContact}`, 20, 200);
      }
      
      // Product details
      ctx.fillStyle = '#1F2937'; // gray-800
      ctx.font = 'bold 18px Arial';
      ctx.fillText('Product Details:', 20, 250);
      
      // Table header
      ctx.fillStyle = '#FEF3C7'; // amber-100
      ctx.fillRect(20, 270, 760, 40);
      
      ctx.fillStyle = '#92400E'; // amber-800
      ctx.font = 'bold 16px Arial';
      ctx.fillText('Item', 30, 295);
      ctx.fillText('Weight', 300, 295);
      ctx.fillText('Rate', 450, 295);
      ctx.fillText('Amount', 600, 295);
      
      // Product row
      ctx.fillStyle = '#4B5563'; // gray-600
      ctx.font = '16px Arial';
      ctx.fillText(product.name, 30, 335);
      ctx.fillText(`${product.weight}g`, 300, 335);
      ctx.fillText(`₹${data.customRate || defaultGoldRate}/10g`, 450, 335);
      
      const baseAmount = ((data.customRate || defaultGoldRate) * (product.weight || 0) / 10).toFixed(2);
      ctx.fillText(`₹${baseAmount}`, 600, 335);
      
      let yPos = 370;
      
      // Making charges row
      if (data.includeMakingCharges) {
        ctx.fillText(`Making Charges (${data.makingChargesPercentage}%)`, 30, yPos);
        const makingCharges = (((data.customRate || defaultGoldRate) * (product.weight || 0) / 10) * (data.makingChargesPercentage / 100)).toFixed(2);
        ctx.fillText(`₹${makingCharges}`, 600, yPos);
        yPos += 35;
      }
      
      // Additional charges row
      if (data.additionalCharges > 0) {
        ctx.fillText('Additional Charges', 30, yPos);
        ctx.fillText(`₹${data.additionalCharges.toFixed(2)}`, 600, yPos);
        yPos += 35;
      }
      
      // Discount row
      if (data.discount > 0) {
        ctx.fillStyle = '#EF4444'; // red-500
        ctx.fillText(
          `Discount ${data.discountType === 'percentage' ? `(${data.discount}%)` : ''}`, 
          30, 
          yPos
        );
        
        const discountAmount = data.discountType === 'percentage' 
          ? (calculateTotalPrice({ ...data, discount: 0 }) * (data.discount / 100)).toFixed(2)
          : data.discount.toFixed(2);
        
        ctx.fillText(`- ₹${discountAmount}`, 600, yPos);
        yPos += 35;
      }
      
      // Total
      yPos = 500;
      ctx.fillStyle = '#FEF3C7'; // amber-100
      ctx.fillRect(500, yPos, 280, 40);
      
      ctx.fillStyle = '#92400E'; // amber-800
      ctx.font = 'bold 16px Arial';
      ctx.fillText('Total Amount', 520, yPos + 25);
      
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`₹${totalAmount}`, 650, yPos + 25);
      
      // Footer
      ctx.fillStyle = '#6B7280'; // gray-500
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Thank you for your business!', 400, 700);
      ctx.fillText(`${data.shopName} - ${data.shopContact}`, 400, 725);
      
      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/png');
      setInvoicePreview(dataUrl);
    } else {
      toast({
        title: "Preview Error",
        description: "Could not generate invoice preview. Please try again.",
        variant: "destructive"
      });
    }
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
        

      </DialogContent>
    </Dialog>
  );
}