import React from 'react';
import { useAuth } from '../hooks/use-auth';
import PushNotificationSetup from '../components/notifications/push-notification-setup';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

const NotificationsPage: React.FC = () => {
  const { firebaseUser } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="container py-8 px-4 mx-auto max-w-4xl">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Manage your push notification preferences
          </p>
        </div>

        {!firebaseUser ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h2 className="text-lg font-medium mb-2">Login Required</h2>
              <p className="text-sm text-muted-foreground mb-4">
                You need to be logged in with Firebase to enable push notifications.
              </p>
              <Button onClick={() => setLocation('/firebase-login')}>
                Sign in with Firebase
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-muted rounded-lg">
              <h2 className="text-lg font-medium mb-2">Account Information</h2>
              <p className="text-sm mb-1">
                <span className="font-medium">User ID:</span> {firebaseUser.uid}
              </p>
              {firebaseUser.email && (
                <p className="text-sm mb-1">
                  <span className="font-medium">Email:</span> {firebaseUser.email}
                </p>
              )}
              {firebaseUser.phoneNumber && (
                <p className="text-sm mb-1">
                  <span className="font-medium">Phone:</span> {firebaseUser.phoneNumber}
                </p>
              )}
            </div>

            <PushNotificationSetup />

            <div className="space-y-2">
              <h2 className="text-lg font-medium">About Notifications</h2>
              <p className="text-sm text-muted-foreground">
                Push notifications will keep you informed about important gold and silver rate changes.
                Your notification preferences are linked to your account and will be synced across devices.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="text-md font-medium mb-1">Rate Alerts</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts when gold or silver rates change significantly
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="text-md font-medium mb-1">Order Updates</h3>
                  <p className="text-sm text-muted-foreground">
                    Get notified about your order status changes
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;