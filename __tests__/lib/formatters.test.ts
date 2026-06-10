import { describe, it, expect } from 'vitest'
import {
  formatSessionLabel,
  formatVolunteerLabel,
  formatModelLabel,
  formatLecturerLabel,
  formatHeadLabel,
  getSessionDisplayName,
  getVolunteerDisplayName,
  getModelDisplayName,
  getLecturerDisplayName,
  getHeadDisplayName
} from '../../lib/formatters'

describe('Formatters', () => {
  it('should format session label', () => {
    expect(formatSessionLabel({ title: 'Morning', date: '2026-10-10' })).toContain('Morning')
    expect(formatSessionLabel(null)).toBe('Unknown Session')
  })

  it('should format volunteer label', () => {
    expect(formatVolunteerLabel({ full_name: 'John Doe', snk_id: 'V123' })).toBe('John Doe (V123)')
    expect(formatVolunteerLabel(null)).toBe('Unknown Volunteer')
  })

  it('should format model label', () => {
    expect(formatModelLabel({ name: 'Model A' })).toBe('Model A')
    expect(formatModelLabel(null)).toBe('Unknown Model')
  })

  it('should format lecturer label', () => {
    expect(formatLecturerLabel({ full_name: 'Lecturer A' })).toBe('Lecturer A')
    expect(formatLecturerLabel(null)).toBe('Unknown Lecturer')
  })

  it('should format head label', () => {
    expect(formatHeadLabel({ full_name: 'Head A' })).toBe('Head A')
    expect(formatHeadLabel(null)).toBe('Unknown Head')
  })

  it('should have working aliases', () => {
    expect(getSessionDisplayName).toBe(formatSessionLabel)
    expect(getVolunteerDisplayName).toBe(formatVolunteerLabel)
    expect(getModelDisplayName).toBe(formatModelLabel)
    expect(getLecturerDisplayName).toBe(formatLecturerLabel)
    expect(getHeadDisplayName).toBe(formatHeadLabel)
  })
})
