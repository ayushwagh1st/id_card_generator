'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useReactToPrint } from 'react-to-print'
import { Printer, RefreshCw, Layers, ChevronLeft, Loader2, ZoomIn, ZoomOut, Maximize, ChevronRight } from 'lucide-react'
import { IDCard } from '@/components/volunteers/IDCard'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

export default function PrintCenter() {
  const [volunteers, setVolunteers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isFiltered, setIsFiltered] = useState(false)
  const componentRef = useRef<HTMLDivElement>(null)

  // Print settings
  const [cardSize, setCardSize] = useState<'standard' | 'large'>('standard')
  const [printMode, setPrintMode] = useState<'front' | 'back' | 'duplex'>('duplex')
  const [zoom, setZoom] = useState(100)
  
  // Pagination & Chunking state
  const [currentBatch, setCurrentBatch] = useState(1)
  const SHEETS_PER_BATCH = 20 // 20 sheets max in DOM to prevent browser crash and memory leaks

  const supabase = createClient()

  const fetchPrintData = async () => {
    setLoading(true)
    try {
      const selectedIdsStr = localStorage.getItem('print-volunteer-ids')
      let query = supabase
        .from('volunteers')
        .select(`
          id,
          snk_id,
          full_name,
          mobile_number,
          gender,
          age,
          emergency_contact,
          address,
          role,
          branch,
          accommodation,
          designation,
          photo_url,
          status,
          models:model_id (
            name,
            profiles:head_id (
              full_name
            )
          )
        `)

      if (selectedIdsStr) {
        const selectedIds = JSON.parse(selectedIdsStr)
        if (selectedIds && selectedIds.length > 0) {
          query = query.in('id', selectedIds)
          setIsFiltered(true)
        } else {
          query = query.eq('status', 'Approved')
          setIsFiltered(false)
        }
      } else {
        query = query.eq('status', 'Approved')
        setIsFiltered(false)
      }

      const { data, error } = await query
      if (error) throw error

      const mapped = (data || []).map(v => {
        const modelObj = Array.isArray(v.models) ? v.models[0] : (v.models as any);
        const headObj = modelObj?.profiles;
        const headName = Array.isArray(headObj) ? (headObj[0] as any)?.full_name : (headObj as any)?.full_name || 'Unassigned';
        
        return {
          id: v.id,
          snk_id: v.snk_id,
          name: v.full_name,
          mobile: v.mobile_number,
          model: modelObj?.name || 'Unassigned',
          branch: v.branch,
          accommodation: v.accommodation,
          headName: headName,
          role: v.designation || v.role || 'Volunteer',
          photoUrl: v.photo_url,
          emergencyContact: v.emergency_contact || 'N/A'
        }
      })

      setVolunteers(mapped)
    } catch (err: any) {
      toast.error(err.message || 'Error fetching print records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrintData()
  }, [])

  const handlePrint = useReactToPrint({
    documentTitle: "Volunteer_ID_Cards",
    contentRef: componentRef,
  })

  const handlePrintSingleCard = (vol: any) => {
    const originalVolunteers = [...volunteers]
    setVolunteers([vol])
    setTimeout(() => {
      handlePrint()
      setTimeout(() => {
        setVolunteers(originalVolunteers)
      }, 300)
    }, 100)
  }

  const clearSelectionFilter = () => {
    localStorage.removeItem('print-volunteer-ids')
    fetchPrintData()
  }

  // --- Pagination & Grid Logic ---
  const CARDS_PER_PAGE = 9 // 3x3 grid

  // Generate pages chunked by CARDS_PER_PAGE
  const volunteerPages = []
  for (let i = 0; i < volunteers.length; i += CARDS_PER_PAGE) {
    volunteerPages.push(volunteers.slice(i, i + CARDS_PER_PAGE))
  }

  // Helper to reverse columns in a row so Back aligns with Front during Long Edge flip
  const mirrorPageForBack = (pageVols: any[]) => {
    const mirrored = []
    for (let i = 0; i < pageVols.length; i += 3) {
      const row = pageVols.slice(i, i + 3)
      // Pad empty slots with null to maintain column structural integrity
      while (row.length < 3) row.push(null)
      mirrored.push(...row.reverse())
    }
    return mirrored
  }

  // Build the array of print sheets based on selected mode
  const printSheets: { type: 'front' | 'back', data: any[], pageNum: number }[] = []
  
  volunteerPages.forEach((page, index) => {
    const pageNum = index + 1
    if (printMode === 'front' || printMode === 'duplex') {
      printSheets.push({ type: 'front', data: page, pageNum })
    }
    if (printMode === 'back' || printMode === 'duplex') {
      printSheets.push({ type: 'back', data: mirrorPageForBack(page), pageNum })
    }
  })

  // Apply batch chunking to printSheets
  const totalBatches = Math.ceil(printSheets.length / SHEETS_PER_BATCH)
  // Ensure currentBatch doesn't exceed total if filters change
  const safeCurrentBatch = Math.min(currentBatch, totalBatches || 1)
  const currentPrintSheets = printSheets.slice((safeCurrentBatch - 1) * SHEETS_PER_BATCH, safeCurrentBatch * SHEETS_PER_BATCH)

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest mb-1.5">
            <Link href="/admin/volunteers" className="hover:underline flex items-center gap-1">
              <ChevronLeft className="w-3 h-3" /> Back to Volunteers
            </Link>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Print Engine</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Configure A4 layouts and duplex printing modes for professional Vertical ID cards.
          </p>
          <div className="mt-2 block sm:hidden">
            <span className="text-xs bg-amber-500/10 text-amber-600 px-2.5 py-1 rounded-full font-semibold border border-amber-500/20">
              Note: Printing is best optimized on a desktop browser.
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {totalBatches > 1 && (
            <div className="flex items-center gap-1 bg-muted p-1 rounded-xl mr-2">
              <Button variant="ghost" size="icon" onClick={() => setCurrentBatch(b => Math.max(1, b - 1))} disabled={safeCurrentBatch === 1} className="h-8 w-8 rounded-lg hover:bg-background">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-[11px] font-bold px-2 text-muted-foreground uppercase tracking-wider">
                Batch {safeCurrentBatch} of {totalBatches}
              </span>
              <Button variant="ghost" size="icon" onClick={() => setCurrentBatch(b => Math.min(totalBatches, b + 1))} disabled={safeCurrentBatch === totalBatches} className="h-8 w-8 rounded-lg hover:bg-background">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {isFiltered && (
            <Button variant="outline" onClick={clearSelectionFilter} className="gap-2 rounded-xl border-dashed">
              <RefreshCw className="h-4 w-4" />
              Load All
            </Button>
          )}
          <Button onClick={handlePrint} disabled={loading || volunteers.length === 0} className="gap-2 bg-black hover:bg-zinc-800 text-white font-semibold rounded-xl px-5 shadow-md">
            <Printer className="h-4 w-4" />
            Print Batch {totalBatches > 1 ? safeCurrentBatch : ''}
          </Button>
        </div>
      </div>

      {/* Print Controls Sidebar & Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Controls */}
        <Card className="xl:col-span-1 shadow-sm border-primary/10 h-fit sticky top-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Print Settings</CardTitle>
            <CardDescription>Configure output dimensions and paper rules.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Card Size</Label>
              <Select value={cardSize} onValueChange={(v) => { if (v === 'standard' || v === 'large') setCardSize(v) }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard" label="Standard (54 x 86mm)">Standard (54 x 86mm)</SelectItem>
                  <SelectItem value="large" label="Large (60 x 95mm)">Large (60 x 95mm)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Print Mode</Label>
              <Select value={printMode} onValueChange={(v) => { if (v === 'front' || v === 'back' || v === 'duplex') setPrintMode(v) }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="duplex" label="Front + Back (Duplex)">Front + Back (Duplex)</SelectItem>
                  <SelectItem value="front" label="Front Only">Front Only</SelectItem>
                  <SelectItem value="back" label="Back Only">Back Only</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground mt-1">
                {printMode === 'duplex' ? 'Standard Long-Edge binding flips automatically mirror the back.' : 'Single-sided rendering enabled.'}
              </p>
            </div>

            <div className="pt-4 border-t border-dashed border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Preview Zoom</Label>
                <span className="text-xs font-bold">{zoom}%</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setZoom(z => Math.max(50, z - 10))}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setZoom(100)}>
                  <Maximize className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setZoom(z => Math.min(200, z + 10))}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg mt-4">
              <h5 className="text-[10px] font-bold text-amber-800 uppercase mb-1">Pre-flight Checklist</h5>
              <ul className="text-[10px] text-amber-700 space-y-1 list-disc pl-3">
                <li>Load A4 Size Paper.</li>
                <li>Set printer margins to <strong>None</strong> or <strong>Custom (0px)</strong>.</li>
                <li>Disable "Headers and Footers" in print dialog.</li>
                <li>Print at 100% scale (Do not fit to page).</li>
              </ul>
            </div>

          </CardContent>
        </Card>

        {/* Preview Area */}
        <Card className="xl:col-span-3 shadow-sm border-primary/10 overflow-hidden bg-zinc-900 flex flex-col">
          <CardHeader className="bg-zinc-950 border-b border-zinc-800 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Print Preview Sheet
              </CardTitle>
            </div>
            <div className="text-xs font-mono text-zinc-500 bg-zinc-900 px-3 py-1 rounded border border-zinc-800">
              {volunteers.length} Cards • {printSheets.length} Sheets Total
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto p-4 sm:p-8 flex justify-start md:justify-center min-h-[600px] relative w-full">
            
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-6 mt-10 w-full max-w-2xl">
                <div className="grid grid-cols-3 gap-6 w-full p-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="aspect-[54/86] w-full rounded-xl bg-zinc-800" />
                  ))}
                </div>
                <p className="text-sm font-semibold text-zinc-500">Generating print layout preview...</p>
              </div>
            ) : volunteers.length === 0 ? (
              <div className="text-center mt-20 text-zinc-500">
                <Printer className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-bold text-zinc-400">No cards in queue</h3>
                <p className="text-sm mt-2">Approve volunteers or select them from the directory first.</p>
              </div>
            ) : (
              <div 
                className="transition-transform origin-top"
                style={{ transform: `scale(${zoom / 100})` }}
              >
                {/* Render Container for react-to-print */}
                <div ref={componentRef} className="print-engine-container">
                  {currentPrintSheets.map((sheet, idx) => (
                    <div 
                      key={`${sheet.pageNum}-${sheet.type}-${idx}`} 
                      className="bg-white shadow-2xl mx-auto mb-8 print:shadow-none print:mb-0 relative"
                      style={{ 
                        width: '210mm', 
                        height: '297mm', 
                        padding: '5mm', // Strict 5mm margin on all sides
                        boxSizing: 'border-box',
                        pageBreakAfter: 'always',
                        pageBreakInside: 'avoid'
                      }}
                    >
                      {/* Grid for 9 cards (3 columns) */}
                      <div className="grid grid-cols-3 gap-[2px] justify-items-center content-start h-full">
                        {sheet.data.map((vol, vIdx) => (
                          <div key={vol ? vol.id : `empty-${vIdx}`} className="inline-block print:break-inside-avoid relative group">
                            {vol ? (
                              <>
                                <IDCard volunteer={vol} size={cardSize} side={sheet.type} />
                                {/* Individual Print Button Overlay */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center print:hidden z-50">
                                  <Button 
                                    size="sm" 
                                    className="bg-primary text-white hover:bg-primary/90 font-bold text-[10px] py-1.5 px-3 rounded-lg shadow-md flex items-center gap-1.5"
                                    onClick={() => handlePrintSingleCard(vol)}
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                    Print Card
                                  </Button>
                                </div>
                              </>
                            ) : (
                              // Empty placeholder to maintain grid structure when row is padded
                              <div style={{ 
                                width: cardSize === 'standard' ? '54mm' : '60mm', 
                                height: cardSize === 'standard' ? '86mm' : '95mm' 
                              }} />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* On-screen page label (Hidden in actual print) */}
                      <div className="absolute -bottom-6 left-0 text-zinc-500 text-xs font-mono print:hidden">
                        Page {idx + 1} • {sheet.type.toUpperCase()} (Sheet {sheet.pageNum})
                      </div>
                    </div>
                  ))}

                  <style jsx global>{`
                    @media print {
                      @page {
                        size: A4 portrait;
                        margin: 0 !important; /* Force strict 0 margin to let the 5mm padding handle it perfectly */
                      }
                      body {
                        background: white !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        margin: 0 !important;
                        padding: 0 !important;
                      }
                      .print-engine-container {
                        margin: 0 !important;
                        padding: 0 !important;
                      }
                    }
                  `}</style>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

