"use client"

import { useState } from "react"
import { SafeIcon } from "@/components/ui/safe-icon"
import { Bell } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  title: string
  description: string
  timestamp: Date
  read: boolean
  type: "info" | "success" | "warning" | "error"
}

// No mock data - use empty array for notifications

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    const baseClasses = "h-2 w-2 rounded-full"
    switch (type) {
      case "info":
        return <div className={cn(baseClasses, "bg-blue-500")} />
      case "success":
        return <div className={cn(baseClasses, "bg-green-500")} />
      case "warning":
        return <div className={cn(baseClasses, "bg-yellow-500")} />
      case "error":
        return <div className={cn(baseClasses, "bg-red-500")} />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <SafeIcon><Bell className="h-5 w-5" /></SafeIcon>
          {unreadCount > 0 && (
            <Badge
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" className="h-auto p-0 text-sm text-muted-foreground" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn("flex flex-col gap-1 p-4", !notification.read && "bg-muted/50")}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-center gap-2">
                  {getNotificationIcon(notification.type)}
                  <span className="font-medium">{notification.title}</span>
                </div>
                <p className="text-sm text-muted-foreground">{notification.description}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                </p>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground">No notifications</div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

