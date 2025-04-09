import { useState } from "react";
import { AdminPanel } from "./admin-panel";
import { RateInfo } from "@/components/ui/rate-card";
import { Settings, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminTriggerProps {
  rates: RateInfo[];
}

export function AdminTrigger({ rates }: AdminTriggerProps) {
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  return (
    <>
      {/* Fixed position admin button */}
      <div className="fixed right-4 top-16 z-50">
        <Button 
          onClick={() => setIsAdminPanelOpen(true)}
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full bg-white shadow-lg border-amber-200 hover:bg-amber-50"
        >
          <ShieldAlert className="h-6 w-6 text-amber-600" />
        </Button>
      </div>
      
      <AdminPanel 
        rates={rates} 
        isOpen={isAdminPanelOpen} 
        onOpenChange={setIsAdminPanelOpen} 
      />
    </>
  );
}
