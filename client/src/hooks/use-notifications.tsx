import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, createContext, useContext, ReactNode, useEffect } from "react";
import { getQueryFn, queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Bell, BellRing } from "lucide-react";

// Notification types
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  read: number;
  userId: number;
  createdAt: string;
}

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  isLoading: boolean;
  error: Error | null;
};

export const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth() || {};
  const { toast } = useToast();
  
  // Fetch notifications for the logged-in user
  const {
    data: notifications = [] as Notification[],
    isLoading,
    error,
    refetch
  } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: getQueryFn<Notification[]>({ on401: "returnNull" }),
    enabled: !!user,
  });

  // Calculate unread notifications count
  const unreadCount = (notifications as Notification[]).filter((n: Notification) => n.read === 0).length;
  
  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/notifications/${id}/read`, {});
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to mark notification as read: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mark a notification as read
  const markAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  // Provide the notification context
  return (
    <NotificationContext.Provider
      value={{
        notifications: notifications as Notification[],
        unreadCount,
        markAsRead,
        isLoading,
        error: error as Error | null,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}

// UI Component for notification icon/bell
export function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button
        className="relative p-2 rounded-full hover:bg-amber-100 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`${unreadCount} unread notifications`}
      >
        {unreadCount > 0 ? (
          <>
            <BellRing className="h-6 w-6 text-amber-600" />
            <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          </>
        ) : (
          <Bell className="h-6 w-6 text-gray-600" />
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 max-h-96 overflow-auto">
          <div className="p-3 border-b">
            <h3 className="text-lg font-semibold">Notifications</h3>
          </div>
          
          <div className="divide-y">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-3 cursor-pointer hover:bg-gray-50 ${notification.read === 0 ? 'bg-amber-50' : ''}`}
                  onClick={() => {
                    if (notification.read === 0) {
                      markAsRead(notification.id);
                    }
                  }}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-gray-900">
                      {notification.title}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}