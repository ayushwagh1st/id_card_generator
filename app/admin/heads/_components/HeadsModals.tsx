'use client'
import { ActionForm } from '@/components/ui/action-form'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AnimatedLoader } from '@/components/ui/animated-loader'
import { Plus, RefreshCw, Copy, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { useCallback } from 'react'

function generatePassword(length = 10) {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const all = upper + lower + digits
  let pass =
    upper[Math.floor(Math.random() * upper.length)] +
    lower[Math.floor(Math.random() * lower.length)] +
    digits[Math.floor(Math.random() * digits.length)]
  for (let i = 3; i < length; i++) {
    pass += all[Math.floor(Math.random() * all.length)]
  }
  return pass.split('').sort(() => Math.random() - 0.5).join('')
}

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
  
  const handleGenerate = useCallback(() => {
    const newPass = generatePassword()
    dispatch({ type: 'SET_FORM_FIELD', field: 'headPassword', value: newPass })
    if (!state.visiblePasswords['head']) {
      dispatch({ type: 'TOGGLE_PASSWORD', payload: 'head' })
    }
  }, [dispatch, state.visiblePasswords])

  const handleResetGenerate = useCallback(() => {
    const newPass = generatePassword()
    dispatch({ type: 'SET_FORM_FIELD', field: 'headPassword', value: newPass })
    if (!state.visiblePasswords['reset']) {
      dispatch({ type: 'TOGGLE_PASSWORD', payload: 'reset' })
    }
  }, [dispatch, state.visiblePasswords])

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Password copied to clipboard')
    } catch {
      toast.error('Failed to copy')
    }
  }, [])

  return (
    <>
      {/* Create Dialog */}
      <Dialog open={state.isAddHeadOpen} onOpenChange={(val) => val ? dispatch({ type: 'OPEN_ADD' }) : dispatch({ type: 'CLOSE_ADD' })}>
        <DialogTrigger className="w-full sm:w-auto">
          <span className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 px-5 h-10 text-xs sm:text-sm font-semibold cursor-pointer transition-all">
            <Plus className="h-4 w-4 mr-2" />
            Add Model Head
          </span>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Add Model Head
            </DialogTitle>
            <DialogDescription>
              Create a new model head account. They'll receive credentials to access the portal.
            </DialogDescription>
          </DialogHeader>
          <ActionForm onSubmit={handleCreateHead} className="space-y-4 py-2">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="head-name" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Full Name *</Label>
                <Input id="head-name" placeholder="Full name" value={state.headName} onChange={e => dispatch({ type: 'SET_FORM_FIELD', field: 'headName', value: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="head-email" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Email (Login ID) *</Label>
                <Input id="head-email" type="email" placeholder="email@example.com" value={state.headEmail} onChange={e => dispatch({ type: 'SET_FORM_FIELD', field: 'headEmail', value: e.target.value })} required />
              </div>
            </div>

            {/* Password with generate */}
            <div className="space-y-1.5 p-4 border border-dashed rounded-lg bg-muted/30">
              <Label htmlFor="head-password" className="text-[11px] font-bold text-muted-foreground uppercase">Password *</Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    id="head-password"
                    type={state.visiblePasswords['head'] ? 'text' : 'password'}
                    value={state.headPassword}
                    onChange={e => dispatch({ type: 'SET_FORM_FIELD', field: 'headPassword', value: e.target.value })}
                    required
                    minLength={6}
                    placeholder="Enter or generate password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'TOGGLE_PASSWORD', payload: 'head' })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {state.visiblePasswords['head'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleGenerate}
                  title="Generate password"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                {state.headPassword && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(state.headPassword)}
                    title="Copy password"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Use the generate button for a strong random password.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => dispatch({ type: 'CLOSE_ADD' })}>Cancel</Button>
              <Button type="submit" disabled={state.isCreatingHead}>
                {state.isCreatingHead ? <><AnimatedLoader className="mr-2 h-4 w-4" /> Creating...</> : 'Create Account'}
              </Button>
            </DialogFooter>
          </ActionForm>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={state.isEditHeadOpen} onOpenChange={(val) => !val && dispatch({ type: 'CLOSE_EDIT' })}>
        <DialogContent className="sm:max-w-lg rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Model Head</DialogTitle>
            <DialogDescription>Update the name or login email for this user.</DialogDescription>
          </DialogHeader>
          <ActionForm onSubmit={handleUpdateHead} className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-head-name" className="text-[11px] font-bold text-muted-foreground uppercase">Full Name *</Label>
                <Input id="edit-head-name" value={state.headName} onChange={e => dispatch({ type: 'SET_FORM_FIELD', field: 'headName', value: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-head-email" className="text-[11px] font-bold text-muted-foreground uppercase">Email (Login ID) *</Label>
                <Input id="edit-head-email" type="email" value={state.headEmail} onChange={e => dispatch({ type: 'SET_FORM_FIELD', field: 'headEmail', value: e.target.value })} required />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => dispatch({ type: 'CLOSE_EDIT' })}>Cancel</Button>
              <Button type="submit" disabled={state.isUpdating}>
                {state.isUpdating ? <AnimatedLoader className="h-4 w-4" /> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </ActionForm>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={state.isResetPassOpen} onOpenChange={(val) => !val && dispatch({ type: 'CLOSE_RESET' })}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Reset Password</DialogTitle>
            <DialogDescription>Assign a new temporary password to {state.currentHead?.full_name}.</DialogDescription>
          </DialogHeader>
          <ActionForm onSubmit={handleResetPassword} className="space-y-4 py-2">
            <div className="space-y-1.5 p-4 border border-dashed rounded-lg bg-muted/30">
              <Label htmlFor="reset-head-password" className="text-[11px] font-bold text-muted-foreground uppercase">New Password *</Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    id="reset-head-password"
                    type={state.visiblePasswords['reset'] ? 'text' : 'password'}
                    value={state.headPassword}
                    onChange={e => dispatch({ type: 'SET_FORM_FIELD', field: 'headPassword', value: e.target.value })}
                    required
                    minLength={6}
                    placeholder="Min. 6 characters"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'TOGGLE_PASSWORD', payload: 'reset' })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {state.visiblePasswords['reset'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleResetGenerate}
                  title="Generate password"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                {state.headPassword && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(state.headPassword)}
                    title="Copy password"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => dispatch({ type: 'CLOSE_RESET' })}>Cancel</Button>
              <Button type="submit" disabled={state.isUpdating}>
                {state.isUpdating ? <AnimatedLoader className="h-4 w-4" /> : 'Reset Password'}
              </Button>
            </DialogFooter>
          </ActionForm>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={state.isDeleteOpen} onOpenChange={(val) => !val && dispatch({ type: 'CLOSE_DELETE' })}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-rose-600 font-bold">Delete Account</DialogTitle>
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
