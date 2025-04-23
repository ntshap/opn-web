import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-3 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-sm font-normal",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-blue-100 text-blue-600 hover:bg-blue-100",
        secondary:
          "border-transparent bg-gray-100 text-gray-800 hover:bg-gray-100",
        destructive:
          "border-transparent bg-red-100 text-red-800 hover:bg-red-100",
        outline: "border-gray-200 text-gray-800 bg-gray-100",
        status: "border-transparent bg-blue-100 text-blue-600 hover:bg-blue-100",
        success: "border-transparent bg-green-100 text-green-800 hover:bg-green-100",
        warning: "border-transparent bg-amber-100 text-amber-800 hover:bg-amber-100",
        info: "border-transparent bg-sky-100 text-sky-800 hover:bg-sky-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        badgeVariants({ variant }),
        className
      )}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
