"use client"

import { useState } from "react"
import {
  Calendar,
  DollarSign,
  FileText,
  Users,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function DashboardPreview() {
  const [activeTab, setActiveTab] = useState("overview")

  // Sample data for the dashboard
  const events = [
    {
      id: 1,
      title: "Annual General Meeting",
      date: "2024-03-15",
      status: "selesai",
    },
    {
      id: 2,
      title: "Community Outreach Program",
      date: "2024-03-28",
      status: "akan datang",
    },
    {
      id: 3,
      title: "Leadership Workshop",
      date: "2024-04-05",
      status: "akan datang",
    },
  ]

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 flex h-full w-[250px] flex-col border-r border-slate-200 bg-white">
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white font-bold">
              OM
            </div>
            <span className="text-lg font-semibold text-slate-900">OrgManager</span>
          </div>
        </div>

        <nav className="flex flex-col gap-1 p-2">
          {[
            { icon: <Calendar className="w-5 h-5" />, label: "Dashboard" },
            { icon: <Users className="w-5 h-5" />, label: "Members" },
            { icon: <Calendar className="w-5 h-5" />, label: "Events" },
            { icon: <DollarSign className="w-5 h-5" />, label: "Finance" },
            { icon: <FileText className="w-5 h-5" />, label: "Reports" },
          ].map((item, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
                ${index === 0 ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100"}`}
            >
              <div className={index === 0 ? "text-blue-700" : "text-slate-500"}>{item.icon}</div>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        <div className="mt-auto border-t border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://ui-avatars.com/api/?name=Admin+User&background=c7d2fe&color=4f46e5" />
              <AvatarFallback>AU</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">Admin User</p>
              <p className="text-xs text-slate-500">admin@example.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-[250px] flex-1">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-6">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-full rounded-lg bg-slate-50 pl-8 focus-visible:bg-white"
              />
            </div>
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://ui-avatars.com/api/?name=Admin+User&background=c7d2fe&color=4f46e5" />
              <AvatarFallback>AU</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-medium tracking-tight text-slate-900">Dashboard</h1>
              <p className="text-slate-500">
                Welcome back, Admin. Here's what's happening with your organization today.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Total Members", value: "256", icon: Users, trend: "up", percentage: 12, color: "blue" },
                { title: "Total Events", value: "45", icon: Calendar, trend: "up", percentage: 8, color: "purple" },
                {
                  title: "Total Income",
                  value: "$15,000",
                  icon: DollarSign,
                  trend: "down",
                  percentage: 5,
                  color: "green",
                },
                { title: "Total Reports", value: "45", icon: FileText, trend: "up", percentage: 15, color: "amber" },
              ].map((stat, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">{stat.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-medium">{stat.value}</div>
                      <div
                        className={`rounded-full p-2 ${
                          stat.color === "blue"
                            ? "bg-blue-100 text-blue-600"
                            : stat.color === "purple"
                              ? "bg-purple-100 text-purple-600"
                              : stat.color === "green"
                                ? "bg-green-100 text-green-600"
                                : "bg-amber-100 text-amber-600"
                        }`}
                      >
                        <stat.icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>

                </Card>
              ))}
            </div>

            {/* Dashboard Tabs */}
            <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <div className="flex items-center justify-between">
                <TabsList className="grid w-[400px] grid-cols-2">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="events">Events</TabsTrigger>
                </TabsList>

                {activeTab === "events" && (
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Event
                  </Button>
                )}
              </div>

              <TabsContent value="overview" className="space-y-6">
                {/* Chart Placeholders */}
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold">Member Activity</CardTitle>
                      <CardDescription>Monthly active members over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] bg-slate-100 rounded-md flex items-center justify-center">
                        <p className="text-slate-500">Area Chart Visualization</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold">Event Attendance</CardTitle>
                      <CardDescription>Attendance at recent events</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] bg-slate-100 rounded-md flex items-center justify-center">
                        <p className="text-slate-500">Bar Chart Visualization</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Events Preview */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-lg font-semibold">Recent Events</CardTitle>
                      <CardDescription>Your latest organization events</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab("events")}>
                      View All
                    </Button>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {events.map((event) => (
                            <TableRow key={event.id} className="hover:bg-slate-50">
                              <TableCell className="font-medium">{event.title}</TableCell>
                              <TableCell>{event.date}</TableCell>
                              <TableCell>
                                <Badge variant={event.status === "selesai" ? "secondary" : "default"}>
                                  {event.status === "akan datang" ? "Akan Datang" : "Selesai"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" className="hover:bg-slate-100">
                                  <Eye className="h-4 w-4 text-slate-600" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="events" className="space-y-6">
                {/* Events Table */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold">Events Management</CardTitle>
                        <CardDescription>Manage your organization's events</CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <div className="relative flex-1 min-w-[200px]">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                          <Input type="search" placeholder="Search events..." className="pl-8 w-full" />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {events.map((event) => (
                            <TableRow key={event.id} className="hover:bg-slate-50">
                              <TableCell className="font-medium">{event.title}</TableCell>
                              <TableCell>{event.date}</TableCell>
                              <TableCell>
                                <Badge variant={event.status === "selesai" ? "secondary" : "default"}>
                                  {event.status === "akan datang" ? "Akan Datang" : "Selesai"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="icon" className="hover:bg-slate-100">
                                    <Eye className="h-4 w-4 text-slate-600" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="hover:bg-slate-100">
                                    <Edit className="h-4 w-4 text-slate-600" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="hover:bg-slate-100">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}

