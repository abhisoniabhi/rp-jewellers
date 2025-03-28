// Simple event system for real-time updates

type EventCallback = () => void;

class EventBus {
  private events: Map<string, EventCallback[]>;

  constructor() {
    this.events = new Map();
  }

  subscribe(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    const callbacks = this.events.get(event)!;
    callbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const callbackIndex = callbacks.indexOf(callback);
      if (callbackIndex !== -1) {
        callbacks.splice(callbackIndex, 1);
      }
    };
  }

  publish(event: string): void {
    if (!this.events.has(event)) return;

    const callbacks = this.events.get(event)!;
    callbacks.forEach(callback => callback());
  }
}

// Create a singleton instance
export const eventBus = new EventBus();

// Event names
export const EVENTS = {
  RATES_UPDATED: 'rates_updated'
};