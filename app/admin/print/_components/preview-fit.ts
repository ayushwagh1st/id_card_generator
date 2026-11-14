export const A4_WIDTH_PX = 210 * 96 / 25.4
export const A4_HEIGHT_PX = 297 * 96 / 25.4
export const PREVIEW_SHEET_GAP_PX = 15 * 96 / 25.4

export function getPreviewFitZoom(width: number, height: number, mode: 'width' | 'page') {
  const scale = mode === 'page' ? Math.min(width / A4_WIDTH_PX, height / (A4_HEIGHT_PX + PREVIEW_SHEET_GAP_PX)) : width / A4_WIDTH_PX
  return Math.max(10, Math.min(200, Math.floor(scale * 100)))
}
