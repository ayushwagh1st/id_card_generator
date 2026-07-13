"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "#111111",
          "--border-radius": "12px",
          "--toast-icon-margin-start": "-3px",
          "--toast-icon-margin-end": "4px",
          "--toast-svg-margin-start": "-1px",
          "--toast-svg-margin-end": "0px",
          "--toast-button-margin-start": "auto",
          "--toast-button-margin-end": "0",
          "--toast-close-button-start": "0",
          "--toast-close-button-end": "-16px",
          "--toast-close-button-transform": "translate(-35%, -35%)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "group toast flex gap-3 px-4 py-3 font-display font-medium text-base border-[3px] border-ink shadow-[4px_4px_0_#111111] rounded-xl bg-white text-ink w-full items-center",
          description: "group-[.toast]:text-ink/80 text-sm font-sans font-medium",
          actionButton: "group-[.toast]:bg-ink group-[.toast]:text-white font-bold px-3 py-1.5 rounded-lg border-2 border-transparent hover:scale-[1.02] transition-transform",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-ink font-bold px-3 py-1.5 rounded-lg border-2 border-transparent hover:bg-muted/80",
          success: "group-[.toaster]:bg-[#D1FAE5] group-[.toaster]:text-[#065F46] group-[.toaster]:border-ink group-[.toaster]:shadow-[4px_4px_0_#065F46]",
          error: "group-[.toaster]:bg-[#FEE2E2] group-[.toaster]:text-[#991B1B] group-[.toaster]:border-ink group-[.toaster]:shadow-[4px_4px_0_#991B1B]",
          info: "group-[.toaster]:bg-[#DBEAFE] group-[.toaster]:text-[#1E40AF] group-[.toaster]:border-ink group-[.toaster]:shadow-[4px_4px_0_#1E40AF]",
          warning: "group-[.toaster]:bg-[#FEF3C7] group-[.toaster]:text-[#92400E] group-[.toaster]:border-ink group-[.toaster]:shadow-[4px_4px_0_#92400E]",
          icon: "group-data-[type=error]:text-[#991B1B] group-data-[type=success]:text-[#065F46] group-data-[type=warning]:text-[#92400E] group-data-[type=info]:text-[#1E40AF]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
