'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AnimatedLoader } from '@/components/ui/animated-loader'
import { Plus } from 'lucide-react'

export function HeadsModals({
  state,
  dispatch,
  handleCreateHead,
  handleUpdateHead,
  handleResetPassword,
  handleDeleteHead
}: {
  state: any,
  dispatch: any,
  handleCreateHead: (e: React.FormEvent) => any,
  handleUpdateHead: (e: React.FormEvent) => any,
  handleResetPassword: (e: React.FormEvent) => any,
  handleDeleteHead: () => any
}) {
  return (
    <>
      {/* Create Dialog */}
      <Dialog open={state.isAddHeadOpen} onOpenChange={(val) => val ? dispatch({ type: 'OPEN_ADD' }) : dispatch({ type: 'CLOSE_ADD' })}>
        <DialogTrigger>
          <div className="w-full sm:w-auto px-5 gap-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10">
            <Plus className="h-4 w-4 mr-2" />
            Create Model Head
          </div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Create Model Head</DialogTitle>
            <DialogDescription>
              Generate credentials for a new exhibition supervisor.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateHead} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="head-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
              <Input id="head-name" placeholder="e.g. Ramesh Kumar" value={state.headName} onChange={e => dispatch({ type: 'SET_FORM_FIELD', field: 'headName', value: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="head-email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email (Login ID)</Label>
              <Input id="head-email" type="email" placeholder="ramesh@example.com" value={state.headEmail} onChange={e => dispatch({ type: 'SET_FORM_FIELD', field: 'headEmail', value: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="head-pass" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Temporary Password</Label>
              <Input id="head-pass" type="password" placeholder="Min. 6 characters" value={state.headPassword} onChange={e => dispatch({ type: 'SET_FORM_FIELD', field: 'headPassword', value: e.target.value })} required minLength={6} />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => dispatch({ type: 'CLOSE_ADD' })}>Cancel</Button>
              <Button type="submit" disabled={state.isCreatingHead}>
                {state.isCreatingHead ? <><AnimatedLoader className="mr-2 h-4 w-4" /> Creating...</> : 'Create Account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={state.isEditHeadOpen} onOpenChange={(val) => !val && dispatch({ type: 'CLOSE_EDIT' })}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Edit Model Head</DialogTitle>
            <DialogDescription>Update the name or login email for this user.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateHead} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Full Name</Label>
              <Input value={state.headName} onChange={e => dispatch({ type: 'SET_FORM_FIELD', field: 'headName', value: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Email (Login ID)</Label>
              <Input type="email" value={state.headEmail} onChange={e => dispatch({ type: 'SET_FORM_FIELD', field: 'headEmail', value: e.target.value })} required />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => dispatch({ type: 'CLOSE_EDIT' })}>Cancel</Button>
              <Button type="submit" disabled={state.isUpdating}>
                {state.isUpdating ? <AnimatedLoader className="h-4 w-4" /> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={state.isResetPassOpen} onOpenChange={(val) => !val && dispatch({ type: 'CLOSE_RESET' })}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Assign a new temporary password to {state.currentHead?.full_name}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">New Password</Label>
              <Input type="text" value={state.headPassword} onChange={e => dispatch({ type: 'SET_FORM_FIELD', field: 'headPassword', value: e.target.value })} required minLength={6} placeholder="Min. 6 characters" />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => dispatch({ type: 'CLOSE_RESET' })}>Cancel</Button>
              <Button type="submit" disabled={state.isUpdating}>
                {state.isUpdating ? <AnimatedLoader className="h-4 w-4" /> : 'Reset Password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={state.isDeleteOpen} onOpenChange={(val) => !val && dispatch({ type: 'CLOSE_DELETE' })}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-rose-600">Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete <strong>{state.currentHead?.full_name}</strong>? 
              This will remove their login access. Reassign their models first if necessary.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => dispatch({ type: 'CLOSE_DELETE' })}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteHead} disabled={state.isUpdating}>
              {state.isUpdating ? <AnimatedLoader className="h-4 w-4" /> : 'Yes, Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
