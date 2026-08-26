import React from 'react'
import { Check } from 'lucide-react'
import { COLOR_PALETTE } from './Color'

interface ColorPickerProps {
  /** Currently selected hex colour */
  selectedColor: string
  /** Callback fired when the user picks a colour */
  onSelect: (color: string) => void
}

/**
 * A fixed-height, scrollable grid of colour swatches.
 * The currently selected colour shows a white check-mark overlay.
 */
function ColorPicker({ selectedColor, onSelect }: ColorPickerProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-12 sm:grid-cols-14 md:grid-cols-16 gap-1.5 p-2 border border-[var(--theme-border-soft)] rounded-lg bg-[var(--theme-control-bg)] max-h-28 overflow-y-auto custom-scrollbar">
      {COLOR_PALETTE.map((colorHex) => {
        const isSelected = selectedColor.toLowerCase() === colorHex.toLowerCase()
        return (
          <button
            key={colorHex}
            type="button"
            onClick={() => onSelect(colorHex)}
            className="w-full aspect-square rounded-full flex items-center justify-center transition-all scale-95 hover:scale-110 active:scale-95 relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            style={{ backgroundColor: colorHex }}
            title={colorHex}
          >
            {isSelected && (
              <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow-md">
                <Check size={12} strokeWidth={3} />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default ColorPicker
