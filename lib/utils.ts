import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { id } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as Rupiah currency
 * @param amount - The amount to format (can be string or number)
 * @param options - Formatting options
 * @returns Formatted Rupiah string
 */
export function formatRupiah(
  amount: string | number,
  options: {
    minimumFractionDigits?: number
    maximumFractionDigits?: number
    compact?: boolean
  } = {}
) {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
    compact = false,
  } = options

  // Handle empty or invalid values
  if (amount === null || amount === undefined || amount === '') {
    return 'Rp0'
  }

  // Format the amount

  // Convert to number, handling potential parsing errors
  let numericAmount = 0
  try {
    numericAmount = typeof amount === "string" ? Number(amount) : amount
    // Check if the result is a valid number
    if (isNaN(numericAmount)) {
      numericAmount = 0
    }
  } catch (error) {
    numericAmount = 0
  }

  // Use Intl.NumberFormat for proper localization
  const formatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits,
    maximumFractionDigits,
    notation: compact ? "compact" : "standard",
    compactDisplay: "short",
  })

  // Format the amount and remove any spaces between currency symbol and amount
  // Also ensure the Rp symbol is properly displayed
  return formatter.format(numericAmount)
    .replace(/\s+/g, "") // Remove spaces
    .replace(/\u00A0/g, "") // Remove non-breaking spaces
}

/**
 * Format a date to a localized string using date-fns
 * @param date - Date to format
 * @param formatStr - Optional format string
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, formatStr = "PPP") {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return format(dateObj, formatStr, { locale: id })
}

/**
 * Check if there are unsaved form changes
 * @param formData - Current form data
 * @param initialData - Initial form data
 * @returns boolean indicating if there are unsaved changes
 */
export function hasUnsavedChanges(formData: any, initialData: any): boolean {
  return JSON.stringify(formData) !== JSON.stringify(initialData)
}

/**
 * Generate a storage key with a prefix
 * @param prefix - Key prefix
 * @param identifier - Unique identifier
 * @returns Storage key string
 */
export function generateStorageKey(prefix: string, identifier: string | number): string {
  return `${prefix}_${identifier}`
}

// Constants for local storage keys
export const STORAGE_KEYS = {
  MEETING_MINUTES_DRAFT: 'meeting_minutes_draft',
  LAST_EDIT_TIME: 'last_edit_time',
} as const
