import { useState, useRef } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Camera, Download, Share2 } from "lucide-react";
import { ScreenshotView } from "./screenshot-view";
import { RateInfo } from "@/components/ui/rate-card";
import { generateRatesScreenshot, downloadScreenshot, shareScreenshot } from "@/lib/screenshot";
import { useToast } from "@/hooks/use-toast";

interface ScreenshotGeneratorProps {
  rates: RateInfo[];
}

export function ScreenshotGenerator({ rates }: ScreenshotGeneratorProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const shopName = "RP Jewellers"; // Fixed shop name
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [includeWatermark, setIncludeWatermark] = useState(true);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateScreenshot = async () => {
    try {
      setIsGenerating(true);
      // Wait a moment for the UI to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await generateRatesScreenshot(rates, "screenshot-container", {
        includeShopName: true,
        includeTimestamp,
        includeWatermark,
        backgroundColor: "#ffffff"
      });
      
      setScreenshotUrl(dataUrl);
      
      toast({
        title: "Screenshot Generated",
        description: "Your rates screenshot is ready to share!",
      });
    } catch (error) {
      console.error("Error generating screenshot:", error);
      toast({
        title: "Error",
        description: "Failed to generate screenshot",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (screenshotUrl) {
      downloadScreenshot(screenshotUrl, `${shopName.replace(/\s+/g, '-').toLowerCase()}-rates.png`);
    }
  };

  const handleShare = async () => {
    if (screenshotUrl) {
      try {
        await shareScreenshot(screenshotUrl, `${shopName}'s Gold & Silver Rates`);
        toast({
          title: "Shared Successfully",
          description: "Rates screenshot shared successfully!"
        });
      } catch (error) {
        console.error("Error sharing screenshot:", error);
        toast({
          title: "Sharing Failed",
          description: "Could not share the screenshot. It has been downloaded instead.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          className="flex items-center gap-2 bg-white text-amber-700 border-amber-200 hover:bg-amber-50"
        >
          <Camera className="h-4 w-4" />
          <span>Create Shareable Image</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Rates Screenshot</DialogTitle>
          <DialogDescription>
            Create a shareable image of the current rates.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="timestamp" className="cursor-pointer">Show Date</Label>
            <Switch
              id="timestamp"
              checked={includeTimestamp}
              onCheckedChange={setIncludeTimestamp}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="watermark" className="cursor-pointer">Include Watermark</Label>
            <Switch
              id="watermark"
              checked={includeWatermark}
              onCheckedChange={setIncludeWatermark}
            />
          </div>
        </div>

        <div className="border rounded-md p-1 overflow-hidden">
          <div className="max-h-80 overflow-y-auto">
            <ScreenshotView 
              rates={rates} 
              shopName={shopName}
              includeTimestamp={includeTimestamp}
              includeWatermark={includeWatermark}
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
          <div className="flex gap-2 w-full sm:w-auto">
            {screenshotUrl ? (
              <>
                <Button 
                  className="flex-1 flex items-center gap-2" 
                  variant="outline"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </Button>
                <Button 
                  className="flex-1 flex items-center gap-2 bg-amber-600 hover:bg-amber-700" 
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </Button>
              </>
            ) : (
              <Button 
                className="w-full bg-amber-600 hover:bg-amber-700" 
                onClick={generateScreenshot}
                disabled={isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate Screenshot"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}