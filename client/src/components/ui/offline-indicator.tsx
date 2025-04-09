import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  return (
    <div className="fixed bottom-16 left-0 w-full flex justify-center z-50 pointer-events-none">
      <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm shadow-lg flex items-center gap-1.5 pointer-events-auto">
        <WifiOff className="h-3 w-3" />
        <span>Offline Mode</span>
      </div>
    </div>
  );
}