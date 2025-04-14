import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../../hooks/use-auth';
import { PushNotifications, PushNotificationSchema, ActionPerformed, Token } from '@capacitor/push-notifications';

const PushNotificationSetup: React.FC = () => {
  const { toast } = useToast();
  const { firebaseUser, requestNotifications, fcmToken } = useAuth();
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [isCapacitorAvailable, setIsCapacitorAvailable] = useState<boolean>(false);
  const [notificationsList, setNotificationsList] = useState<PushNotificationSchema[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Check if running in Capacitor environment
  useEffect(() => {
    const checkCapacitor = async () => {
      try {
        // Try to access Capacitor plugins
        if (typeof PushNotifications !== 'undefined') {
          setIsCapacitorAvailable(true);
          // Initialize push notifications if available
          await initializePushNotifications();
        }
      } catch (error) {
        console.log('Not running in Capacitor environment:', error);
        setIsCapacitorAvailable(false);
      }
    };

    checkCapacitor();
  }, []);

  // Check browser notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Initialize Capacitor Push Notifications
  const initializePushNotifications = async () => {
    if (!isCapacitorAvailable) return;

    try {
      // Request permission
      const permissionStatus = await PushNotifications.requestPermissions();
      
      if (permissionStatus.receive === 'granted') {
        // Register with FCM
        await PushNotifications.register();
      }

      // Event handlers are defined outside
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  };
  
  // Add push notification event listeners
  useEffect(() => {
    if (!isCapacitorAvailable) return;
    
    // Add listeners for push events
    const registrationListener = PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token:', token.value);
      toast({
        title: 'Push Notifications Enabled',
        description: 'Successfully registered for push notifications'
      });
    });

    const errorListener = PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration:', error);
      toast({
        title: 'Registration Failed',
        description: 'Failed to register for push notifications',
        variant: 'destructive'
      });
    });

    const notificationListener = PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received:', notification);
      setNotificationsList(prev => [...prev, notification]);
      toast({
        title: notification.title || 'New notification',
        description: notification.body || 'You received a notification'
      });
    });

    const actionListener = PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('Push notification action performed:', action);
    });
    
    // Cleanup listeners when component unmounts
    return () => {
      registrationListener.remove();
      errorListener.remove();
      notificationListener.remove();
      actionListener.remove();
    };
  }, [isCapacitorAvailable, toast]);

  // Request notifications permission using Firebase (for web)
  const handleRequestPermission = async () => {
    if (!firebaseUser) {
      toast({
        title: 'Not Logged In',
        description: 'Please log in to enable notifications',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        
        if (permission === 'granted') {
          const token = await requestNotifications();
          toast({
            title: 'Notifications Enabled',
            description: 'You will now receive gold rate alerts'
          });
        } else {
          toast({
            title: 'Notifications Blocked',
            description: 'Please enable notifications in your browser settings',
            variant: 'destructive'
          });
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: 'Error',
        description: 'Failed to enable notifications',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gold Rate Alerts</CardTitle>
        <CardDescription>
          Enable push notifications to stay updated with gold rate changes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!firebaseUser ? (
            <p className="text-sm text-muted-foreground">
              Please log in to enable rate alerts
            </p>
          ) : notificationPermission === 'granted' || fcmToken ? (
            <div className="space-y-2">
              <p className="text-sm text-green-600 dark:text-green-400">
                ✓ Notifications are enabled
              </p>
              {fcmToken && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Your device token:</p>
                  <p className="text-xs font-mono bg-muted p-2 rounded-md break-all">
                    {fcmToken.substring(0, 20)}...{fcmToken.substring(fcmToken.length - 20)}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <Button 
              onClick={handleRequestPermission}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Enabling...' : 'Enable Rate Alerts'}
            </Button>
          )}
          
          {isCapacitorAvailable && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Recent Notifications</p>
              {notificationsList.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              ) : (
                <ul className="space-y-2">
                  {notificationsList.map((notification, index) => (
                    <li key={index} className="text-sm bg-muted p-2 rounded-md">
                      <p className="font-medium">{notification.title}</p>
                      <p>{notification.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          {isCapacitorAvailable 
            ? 'Running in mobile app mode with native notifications'
            : 'Running in web mode with browser notifications'}
        </p>
      </CardFooter>
    </Card>
  );
};

export default PushNotificationSetup;