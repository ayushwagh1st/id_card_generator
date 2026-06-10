'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Scanner } from '@yudiel/react-qr-scanner'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface QRScannerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QRScannerDialog({ open, onOpenChange }: QRScannerDialogProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleScan = (result: any) => {
    if (result && result.length > 0) {
      const url = result[0].rawValue
      // Check if it's our URL
      if (url.includes('/verify/')) {
        const id = url.split('/verify/')[1]
        if (id) {
          setIsProcessing(true)
          toast.success('ID Card Detected!')
          // Navigate to verify page
          router.push(`/verify/${id}`)
          onOpenChange(false)
          // small timeout to clear processing state after navigation begins
          setTimeout(() => setIsProcessing(false), 2000)
        }
      } else {
        // If they scan something else
        toast.error('Invalid QR Code. Please scan a valid Bal Pradarshani ID Card.')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={isProcessing ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan ID Card</DialogTitle>
          <DialogDescription>
            Point your camera at the QR code on the back of the volunteer's ID card.
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-black flex flex-col items-center justify-center border-3 border-ink shadow-hard-sm">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center space-y-4 text-white z-10">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="font-semibold text-lg">Loading Profile...</p>
            </div>
          ) : (
            open && (
              <Scanner 
                onScan={handleScan}
                onError={(error) => console.log(error?.message)}
                components={{
                  finder: true,
                }}
                styles={{
                  container: { width: '100%', height: '100%' }
                }}
              />
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
