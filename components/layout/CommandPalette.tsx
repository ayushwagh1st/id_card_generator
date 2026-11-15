'use client'

import { useEffect, useRef, useState, type ElementType, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { getWorkspaceCommands, type WorkspaceRole } from './navigation'

interface CommandItem { id: string; title: string; subtitle: string; category: string; icon: ElementType; href: string }
export function CommandPalette({ role = 'SUPER_ADMIN' }: { role?: WorkspaceRole }) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const resultsRef = useRef<HTMLDivElement>(null)
  const commands: CommandItem[] = getWorkspaceCommands(role).map(item => ({ ...item, title: item.name, subtitle: item.description }))
  const filteredCommands = commands.filter(command => `${command.title} ${command.subtitle} ${command.category}`.toLowerCase().includes(query.toLowerCase()))
  const activeId = filteredCommands[selectedIndex]?.id

  useEffect(() => {
    const list = resultsRef.current
    const option = activeId ? document.getElementById(`command-${activeId}`) : null
    if (!isOpen || !list || !option) return
    const listBounds = list.getBoundingClientRect()
    const optionBounds = option.getBoundingClientRect()
    if (optionBounds.top < listBounds.top) list.scrollTop -= listBounds.top - optionBounds.top
    else if (optionBounds.bottom > listBounds.bottom) list.scrollTop += optionBounds.bottom - listBounds.bottom
  }, [activeId, isOpen])

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setIsOpen(open => !open)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const selectCommand = (item: CommandItem) => {
    setIsOpen(false)
    setQuery('')
    setSelectedIndex(0)
    router.push(item.href)
  }
  const handleArrowNav = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return
    if (!filteredCommands.length) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setSelectedIndex(index => (index + (event.key === 'ArrowDown' ? 1 : -1) + filteredCommands.length) % filteredCommands.length)
    } else if (event.key === 'Enter' && filteredCommands[selectedIndex]) {
      event.preventDefault()
      // Safari can end composition before delivering its confirming Enter.
      if (event.nativeEvent.keyCode === 229) return
      selectCommand(filteredCommands[selectedIndex])
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="workspace-command-trigger" aria-label="Search pages and tools">
        <Search size={16} aria-hidden="true" />
        <span>Go to page…</span>
        <kbd>Ctrl K</kbd>
      </DialogTrigger>
      <DialogContent className="workspace-command-dialog translate-x-0 translate-y-0" style={{ translate: 'none' }} showCloseButton={false} data-motion="none">
        <DialogTitle className="sr-only">Find your next task</DialogTitle>
        <DialogDescription className="sr-only">Search the portal&apos;s pages and tools.</DialogDescription>
        <label htmlFor="workspace-command-search" className="sr-only">Search pages and tools</label>
        <div className="workspace-command-header">
          <Search size={18} className="workspace-command-search-icon" aria-hidden="true" />
          <input
            id="workspace-command-search"
            className="workspace-command-input"
            role="combobox"
            aria-label="Search pages and tools"
            aria-expanded={isOpen}
            aria-controls="workspace-command-results"
            aria-autocomplete="list"
            aria-activedescendant={filteredCommands[selectedIndex] ? `command-${filteredCommands[selectedIndex].id}` : undefined}
            autoFocus
            placeholder="Search registration, printing, sessions…"
            value={query}
            onKeyDown={handleArrowNav}
            onChange={event => { setQuery(event.target.value); setSelectedIndex(0) }}
          />
          {query ? (
            <button
              type="button"
              className="workspace-command-clear"
              onClick={() => { setQuery(''); setSelectedIndex(0) }}
              aria-label="Clear search"
            >
              <X size={15} aria-hidden="true" />
            </button>
          ) : (
            <button type="button" className="workspace-command-dismiss" aria-label="Close search" onClick={() => setIsOpen(false)}><kbd className="workspace-command-kbd">ESC</kbd></button>
          )}
        </div>
        <div ref={resultsRef} id="workspace-command-results" role="listbox" aria-label="Matching pages" className="workspace-command-results">
          {!filteredCommands.length ? (
            <p className="workspace-command-empty">No matching pages. Try a shorter search or a different task.</p>
          ) : (
            filteredCommands.map((item, index) => {
              const Icon = item.icon
              return (
                <button
                  type="button"
                  role="option"
                  aria-label={`${item.title}: ${item.subtitle}`}
                  id={`command-${item.id}`}
                  aria-selected={index === selectedIndex}
                  tabIndex={-1}
                  key={item.id}
                  className="workspace-command-option"
                  onPointerMove={() => setSelectedIndex(index)}
                  onClick={() => selectCommand(item)}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.subtitle}</small>
                  </span>
                  <span className="workspace-command-category">{item.category}</span>
                </button>
              )
            })
          )}
        </div>
        <p className="workspace-command-hint">Arrow keys to navigate · Enter to open · Escape to close</p>
      </DialogContent>
    </Dialog>
  )
}
