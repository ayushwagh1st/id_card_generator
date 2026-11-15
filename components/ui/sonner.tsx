"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme = "light" } = useTheme()

  return (
    <Sonner
      theme={resolvedTheme as ToasterProps["theme"]}
      className="event-notifications"
      position="bottom-right"
      closeButton
      visibleToasts={3}
      duration={5000}
      gap={10}
      offset={24}
      mobileOffset={{ top: 'calc(16px + env(safe-area-inset-top))', right: 16, bottom: 'calc(16px + env(safe-area-inset-bottom))', left: 16 }}
      icons={{
        success: <CircleCheckIcon size={19} aria-hidden="true" />,
        info: <InfoIcon size={19} aria-hidden="true" />,
        warning: <TriangleAlertIcon size={19} aria-hidden="true" />,
        error: <OctagonXIcon size={19} aria-hidden="true" />,
        loading: <Loader2Icon size={19} className="operation-spinner" aria-hidden="true" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "event-toast",
          title: "event-toast-title",
          description: "event-toast-description",
          content: "event-toast-content",
          icon: "event-toast-icon",
          closeButton: "event-toast-close",
          actionButton: "event-toast-action",
          cancelButton: "event-toast-cancel",
          success: "event-toast-success",
          error: "event-toast-error",
          info: "event-toast-info",
          warning: "event-toast-warning",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
