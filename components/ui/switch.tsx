"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border-2 border-ink transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-2 focus-visible:ring-primary/50 data-[size=default]:h-[22px] data-[size=default]:w-[38px] data-[size=sm]:h-[16px] data-[size=sm]:w-[28px] data-checked:bg-secondary data-unchecked:bg-white data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block rounded-full bg-white border-2 border-ink ring-0 transition-transform group-data-[size=default]/switch:size-[16px] group-data-[size=sm]/switch:size-[10px] group-data-[size=default]/switch:data-checked:translate-x-[16px] group-data-[size=sm]/switch:data-checked:translate-x-[10px] group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0 shadow-[1px_1px_0_0_#111111]"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
