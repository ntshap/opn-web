"use client"

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { Button, ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PrefetchLinkProps extends ButtonProps {
  href: string
  prefetch?: boolean
  onHover?: () => void
  onLeave?: () => void
}

export function PrefetchLink({
  href,
  prefetch = true,
  onHover,
  onLeave,
  children,
  className,
  ...props
}: PrefetchLinkProps) {
  const router = useRouter()
  const [isPrefetching, setIsPrefetching] = useState(false)

  const handleMouseEnter = useCallback(() => {
    if (prefetch && !isPrefetching) {
      setIsPrefetching(true)
      // Prefetch the page
      router.prefetch(href)
    }
    onHover?.()
  }, [prefetch, isPrefetching, router, href, onHover])

  const handleMouseLeave = useCallback(() => {
    onLeave?.()
  }, [onLeave])

  const handleClick = useCallback(() => {
    router.push(href)
  }, [router, href])

  return (
    <Button
      variant="ghost"
      className={cn('hover:bg-transparent hover:underline', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  )
}
