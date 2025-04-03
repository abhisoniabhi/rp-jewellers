import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useState } from "react";
import { AdminPanel } from "./admin-panel";
import { RateInfo } from "@/components/ui/rate-card";

interface AdminTriggerProps {
  rates: RateInfo[];
}

export function AdminTrigger({ rates }: AdminTriggerProps) {
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-20 right-4 z-40">
        <Button
          className="bg-amber-600 hover:bg-amber-700 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center"
          onClick={() => setIsAdminPanelOpen(true)}
        >
          <Lock className="h-5 w-5" />
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
