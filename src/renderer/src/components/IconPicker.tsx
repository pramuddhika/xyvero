import React from 'react'
import { Icon, iconsList } from './Icon'

interface IconPickerProps {
  /** Currently selected icon name */
  selectedIcon: string
  /** Currently selected colour – used to tint the active icon */
  selectedColor: string
  /** Callback fired when the user picks an icon */
  onSelect: (iconName: string) => void
}

/**
 * A fixed-height, scrollable grid of all available icons.
 * The currently selected icon is highlighted with the chosen colour.
 */
function IconPicker({ selectedIcon, selectedColor, onSelect }: IconPickerProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-12 sm:grid-cols-14 md:grid-cols-16 gap-1.5 p-2 border border-[var(--theme-border-soft)] rounded-lg bg-[var(--theme-control-bg)] max-h-28 overflow-y-auto custom-scrollbar">
      {iconsList.map((iconName) => {
        const isSelected = selectedIcon === iconName
        return (
          <button
            key={iconName}
            type="button"
            onClick={() => onSelect(iconName)}
            className={`aspect-square flex items-center justify-center rounded-md transition-all border cursor-pointer ${
              isSelected
                ? 'scale-105 shadow-sm text-white'
                : 'border-transparent text-[var(--theme-text-muted)] hover:bg-[var(--theme-control-hover)] hover:text-[var(--theme-text-strong)]'
            }`}
            style={{
              backgroundColor: isSelected ? selectedColor : undefined,
              borderColor: isSelected ? selectedColor : undefined
            }}
            title={iconName}
          >
            <Icon icon={iconName} size={16} />
          </button>
        )
      })}
    </div>
  )
}

export default IconPicker
