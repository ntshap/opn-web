"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface BarChartProps {
  data: {
    label: string
    value: number
    color?: string
  }[]
  title: string
  maxValue?: number
}

export function BarChart({ data, title, maxValue }: BarChartProps) {
  const calculatedMaxValue = maxValue || Math.max(...data.map((item) => item.value))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{item.label}</span>
                <span className="font-medium">${item.value.toFixed(2)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${item.color || "bg-blue-500"}`}
                  style={{
                    width: `${(item.value / calculatedMaxValue) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

