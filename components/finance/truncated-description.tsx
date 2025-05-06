"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { TipTapContent } from "@/components/ui/tiptap-editor"
import { ChevronDown } from "lucide-react"

interface TruncatedDescriptionProps {
  description: string
  maxLength?: number
  isRichText?: boolean
  title?: string
}

export function TruncatedDescription({
  description,
  maxLength = 50,
  isRichText = false,
  title = "Deskripsi Lengkap"
}: TruncatedDescriptionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Function to strip HTML tags for plain text comparison
  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  }

  // For rich text, we need to check if the stripped content is longer than maxLength
  const plainText = isRichText ? stripHtml(description) : description;
  const isTruncated = plainText.length > maxLength;

  // Create truncated text version
  const truncatedText = isTruncated
    ? plainText.substring(0, maxLength) + '...'
    : plainText;

  // If it's not truncated, just display the content
  if (!isTruncated) {
    return isRichText ? (
      <div className="prose prose-sm max-w-none">
        <div dangerouslySetInnerHTML={{ __html: description }} />
      </div>
    ) : (
      <span>{description}</span>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="prose prose-sm max-w-none">
          {isRichText ? (
            <div dangerouslySetInnerHTML={{ __html: description.substring(0, 100) + '...' }} />
          ) : (
            <span>{truncatedText}</span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-fit mt-1 text-xs text-blue-600 hover:text-blue-800 border-blue-200 hover:bg-blue-50 hover:border-blue-300 px-3 py-1"
          onClick={() => setIsDialogOpen(true)}
        >
          <span>Selengkapnya</span>
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {isRichText ? (
              <TipTapContent content={description} />
            ) : (
              <p className="whitespace-pre-wrap">{description}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
