import React, { useState } from "react";
import { Product, Collection, Rate } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

// Define the form schema for invoice
const invoiceFormSchema = z.object({
  shopName: z.string().min(1, "Shop name is required"),
  shopAddress: z.string().min(1, "Shop address is required"),
  shopContact: z.string().min(1, "Contact number is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  invoiceDate: z.date({
    required_error: "Invoice date is required",
  }),
  gstNumber: z.string().optional(),
  customWeight: z.coerce.number().min(0.1, "Weight must be at least 0.1g").optional(),
  customRate: z.coerce.number().min(0, "Rate cannot be negative").optional(),
  karatType: z.enum(["22K", "18K"]).default("22K"),
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
    customWeight: product.weight || 0,
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
    
    // Adjust gold rate based on karat type
    // 22K is 91.6% pure gold, 18K is 75% pure gold
    const purityFactor = values.karatType === "22K" ? 0.916 : 0.75;
    const adjustedGoldRate = goldRate * purityFactor;
    
    // Use custom weight if specified, otherwise use product weight
    const weight = values.customWeight !== undefined ? values.customWeight : product.weight || 0;
    const productPrice = (adjustedGoldRate * weight) / 10; // Price per gram
    
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

  // Generate invoice preview using canvas API
  const previewInvoice = async (data: InvoiceFormValues) => {
    try {
      const totalAmount = calculateTotalPrice(data).toFixed(2);
      
      // Create a canvas to draw the invoice preview
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 900;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        toast({
          title: "Preview Error",
          description: "Could not generate invoice preview. Browser may not support canvas.",
          variant: "destructive"
        });
        return;
      }
      
      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 800, 900);
      
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
      
      // Shop details (replacing customer details)
      ctx.fillStyle = '#1F2937'; // gray-800
      ctx.font = 'bold 18px Arial';
      ctx.fillText('Shop Details:', 20, 120);
      
      ctx.fillStyle = '#4B5563'; // gray-600
      ctx.font = '16px Arial';
      ctx.fillText(data.shopContact, 20, 150);
      ctx.fillText(data.shopAddress, 20, 175);
      if (data.gstNumber) {
        ctx.fillText(`GST No: ${data.gstNumber}`, 20, 200);
      }
      
      // Product details
      ctx.fillStyle = '#1F2937'; // gray-800
      ctx.font = 'bold 18px Arial';
      ctx.fillText('Product Details:', 20, 250);

      let currentY = 270;
      
      // Add product image if it exists and is requested
      if (data.includeProductImage && product.imageUrl) {
        try {
          // Create a temporary image element to load the product image
          const img = new Image();
          img.crossOrigin = "anonymous"; // Enable CORS
          
          // Wait for the image to load
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = product.imageUrl;
          });
          
          // Draw image with a border
          const imgSize = 120;
          ctx.strokeStyle = '#E5E7EB'; // gray-200
          ctx.lineWidth = 1;
          
          // Draw the image
          ctx.drawImage(img, 20, currentY, imgSize, imgSize);
          
          // Draw border around the image
          ctx.strokeRect(20, currentY, imgSize, imgSize);
          
          // Add product name and details next to the image
          ctx.fillStyle = '#4B5563'; // gray-600
          ctx.font = 'bold 16px Arial';
          ctx.fillText(product.name, 160, currentY + 25);
          
          ctx.font = '14px Arial';
          ctx.fillText(`Category: ${product.category || 'N/A'}`, 160, currentY + 50);
          // Remove karatType reference
          if (collection) {
            ctx.fillText(`Collection: ${collection.name}`, 160, currentY + 100);
          }
          
          // Update Y position to continue after the image
          currentY += imgSize + 30;
        } catch (err) {
          console.error('Error loading product image:', err);
          // If image fails to load, just show text
          currentY += 30;
        }
      } else {
        // If no image, just add some spacing
        currentY += 30;
      }
      
      // Table header
      ctx.fillStyle = '#FEF3C7'; // amber-100
      ctx.fillRect(20, currentY, 760, 40);
      
      ctx.fillStyle = '#92400E'; // amber-800
      ctx.font = 'bold 16px Arial';
      ctx.fillText('Item', 30, currentY + 25);
      ctx.fillText('Weight', 300, currentY + 25);
      ctx.fillText('Rate', 450, currentY + 25);
      ctx.fillText('Amount', 600, currentY + 25);
      
      currentY += 40;
      
      // Product row
      ctx.fillStyle = '#4B5563'; // gray-600
      ctx.font = '16px Arial';
      ctx.fillText(`${product.name}`, 30, currentY + 25);
      
      // Use custom weight if provided
      const displayWeight = data.customWeight !== undefined ? data.customWeight : product.weight || 0;
      ctx.fillText(`${displayWeight}g`, 300, currentY + 25);
      
      ctx.fillText(`₹${data.customRate || defaultGoldRate}/10g`, 450, currentY + 25);
      
      // Calculate with purity factor
      const purityFactor = data.karatType === "22K" ? 0.916 : 0.75;
      const adjustedGoldRate = (data.customRate || defaultGoldRate) * purityFactor;
      const baseAmount = (adjustedGoldRate * displayWeight / 10).toFixed(2);
      ctx.fillText(`₹${baseAmount}`, 600, currentY + 25);
      
      currentY += 40;
      let yPos = currentY + 30;
      
      // Making charges row
      if (data.includeMakingCharges) {
        ctx.fillText(`Making Charges (${data.makingChargesPercentage}%)`, 30, yPos);
        // Use the adjusted gold rate for making charges calculation
        const makingCharges = ((adjustedGoldRate * displayWeight / 10) * (data.makingChargesPercentage / 100)).toFixed(2);
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
      yPos = currentY + 150;
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
      ctx.fillText('Thank you for your business!', 400, 800);
      ctx.fillText(`${data.shopName} - ${data.shopContact}`, 400, 825);
      
      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/png');
      setInvoicePreview(dataUrl);
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast({
        title: "Error",
        description: "Failed to generate invoice preview",
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
      const shopNameValue = form.getValues("shopName");
      const shopName = typeof shopNameValue === 'string' ? shopNameValue.replace(/\s+/g, "-").toLowerCase() : 'shop';
      
      const invoiceNumberValue = form.getValues("invoiceNumber");
      const invoiceNumber = typeof invoiceNumberValue === 'string' ? invoiceNumberValue : 'invoice';
      
      const currentDate = format(new Date(), 'yyyy-MM-dd');
      const fileName = `invoice-${shopName}-${invoiceNumber}-${currentDate}.png`;
      
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
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="customWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Weight (g)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              min="0.01"
                              placeholder="Weight in grams" 
                              {...field} 
                              onChange={(e) => {
                                field.onChange(e);
                                // Trigger form state update to recalculate total
                                setTimeout(() => form.trigger(), 100);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Default: {product.weight}g
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  
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
                  </div>

                  <FormField
                    control={form.control}
                    name="karatType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gold Karat Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select karat type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="22K">22K Gold</SelectItem>
                            <SelectItem value="18K">18K Gold</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose between 22K and 18K gold for calculations
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
                                <SelectValue placeholder="Select type" />
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
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Additional notes or terms..." 
                            {...field}
                            rows={3}
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
                  
                  <div className="pt-4">
                    <Button type="submit" className="w-full">
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Preview
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </div>
          
          {/* Preview Section */}
          <div className="border rounded-lg p-4 flex flex-col">
            <h3 className="text-lg font-medium mb-4">Preview</h3>
            {invoicePreview ? (
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="flex-1 overflow-auto border rounded">
                  <img 
                    src={invoicePreview} 
                    alt="Invoice Preview" 
                    className="w-full h-auto"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleDownload}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button 
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
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-4 border rounded-md p-8">
                <Receipt className="h-16 w-16 opacity-20" />
                <p>Fill the form and generate a preview to see your invoice here</p>
                <p className="text-sm">The preview will show a professional invoice with your details and the product information</p>
              </div>
            )}
          </div>
        </div>
        
      </DialogContent>
    </Dialog>
  );
}