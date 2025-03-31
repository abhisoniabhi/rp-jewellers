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
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Camera, Download, Share2, Image, FileImage } from "lucide-react";
import { downloadScreenshot, shareScreenshot } from "@/lib/screenshot";
import { RateInfo } from "@/components/ui/rate-card";

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
  const [shopName, setShopName] = useState("");
  const [shopContact, setShopContact] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [borderWidth, setBorderWidth] = useState(4);
  const [includeAllKarats, setIncludeAllKarats] = useState(false);
  const [selectedTab, setSelectedTab] = useState("preview");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const screenshotRef = useRef<HTMLDivElement>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Find the 24K gold rate to use as the base for calculations
  const baseGoldRate = rates.find(rate => 
    rate.type.toLowerCase().includes("99.99") || 
    rate.type.toLowerCase().includes("24k"))?.current || 0;

  // Calculate rates for different karats
  const derivedRates = calculateDerivedRates(baseGoldRate);

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
      downloadScreenshot(generatedImage, `${shopName || 'custom'}-gold-rates.png`);
    }
  };

  const handleShare = async () => {
    if (generatedImage) {
      try {
        await shareScreenshot(
          generatedImage, 
          `Gold Rates - ${shopName || 'Today'}`
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
        </DialogHeader>
        
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="share">Share</TabsTrigger>
          </TabsList>
          
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shop-name">Shop Name</Label>
              <Input 
                id="shop-name" 
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Your Jewellery Shop" 
              />
            </div>
            
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
            
            <div className="flex items-center justify-between">
              <Label htmlFor="all-karats">Show All Karats</Label>
              <Switch 
                id="all-karats" 
                checked={includeAllKarats}
                onCheckedChange={setIncludeAllKarats}
              />
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
                  <div className="text-right flex-1 ml-2">
                    <h3 className="text-lg font-bold text-amber-800">
                      {shopName || "Your Jewellery Shop"}
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
                  {includeTimestamp && (
                    <p className="text-xs text-gray-600 mt-1">
                      {currentDate} at {currentTime}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-1 bg-amber-50 p-2 rounded-md">
                    <div className="font-semibold text-amber-900">22K Gold</div>
                    <div className="text-right font-bold">₹{formatCurrency(derivedRates['22K'])}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1 bg-amber-50 p-2 rounded-md">
                    <div className="font-semibold text-amber-900">18K Gold</div>
                    <div className="text-right font-bold">₹{formatCurrency(derivedRates['18K'])}</div>
                  </div>
                  
                  {includeAllKarats && (
                    <>
                      <div className="grid grid-cols-2 gap-1 bg-amber-50 p-2 rounded-md">
                        <div className="font-semibold text-amber-900">24K Gold</div>
                        <div className="text-right font-bold">₹{formatCurrency(derivedRates['24K'])}</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-1 bg-amber-50 p-2 rounded-md">
                        <div className="font-semibold text-amber-900">14K Gold</div>
                        <div className="text-right font-bold">₹{formatCurrency(derivedRates['14K'])}</div>
                      </div>
                    </>
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