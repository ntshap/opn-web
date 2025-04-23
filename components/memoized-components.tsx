"use client"

import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MemberCard } from '@/components/members/member-card'
import { NewsCard } from '@/app/dashboard/news/components/news-card'
import { StatCard } from '@/components/dashboard/stat-card'
import { Member } from '@/lib/api-service' // Updated path

// Memoized Card components
export const MemoizedCard = memo(Card)
export const MemoizedCardContent = memo(CardContent)
export const MemoizedCardHeader = memo(CardHeader)
export const MemoizedCardTitle = memo(CardTitle)
export const MemoizedCardDescription = memo(CardDescription)
export const MemoizedCardFooter = memo(CardFooter)

// Memoized Button
export const MemoizedButton = memo(Button)

// Memoized Skeleton
export const MemoizedSkeleton = memo(Skeleton)

// Memoized MemberCard
export const MemoizedMemberCard = memo(MemberCard)

// Memoized NewsCard
export const MemoizedNewsCard = memo(NewsCard)

// Memoized StatCard
export const MemoizedStatCard = memo(StatCard)

// Memoized LoadingCard
export const MemoizedLoadingCard = memo(function LoadingCard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-24" />
      </CardFooter>
    </Card>
  )
})

// Memoized EmptyState
export const MemoizedEmptyState = memo(function EmptyState({ 
  icon: Icon, 
  message, 
  actionLabel, 
  onAction 
}: { 
  icon: React.ElementType, 
  message: string, 
  actionLabel?: string, 
  onAction?: () => void 
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <Icon className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">{message}</p>
        {actionLabel && onAction && (
          <Button onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  )
})

// Memoized MembersList
export const MemoizedMembersList = memo(function MembersList({
  members,
  onEdit,
  onDelete
}: {
  members: Member[]
  onEdit: (member: Member) => void
  onDelete: (member: Member) => void
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {members.map((member) => (
        <MemoizedMemberCard
          key={member.id}
          member={member}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
})
