"use client"

import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import { useState, useEffect } from 'react'
import { Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon, List, ListOrdered, Heading1, Heading2, Heading3, AlignLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TipTapEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
}

export function TipTapEditor({ content, onChange, placeholder, className = '' }: TipTapEditorProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline',
        },
      }),
      Underline,
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      console.log('Editor content updated:', html);
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl focus:outline-none min-h-[200px] p-4',
        placeholder: placeholder || 'Tulis notulensi rapat di sini...',
      },
    },
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      console.log('Setting editor content:', content || '');
      editor.commands.setContent(content || '')
    }
  }, [content, editor])

  if (!isMounted) {
    return null
  }

  const addLink = () => {
    if (linkUrl) {
      editor?.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
      setLinkUrl('')
      setShowLinkInput(false)
    }
  }

  return (
    <div className={`border rounded-md ${className}`}>
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50">
        <div className="flex items-center">
          <select
            className="text-sm border-0 bg-transparent focus:ring-0 py-1 px-2 rounded"
            onChange={(e) => {
              const value = e.target.value
              if (value === 'p') {
                editor?.chain().focus().setParagraph().run()
              } else if (value === 'h1') {
                editor?.chain().focus().toggleHeading({ level: 1 }).run()
              } else if (value === 'h2') {
                editor?.chain().focus().toggleHeading({ level: 2 }).run()
              } else if (value === 'h3') {
                editor?.chain().focus().toggleHeading({ level: 3 }).run()
              }
            }}
          >
            <option value="p">Normal</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>
        </div>
        <div className="h-4 w-px bg-gray-300 mx-1"></div>
        <button
          className={`p-1 hover:bg-gray-200 rounded ${editor?.isActive('bold') ? 'bg-gray-200' : ''}`}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          className={`p-1 hover:bg-gray-200 rounded ${editor?.isActive('italic') ? 'bg-gray-200' : ''}`}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          className={`p-1 hover:bg-gray-200 rounded ${editor?.isActive('underline') ? 'bg-gray-200' : ''}`}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </button>
        <button
          className={`p-1 hover:bg-gray-200 rounded ${editor?.isActive('link') ? 'bg-gray-200' : ''}`}
          onClick={() => {
            if (editor?.isActive('link')) {
              editor.chain().focus().unsetLink().run()
            } else {
              setShowLinkInput(true)
            }
          }}
        >
          <LinkIcon className="h-4 w-4" />
        </button>
        <div className="h-4 w-px bg-gray-300 mx-1"></div>
        <button
          className={`p-1 hover:bg-gray-200 rounded ${editor?.isActive('bulletList') ? 'bg-gray-200' : ''}`}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </button>
        <button
          className={`p-1 hover:bg-gray-200 rounded ${editor?.isActive('orderedList') ? 'bg-gray-200' : ''}`}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        {showLinkInput && (
          <div className="flex items-center ml-2">
            <input
              type="text"
              placeholder="https://example.com"
              className="text-sm border rounded px-2 py-1 w-40"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addLink()
                }
              }}
            />
            <Button
              size="sm"
              className="ml-1"
              onClick={addLink}
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="ml-1"
              onClick={() => setShowLinkInput(false)}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      <EditorContent editor={editor} className="min-h-[200px]" />

      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="flex bg-white shadow rounded border">
            <button
              className={`p-1 hover:bg-gray-100 ${editor.isActive('bold') ? 'bg-gray-100' : ''}`}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              className={`p-1 hover:bg-gray-100 ${editor.isActive('italic') ? 'bg-gray-100' : ''}`}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              className={`p-1 hover:bg-gray-100 ${editor.isActive('underline') ? 'bg-gray-100' : ''}`}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              <UnderlineIcon className="h-4 w-4" />
            </button>
            <button
              className={`p-1 hover:bg-gray-100 ${editor.isActive('link') ? 'bg-gray-100' : ''}`}
              onClick={() => {
                if (editor.isActive('link')) {
                  editor.chain().focus().unsetLink().run()
                } else {
                  const url = window.prompt('URL')
                  if (url) {
                    editor.chain().focus().setLink({ href: url }).run()
                  }
                }
              }}
            >
              <LinkIcon className="h-4 w-4" />
            </button>
          </div>
        </BubbleMenu>
      )}
    </div>
  )
}

export function TipTapContent({ content }: { content: string }) {
  // Check if content is empty, null, undefined, or just HTML tags with no text
  const isEmpty = !content || content.trim() === '' || content.replace(/<[^>]*>/g, '').trim() === '';

  if (isEmpty) {
    return (
      <div className="border rounded-md p-4 min-h-[100px] flex items-center justify-center text-gray-400">
        Belum ada notulensi untuk acara ini
      </div>
    )
  }

  return (
    <div className="border rounded-md p-4 min-h-[100px] prose max-w-none">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  )
}
