// WebSocket client for real-time updates

type MessageHandler = (data: any) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectTimeout: number = 2000; // Start with 2 seconds
  private maxReconnectTimeout: number = 30000; // Max 30 seconds
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting: boolean = false;

  constructor() {
    // Determine the WebSocket URL based on the current location
    // Use a specific path to avoid conflicts with Vite's HMR WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.url = `${protocol}//${window.location.host}/ws`;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) return;
    this.isConnecting = true;

    console.log(`[websocket] Connecting to ${this.url}`);
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('[websocket] Connected');
      this.reconnectTimeout = 2000; // Reset reconnect timeout on successful connection
      this.isConnecting = false;
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log(`[websocket] Received: ${message.event}`, message.data);
        
        // Dispatch to all handlers for this event
        const eventHandlers = this.handlers.get(message.event);
        if (eventHandlers) {
          eventHandlers.forEach(handler => handler(message.data));
        }
      } catch (error) {
        console.error('[websocket] Error parsing message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('[websocket] Connection closed');
      this.ws = null;
      this.isConnecting = false;

      // Schedule reconnect
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => {
        console.log(`[websocket] Attempting to reconnect in ${this.reconnectTimeout / 1000}s...`);
        this.connect();
        // Exponential backoff with max limit
        this.reconnectTimeout = Math.min(this.reconnectTimeout * 1.5, this.maxReconnectTimeout);
      }, this.reconnectTimeout);
    };

    this.ws.onerror = (error) => {
      console.error('[websocket] Error:', error);
    };
  }

  subscribe(event: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }

    const eventHandlers = this.handlers.get(event)!;
    eventHandlers.add(handler);

    // Make sure we're connected
    this.connect();

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.handlers.delete(event);
        }
      }
    };
  }

  // Close connection (useful when component unmounts)
  close() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Create singleton instance
export const wsClient = new WebSocketClient();

// Export event names as constants
export const WS_EVENTS = {
  RATE_UPDATED: 'RATE_UPDATED'
};