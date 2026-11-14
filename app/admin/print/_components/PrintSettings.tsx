'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, Maximize, Printer } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'

interface PrintSettingsProps {
  cardSize: 'standard' | 'large'
  printMode: 'duplex' | 'front' | 'back'
  zoom: number
  setCardSize: (size: 'standard' | 'large') => void
  setPrintMode: (mode: 'duplex' | 'front' | 'back') => void
  setZoom: (zoom: number | ((prev: number) => number)) => void
  fitMode: 'width' | 'page' | null
  onFitWidth: () => void
  onFitPage: () => void
}

export function PrintSettings({
  cardSize,
  printMode,
  zoom,
  setCardSize,
  setPrintMode,
  setZoom,
  fitMode,
  onFitWidth,
  onFitPage,
}: PrintSettingsProps) {
  const [expanded, setExpanded] = useState(false)
  return (
    <GlassCard className="xl:col-span-1 h-fit relative xl:sticky xl:top-6 z-10 p-6" glowColor="blue">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-500 mb-1">
        <Printer className="w-3.5 h-3.5" />
        <span>Studio Configuration</span>
      </div>
      <div className="flex items-center justify-between gap-2"><h2 className="text-lg font-semibold">Print settings</h2><Button variant="ghost" size="sm" className="print-settings-toggle" aria-expanded={expanded} aria-controls="print-settings-fields" onClick={() => setExpanded(value => !value)}>{expanded ? 'Hide' : 'Show'}</Button></div>
      <p className="text-sm text-muted-foreground mt-1 mb-4">Card dimensions, print sides, and preview scale.</p>

      <div id="print-settings-fields" className="print-settings-fields space-y-5" data-expanded={expanded}>
        <div className="space-y-2">
          <Label htmlFor="print-card-size" className="text-xs font-medium text-muted-foreground">Card size</Label>
          <Select
            value={cardSize}
            onValueChange={(v) => {
              if (v === 'standard' || v === 'large') setCardSize(v)
            }}
          >
            <SelectTrigger id="print-card-size" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">
                Standard (54 x 86mm)
              </SelectItem>
              <SelectItem value="large">
                Large (60 x 95mm)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="print-mode" className="text-xs font-medium text-muted-foreground">Print sides</Label>
          <Select
            value={printMode}
            onValueChange={(v) => {
              if (v === 'front' || v === 'back' || v === 'duplex') setPrintMode(v)
            }}
          >
            <SelectTrigger id="print-mode" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="duplex">
                Front + Back (Duplex)
              </SelectItem>
              <SelectItem value="front">
                Front Only
              </SelectItem>
              <SelectItem value="back">
                Back Only
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-slate-400 mt-1">
            {printMode === 'duplex'
              ? 'Standard Long-Edge binding flips automatically mirror the back.'
              : 'Single-sided rendering enabled.'}
          </p>
        </div>

        <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/60">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-muted-foreground">Preview zoom</span>
            <span className="text-xs font-mono font-bold text-blue-500">{zoom}%</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              aria-label="Zoom out"
              onClick={() => setZoom((z) => Math.max(10, z - 10))}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setZoom(100)} aria-label="Reset zoom to 100 percent">
              <Maximize className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              aria-label="Zoom in"
              onClick={() => setZoom((z) => Math.min(200, z + 10))}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2"><Button variant={fitMode === 'width' ? 'secondary' : 'outline'} size="sm" onClick={onFitWidth} aria-pressed={fitMode === 'width'}>Fit width</Button><Button variant={fitMode === 'page' ? 'secondary' : 'outline'} size="sm" onClick={onFitPage} aria-pressed={fitMode === 'page'}>Fit page</Button></div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 space-y-1">
          <h5 className="font-semibold uppercase text-[11px] tracking-wider mb-1">Pre-flight Checklist</h5>
          <ul className="text-[11px] space-y-1 list-disc pl-4 leading-relaxed">
            <li>Load A4 Heavyweight Cardstock Paper.</li>
            <li>Set printer margins to <strong>None (0px)</strong>.</li>
            <li>Disable "Headers and Footers" in print dialog.</li>
            <li>Print at 100% scale (Do not fit to page).</li>
          </ul>
        </div>
      </div>
    </GlassCard>
  )
}
