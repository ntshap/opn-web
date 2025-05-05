/**
 * Utility functions for handling attendance data
 */

/**
 * Validates and cleans attendance data from localStorage
 * @param data The data to validate
 * @returns Cleaned and validated attendance data array
 */
export function validateAttendanceData(data: any): Array<{ member_id: number; status: string; notes: string }> {
  // If data is null or undefined, return empty array
  if (!data) return [];
  
  // If data is already an array, filter out invalid entries
  if (Array.isArray(data)) {
    return data.filter(item => 
      item && 
      typeof item === 'object' && 
      typeof item.member_id !== 'undefined' &&
      typeof item.status === 'string'
    ).map(item => ({
      member_id: typeof item.member_id === 'string' ? parseInt(item.member_id, 10) : item.member_id,
      status: ["Hadir", "Izin", "Alfa"].includes(item.status) ? item.status : "Hadir",
      notes: item.notes || ""
    }));
  }
  
  // If data is an object but not an array, try to convert it to an array with a single item
  if (typeof data === 'object') {
    if (typeof data.member_id !== 'undefined' && typeof data.status === 'string') {
      return [{
        member_id: typeof data.member_id === 'string' ? parseInt(data.member_id, 10) : data.member_id,
        status: ["Hadir", "Izin", "Alfa"].includes(data.status) ? data.status : "Hadir",
        notes: data.notes || ""
      }];
    }
  }
  
  // If we can't convert it to a valid array, return empty array
  return [];
}

/**
 * Safely gets attendance data from localStorage
 * @param eventId The event ID
 * @returns Validated attendance data array
 */
export function getSavedAttendanceData(eventId: number | string): Array<{ member_id: number; status: string; notes: string }> {
  if (typeof window === 'undefined') return [];
  
  try {
    const savedAttendance = localStorage.getItem(`event_${eventId}_attendance`);
    if (!savedAttendance) return [];
    
    const parsedAttendance = JSON.parse(savedAttendance);
    return validateAttendanceData(parsedAttendance);
  } catch (error) {
    console.error(`[attendance-utils] Error getting attendance data for event ${eventId}:`, error);
    // If there's an error, remove the problematic data from localStorage
    localStorage.removeItem(`event_${eventId}_attendance`);
    return [];
  }
}

/**
 * Safely saves attendance data to localStorage
 * @param eventId The event ID
 * @param data The attendance data to save
 * @returns true if successful, false otherwise
 */
export function saveAttendanceData(
  eventId: number | string, 
  data: Array<{ member_id: number; status: string; notes: string }>
): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    // Validate the data before saving
    const validData = validateAttendanceData(data);
    
    if (validData.length === 0) {
      console.error(`[attendance-utils] No valid attendance data to save for event ${eventId}`);
      return false;
    }
    
    // Save to localStorage
    localStorage.setItem(`event_${eventId}_attendance`, JSON.stringify(validData));
    console.log(`[attendance-utils] Saved ${validData.length} attendance records for event ${eventId}`);
    return true;
  } catch (error) {
    console.error(`[attendance-utils] Error saving attendance data for event ${eventId}:`, error);
    return false;
  }
}

/**
 * Updates existing attendance data in localStorage
 * @param eventId The event ID
 * @param newData The new attendance data to merge with existing data
 * @returns true if successful, false otherwise
 */
export function updateAttendanceData(
  eventId: number | string,
  newData: Array<{ member_id: number; status: string; notes: string }>
): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    // Get existing data
    const existingData = getSavedAttendanceData(eventId);
    
    // Validate the new data
    const validNewData = validateAttendanceData(newData);
    
    if (validNewData.length === 0) {
      console.error(`[attendance-utils] No valid new attendance data to update for event ${eventId}`);
      return false;
    }
    
    // Create a map of existing data for quick lookup
    const dataMap = new Map();
    existingData.forEach(item => {
      dataMap.set(item.member_id, item);
    });
    
    // Update or add new data
    validNewData.forEach(item => {
      dataMap.set(item.member_id, item);
    });
    
    // Convert map back to array
    const updatedData = Array.from(dataMap.values());
    
    // Save updated data
    return saveAttendanceData(eventId, updatedData);
  } catch (error) {
    console.error(`[attendance-utils] Error updating attendance data for event ${eventId}:`, error);
    return false;
  }
}
