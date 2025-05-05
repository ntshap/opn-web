"use client"

/**
 * A simple event bus for cross-component communication
 * This is used to notify components about events without direct props passing
 */

type EventCallback = (...args: any[]) => void;

interface EventMap {
  [eventName: string]: EventCallback[];
}

class EventBus {
  private events: EventMap = {};

  /**
   * Subscribe to an event
   * @param eventName Name of the event to subscribe to
   * @param callback Function to call when the event is emitted
   * @returns Unsubscribe function
   */
  on(eventName: string, callback: EventCallback): () => void {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    
    this.events[eventName].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.events[eventName] = this.events[eventName].filter(
        (cb) => cb !== callback
      );
    };
  }

  /**
   * Emit an event
   * @param eventName Name of the event to emit
   * @param args Arguments to pass to the callbacks
   */
  emit(eventName: string, ...args: any[]): void {
    if (this.events[eventName]) {
      this.events[eventName].forEach((callback) => {
        callback(...args);
      });
    }
  }

  /**
   * Remove all event listeners
   */
  clear(): void {
    this.events = {};
  }
}

// Create a singleton instance
const eventBus = new EventBus();

// Event names constants
export const EVENTS = {
  PHOTO_UPLOADED: 'photo_uploaded',
  PHOTO_DELETED: 'photo_deleted',
  GALLERY_REFRESH: 'gallery_refresh',
};

export default eventBus;
