import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "ui-input min-h-11 w-full min-w-0 rounded-md bg-card border border-input px-3.5 py-2.5 text-base text-foreground placeholder:text-muted-foreground disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
