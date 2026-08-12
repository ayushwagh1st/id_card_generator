'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Camera, RefreshCw, AlertCircle } from 'lucide-react'

const Scanner = dynamic(() => import('@yudiel/react-qr-scanner').then((mod) => mod.Scanner), {
  ssr: false,
})

interface QRScannerDialogProps {
  isOpen: boolean
  onClose: () => void
  onScanSuccess: (decodedText: string) => void
  title?: string
  description?: string
}

export function QRScannerDialog({
  isOpen,
  onClose,
  onScanSuccess,
  title = "Scan ID Card QR Code",
  description = "Position the QR code inside the frame to scan automatically."
}: QRScannerDialogProps) {
  const [cameraError, setCameraError] = useState<string | null>(null)

  const handleScan = (result: any[]) => {
    if (result && result.length > 0 && result[0]?.rawValue) {
      onScanSuccess(result[0].rawValue)
      onClose()
    }
  }

  const handleError = (error: any) => {
    console.error('Scanner error:', error)
    setCameraError("Camera access failed. Please check device permissions.")
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setCameraError(null)
        onClose()
      }
    }}>
      <DialogContent className="max-w-md w-full p-6 text-slate-900 dark:text-white">
        <DialogHeader>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-500 mb-1">
            <Camera className="w-3.5 h-3.5" />
            <span>QR Scanner</span>
          </div>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 flex flex-col items-center justify-center">
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden glass-panel border border-white/40 dark:border-slate-800/80 bg-slate-950 flex flex-col items-center justify-center shadow-xl">
            {isOpen && (
              <Scanner
                onScan={handleScan}
                onError={handleError}
                styles={{
                  container: { width: '100%', height: '100%', borderRadius: '1rem' }
                }}
              />
            )}
            
            {cameraError && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-rose-400 space-y-3 z-20">
                <AlertCircle className="w-10 h-10" />
                <p className="text-xs font-medium">{cameraError}</p>
                <Button size="sm" variant="outline" onClick={() => setCameraError(null)} className="gap-2">
                  <RefreshCw className="w-3.5 h-3.5" /> Retry Camera
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
