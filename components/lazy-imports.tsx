"use client"

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy loading untuk komponen form yang besar
export const LazyMemberForm = dynamic(
  () => import('@/components/members/member-form').then(mod => ({ default: mod.MemberForm })),
  {
    loading: () => (
      <div className="space-y-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    )
  }
)

// Lazy loading untuk komponen form berita
export const LazyNewsForm = dynamic(
  () => import('@/app/dashboard/news/components/news-form').then(mod => ({ default: mod.NewsForm })),
  {
    loading: () => (
      <div className="space-y-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    )
  }
)

// Lazy loading untuk komponen form acara
export const LazyEventForm = dynamic(
  () => import('@/components/events/event-form').then(mod => ({ default: mod.EventForm })),
  {
    loading: () => (
      <div className="space-y-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    )
  }
)

// Lazy loading untuk komponen notulensi
export const LazyMeetingMinutesList = dynamic(
  () => import('@/components/events/meeting-minutes-list').then(mod => ({ default: mod.MeetingMinutesList })),
  {
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="border rounded-md p-4 space-y-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }
)
