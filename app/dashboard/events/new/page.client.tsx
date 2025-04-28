"use client"

import { EventForm } from "@/components/events/event-form"

export default function NewEventPageClient() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Buat Acara Baru</h1>
      </div>

      <EventForm />
    </div>
  )
}
