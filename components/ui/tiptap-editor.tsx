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
      StarterKit.configure({
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal pl-6',
          },
        },
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc pl-6',
          },
        },
        listItem: {
          HTMLAttributes: {
            class: 'mb-1',
          },
        },
      }),
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
      let html = editor.getHTML();

      // Format ordered lists to match the desired structure
      // This ensures that when an ordered list is created, it has the proper HTML structure
      // with <ol><li><p>content</p></li></ol> format
      if (html.includes('<ol>') || html.includes('<ol ')) {
        // Use regex to ensure each list item has proper <p> tags
        html = html.replace(/<li>(.*?)<\/li>/g, (match, content) => {
          // If content doesn't already have <p> tags, wrap it
          if (!content.trim().startsWith('<p>')) {
            return `<li><p>${content}</p></li>`;
          }
          return match;
        });
      }

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
    <div
      className={`border rounded-md ${className}`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50">
        <div className="flex items-center">
          <select
            className="text-sm border-0 bg-transparent focus:ring-0 py-1 px-2 rounded"
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation();
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
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor?.chain().focus().toggleBold().run();
          }}
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          className={`p-1 hover:bg-gray-200 rounded ${editor?.isActive('italic') ? 'bg-gray-200' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor?.chain().focus().toggleItalic().run();
          }}
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          className={`p-1 hover:bg-gray-200 rounded ${editor?.isActive('underline') ? 'bg-gray-200' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor?.chain().focus().toggleUnderline().run();
          }}
        >
          <UnderlineIcon className="h-4 w-4" />
        </button>
        <button
          className={`p-1 hover:bg-gray-200 rounded ${editor?.isActive('link') ? 'bg-gray-200' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (editor?.isActive('link')) {
              editor.chain().focus().unsetLink().run();
            } else {
              setShowLinkInput(true);
            }
          }}
        >
          <LinkIcon className="h-4 w-4" />
        </button>
        <div className="h-4 w-px bg-gray-300 mx-1"></div>
        <button
          className={`p-1 hover:bg-gray-200 rounded ${editor?.isActive('bulletList') ? 'bg-gray-200' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor?.chain().focus().toggleBulletList().run();
          }}
        >
          <List className="h-4 w-4" />
        </button>
        <button
          className={`p-1 hover:bg-gray-200 rounded ${editor?.isActive('orderedList') ? 'bg-gray-200' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor?.chain().focus().toggleOrderedList().run();

            // After toggling the ordered list, ensure proper formatting
            if (editor?.isActive('orderedList')) {
              // If we just activated an ordered list, make sure it has proper structure
              const html = editor.getHTML();
              console.log('Ordered list activated, current HTML:', html);
            }
          }}
          title="Daftar Bernomor"
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        {showLinkInput && (
          <div className="flex items-center ml-2" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              placeholder="https://example.com"
              className="text-sm border rounded px-2 py-1 w-40"
              value={linkUrl}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                setLinkUrl(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                  addLink();
                }
              }}
            />
            <Button
              size="sm"
              className="ml-1"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addLink();
              }}
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="ml-1"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowLinkInput(false);
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <EditorContent editor={editor} className="min-h-[200px]" />
      </div>

      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="flex bg-white shadow rounded border">
            <button
              className={`p-1 hover:bg-gray-100 ${editor.isActive('bold') ? 'bg-gray-100' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                editor.chain().focus().toggleBold().run();
              }}
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              className={`p-1 hover:bg-gray-100 ${editor.isActive('italic') ? 'bg-gray-100' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                editor.chain().focus().toggleItalic().run();
              }}
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              className={`p-1 hover:bg-gray-100 ${editor.isActive('underline') ? 'bg-gray-100' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                editor.chain().focus().toggleUnderline().run();
              }}
            >
              <UnderlineIcon className="h-4 w-4" />
            </button>
            <button
              className={`p-1 hover:bg-gray-100 ${editor.isActive('link') ? 'bg-gray-100' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (editor.isActive('link')) {
                  editor.chain().focus().unsetLink().run();
                } else {
                  const url = window.prompt('URL');
                  if (url) {
                    editor.chain().focus().setLink({ href: url }).run();
                  }
                }
              }}
            >
              <LinkIcon className="h-4 w-4" />
            </button>
            <button
              className={`p-1 hover:bg-gray-100 ${editor.isActive('bulletList') ? 'bg-gray-100' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                editor.chain().focus().toggleBulletList().run();
              }}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              className={`p-1 hover:bg-gray-100 ${editor.isActive('orderedList') ? 'bg-gray-100' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                editor.chain().focus().toggleOrderedList().run();
              }}
            >
              <ListOrdered className="h-4 w-4" />
            </button>
          </div>
        </BubbleMenu>
      )}
    </div>
  )
}

export function TipTapContent({ content }: { content: string }) {
  // Log the content for debugging
  console.log('[TipTapContent] Received content:', content);

  // Check if content is empty, null, undefined, or just HTML tags with no text
  const isEmpty = !content || content.trim() === '' || content.replace(/<[^>]*>/g, '').trim() === '';

  if (isEmpty) {
    console.log('[TipTapContent] Content is empty');
    return (
      <div className="border rounded-md p-4 min-h-[100px] flex items-center justify-center text-gray-400">
        Belum ada deskripsi untuk berita ini
      </div>
    )
  }

  // Process content to ensure proper formatting
  let processedContent = content;

  // Handle plain text content (no HTML tags)
  if (!processedContent.includes('<')) {
    console.log('[TipTapContent] Content appears to be plain text, wrapping in paragraphs');
    // Split by newlines and wrap each paragraph
    processedContent = processedContent
      .split('\n')
      .map(para => para.trim())
      .filter(para => para.length > 0)
      .map(para => `<p>${para}</p>`)
      .join('');

    // If still empty after processing, add a single paragraph
    if (!processedContent) {
      processedContent = `<p>${content}</p>`;
    }
  }
  // Ensure ordered lists have the proper structure with <p> tags inside <li> elements
  else if (processedContent.includes('<ol>') || processedContent.includes('<ol ')) {
    console.log('[TipTapContent] Processing ordered lists');
    // Use regex to ensure each list item has proper <p> tags
    processedContent = processedContent.replace(/<li>(.*?)<\/li>/g, (match, content) => {
      // If content doesn't already have <p> tags, wrap it
      if (!content.trim().startsWith('<p>')) {
        return `<li><p>${content}</p></li>`;
      }
      return match;
    });
  }
  // Ensure content has proper paragraph tags if it doesn't have any block elements
  else if (!processedContent.includes('<p>') &&
           !processedContent.includes('<div>') &&
           !processedContent.includes('<ul>') &&
           !processedContent.includes('<ol>') &&
           !processedContent.includes('<h1>') &&
           !processedContent.includes('<h2>') &&
           !processedContent.includes('<h3>')) {
    console.log('[TipTapContent] No block elements found, wrapping content in paragraph');
    processedContent = `<p>${processedContent}</p>`;
  }

  console.log('[TipTapContent] Processed content:', processedContent);

  // Use a simpler structure without border to match the news card style
  return (
    <div className="prose prose-sm sm:prose-base max-w-none">
      <div
        dangerouslySetInnerHTML={{ __html: processedContent }}
        className="prose-content"
        style={{ display: 'block', visibility: 'visible' }}
      />
    </div>
  )
}
