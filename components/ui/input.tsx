import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-xl bg-white border border-black/10 shadow-sm px-4 py-2 text-[15px] tracking-[-0.01em] text-foreground transition-all duration-300 outline-none placeholder:text-muted-foreground focus:outline-none focus:ring-[3px] focus:ring-primary/20 focus:border-primary/60 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
