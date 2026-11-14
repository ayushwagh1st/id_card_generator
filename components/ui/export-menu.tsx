'use client'

import { Menu } from '@base-ui/react/menu'
import { ChevronDown, Download, FileSpreadsheet, FileText } from 'lucide-react'
import { Button } from './button'

export function ExportMenu({ onCSV, onPDF, disabled = false, label = 'Export' }: { onCSV: () => void; onPDF: () => void; disabled?: boolean; label?: string }) {
  return <Menu.Root>
    <Menu.Trigger aria-label={label} render={<Button variant="outline" disabled={disabled} />}><Download size={16} aria-hidden="true" />Export<ChevronDown size={14} aria-hidden="true" /></Menu.Trigger>
    <Menu.Portal><Menu.Positioner sideOffset={6} align="end" className="workspace-menu-positioner"><Menu.Popup className="workspace-action-menu">
      <Menu.Item className="workspace-menu-item" onClick={onCSV}><FileSpreadsheet size={16} aria-hidden="true" />Export CSV</Menu.Item>
      <Menu.Item className="workspace-menu-item" onClick={onPDF}><FileText size={16} aria-hidden="true" />Export PDF</Menu.Item>
    </Menu.Popup></Menu.Positioner></Menu.Portal>
  </Menu.Root>
}
