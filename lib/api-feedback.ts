/**
 * Feedback API Service
 * Handles all feedback-related API calls
 */
import axios from 'axios';
import { apiClient } from './api-client';
import { withRetry } from './api-utils';

// Feedback types
export interface Feedback {
  id: number;
  content: string;
  member_id: number;
  event_id: number;
  created_at: string;
  full_name?: string; // Add full_name field from backend response
}

export interface FeedbackFormData {
  content: string;
}

// Feedback API service
export const feedbackApi = {
  // Get all feedback for an event
  getEventFeedback: async (eventId: number | string | null, signal?: AbortSignal): Promise<Feedback[]> => {
    try {
      // If eventId is null or undefined, return empty array
      if (!eventId) {
        console.log('[API] No event ID provided for feedback. Returning empty array.');
        return [];
      }

      console.log(`[API] Fetching feedback for event ID: ${eventId}`);

      // Make sure the ID is properly formatted
      const id = String(eventId).trim();

      // Use withRetry to handle network issues
      const response = await withRetry(() =>
        apiClient.get<Feedback[]>(`/feedback/event/${id}/feedback`, {
          signal,
          // Add additional headers for debugging
          headers: {
            'X-Request-ID': `event-feedback-${id}-${Date.now()}`,
          }
        })
      );

      console.log(`[API] Successfully fetched ${response.data.length} feedback items for event ${id}`);
      return response.data;
    } catch (error) {
      // Handle canceled requests gracefully
      if (axios.isCancel(error)) {
        console.log('[API] Event feedback request was cancelled');
        return [];
      }

      // Log detailed error information
      console.error('[API] Error fetching event feedback:', {
        eventId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Return empty array for all errors to prevent UI from breaking
      return [];
    }
  },

  // Get a single feedback by ID
  getFeedback: async (feedbackId: number | string, signal?: AbortSignal): Promise<Feedback | null> => {
    try {
      console.log(`[API] Fetching feedback with ID: ${feedbackId}`);

      // Make sure the ID is properly formatted
      const id = String(feedbackId).trim();

      // Use withRetry to handle network issues
      const response = await withRetry(() =>
        apiClient.get<Feedback>(`/feedback/feedback/${id}`, {
          signal,
          // Add additional headers for debugging
          headers: {
            'X-Request-ID': `feedback-${id}-${Date.now()}`,
          }
        })
      );

      console.log(`[API] Successfully fetched feedback with ID ${id}`);
      return response.data;
    } catch (error) {
      // Handle canceled requests gracefully
      if (axios.isCancel(error)) {
        console.log('[API] Feedback request was cancelled');
        return null;
      }

      // Log detailed error information
      console.error('[API] Error fetching feedback:', {
        feedbackId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Return null for all errors to prevent UI from breaking
      return null;
    }
  },

  // Create feedback for an event
  createFeedback: async (eventId: number | string | null, data: FeedbackFormData): Promise<Feedback | null> => {
    try {
      // If eventId is null or undefined, throw an error
      if (!eventId) {
        throw new Error('Cannot create feedback: No event ID provided');
      }

      console.log(`[API] Creating feedback for event ID: ${eventId}`);

      // Make sure the ID is properly formatted
      const id = String(eventId).trim();

      // Use withRetry to handle network issues
      const response = await withRetry(() =>
        apiClient.post<Feedback>(`/feedback/event/${id}/feedback`, data)
      );

      console.log(`[API] Successfully created feedback for event ${id}`);
      return response.data;
    } catch (error) {
      // Log detailed error information
      console.error('[API] Error creating feedback:', {
        eventId,
        data,
        error: error instanceof Error ? error.message : String(error),
      });

      // Rethrow the error to be handled by the component
      throw error;
    }
  },

  // Update feedback
  updateFeedback: async (feedbackId: number | string, data: FeedbackFormData): Promise<Feedback | null> => {
    try {
      console.log(`[API] Updating feedback with ID: ${feedbackId}`);

      // Make sure the ID is properly formatted
      const id = String(feedbackId).trim();

      // Use withRetry to handle network issues
      const response = await withRetry(() =>
        apiClient.put<Feedback>(`/feedback/feedback/${id}`, data)
      );

      console.log(`[API] Successfully updated feedback with ID ${id}`);
      return response.data;
    } catch (error) {
      // Log detailed error information
      console.error('[API] Error updating feedback:', {
        feedbackId,
        data,
        error: error instanceof Error ? error.message : String(error),
      });

      // Rethrow the error to be handled by the component
      throw error;
    }
  },

  // Delete feedback
  deleteFeedback: async (feedbackId: number | string): Promise<void> => {
    try {
      console.log(`[API] Deleting feedback with ID: ${feedbackId}`);

      // Make sure the ID is properly formatted
      const id = String(feedbackId).trim();

      // Use withRetry to handle network issues
      await withRetry(() =>
        apiClient.delete(`/feedback/feedback/${id}`)
      );

      console.log(`[API] Successfully deleted feedback with ID ${id}`);
    } catch (error) {
      // Log detailed error information
      console.error('[API] Error deleting feedback:', {
        feedbackId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Rethrow the error to be handled by the component
      throw error;
    }
  },
};
