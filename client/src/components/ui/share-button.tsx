import { Button } from "@/components/ui/button";
import { Share } from "lucide-react";
import { shareRates } from "@/lib/share";

export function ShareButton() {
  return (
    <Button 
      variant="outline" 
      onClick={shareRates}
      className="px-6 py-2 rounded-full shadow-md flex items-center gap-2"
    >
      <span className="font-medium">SHARE</span>
      <Share className="h-4 w-4" />
    </Button>
  );
}
