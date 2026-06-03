'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { UploadCloud, CheckCircle2, AlertCircle, Download, Loader2 } from 'lucide-react'
import Papa from 'papaparse'
import { toast } from 'sonner'
import { bulkImportVolunteersAction } from '@/app/actions/volunteers'
import { createClient } from '@/lib/supabase/client'

export function CSVUpload({ onUploadSuccess }: { onUploadSuccess?: (data: any[]) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Preview states
  const [parsedData, setParsedData] = useState<any[]>([])
  const [validationResults, setValidationResults] = useState<{
    valid: any[];
    invalid: any[];
    errors: string[];
  } | null>(null)
  
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<{
    successful: number;
    duplicates: number;
  } | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
      setResults(null)
      setParsedData([])
      setValidationResults(null)
    }
  }

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
        
        // Fetch models to map names
        const supabase = createClient()
        const { data: modelsData } = await supabase.from('models').select('id, name')
        const modelMap: Record<string, string> = {}
        if (modelsData) {
          modelsData.forEach(m => {
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
              designation: row['Role'] || row['Designation'] || 'Volunteer',
              branch: row['Branch'] || '',
              accommodation: ['yes', 'true', '1'].includes(String(row['Accommodation'] || '').toLowerCase().trim()),
              remarks: row['Remarks'] || '',
              status: 'Pending',
              model_id: matchedModelId,
              original_model_name: rowModelName
            })
          }
        })

        setValidationResults({ valid, invalid, errors })
        setParsedData(data)
      },
      error: (err: any) => {
        setError(err.message)
      }
    })
  }

  const confirmImport = async () => {
    if (!validationResults || validationResults.valid.length === 0) return
    
    setImporting(true)
    try {
      // Strip original_model_name before insert
      const payload = validationResults.valid.map(v => {
        const { original_model_name, ...rest } = v
        return rest
      })

      const res = await bulkImportVolunteersAction(payload)
      if (res.error) throw new Error(res.error)

      setResults({ successful: res.count ?? 0, duplicates: res.duplicates ?? 0 })
      if (onUploadSuccess) onUploadSuccess([])
      toast.success(`Successfully imported ${res.count} records. Skipped ${res.duplicates} duplicates.`)
      
      // Cleanup states
      setFile(null)
      setValidationResults(null)
    } catch (err: any) {
      toast.error(err.message || 'Import failed')
      setError(err.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Bulk Import Data</CardTitle>
            <CardDescription>Upload CSV to add volunteers. You will preview before importing.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
            <Download className="w-4 h-4" /> Download Template
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!validationResults && !results && (
            <div className="flex items-center justify-center w-full">
              <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-muted/20 border-muted-foreground/25 hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">CSV (MAX. 10MB)</p>
                </div>
                <input id="dropzone-file" type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          )}
          
          {file && !validationResults && !results && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
              <Button size="sm" onClick={previewCSV}>Preview Data</Button>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-md">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Validation Preview Phase */}
          {validationResults && !results && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-4 text-sm font-semibold">
                <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                  {validationResults.valid.length} Valid Records
                </div>
                {validationResults.invalid.length > 0 && (
                  <div className="px-3 py-1 bg-rose-50 text-rose-700 rounded-full border border-rose-200">
                    {validationResults.invalid.length} Invalid Records
                  </div>
                )}
              </div>

              {validationResults.errors.length > 0 && (
                <div className="text-xs text-red-500 max-h-24 overflow-y-auto space-y-1 bg-red-50 p-2 rounded border border-red-200">
                  {validationResults.errors.map((err, i) => <div key={i}>{err}</div>)}
                </div>
              )}

              <div className="border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-muted sticky top-0">
                    <TableRow>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Mobile</TableHead>
                      <TableHead className="text-xs">Model Area</TableHead>
                      <TableHead className="font-bold text-xs uppercase text-muted-foreground min-w-[100px]">Branch</TableHead>
                      <TableHead className="font-bold text-xs uppercase text-muted-foreground min-w-[80px]">Accomm.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validationResults.valid.slice(0, 50).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs font-medium">{row.full_name}</TableCell>
                        <TableCell className="text-xs">{row.mobile_number}</TableCell>
                        <TableCell className="text-xs">{row.original_model_name || 'None'}</TableCell>
                        <TableCell className="text-xs">{row.branch}</TableCell>
                        <TableCell className="text-xs font-semibold">{row.accommodation ? 'Yes' : 'No'}</TableCell>
                        <TableCell className="text-xs text-emerald-600 font-semibold">Valid</TableCell>
                      </TableRow>
                    ))}
                    {validationResults.valid.length > 50 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-2">
                          ... and {validationResults.valid.length - 50} more valid records
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

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

          {/* Success Results Phase */}
          {results && (
            <div className="space-y-3 p-4 border rounded-md bg-emerald-50/50">
              <h4 className="font-medium text-sm">Import Completed</h4>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1 text-emerald-700 font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  {results.successful} Inserted
                </div>
                {results.duplicates > 0 && (
                  <div className="flex items-center gap-1 text-amber-600 font-bold">
                    <AlertCircle className="h-4 w-4" />
                    {results.duplicates} Skipped (Duplicates)
                  </div>
                )}
              </div>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => { setFile(null); setResults(null) }}>Upload Another</Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
