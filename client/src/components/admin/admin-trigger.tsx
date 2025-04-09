import { useState } from "react";
import { AdminPanel } from "./admin-panel";
import { RateInfo } from "@/components/ui/rate-card";

interface AdminTriggerProps {
  rates: RateInfo[];
}

export function AdminTrigger({ rates }: AdminTriggerProps) {
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  return (
    <AdminPanel 
      rates={rates} 
      isOpen={isAdminPanelOpen} 
      onOpenChange={setIsAdminPanelOpen} 
    />
  );
}
