"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"

interface TimeInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function TimeInput({ value, onChange, disabled }: TimeInputProps) {
  const [hours, setHours] = useState("")
  const [minutes, setMinutes] = useState("")

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(":")
      setHours(h)
      setMinutes(m)
    }
  }, [value])

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value
    if (val === "") {
      setHours("")
      onChange(`00:${minutes}`)
      return
    }

    const numVal = Number.parseInt(val)
    if (isNaN(numVal)) return

    if (numVal > 23) val = "23"
    if (numVal < 0) val = "00"

    // Ensure two digits
    val = val.padStart(2, "0")

    setHours(val)
    onChange(`${val}:${minutes}`)
  }

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value
    if (val === "") {
      setMinutes("")
      onChange(`${hours}:00`)
      return
    }

    const numVal = Number.parseInt(val)
    if (isNaN(numVal)) return

    if (numVal > 59) val = "59"
    if (numVal < 0) val = "00"

    // Ensure two digits
    val = val.padStart(2, "0")

    setMinutes(val)
    onChange(`${hours}:${val}`)
  }

  return (
    <div className="flex items-center">
      <Input
        type="text"
        value={hours}
        onChange={handleHoursChange}
        placeholder="HH"
        className="w-16 text-center"
        maxLength={2}
        disabled={disabled}
      />
      <span className="mx-1 text-lg">:</span>
      <Input
        type="text"
        value={minutes}
        onChange={handleMinutesChange}
        placeholder="MM"
        className="w-16 text-center"
        maxLength={2}
        disabled={disabled}
      />
    </div>
  )
}

