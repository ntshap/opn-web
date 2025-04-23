"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useFeedbackMutations } from "@/hooks/useFeedback"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"

// Form schema for feedback
const formSchema = z.object({
  content: z.string().min(5, {
    message: "Feedback harus berisi minimal 5 karakter.",
  }).max(1000, {
    message: "Feedback tidak boleh lebih dari 1000 karakter.",
  }),
})

interface FeedbackFormProps {
  eventId: number | string
  onSuccess?: () => void
}

export function FeedbackForm({ eventId, onSuccess }: FeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { createFeedback } = useFeedbackMutations(eventId)
  const { isAuthenticated } = useAuth()

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    },
  })

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      await createFeedback.mutateAsync(values)
      form.reset() // Reset form after successful submission
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error submitting feedback:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="p-4 bg-muted rounded-md">
        <p className="text-sm text-muted-foreground">
          Silakan login untuk memberikan feedback.
        </p>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Feedback Anda</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Bagikan pendapat atau saran Anda tentang acara ini..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Feedback Anda sangat berharga untuk meningkatkan kualitas acara kami.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mengirim...
            </>
          ) : (
            "Kirim Feedback"
          )}
        </Button>
      </form>
    </Form>
  )
}
