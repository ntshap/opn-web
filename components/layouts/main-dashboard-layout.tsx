"use client"

import type React from "react"
import Image from "next/image"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  FileText,
  Settings,
  Bell,
  Search,
  Menu,
  LogOut,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export function MainDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const menuItems = [
    {
      icon: <LayoutDashboard className="w-5 h-5" />,
      label: "Dashboard",
      path: "/dashboard",
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: "Anggota",
      path: "/dashboard/members",
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      label: "Acara",
      path: "/dashboard/events",
    },
    {
      icon: <DollarSign className="w-5 h-5" />,
      label: "Keuangan",
      path: "/dashboard/finance",
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: "Berita",
      path: "/dashboard/news",
    },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar variant="inset" className="hidden md:block">
        <SidebarHeader className="flex h-14 items-center border-b px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
            <span className="text-primary">Org</span>
            <span>Manager</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton asChild isActive={pathname === item.path}>
                  <Link href={item.path} className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src="https://ui-avatars.com/api/?name=Admin+User" />
                <AvatarFallback>AU</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">Admin User</p>
                <p className="text-xs text-muted-foreground">admin@example.com</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] sm:w-[300px] p-0 max-w-[90vw]">
          <div className="flex h-14 items-center border-b px-4 sm:px-6">
            <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3 font-bold text-lg sm:text-xl" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white overflow-hidden">
                <Image
                  src="/images/opn-logo.png"
                  alt="OPN Logo"
                  width={24}
                  height={24}
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-primary">OPN</span>
            </Link>
          </div>
          <div className="py-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
            <nav className="flex flex-col gap-1 px-2">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors
                    ${pathname === item.path ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-auto border-t p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src="https://ui-avatars.com/api/?name=Admin+User" />
                  <AvatarFallback>AU</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">Admin User</p>
                  <p className="text-xs text-muted-foreground">admin@example.com</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600"
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.href = '/login?t=' + new Date().getTime();
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 sm:gap-4 border-b bg-background px-2 sm:px-6">
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>

          <SidebarTrigger className="hidden md:flex" />

          <div className="flex flex-1 items-center gap-2 sm:gap-4">
            <form className="hidden md:block flex-1 md:max-w-xs">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[300px]"
                />
              </div>
            </form>
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive"></span>
                <span className="sr-only">Notifications</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  // Clear all possible auth tokens
                  localStorage.removeItem('token');
                  localStorage.removeItem('auth_token');
                  localStorage.removeItem('refreshToken');
                  localStorage.removeItem('direct_token');
                  localStorage.removeItem('is_logged_in');
                  localStorage.removeItem('token_type');
                  localStorage.removeItem('login_time');

                  // Clear session storage too
                  sessionStorage.removeItem('token');
                  sessionStorage.removeItem('auth_token');
                  sessionStorage.removeItem('refreshToken');
                  sessionStorage.removeItem('direct_token');
                  sessionStorage.removeItem('is_logged_in');
                  sessionStorage.removeItem('token_type');
                  sessionStorage.removeItem('login_time');

                  // Clear cookies
                  document.cookie = "token=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT";
                  document.cookie = "auth_token=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT";
                  document.cookie = "refreshToken=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT";

                  // Force redirect to login page with cache busting parameter
                  window.location.href = '/login?t=' + new Date().getTime();
                }}
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Keluar</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
