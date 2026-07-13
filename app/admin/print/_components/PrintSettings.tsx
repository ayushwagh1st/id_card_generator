import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react'

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
    <div className="xl:col-span-1 h-fit relative xl:sticky xl:top-6 z-10 mb-6 xl:mb-0 bento-white border-ink shadow-hard !p-0">
      <CardHeader className="pb-4 bg-muted/20 border-b border-ink/10">
        <CardTitle className="text-lg">Print Settings</CardTitle>
        <CardDescription>Configure output dimensions and paper rules.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase text-muted-foreground">Card Size</Label>
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
              <SelectItem value="standard" label="Standard (54 x 86mm)">
                Standard (54 x 86mm)
              </SelectItem>
              <SelectItem value="large" label="Large (60 x 95mm)">
                Large (60 x 95mm)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase text-muted-foreground">Print Mode</Label>
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
              <SelectItem value="duplex" label="Front + Back (Duplex)">
                Front + Back (Duplex)
              </SelectItem>
              <SelectItem value="front" label="Front Only">
                Front Only
              </SelectItem>
              <SelectItem value="back" label="Back Only">
                Back Only
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground mt-1">
            {printMode === 'duplex'
              ? 'Standard Long-Edge binding flips automatically mirror the back.'
              : 'Single-sided rendering enabled.'}
          </p>
        </div>

        <div className="pt-4 border-t border-dashed border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Preview Zoom</Label>
            <span className="text-xs font-bold">{zoom}%</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setZoom(100)}>
              <Maximize className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setZoom((z) => Math.min(200, z + 10))}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg mt-4">
          <h5 className="text-[10px] font-bold text-amber-800 uppercase mb-1">Pre-flight Checklist</h5>
          <ul className="text-[10px] text-amber-700 space-y-1 list-disc pl-3">
            <li>Load A4 Size Paper.</li>
            <li>
              Set printer margins to <strong>None</strong> or <strong>Custom (0px)</strong>.
            </li>
            <li>Disable "Headers and Footers" in print dialog.</li>
            <li>Print at 100% scale (Do not fit to page).</li>
          </ul>
        </div>
      </CardContent>
    </div>
  )
}
