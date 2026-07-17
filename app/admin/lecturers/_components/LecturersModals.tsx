'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Shield, RefreshCw, Copy, Eye, EyeOff } from 'lucide-react'
import { useState, useCallback } from 'react'
import { toast } from 'sonner'

function generatePassword(length = 10) {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const all = upper + lower + digits
  // Ensure at least one of each category
  let pass =
    upper[Math.floor(Math.random() * upper.length)] +
    lower[Math.floor(Math.random() * lower.length)] +
    digits[Math.floor(Math.random() * digits.length)]
  for (let i = 3; i < length; i++) {
    pass += all[Math.floor(Math.random() * all.length)]
  }
  // Shuffle
  return pass.split('').sort(() => Math.random() - 0.5).join('')
}

export function LecturersModals({
  isAddOpen, setIsAddOpen,
  isEditOpen, setIsEditOpen,
  isResetPassOpen, setIsResetPassOpen,
  currentLecturer,
  name, setName,
  email, setEmail,
  mobile, setMobile,
  password, setPassword,
  status, setStatus,
  handleCreate,
  handleUpdate,
  handleResetPassword
}: any) {
  const [showPassword, setShowPassword] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)

  const handleGenerate = useCallback(() => {
    const newPass = generatePassword()
    setPassword(newPass)
    setShowPassword(true)
  }, [setPassword])

  const handleResetGenerate = useCallback(() => {
    const newPass = generatePassword()
    setPassword(newPass)
    setShowResetPassword(true)
  }, [setPassword])

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
      {/* ── Add Security Dialog ── */}
      <Dialog open={isAddOpen} onOpenChange={(open) => {
        setIsAddOpen(open)
        if (!open) setShowPassword(false)
      }}>
        <DialogTrigger
          render={<Button className="w-full sm:w-auto px-5 gap-2 shadow-hard-xs font-bold" />}
        >
          <Plus className="h-4 w-4" /> Add Security
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Add Security Personnel
            </DialogTitle>
            <DialogDescription>
              Create a new security account. They'll receive credentials to access the portal.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-2">
            {/* Name & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Full Name *</Label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Email *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="security@example.com"
                />
              </div>
            </div>

            {/* Mobile & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Mobile</Label>
                <Input
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  placeholder="Contact number"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Status</Label>
                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Password with generate */}
            <div className="space-y-1.5 p-4 border border-dashed rounded-lg bg-muted/30">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase">Password *</Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="Enter or generate password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                {password && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(password)}
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
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit">
                <Shield className="h-4 w-4 mr-1.5" /> Create Security
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Security Dialog ── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Security</DialogTitle>
            <DialogDescription>Update security personnel information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Full Name *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Email *</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Mobile</Label>
                <Input value={mobile} onChange={e => setMobile(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Status</Label>
                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Reset Password Dialog ── */}
      <Dialog open={isResetPassOpen} onOpenChange={(open) => {
        setIsResetPassOpen(open)
        if (!open) setShowResetPassword(false)
      }}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Reset Password</DialogTitle>
            <DialogDescription>Assign a new temporary password to {currentLecturer?.name}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4 py-2">
            <div className="space-y-1.5 p-4 border border-dashed rounded-lg bg-muted/30">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase">New Password *</Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showResetPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Min. 6 characters"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                {password && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(password)}
                    title="Copy password"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsResetPassOpen(false)}>Cancel</Button>
              <Button type="submit">Reset Password</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
