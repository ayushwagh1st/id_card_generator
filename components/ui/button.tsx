import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "ui-button group/button inline-flex shrink-0 items-center justify-center rounded-md text-sm font-medium whitespace-nowrap select-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "ui-button-primary bg-primary text-primary-foreground border border-transparent",
        outline:
          "ui-button-outline border border-border bg-card text-foreground",
        secondary:
          "ui-button-secondary bg-secondary text-secondary-foreground border border-transparent",
        ghost:
          "ui-button-ghost text-foreground border border-transparent",
        destructive:
          "ui-button-destructive bg-destructive text-white border border-transparent",
        link:
          "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-11 gap-2 px-4 py-2.5",
        xs: "min-h-11 gap-1 px-2.5 text-xs",
        sm: "min-h-11 gap-1.5 px-3 text-xs",
        lg: "h-12 gap-2.5 px-6 text-sm sm:text-base",
        icon: "size-11",
        "icon-xs": "size-11",
        "icon-sm": "size-11",
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
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
