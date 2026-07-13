'use client'

import React, { useEffect, useRef, useReducer, useCallback } from 'react'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useReactToPrint } from 'react-to-print'
import { Printer, RefreshCw, Layers, ChevronLeft, ChevronRight } from 'lucide-react'
import { IDCard } from '@/components/volunteers/IDCard'
import { toast } from 'sonner'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { getPrintVolunteersAction } from './actions.server'
import { PrintSettings } from './_components/PrintSettings'

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

export default function PrintCenter() {
  const [state, dispatch] = React.useReducer(
    (state: any, action: any) => typeof action === 'function' ? { ...state, ...action(state) } : { ...state, ...action },
    {
      volunteers: [],
      loading: true,
      isFiltered: false,
      cardSize: 'standard',
      printMode: 'duplex',
      zoom: 100,
      currentBatch: 1
    }
  )

  const { volunteers, loading, isFiltered, cardSize, printMode, zoom, currentBatch } = state

  const setVolunteers = useCallback((v: any) => dispatch((s: any) => ({ volunteers: typeof v === 'function' ? v(s.volunteers) : v })), [])
  const setLoading = useCallback((v: any) => dispatch((s: any) => ({ loading: typeof v === 'function' ? v(s.loading) : v })), [])
  const setIsFiltered = useCallback((v: any) => dispatch((s: any) => ({ isFiltered: typeof v === 'function' ? v(s.isFiltered) : v })), [])
  const setCardSize = useCallback((v: any) => dispatch((s: any) => ({ cardSize: typeof v === 'function' ? v(s.cardSize) : v })), [])
  const setPrintMode = useCallback((v: any) => dispatch((s: any) => ({ printMode: typeof v === 'function' ? v(s.printMode) : v })), [])
  const setZoom = useCallback((v: any) => dispatch((s: any) => ({ zoom: typeof v === 'function' ? v(s.zoom) : v })), [])
  const setCurrentBatch = useCallback((v: any) => dispatch((s: any) => ({ currentBatch: typeof v === 'function' ? v(s.currentBatch) : v })), [])
  const SHEETS_PER_BATCH = 20 // 20 sheets max in DOM to prevent browser crash and memory leaks

  const fetchPrintData = useCallback(async () => {
    setLoading(true)
    try {
      const selectedIdsStr = localStorage.getItem('print-volunteer-ids:v1')
      let selectedIds: string[] | null = null
      if (selectedIdsStr) {
        selectedIds = JSON.parse(selectedIdsStr)
      }

      const { volunteers: fetchedVolunteers, isFiltered: filtered } = await getPrintVolunteersAction(selectedIds)
      
      setVolunteers(fetchedVolunteers)
      setIsFiltered(filtered)
    } catch (err: any) {
      toast.error(err.message || 'Error fetching print records')
    } finally {
      setLoading(false)
    }
  }, [setLoading, setVolunteers, setIsFiltered])

  useEffect(() => {
    fetchPrintData()
  }, [fetchPrintData])

  const componentRef = useRef(null)

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
              <Button variant="ghost" size="icon" onClick={() => setCurrentBatch((b: any) => Math.max(1, b - 1))} disabled={safeCurrentBatch === 1} className="h-8 w-8 rounded-lg hover:bg-background">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-[11px] font-bold px-2 text-muted-foreground uppercase tracking-wider">
                Batch {safeCurrentBatch} of {totalBatches}
              </span>
              <Button variant="ghost" size="icon" onClick={() => setCurrentBatch((b: any) => Math.min(totalBatches, b + 1))} disabled={safeCurrentBatch === totalBatches} className="h-8 w-8 rounded-lg hover:bg-background">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {isFiltered && (
            <Button variant="outline" onClick={clearSelectionFilter} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Load All
            </Button>
          )}
          <Button onClick={handlePrint} disabled={loading || volunteers.length === 0} className="gap-2 bg-black hover:bg-zinc-800 text-white px-5">
            <Printer className="h-4 w-4" />
            Print Batch {totalBatches > 1 ? safeCurrentBatch : ''}
          </Button>
        </div>
      </div>

      {/* Print Controls Sidebar & Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Controls */}
        <PrintSettings
          cardSize={cardSize}
          printMode={printMode}
          zoom={zoom}
          setCardSize={setCardSize}
          setPrintMode={setPrintMode}
          setZoom={setZoom}
        />

        {/* Preview Area */}
        <div className="xl:col-span-3 overflow-hidden bg-ink border-2 border-ink shadow-hard rounded-[32px] flex flex-col">
          <CardHeader className="bg-ink border-b border-white/10 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Print Preview Sheet
              </CardTitle>
            </div>
            <div className="text-xs font-mono text-white/50 bg-white/5 px-3 py-1 rounded border border-white/10">
              {volunteers.length} Cards • {printSheets.length} Sheets Total
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto p-4 sm:p-8 flex justify-start md:justify-center min-h-[600px] relative w-full bg-ink">
            
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
                className="transition-transform origin-top-left sm:origin-top"
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
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-[10px] py-1.5 px-3 flex items-center gap-1.5"
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

                  <style dangerouslySetInnerHTML={{ __html: `
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
                  ` }} />
                </div>
              </div>
            )}
          </CardContent>
        </div>
      </div>
    </div>
  )
}

