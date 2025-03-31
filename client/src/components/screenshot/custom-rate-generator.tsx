import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Camera, Download, Share2, Image, FileImage, Edit } from "lucide-react";
import { downloadScreenshot, shareScreenshot } from "@/lib/screenshot";
import { RateInfo } from "@/components/ui/rate-card";
import { Separator } from "@/components/ui/separator";

// Helper function to calculate derived gold rates
function calculateDerivedRates(baseRate: number): { [key: string]: number } {
  return {
    '24K': baseRate,
    '22K': Math.round(baseRate * 22 / 24),
    '18K': Math.round(baseRate * 18 / 24),
    '14K': Math.round(baseRate * 14 / 24),
  };
}

interface CustomRateGeneratorProps {
  rates: RateInfo[];
}

export function CustomRateGenerator({ rates }: CustomRateGeneratorProps) {
  const [open, setOpen] = useState(false);
  const shopName = "RP Jewellers"; // Fixed shop name
  const [shopContact, setShopContact] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [borderWidth, setBorderWidth] = useState(4);
  const [selectedTab, setSelectedTab] = useState("preview");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const screenshotRef = useRef<HTMLDivElement>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [useCustomRates, setUseCustomRates] = useState(false);
  const [show24K, setShow24K] = useState(false);
  const [show22K, setShow22K] = useState(true);
  const [show18K, setShow18K] = useState(true);
  const [show14K, setShow14K] = useState(false);

  // Find the 24K gold rate to use as the base for calculations
  const baseGoldRate = rates.find(rate => 
    rate.type.toLowerCase().includes("99.99") || 
    rate.type.toLowerCase().includes("24k"))?.current || 0;

  // State for custom rates
  const [custom24kRate, setCustom24kRate] = useState(baseGoldRate);
  const [custom22kRate, setCustom22kRate] = useState(Math.round(baseGoldRate * 22 / 24));
  const [custom18kRate, setCustom18kRate] = useState(Math.round(baseGoldRate * 18 / 24));
  const [custom14kRate, setCustom14kRate] = useState(Math.round(baseGoldRate * 14 / 24));
  
  // Function to update all rates based on 24K
  const updateAllRatesFrom24K = (base24kRate: number) => {
    setCustom24kRate(base24kRate);
    setCustom22kRate(Math.round(base24kRate * 22 / 24));
    setCustom18kRate(Math.round(base24kRate * 18 / 24));
    setCustom14kRate(Math.round(base24kRate * 14 / 24));
  };
  
  // Calculate or use direct custom rates
  const derivedRates = useCustomRates 
    ? {
        '24K': custom24kRate,
        '22K': custom22kRate,
        '18K': custom18kRate,
        '14K': custom14kRate
      }
    : calculateDerivedRates(baseGoldRate);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCaptureClick = async () => {
    if (!screenshotRef.current) return;
    
    try {
      const canvas = await html2canvas(screenshotRef.current, {
        backgroundColor: "white",
        scale: 2, // Higher scale for better quality
      });
      
      const dataUrl = canvas.toDataURL("image/png");
      setGeneratedImage(dataUrl);
      setSelectedTab("share");
    } catch (error) {
      console.error("Error generating screenshot:", error);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      downloadScreenshot(generatedImage, `${shopName}-gold-rates.png`);
    }
  };

  const handleShare = async () => {
    if (generatedImage) {
      try {
        await shareScreenshot(
          generatedImage, 
          `Gold Rates - ${shopName}`
        );
      } catch (error) {
        console.error("Error sharing image:", error);
      }
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-IN');
  };

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const currentTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex gap-1 items-center">
          <FileImage className="h-4 w-4" />
          <span className="text-xs">Custom Rate List</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Custom Rate List</DialogTitle>
          <DialogDescription className="text-xs text-gray-500 mt-1">
            Create a branded rate list with your shop name, logo, and even set your own custom rates.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="share">Share</TabsTrigger>
          </TabsList>
          
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shop-contact">Contact Info</Label>
              <Input 
                id="shop-contact" 
                value={shopContact}
                onChange={(e) => setShopContact(e.target.value)}
                placeholder="Phone or Address" 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Shop Logo</Label>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex gap-1 items-center"
                >
                  <Image className="h-4 w-4" />
                  <span>Upload Logo</span>
                </Button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                {logoUrl && (
                  <div className="w-10 h-10 bg-gray-100 rounded-md overflow-hidden">
                    <img 
                      src={logoUrl} 
                      alt="Shop Logo" 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="timestamp">Show Date & Time</Label>
              <Switch 
                id="timestamp" 
                checked={includeTimestamp}
                onCheckedChange={setIncludeTimestamp}
              />
            </div>
            
            <div className="space-y-3">
              <Label className="text-sm font-medium">Show Karats</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="show-24k" 
                    checked={show24K}
                    onCheckedChange={(checked) => setShow24K(checked === true)}
                  />
                  <Label htmlFor="show-24k" className="text-sm">24K Gold</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="show-22k" 
                    checked={show22K}
                    onCheckedChange={(checked) => setShow22K(checked === true)}
                  />
                  <Label htmlFor="show-22k" className="text-sm">22K Gold</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="show-18k" 
                    checked={show18K}
                    onCheckedChange={(checked) => setShow18K(checked === true)}
                  />
                  <Label htmlFor="show-18k" className="text-sm">18K Gold</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="show-14k" 
                    checked={show14K}
                    onCheckedChange={(checked) => setShow14K(checked === true)}
                  />
                  <Label htmlFor="show-14k" className="text-sm">14K Gold</Label>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Border Thickness</Label>
              <Slider 
                value={[borderWidth]} 
                min={0} 
                max={8} 
                step={1}
                onValueChange={(value) => setBorderWidth(value[0])}
              />
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-3 bg-amber-50 p-3 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Edit className="h-4 w-4 text-amber-600" />
                  <Label htmlFor="custom-rates" className="font-medium">Use Custom Rates</Label>
                </div>
                <Switch 
                  id="custom-rates" 
                  checked={useCustomRates}
                  onCheckedChange={setUseCustomRates}
                />
              </div>
              
              {useCustomRates && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="custom-24k-rate" className="flex items-center gap-1">
                      <span>24K Gold Rate (₹)</span>
                      {show24K && <span className="text-2xs font-medium text-green-600 bg-green-50 px-1 rounded">Visible</span>}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="custom-24k-rate"
                        type="number"
                        value={custom24kRate}
                        onChange={(e) => setCustom24kRate(Number(e.target.value))}
                        className="bg-white flex-1"
                      />
                      <Button 
                        onClick={() => updateAllRatesFrom24K(custom24kRate)}
                        size="sm"
                        variant="outline"
                        className="text-xs whitespace-nowrap"
                      >
                        Recalculate All
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="custom-22k-rate" className="flex items-center gap-1">
                      <span>22K Gold Rate (₹)</span>
                      {show22K && <span className="text-2xs font-medium text-green-600 bg-green-50 px-1 rounded">Visible</span>}
                    </Label>
                    <Input
                      id="custom-22k-rate"
                      type="number"
                      value={custom22kRate}
                      onChange={(e) => setCustom22kRate(Number(e.target.value))}
                      className="bg-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="custom-18k-rate" className="flex items-center gap-1">
                      <span>18K Gold Rate (₹)</span>
                      {show18K && <span className="text-2xs font-medium text-green-600 bg-green-50 px-1 rounded">Visible</span>}
                    </Label>
                    <Input
                      id="custom-18k-rate"
                      type="number"
                      value={custom18kRate}
                      onChange={(e) => setCustom18kRate(Number(e.target.value))}
                      className="bg-white"
                    />
                  </div>
                  
                  {show14K && (
                    <div className="space-y-2">
                      <Label htmlFor="custom-14k-rate" className="flex items-center gap-1">
                        <span>14K Gold Rate (₹)</span>
                        <span className="text-2xs font-medium text-green-600 bg-green-50 px-1 rounded">Visible</span>
                      </Label>
                      <Input
                        id="custom-14k-rate"
                        type="number"
                        value={custom14kRate}
                        onChange={(e) => setCustom14kRate(Number(e.target.value))}
                        className="bg-white"
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-2">
                    <p className="text-xs text-amber-700">
                      Customize each karat's rate individually
                    </p>
                    <Button
                      variant="secondary" 
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        updateAllRatesFrom24K(baseGoldRate);
                      }}
                    >
                      Use Market Rates
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="preview">
            <div className="flex justify-center">
              <div 
                ref={screenshotRef} 
                className="w-full max-w-[320px] bg-white p-4 rounded-lg shadow-lg"
                style={{ border: `${borderWidth}px solid #F59E0B` }}
              >
                <div className="flex justify-between items-center mb-3">
                  {logoUrl && (
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-amber-300">
                      <img 
                        src={logoUrl} 
                        alt="Shop Logo" 
                        className="w-full h-full object-contain" 
                      />
                    </div>
                  )}
                  <div className="text-right flex-1 ml-1">
                    <h3 className="text-xl font-bold text-amber-800 -mt-1">
                      {shopName}
                    </h3>
                    {shopContact && (
                      <p className="text-xs text-gray-600">{shopContact}</p>
                    )}
                  </div>
                </div>
                
                <div className="text-center mb-3">
                  <h2 className="text-lg font-bold bg-amber-500 text-white py-1 rounded">
                    Today's Gold Rates
                  </h2>
                  <div className="flex flex-col items-center">
                    {includeTimestamp && (
                      <p className="text-xs text-gray-600 mt-1">
                        {currentDate} at {currentTime}
                      </p>
                    )}
                    {useCustomRates && (
                      <span className="text-2xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-sm mt-1">
                        Custom Rates
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  {show24K && (
                    <div className="grid grid-cols-2 gap-1 bg-amber-50 p-2 rounded-md">
                      <div className="font-semibold text-amber-900">24K Gold</div>
                      <div className="text-right font-bold">₹{formatCurrency(derivedRates['24K'])}</div>
                    </div>
                  )}
                  
                  {show22K && (
                    <div className="grid grid-cols-2 gap-1 bg-amber-50 p-2 rounded-md">
                      <div className="font-semibold text-amber-900">22K Gold</div>
                      <div className="text-right font-bold">₹{formatCurrency(derivedRates['22K'])}</div>
                    </div>
                  )}
                  
                  {show18K && (
                    <div className="grid grid-cols-2 gap-1 bg-amber-50 p-2 rounded-md">
                      <div className="font-semibold text-amber-900">18K Gold</div>
                      <div className="text-right font-bold">₹{formatCurrency(derivedRates['18K'])}</div>
                    </div>
                  )}
                  
                  {show14K && (
                    <div className="grid grid-cols-2 gap-1 bg-amber-50 p-2 rounded-md">
                      <div className="font-semibold text-amber-900">14K Gold</div>
                      <div className="text-right font-bold">₹{formatCurrency(derivedRates['14K'])}</div>
                    </div>
                  )}
                </div>
                
                <div className="mt-3 text-2xs text-gray-500 text-center">
                  <p>*Rates subject to change without prior notice</p>
                  <p>*GST extra as applicable</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center mt-4">
              <Button onClick={handleCaptureClick}>
                <Camera className="h-4 w-4 mr-1" />
                Generate Image
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="share">
            {generatedImage ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img 
                    src={generatedImage} 
                    alt="Generated Rate Card" 
                    className="max-w-full rounded-md shadow-md"
                  />
                </div>
                
                <div className="flex justify-center gap-2">
                  <Button onClick={handleDownload} variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center p-6">
                <p className="text-gray-500">
                  Generate an image from the Preview tab first
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}