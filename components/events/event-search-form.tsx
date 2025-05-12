"use client"

import { useState, useEffect } from "react"
import { Search, Calendar, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export interface EventSearchParams {
  keyword?: string
  date?: string
  status?: "akan datang" | "selesai" | string
  page?: number
  limit?: number
}

interface EventSearchFormProps {
  onSearch: (params: EventSearchParams) => void
  isSearching?: boolean
  onReset?: () => void
}

export function EventSearchForm({ onSearch, isSearching = false, onReset }: EventSearchFormProps) {
  const [keyword, setKeyword] = useState("")
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [status, setStatus] = useState<string>("all")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [hasFilters, setHasFilters] = useState(false)

  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const params: EventSearchParams = {}

    if (keyword.trim()) {
      params.keyword = keyword.trim()
    }

    if (date) {
      params.date = format(date, "yyyy-MM-dd'T'HH:mm:ss")
    }

    if (status && status !== 'all') {
      params.status = status
    }

    onSearch(params)
  }

  // Handle reset
  const handleReset = () => {
    setKeyword("")
    setDate(undefined)
    setStatus("all")
    if (onReset) onReset()
  }

  // Check if any filters are applied
  useEffect(() => {
    setHasFilters(!!date || (!!status && status !== 'all'))
  }, [date, status])

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari acara..."
            className="pl-8 w-full"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant={hasFilters ? "default" : "outline"}
              className={cn(hasFilters && "bg-primary text-primary-foreground")}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filter
              {hasFilters && (
                <span className="ml-1 rounded-full bg-primary-foreground text-primary w-5 h-5 text-xs flex items-center justify-center">
                  {(!!date ? 1 : 0) + (!!status && status !== 'all' ? 1 : 0)}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h4 className="font-medium">Filter Acara</h4>

              <div className="space-y-2">
                <Label htmlFor="event-date">Tanggal</Label>
                <div className="grid gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="event-date"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : "Pilih tanggal"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {date && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => setDate(undefined)}
                    >
                      <X className="h-4 w-4 mr-1" /> Hapus tanggal
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="event-status">
                    <SelectValue placeholder="Semua status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua status</SelectItem>
                    <SelectItem value="akan datang">Akan Datang</SelectItem>
                    <SelectItem value="selesai">Selesai</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between pt-2">
                <Button type="button" variant="ghost" onClick={handleReset}>
                  Reset
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    handleSubmit({ preventDefault: () => {} } as React.FormEvent)
                    setIsFilterOpen(false)
                  }}
                >
                  Terapkan Filter
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button type="submit" disabled={isSearching}>
          {isSearching ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Mencari...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Cari
            </>
          )}
        </Button>

        {(keyword || hasFilters) && (
          <Button type="button" variant="ghost" onClick={handleReset}>
            <X className="mr-2 h-4 w-4" />
            Reset
          </Button>
        )}
      </div>
    </form>
  )
}
