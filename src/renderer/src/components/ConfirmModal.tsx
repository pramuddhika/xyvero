/* eslint-disable prettier/prettier */
import React from 'react'
import { AlertTriangle, X, Loader2 } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  itemName?: string
  itemIcon?: React.ReactNode
  itemColor?: string
  message: string
  subMessage?: string
  confirmLabel?: string
  cancelLabel?: string
  isDestructive?: boolean
  isProcessing?: boolean
  error?: string | null
  onClose: () => void
  onConfirm: () => void | Promise<void>
}

export default function ConfirmModal({
  isOpen,
  title,
  itemName,
  itemIcon,
  itemColor,
  message,
  subMessage,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = true,
  isProcessing = false,
  error = null,
  onClose,
  onConfirm
}: ConfirmModalProps): React.JSX.Element | null {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={() => {
          if (!isProcessing) onClose()
        }}
      />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-md bg-[var(--theme-surface-strong)] border border-[var(--theme-border-soft)] rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            if (!isProcessing) onClose()
          }}
          disabled={isProcessing}
          className="absolute top-4 right-4 p-2 rounded-xl text-[var(--theme-text-muted)] hover:text-[var(--theme-text-strong)] hover:bg-[var(--theme-control-hover)] transition-colors disabled:opacity-50 cursor-pointer"
          title="Close"
        >
          <X size={18} />
        </button>

        <div className="p-6 sm:p-7 flex flex-col gap-5">
          {/* Header Icon + Title */}
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                isDestructive
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                  : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              }`}
            >
              <AlertTriangle size={24} />
            </div>

            <div className="flex flex-col min-w-0">
              <h3 className="text-lg font-bold text-[var(--theme-text-strong)] truncate">
                {title}
              </h3>
              <p className="text-xs text-[var(--theme-text-muted)]">
                Please confirm this action
              </p>
            </div>
          </div>

          {/* Optional Item Identity Preview */}
          {itemName && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--theme-control-bg)] border border-[var(--theme-border-soft)]">
              {itemIcon ? (
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                  style={{ backgroundColor: itemColor || '#6366f1' }}
                >
                  {itemIcon}
                </div>
              ) : null}
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
                  Target Account
                </span>
                <span className="text-sm font-semibold text-[var(--theme-text-strong)] truncate">
                  {itemName}
                </span>
              </div>
            </div>
          )}

          {/* Body Message */}
          <div className="flex flex-col gap-2 text-xs sm:text-sm text-[var(--theme-text-strong)]">
            <p className="font-medium leading-relaxed">{message}</p>
            {subMessage && (
              <p className="text-xs text-[var(--theme-text-muted)] leading-relaxed">
                {subMessage}
              </p>
            )}
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl border border-[var(--theme-border-soft)] bg-[var(--theme-control-bg)] hover:bg-[var(--theme-control-hover)] text-[var(--theme-text-strong)] text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              {cancelLabel}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isProcessing}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-sm transition-all cursor-pointer disabled:opacity-60 ${
                isDestructive
                  ? 'bg-red-600 hover:bg-red-700 active:scale-95 shadow-red-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-emerald-500/20'
              }`}
            >
              {isProcessing && <Loader2 size={16} className="animate-spin" />}
              <span>{confirmLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
