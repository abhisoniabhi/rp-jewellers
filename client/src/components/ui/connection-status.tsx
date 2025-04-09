import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { OfflineIndicator } from './offline-indicator';

export function ConnectionStatus() {
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const { toast } = useToast();

  // Check connection to API
  const checkConnection = async () => {
    setStatus('checking');
    
    try {
      // Try to fetch rates as a connection test
      const response = await fetch('/api/rates', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setStatus('online');
        toast({
          title: "Connection restored",
          description: "Successfully connected to the server.",
          variant: "default",
        });
      } else {
        setStatus('offline');
        toast({
          title: "Connection failed",
          description: "Could not connect to the server. Data may be stale.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      setStatus('offline');
      toast({
        title: "Connection failed",
        description: "Could not connect to the server. Data may be stale.",
        variant: "destructive",
      });
    }
  };

  // Check connection on component mount
  useEffect(() => {
    checkConnection();
    
    // Set up periodic connection checks
    const intervalId = setInterval(checkConnection, 60000); // Check every minute
    
    // Add offline/online event listeners for better connectivity detection
    window.addEventListener('online', () => {
      checkConnection();
    });
    
    window.addEventListener('offline', () => {
      setStatus('offline');
      toast({
        title: "You are offline",
        description: "Please check your internet connection.",
        variant: "destructive",
      });
    });
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', () => setStatus('offline'));
    };
  }, []);

  return (
    <>
      {/* Only show the alert when checking or just went offline */}
      {status !== 'online' && (
        <Alert variant={status === 'checking' ? 'default' : 'destructive'} className="mb-4">
          {status === 'checking' ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {status === 'checking' ? 'Checking connection...' : 'Connection Issue'}
          </AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              {status === 'checking' 
                ? 'Verifying connection to the server.' 
                : 'Unable to connect to the server. You\'re viewing stored data.'}
            </span>
            {status === 'offline' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={checkConnection}
                className="ml-2"
              >
                Retry
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Always show the floating indicator when offline */}
      {status === 'offline' && <OfflineIndicator />}
    </>
  );
}