import React from 'react'
import { X } from 'lucide-react'

interface FormModalProps {
  /** Whether the modal is visible */
  isOpen: boolean
  /** Modal header title */
  title: string
  /** Called when the user closes the modal (X button or Cancel) */
  onClose: () => void
  /** Called when the form is submitted */
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  /** Disables the submit button and shows a loading label */
  isSubmitting: boolean
  /** Label for the submit button (e.g. "Save Account") */
  submitLabel: string
  /** If non-null, displays an error banner at the top of the form */
  saveError: string | null
  /** Form body content */
  children: React.ReactNode
}

/**
 * A reusable modal dialog with a consistent header, error banner,
 * form body slot, and cancel / submit footer.
 */
function FormModal({
  isOpen,
  title,
  onClose,
  onSubmit,
  isSubmitting,
  submitLabel,
  saveError,
  children
}: FormModalProps): React.JSX.Element | null {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-[var(--color-background-soft)] border border-[var(--theme-border-soft)] w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--theme-border-soft)] bg-[var(--color-background-mute)]">
          <h3 className="text-lg font-bold text-[var(--theme-text-strong)]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--theme-text-muted)] hover:text-[var(--theme-text-strong)] hover:bg-[var(--theme-control-hover)] p-1.5 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="px-8 py-6 flex flex-col gap-8">
          {saveError && (
            <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
              {saveError}
            </div>
          )}

          {children}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--theme-border-soft)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-lg text-[var(--theme-text-strong)] hover:bg-[var(--theme-control-hover)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/40 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              {isSubmitting ? 'Saving...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FormModal
