import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-[10px] border-3 border-ink bg-white px-3 py-2 text-base text-ink transition-all outline-none placeholder:text-muted-foreground/50 focus-visible:ring-3 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50 md:text-sm shadow-[2px_2px_0_0_#111111]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
