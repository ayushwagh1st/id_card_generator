import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-none text-sm font-bold font-display whitespace-nowrap transition-all duration-100 outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground border-3 border-ink shadow-[4px_4px_0_0_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#111111] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
        outline: "bg-card text-foreground border-3 border-ink shadow-[4px_4px_0_0_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#111111] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
        secondary: "bg-secondary text-secondary-foreground border-3 border-ink shadow-[4px_4px_0_0_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#111111] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
        ghost: "hover:bg-muted hover:text-foreground text-foreground rounded-none",
        destructive: "bg-destructive text-white border-3 border-ink shadow-[4px_4px_0_0_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#111111] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 gap-2 px-4",
        xs: "h-7 gap-1 rounded-none px-2 text-xs",
        sm: "h-8 gap-1.5 px-3 text-xs",
        lg: "h-12 gap-2.5 px-6 text-base",
        icon: "size-10",
        "icon-xs": "size-7 rounded-none",
        "icon-sm": "size-8 rounded-none",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
