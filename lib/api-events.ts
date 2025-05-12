/**
 * Event API Service
 * Handles all event-related API calls
 */
import axios from 'axios';
import { apiClient } from './api-client';
import { withRetry } from './api-utils';
import { Event, EventAttendance, EventFormData, AttendanceFormData, EventPhoto } from '@/types';

// Event API service
export const eventApi = {
  // Get all events
  getEvents: async (params?: {
    skip?: number;
    limit?: number;
    status?: string;
    search?: string;
    signal?: AbortSignal;
  }) => {
    try {
      const { skip = 0, limit = 10, status, search, signal } = params || {};

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('skip', skip.toString());
      queryParams.append('limit', limit.toString());
      if (status) queryParams.append('status', status);
      if (search) queryParams.append('search', search);

      console.log(`[API] Fetching events with params:`, params);

      const response = await withRetry(() =>
        apiClient.get<Event[]>(`/events?${queryParams.toString()}`, { signal })
      );

      console.log(`[API] Successfully fetched ${response.data.length} events`);
      return response.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },

  // Get single event
  getEvent: async (id: number | string, signal?: AbortSignal): Promise<Event> => {
    try {
      console.log(`[API] Fetching event with ID: ${id}`);

      // Make sure the ID is properly formatted
      const eventId = String(id).trim();

      // Use withRetry to handle network issues
      const response = await withRetry(() =>
        apiClient.get<Event>(`/events/${eventId}`, {
          signal,
          // Add additional headers for debugging
          headers: {
            'X-Request-ID': `event-${eventId}-${Date.now()}`,
          }
        })
      );

      console.log(`[API] Successfully fetched event ${eventId}:`, response.data);
      return response.data;
    } catch (error) {
      // Handle canceled requests gracefully
      if (axios.isCancel(error)) {
        console.log('Event request was cancelled');
        // Instead of throwing an error, return a default event object
        // This prevents the UI from breaking when a request is cancelled
        return {
          id: Number(id),
          title: 'Loading...',
          description: 'Event data is being loaded',
          date: new Date().toISOString().split('T')[0],
          time: '00:00',
          location: 'Loading...',
          status: 'akan datang',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          photos: [],
          attendees: []
        };
      }

      // Log detailed error information
      console.error('Error fetching event:', {
        id,
        error: error instanceof Error ? error.message : String(error),
        status: axios.isAxiosError(error) ? error.response?.status : 'unknown',
        data: axios.isAxiosError(error) ? error.response?.data : null,
      });

      // For 404 errors, return a not found event object
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return {
          id: Number(id),
          title: 'Event Not Found',
          description: 'The requested event could not be found.',
          date: new Date().toISOString().split('T')[0],
          time: '00:00',
          location: 'Unknown',
          status: 'dibatalkan',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          photos: [],
          attendees: []
        };
      }

      throw error;
    }
  },

  // Get event photos
  getEventPhotos: async (eventId: number | string, signal?: AbortSignal): Promise<EventPhoto[]> => {
    try {
      console.log(`[API] Fetching photos for event ID: ${eventId}`);

      // Make sure the ID is properly formatted
      const id = String(eventId).trim();

      try {
        // Add a cache-busting parameter to ensure we get fresh data
        const cacheBuster = Date.now();

        // Get the event details which include photos
        console.log(`[API] Getting event details for ID: ${id} to extract photos (cache buster: ${cacheBuster})`);
        const eventResponse = await withRetry(() =>
          apiClient.get<Event>(`/events/${id}?_=${cacheBuster}`, {
            signal,
            headers: {
              'X-Request-ID': `event-details-${id}-${cacheBuster}`,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          })
        );

        // If the event has photos, return them
        if (eventResponse.data && eventResponse.data.photos && Array.isArray(eventResponse.data.photos)) {
          console.log(`[API] Found ${eventResponse.data.photos.length} photos in event ${id} details`);

          // Add a timestamp to each photo to help with debugging
          const photosWithTimestamp = eventResponse.data.photos.map(photo => ({
            ...photo,
            _fetchedAt: cacheBuster
          }));

          return photosWithTimestamp;
        } else {
          // If the event doesn't have photos, return an empty array
          console.log(`[API] No photos found in event ${id} details`);
          return [];
        }
      } catch (apiError) {
        // Handle specific API errors
        if (axios.isAxiosError(apiError)) {
          // For 404 errors, return an empty array - this is normal for events that don't exist
          if (apiError.response?.status === 404) {
            console.log(`[API] Event ${id} not found (404 response)`);
            return [];
          }

          // For other API errors, log and return empty array to prevent UI from breaking
          console.error(`[API] Error fetching event ${id} details:`, {
            status: apiError.response?.status,
            data: apiError.response?.data,
            message: apiError.message
          });
          return [];
        }

        // Rethrow non-Axios errors
        throw apiError;
      }
    } catch (error) {
      // Handle canceled requests gracefully
      if (axios.isCancel(error)) {
        console.log('[API] Event photos request was cancelled');
        return [];
      }

      // Log detailed error information
      console.error('[API] Error in getEventPhotos:', {
        eventId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Return empty array for all errors to prevent UI from breaking
      return [];
    }
  },

  // Delete an event photo
  deleteEventPhoto: async (eventId: number | string, photoId: number | string): Promise<boolean> => {
    try {
      console.log(`[API] Deleting photo ${photoId} from event ${eventId}`);

      // Make sure the IDs are properly formatted
      const formattedEventId = String(eventId).trim();
      const formattedPhotoId = String(photoId).trim();

      // Call the backend API to delete the photo
      const response = await withRetry(() =>
        apiClient.delete(`/uploads/events/photos/${formattedPhotoId}`, {
          headers: {
            'X-Request-ID': `delete-photo-${formattedEventId}-${formattedPhotoId}-${Date.now()}`,
          }
        })
      );

      console.log(`[API] Successfully deleted photo ${photoId} from event ${eventId}:`, response.data);
      return true;
    } catch (error) {
      // Log detailed error information
      console.error('[API] Error deleting event photo:', {
        eventId,
        photoId,
        error: error instanceof Error ? error.message : String(error),
        status: axios.isAxiosError(error) ? error.response?.status : 'unknown',
        data: axios.isAxiosError(error) ? error.response?.data : null,
      });

      // Rethrow the error
      throw error;
    }
  }
};
