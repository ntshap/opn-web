'use client'

import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { useState, useEffect } from 'react'
import { Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, List, ListOrdered } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SafeIcon } from './safe-icon'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ value, onChange, placeholder = 'Tulis di sini...', className }: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: cn(
          'min-h-[150px] max-h-[300px] overflow-y-auto w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Ensure we're only rendering on the client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Update editor content when value changes externally
  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value)
    }
  }, [editor, value])

  if (!isMounted) {
    return (
      <div
        className={cn(
          'min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
      >
        {placeholder}
      </div>
    )
  }

  return (
    <div className="relative">
      {editor && (
        <div className="flex items-center gap-1 mb-2 p-1 bg-muted rounded-md">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              'p-1 rounded hover:bg-background/80',
              editor.isActive('bold') ? 'bg-background/80 text-foreground' : 'text-muted-foreground'
            )}
            title="Bold"
          >
            <SafeIcon>
              <Bold className="h-4 w-4" />
            </SafeIcon>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              'p-1 rounded hover:bg-background/80',
              editor.isActive('italic') ? 'bg-background/80 text-foreground' : 'text-muted-foreground'
            )}
            title="Italic"
          >
            <SafeIcon>
              <Italic className="h-4 w-4" />
            </SafeIcon>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn(
              'p-1 rounded hover:bg-background/80',
              editor.isActive('underline') ? 'bg-background/80 text-foreground' : 'text-muted-foreground'
            )}
            title="Underline"
          >
            <SafeIcon>
              <UnderlineIcon className="h-4 w-4" />
            </SafeIcon>
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={cn(
              'p-1 rounded hover:bg-background/80',
              editor.isActive({ textAlign: 'left' }) ? 'bg-background/80 text-foreground' : 'text-muted-foreground'
            )}
            title="Align Left"
          >
            <SafeIcon>
              <AlignLeft className="h-4 w-4" />
            </SafeIcon>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={cn(
              'p-1 rounded hover:bg-background/80',
              editor.isActive({ textAlign: 'center' }) ? 'bg-background/80 text-foreground' : 'text-muted-foreground'
            )}
            title="Align Center"
          >
            <SafeIcon>
              <AlignCenter className="h-4 w-4" />
            </SafeIcon>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={cn(
              'p-1 rounded hover:bg-background/80',
              editor.isActive({ textAlign: 'right' }) ? 'bg-background/80 text-foreground' : 'text-muted-foreground'
            )}
            title="Align Right"
          >
            <SafeIcon>
              <AlignRight className="h-4 w-4" />
            </SafeIcon>
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              'p-1 rounded hover:bg-background/80',
              editor.isActive('bulletList') ? 'bg-background/80 text-foreground' : 'text-muted-foreground'
            )}
            title="Bullet List"
          >
            <SafeIcon>
              <List className="h-4 w-4" />
            </SafeIcon>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              'p-1 rounded hover:bg-background/80',
              editor.isActive('orderedList') ? 'bg-background/80 text-foreground' : 'text-muted-foreground'
            )}
            title="Ordered List"
          >
            <SafeIcon>
              <ListOrdered className="h-4 w-4" />
            </SafeIcon>
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  )
}
