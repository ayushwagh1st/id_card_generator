'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { UploadCloud, CheckCircle2, AlertCircle, Download, Loader2, FileSpreadsheet } from 'lucide-react'
import Papa from 'papaparse'
import { toast } from 'sonner'
import { bulkImportVolunteersAction } from '@/server/actions/volunteers'
import { getModelsDataAction } from '@/app/admin/models/actions.server'
import { GlassCard } from '@/components/ui/GlassCard'

const downloadTemplate = () => {
  const headers = "Full Name,Mobile Number,Gender,Age,Model Name,Emergency Contact,Designation,Team,Address,Remarks"
  const sample = "John Doe,9876543210,Male,25,Main Stage,+91 1234567890,Usher,Alpha,123 Street,"
  const csvContent = `${headers}\n${sample}`
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', 'volunteer_import_template.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function CSVUpload({ onUploadSuccess }: { onUploadSuccess?: (data: any[]) => void }) {
  const [state, dispatch] = React.useReducer(
    (state: any, action: Partial<any>) => ({ ...state, ...action }),
    {
      file: null,
      error: null,
      parsedData: [],
      validationResults: null,
      importing: false,
      results: null
    }
  )

  const { file, error, parsedData, validationResults, importing, results } = state

  const setFile = (v: any) => dispatch({ file: typeof v === 'function' ? v(file) : v })
  const setError = (v: any) => dispatch({ error: typeof v === 'function' ? v(error) : v })
  const setParsedData = (v: any) => dispatch({ parsedData: typeof v === 'function' ? v(parsedData) : v })
  const setValidationResults = (v: any) => dispatch({ validationResults: typeof v === 'function' ? v(validationResults) : v })
  const setImporting = (v: any) => dispatch({ importing: typeof v === 'function' ? v(importing) : v })
  const setResults = (v: any) => dispatch({ results: typeof v === 'function' ? v(results) : v })

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
      setResults(null)
      setParsedData([])
      setValidationResults(null)
    }
  }

  const previewCSV = async () => {
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const data = result.data as any[]
        const valid: any[] = []
        const invalid: any[] = []
        const errors: string[] = []
        
        const modelsData = await getModelsDataAction()
        const modelMap: Record<string, string> = {}
        if (modelsData) {
          modelsData.forEach((m: any) => {
            modelMap[m.name.toLowerCase()] = m.id
          })
        }

        data.forEach((row, index) => {
          const name = row['Full Name']?.trim()
          const mobile = (row['Mobile Number'] || row['Mobile'])?.trim()
          
          if (!name || !mobile) {
            invalid.push(row)
            errors.push(`Row ${index + 2}: Missing required fields (Full Name or Mobile Number)`)
          } else {
            const rowModelName = (row['Model Name'] || row['Model'] || '').trim()
            const matchedModelId = modelMap[rowModelName.toLowerCase()] || null

            valid.push({
              full_name: name,
              mobile_number: mobile,
              gender: row['Gender'] || 'Male',
              age: row['Age'] ? parseInt(row['Age']) : null,
              emergency_contact: row['Emergency Contact'] || row['Emergency'] || '',
              address: row['Address'] || '',
              role: row['Role'] || row['Designation'] || 'Volunteer',
              model_id: matchedModelId,
              original_model_name: rowModelName,
              status: 'Approved',
              accommodation: (row['Accommodation'] || '').toLowerCase() === 'yes' || (row['Accommodation'] || '').toLowerCase() === 'true',
              branch: row['Branch'] || row['City'] || 'General'
            })
          }
        })

        setParsedData(valid)
        setValidationResults({ valid, invalid, errors })
      },
      error: (err) => {
        setError(`CSV Parsing Failed: ${err.message}`)
      }
    })
  }

  const confirmImport = async () => {
    if (!validationResults || validationResults.valid.length === 0) return
    setImporting(true)
    
    try {
      const res = await bulkImportVolunteersAction(validationResults.valid)
      if (res.error) {
        toast.error(res.error)
      } else {
        setResults(res)
        const importedCount = (res as any).count ?? (res as any).successful ?? validationResults.valid.length
        toast.success(`Imported ${importedCount} volunteers`)
        if (onUploadSuccess) onUploadSuccess(validationResults.valid)
      }
    } catch (err: any) {
      toast.error(err.message || 'Bulk import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <GlassCard className="p-6 md:p-8" glowColor="purple">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200/50 dark:border-slate-800/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-purple-500 mb-1">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV Batch Import</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Bulk Import Volunteer Records
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Upload CSV datasets to batch register volunteers and allocate model assignments.
          </p>
        </div>
        <Button variant="outline" onClick={downloadTemplate} className="gap-2 shrink-0">
          <Download className="w-3.5 h-3.5" />
          Download Sample Template
        </Button>
      </div>

      <div className="space-y-6 pt-6">
        {!validationResults && !results && (
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center hover:border-blue-500/50 transition-colors relative bg-white/40 dark:bg-slate-900/40">
            <input 
              aria-label="Upload volunteer CSV file"
              type="file" 
              accept=".csv" 
              onChange={handleFileUpload} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {file ? file.name : 'Drop your CSV file here or click to browse'}
                </p>
                <p className="text-xs text-slate-400 mt-1">Supports UTF-8 formatted .csv files</p>
              </div>
              {file && (
                <Button onClick={(e) => { e.stopPropagation(); previewCSV() }} className="mt-2 z-20">
                  Parse & Validate Dataset
                </Button>
              )}
            </div>
          </div>
        )}

        {error && (
          <div role="alert" className="p-4 rounded-lg border border-destructive text-destructive text-sm">
            {error}
          </div>
        )}

        {validationResults && !results && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-semibold text-emerald-500">
                <CheckCircle2 className="w-4 h-4" />
                {validationResults.valid.length} Valid Records Ready
              </div>
              {validationResults.invalid.length > 0 && (
                <div className="px-3 py-1 bg-rose-500/10 text-rose-500 rounded-full border border-rose-500/20 font-medium">
                  {validationResults.invalid.length} Invalid Records
                </div>
              )}
            </div>

            {validationResults.errors.length > 0 && <section className="import-validation-errors" aria-label="CSV rows needing correction" role="alert"><h3>Rows needing correction</h3><p>Correct these rows in your CSV file, then upload it again. Only valid rows will be imported.</p><ul>{validationResults.errors.map((message: string, index: number) => <li key={`${index}-${message}`}>{message}</li>)}</ul></section>}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Model Area</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Accomm.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validationResults.valid.slice(0, 50).map((row: any) => (
                  <TableRow key={`${row.full_name}-${row.mobile_number}`}>
                    <TableCell className="font-semibold">{row.full_name}</TableCell>
                    <TableCell className="text-slate-500">{row.mobile_number}</TableCell>
                    <TableCell>{row.original_model_name || 'None'}</TableCell>
                    <TableCell>{row.branch}</TableCell>
                    <TableCell className="font-medium text-emerald-500">{row.accommodation ? 'Yes' : 'No'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setFile(null); setValidationResults(null) }}>Cancel</Button>
              <Button 
                onClick={confirmImport} 
                disabled={importing || validationResults.valid.length === 0}
                className="gap-2"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                Confirm Import {validationResults.valid.length} Records
              </Button>
            </div>
          </div>
        )}

        {results && (
          <div className="space-y-3 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Import Completed Successfully</h4>
            <div className="flex gap-4 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                {results.successful} Inserted
              </div>
              {results.duplicates > 0 && (
                <div className="flex items-center gap-1.5 text-amber-500">
                  <AlertCircle className="h-4 w-4" />
                  {results.duplicates} Skipped (Duplicates)
                </div>
              )}
            </div>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => { setFile(null); setResults(null) }}>
              Upload Another File
            </Button>
          </div>
        )}
      </div>
    </GlassCard>
  )
}
