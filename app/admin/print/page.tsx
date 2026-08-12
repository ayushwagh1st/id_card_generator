'use client'

import React, { useEffect, useRef, useReducer, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { useReactToPrint } from 'react-to-print'
import { Printer, RefreshCw, Layers, ChevronLeft, ChevronRight, Sliders, Sparkles } from 'lucide-react'
import { IDCard } from '@/components/volunteers/IDCard'
import { toast } from 'sonner'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { getPrintVolunteersAction } from './actions.server'
import { PrintSettings } from './_components/PrintSettings'
import { GlassCard } from '@/components/ui/GlassCard'

const mirrorPageForBack = (pageVols: any[]) => {
  const mirrored = []
  for (let i = 0; i < pageVols.length; i += 3) {
    const row = pageVols.slice(i, i + 3)
    while (row.length < 3) row.push(null)
    mirrored.push(...row.reverse())
  }
  return mirrored
}

export default function PrintCenter() {
  const [state, dispatch] = React.useReducer(
    (state: any, action: any) =>
      typeof action === 'function' ? { ...state, ...action(state) } : { ...state, ...action },
    {
      volunteers: [],
      loading: true,
      isFiltered: false,
      cardSize: 'standard',
      printMode: 'duplex',
      zoom: 100,
      currentBatch: 1,
    }
  )

  const { volunteers, loading, isFiltered, cardSize, printMode, zoom, currentBatch } = state

  const setVolunteers = useCallback(
    (v: any) => dispatch((s: any) => ({ volunteers: typeof v === 'function' ? v(s.volunteers) : v })),
    []
  )
  const setLoading = useCallback(
    (v: any) => dispatch((s: any) => ({ loading: typeof v === 'function' ? v(s.loading) : v })),
    []
  )
  const setIsFiltered = useCallback(
    (v: any) => dispatch((s: any) => ({ isFiltered: typeof v === 'function' ? v(s.isFiltered) : v })),
    []
  )
  const setCardSize = useCallback(
    (v: any) => dispatch((s: any) => ({ cardSize: typeof v === 'function' ? v(s.cardSize) : v })),
    []
  )
  const setPrintMode = useCallback(
    (v: any) => dispatch((s: any) => ({ printMode: typeof v === 'function' ? v(s.printMode) : v })),
    []
  )
  const setZoom = useCallback(
    (v: any) => dispatch((s: any) => ({ zoom: typeof v === 'function' ? v(s.zoom) : v })),
    []
  )
  const setCurrentBatch = useCallback(
    (v: any) => dispatch((s: any) => ({ currentBatch: typeof v === 'function' ? v(s.currentBatch) : v })),
    []
  )
  const SHEETS_PER_BATCH = 20

  const fetchPrintData = useCallback(async () => {
    setLoading(true)
    try {
      const selectedIdsStr = localStorage.getItem('print-volunteer-ids:v1')
      let selectedIds: string[] | null = null
      if (selectedIdsStr) {
        selectedIds = JSON.parse(selectedIdsStr)
      }

      const { volunteers: fetchedVolunteers, isFiltered: filtered } =
        await getPrintVolunteersAction(selectedIds)

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
    documentTitle: 'Volunteer_ID_Cards',
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
    localStorage.removeItem('print-volunteer-ids:v1')
    fetchPrintData()
  }

  const CARDS_PER_PAGE = 9

  const volunteerPages = []
  for (let i = 0; i < volunteers.length; i += CARDS_PER_PAGE) {
    volunteerPages.push(volunteers.slice(i, i + CARDS_PER_PAGE))
  }

  const printSheets: { type: 'front' | 'back'; data: any[]; pageNum: number }[] = []

  volunteerPages.forEach((page, index) => {
    const pageNum = index + 1
    if (printMode === 'front' || printMode === 'duplex') {
      printSheets.push({ type: 'front', data: page, pageNum })
    }
    if (printMode === 'back' || printMode === 'duplex') {
      printSheets.push({ type: 'back', data: mirrorPageForBack(page), pageNum })
    }
  })

  const totalBatches = Math.ceil(printSheets.length / SHEETS_PER_BATCH)
  const safeCurrentBatch = Math.min(currentBatch, totalBatches || 1)
  const currentPrintSheets = printSheets.slice(
    (safeCurrentBatch - 1) * SHEETS_PER_BATCH,
    safeCurrentBatch * SHEETS_PER_BATCH
  )

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <GlassCard className="p-6 md:p-8" glowColor="blue">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/admin/volunteers"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-500 hover:text-blue-600 mb-2"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Back to Volunteers
            </Link>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Professional Print Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Live A4 sheet layout positioning, real-time scaling, and duplex print rendering.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {totalBatches > 1 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl glass-pill">
                <button
                  onClick={() => setCurrentBatch((b: any) => Math.max(1, b - 1))}
                  disabled={safeCurrentBatch === 1}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-300">
                  Batch {safeCurrentBatch} / {totalBatches}
                </span>
                <button
                  onClick={() => setCurrentBatch((b: any) => Math.min(totalBatches, b + 1))}
                  disabled={safeCurrentBatch === totalBatches}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {isFiltered && (
              <button
                onClick={clearSelectionFilter}
                className="px-4 py-2 rounded-2xl glass-pill text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 hover:border-blue-500/40"
              >
                <RefreshCw className="h-3.5 h-3.5" />
                Load All Records
              </button>
            )}

            <button
              onClick={handlePrint}
              disabled={loading || volunteers.length === 0}
              className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-blue-500/25 flex items-center gap-2 disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />
              Print Batch {totalBatches > 1 ? safeCurrentBatch : ''}
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Grid: Print Settings + Interactive Live Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <PrintSettings
          cardSize={cardSize}
          printMode={printMode}
          zoom={zoom}
          setCardSize={setCardSize}
          setPrintMode={setPrintMode}
          setZoom={setZoom}
        />

        <div className="xl:col-span-3 rounded-3xl glass-panel border border-slate-200/60 dark:border-slate-800/80 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between bg-slate-100/40 dark:bg-slate-900/40">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
                Live A4 Sheet Preview Canvas
              </span>
            </div>
            <div className="text-xs font-mono text-slate-500 px-3 py-1 rounded-full bg-slate-200/50 dark:bg-slate-800/50">
              {volunteers.length} Cards • {printSheets.length} Sheets Total
            </div>
          </div>

          <div className="p-6 overflow-x-auto flex justify-center min-h-[600px] bg-slate-950/20 backdrop-blur-md">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-6 mt-10 w-full max-w-2xl">
                <div className="grid grid-cols-3 gap-6 w-full p-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="aspect-[54/86] w-full rounded-2xl" />
                  ))}
                </div>
                <p className="text-xs font-medium text-slate-400">Rendering print layout sheets...</p>
              </div>
            ) : volunteers.length === 0 ? (
              <div className="text-center mt-20 text-slate-400">
                <Printer className="w-12 h-12 mx-auto mb-4 opacity-30 text-blue-500" />
                <h3 className="text-base font-semibold text-slate-300">No badges in print queue</h3>
                <p className="text-xs mt-1 text-slate-500">
                  Select attendees from the directory or approve volunteer submissions.
                </p>
              </div>
            ) : (
              <div
                className="transition-transform origin-top duration-200"
                style={{ transform: `scale(${zoom / 100})` }}
              >
                <div ref={componentRef} className="print-engine-container">
                  {currentPrintSheets.map((sheet, idx) => (
                    <div
                      key={`sheet-${sheet.pageNum}-${sheet.type}`}
                      className="bg-white shadow-2xl mx-auto mb-8 print:shadow-none print:mb-0 relative"
                      style={{
                        width: '210mm',
                        height: '297mm',
                        padding: '5mm',
                        boxSizing: 'border-box',
                        pageBreakAfter: 'always',
                        pageBreakInside: 'avoid',
                      }}
                    >
                      <div className="grid grid-cols-3 gap-[2px] justify-items-center content-start h-full">
                        {sheet.data.map((vol, vIdx) => (
                          <div
                            key={vol ? vol.id : `empty-${vIdx}`}
                            className="inline-block print:break-inside-avoid relative group"
                          >
                            {vol ? (
                              <>
                                <IDCard volunteer={vol} size={cardSize} side={sheet.type} />
                                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center print:hidden rounded-lg z-50">
                                  <button
                                    onClick={() => handlePrintSingleCard(vol)}
                                    className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 hover:bg-blue-500"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                    Print Single Card
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div
                                style={{
                                  width: cardSize === 'standard' ? '54mm' : '60mm',
                                  height: cardSize === 'standard' ? '86mm' : '95mm',
                                }}
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="absolute -bottom-6 left-0 text-slate-500 text-[11px] font-mono print:hidden">
                        Page {idx + 1} • {sheet.type.toUpperCase()} (Sheet {sheet.pageNum})
                      </div>
                    </div>
                  ))}

                  <style
                    dangerouslySetInnerHTML={{
                      __html: `
                    @media print {
                      @page {
                        size: A4 portrait;
                        margin: 0 !important;
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
                  `,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
