"use client"

import { useState, useMemo } from "react"
import { useEventFeedback, useFeedbackMutations } from "@/hooks/useFeedback"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/utils"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Loader2, Trash2, User } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { FeedbackForm } from "./feedback-form"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useMembers } from "@/hooks/useMembers"
// Badge styling is now handled via CSS classes

interface FeedbackListProps {
  eventId: number | string
  isAdmin?: boolean
}

export function FeedbackList({ eventId, isAdmin = false }: FeedbackListProps) {
  // Validate eventId to prevent API calls with undefined
  const validEventId = eventId ? eventId : null

  // Only fetch feedback if we have a valid event ID
  const { data: feedbackList, isLoading, refetch } = useEventFeedback(validEventId)
  const { deleteFeedback } = useFeedbackMutations(validEventId)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const { isAuthenticated } = useAuth()

  // Fetch all members to get their names
  const { data: membersData, isLoading: isMembersLoading } = useMembers()

  // Create a map of member IDs to names for quick lookup
  const memberNames = useMemo(() => {
    const nameMap: Record<number, string> = {};

    if (membersData) {
      Object.values(membersData).forEach(members => {
        members.forEach(member => {
          if (member.id) {
            nameMap[member.id] = member.full_name || `Anggota ${member.id}`;
          }
        });
      });
    }

    return nameMap;
  }, [membersData]);

  // Handle feedback deletion
  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      await deleteFeedback.mutateAsync(id)
    } catch (error) {
      console.error("Error deleting feedback:", error)
    } finally {
      setDeletingId(null)
    }
  }

  // Loading state
  if (isLoading || isMembersLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">
          Feedback
          {feedbackList && feedbackList.length > 0 && (
            <button
              className="text-white font-medium py-1 px-3 rounded ml-2"
              style={{
                backgroundColor: "#4b5563",
                border: "none",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
              }}
            >
              {feedbackList.length}
            </button>
          )}
        </h3>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {isAuthenticated && (
        <Accordion type="single" collapsible className="mb-6">
          <AccordionItem value="feedback-form">
            <AccordionTrigger>Berikan Feedback</AccordionTrigger>
            <AccordionContent>
              <FeedbackForm eventId={eventId} onSuccess={() => refetch()} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {feedbackList && feedbackList.length > 0 ? (
        <div className="space-y-4">
          {feedbackList.map((feedback) => (
            <Card key={feedback.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm text-muted-foreground flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {feedback.full_name || memberNames[feedback.member_id] || `Anggota ${feedback.member_id}`}
                    </CardTitle>
                    <CardDescription>
                      {formatDate(feedback.created_at)}
                    </CardDescription>
                  </div>
                  {isAdmin && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          {deletingId === feedback.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Feedback</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus feedback ini? Tindakan ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(feedback.id)}>
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{feedback.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              Belum ada feedback untuk acara ini.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            {!isAuthenticated ? (
              <p className="text-sm text-muted-foreground">
                Silakan login untuk memberikan feedback.
              </p>
            ) : null}
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
