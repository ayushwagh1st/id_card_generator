'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Filter, Plus } from 'lucide-react'

// Hooks
import { useVolunteersState } from './_hooks/useVolunteersState'

// Subcomponents
import { CSVUpload } from '@/components/volunteers/CSVUpload'
import { VolunteersHeader } from './_components/VolunteersHeader'
import { VolunteersFilters } from './_components/VolunteersFilters'
import { VolunteersTable } from './_components/VolunteersTable'
import { VolunteersModals } from './_components/VolunteersModals'

export default function VolunteersPage() {
  const {
    state,
    dispatchField,
    fetchVolunteers,
    handleCreateVolunteer,
    openEditDialog,
    handleUpdateVolunteer,
    handleStatusChange,
    handleBulkApprove,
    handleBulkDelete,
    handleExportPDF,
    handlePhotoUpload,
    handleCropComplete,
    handlePrintSelected,
    handlePrintSingle,
    toggleSelectAll,
    toggleSelect,
    totalPages,
    resetForm,
  } = useVolunteersState()

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <VolunteersHeader />

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList className="bg-muted p-1 rounded-xl">
          <TabsTrigger value="list" className="rounded-lg">All Volunteers</TabsTrigger>
          <TabsTrigger value="import" className="rounded-lg">Bulk Import (CSV)</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <VolunteersFilters
            searchTerm={state.searchTerm}
            filterModel={state.filterModel}
            filterStatus={state.filterStatus}
            models={state.models}
            selectedIdsCount={state.selectedIds.length}
            onSearchChange={(val) => {
              dispatchField('searchTerm', val)
              dispatchField('page', 1)
            }}
            onModelChange={(val) => {
              dispatchField('filterModel', val || 'all')
              dispatchField('page', 1)
            }}
            onStatusChange={(val) => {
              dispatchField('filterStatus', val || 'all')
              dispatchField('page', 1)
            }}
            onPrintSelected={handlePrintSelected}
            onBulkApprove={handleBulkApprove}
            onBulkDelete={handleBulkDelete}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                window.open(
                  `/api/export?type=volunteers&status=${state.filterStatus}&model=${state.filterModel}&search=${state.searchTerm}`,
                  '_blank'
                )
              }}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>

            <Button variant="outline" className="w-full sm:w-auto" onClick={handleExportPDF}>
              <Download className="w-4 h-4" />
              Export PDF
            </Button>

            <Button
              className="w-full sm:w-auto px-5 gap-2"
              onClick={() => {
                resetForm()
                dispatchField('isAddOpen', true)
              }}
            >
              <Plus className="h-4 w-4" />
              Add Volunteer
            </Button>
          </div>

          <VolunteersTable
            volunteers={state.volunteers}
            loading={state.loading}
            selectedIds={state.selectedIds}
            page={state.page}
            totalPages={totalPages}
            totalCount={state.totalCount}
            searchTerm={state.searchTerm}
            filterStatus={state.filterStatus}
            filterModel={state.filterModel}
            onToggleSelectAll={toggleSelectAll}
            onToggleSelect={toggleSelect}
            onOpenEdit={openEditDialog}
            onPrintSingle={handlePrintSingle}
            onStatusChange={handleStatusChange}
            onPageChange={(updater) => {
              if (typeof updater === 'function') {
                dispatchField('page', updater(state.page))
              } else {
                dispatchField('page', updater)
              }
            }}
          />
        </TabsContent>

        <TabsContent value="import">
          <div className="grid gap-6 md:grid-cols-2">
            <CSVUpload onUploadSuccess={fetchVolunteers} />
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Import CSV Guidelines</CardTitle>
                <CardDescription>Follow these validation checks to avoid parse compilation errors.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>The import engine maps headers dynamically. Download the template below for perfect mapping.</p>

                <div className="grid grid-cols-2 gap-2 bg-muted/40 p-3 rounded-lg border border-primary/5 text-xs text-foreground font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Full Name
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Mobile Number
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                    Gender
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                    Age
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                    Model Name
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                    Emergency Contact
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                    Designation
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                    Team
                  </div>
                </div>
                <div className="text-xs flex items-center gap-2 p-2.5 bg-indigo-50 border border-indigo-100 rounded-md text-indigo-700">
                  <Filter className="w-4 h-4 flex-shrink-0" />
                  <span>
                    The <b>Model Name</b> column automatically assigns volunteers to their respective divisions!
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <VolunteersModals
        models={state.models}
        isAddOpen={state.isAddOpen}
        onAddOpenChange={(open) => dispatchField('isAddOpen', open)}
        onCreate={handleCreateVolunteer}
        isEditOpen={state.isEditOpen}
        onEditOpenChange={(open) => dispatchField('isEditOpen', open)}
        onUpdate={handleUpdateVolunteer}
        fullName={state.fullName}
        mobileNumber={state.mobileNumber}
        gender={state.gender}
        age={state.age}
        emergencyContact={state.emergencyContact}
        address={state.address}
        modelId={state.modelId}
        role={state.role}
        branch={state.branch}
        accommodation={state.accommodation}
        remarks={state.remarks}
        photoUrl={state.photoUrl}
        uploadingPhoto={state.uploadingPhoto}
        cropDialogOpen={state.cropDialogOpen}
        cropImageSrc={state.cropImageSrc}
        onFieldChange={dispatchField}
        onPhotoUpload={handlePhotoUpload}
        onCropComplete={handleCropComplete}
      />
    </div>
  )
}
