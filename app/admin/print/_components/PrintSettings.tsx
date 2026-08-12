import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
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
}

export function PrintSettings({
  cardSize,
  printMode,
  zoom,
  setCardSize,
  setPrintMode,
  setZoom,
}: PrintSettingsProps) {
  return (
    <GlassCard className="xl:col-span-1 h-fit relative xl:sticky xl:top-6 z-10 p-6" glowColor="blue">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-500 mb-1">
        <Printer className="w-3.5 h-3.5" />
        <span>Studio Configuration</span>
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Print Settings</h3>
      <p className="text-xs text-slate-400 mb-6">Configure output dimensions and paper rules.</p>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Card Dimension Spec</Label>
          <Select
            value={cardSize}
            onValueChange={(v) => {
              if (v === 'standard' || v === 'large') setCardSize(v)
            }}
          >
            <SelectTrigger className="w-full">
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
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Duplex Mode</Label>
          <Select
            value={printMode}
            onValueChange={(v) => {
              if (v === 'front' || v === 'back' || v === 'duplex') setPrintMode(v)
            }}
          >
            <SelectTrigger className="w-full">
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
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Canvas Zoom</Label>
            <span className="text-xs font-mono font-bold text-blue-500">{zoom}%</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setZoom(100)}>
              <Maximize className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setZoom((z) => Math.min(200, z + 10))}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
          </div>
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
