

export type AnchorRect = {
  top: number
  bottom: number
  left: number
  right: number
}

export type MenuSize = { width: number; height: number }

export type MenuPosition = { top: number; left: number }


const VIEWPORT_MARGIN = 8


const ANCHOR_GAP = 6

export function computeMenuPosition(
  anchor: AnchorRect,
  menu: MenuSize,
  viewport: { width: number; height: number }
): MenuPosition {
  const maxTop = Math.max(VIEWPORT_MARGIN, viewport.height - menu.height - VIEWPORT_MARGIN)
  const maxLeft = Math.max(VIEWPORT_MARGIN, viewport.width - menu.width - VIEWPORT_MARGIN)

  let top = anchor.top - menu.height - ANCHOR_GAP
  if (top < VIEWPORT_MARGIN) top = anchor.bottom + ANCHOR_GAP
  if (top > maxTop) top = maxTop

  const center = (anchor.left + anchor.right) / 2
  const left = Math.min(Math.max(VIEWPORT_MARGIN, center - menu.width / 2), maxLeft)

  return { top, left }
}
