"use client"

import { memo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Clock, ImageIcon, Trash2, Edit2, Eye, Upload } from "lucide-react"
import type { Event } from "@/lib/api-service" // Updated path
import { format, parseISO, isValid } from "date-fns"
import { SecureImage } from "@/components/shared/SecureImage"

interface EventCardProps {
  event: Event
  onView: (event: Event) => void
  onEdit: (event: Event) => void
  onDelete: (event: Event) => void
  onUpload: (event: Event) => void
}

function EventCardComponent({ event, onView, onEdit, onDelete, onUpload }: EventCardProps) {
  // Format date for display
  const formatEventDate = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      return isValid(date) ? format(date, "PPP") : "Invalid date"
    } catch (error) {
      return "Invalid date"
    }
  }

  // Format time for display
  const formatEventTime = (timeString: string) => {
    try {
      // Extract time portion from ISO string or use as is
      const timeValue = timeString.includes("T") ? timeString.split("T")[1].substring(0, 5) : timeString.substring(0, 5)

      return timeValue
    } catch (error) {
      return "Invalid time"
    }
  }

  const formattedDate = formatEventDate(event.date)
  const formattedTime = formatEventTime(event.time)

  // Get the first photo or use placeholder
  const coverPhoto = event.photos && event.photos.length > 0 ? event.photos[0].photo_url : null

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
      <div className="relative">
        {coverPhoto ? (
          <div className="w-full h-48">
            <SecureImage
              src={coverPhoto}
              alt={event.title}
              width="100%"
              height="100%"
              className="object-cover"
              fallbackSrc="/placeholder.svg"
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            />
          </div>
        ) : (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
        )}

        <div className="absolute top-3 right-3 flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="w-8 h-8 rounded-full bg-white/90 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation()
              onUpload(event)
            }}
            aria-label="Upload photos"
          >
            <Upload className="w-4 h-4" />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            className="w-8 h-8 rounded-full bg-white/90 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(event)
            }}
            aria-label="Edit event"
          >
            <Edit2 className="w-4 h-4" />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            className="w-8 h-8 rounded-full bg-white/90 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(event)
            }}
            aria-label="Delete event"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{event.title}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>

        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{formattedDate}</span>
          </div>

          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{formattedTime}</span>
          </div>

          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        </div>

        <Button variant="default" className="w-full mt-4" onClick={() => onView(event)}>
          <Eye className="w-4 h-4 mr-2" /> View Details
        </Button>
      </CardContent>
    </Card>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const EventCard = memo(EventCardComponent)
