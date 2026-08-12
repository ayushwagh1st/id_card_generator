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
        success: <CircleCheckIcon className="size-4 text-emerald-500" />,
        info: <InfoIcon className="size-4 text-blue-500" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-500" />,
        error: <OctagonXIcon className="size-4 text-rose-500" />,
        loading: <Loader2Icon className="size-4 animate-spin text-blue-500" />,
      }}
      toastOptions={{
        classNames: {
          toast: "group toast flex gap-3 px-4 py-3 text-xs sm:text-sm font-medium border border-white/40 dark:border-slate-800/80 rounded-2xl glass-panel shadow-2xl text-slate-900 dark:text-slate-100 w-full items-center",
          description: "text-slate-500 dark:text-slate-400 text-xs font-normal",
          actionButton: "bg-blue-600 text-white font-medium text-xs px-3 py-1.5 rounded-xl shadow-md hover:bg-blue-500 transition-colors",
          cancelButton: "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium px-3 py-1.5 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700",
          success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
          error: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
          info: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
          warning: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
