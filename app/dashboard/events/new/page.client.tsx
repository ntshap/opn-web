"use client"

import { EventForm } from "@/components/events/event-form"

export default function NewEventPageClient() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Create New Event</h1>
      </div>

      <EventForm />
    </div>
  )
}
