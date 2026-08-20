/* eslint-disable prettier/prettier */
import React, { useEffect, useState } from 'react'
import { Sparkles, Download, RefreshCw, AlertCircle, X } from 'lucide-react'

type UpdateStatus = 'idle' | 'available' | 'downloading' | 'downloaded' | 'error'

export default function UpdateToast(): React.JSX.Element | null {
  const [status, setStatus] = useState<UpdateStatus>('idle')
  const [version, setVersion] = useState<string>('')
  const [progress, setProgress] = useState<number>(0)
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [countdown, setCountdown] = useState<number>(3)

  useEffect(() => {
    if (!window.api?.updater) return

    // 1. Listen for update availability
    const unsubscribeAvailable = window.api.updater.onUpdateAvailable((info) => {
      setVersion(info.version || '')
      setStatus('available')
    })

    // 2. Listen for download progress
    const unsubscribeProgress = window.api.updater.onUpdateProgress((percent) => {
      setProgress(Math.round(percent))
      setStatus('downloading')
    })

    // 3. Listen for update downloaded
    const unsubscribeDownloaded = window.api.updater.onUpdateDownloaded(() => {
      setStatus('downloaded')
      setCountdown(3)
    })

    // 4. Listen for updater error
    const unsubscribeError = window.api.updater.onUpdateError((err) => {
      setErrorMsg(err)
      setStatus('error')
    })

    return () => {
      unsubscribeAvailable()
      unsubscribeProgress()
      unsubscribeDownloaded()
      unsubscribeError()
    }
  }, [])

  // Handle countdown for downloaded state
  useEffect(() => {
    if (status !== 'downloaded') return

    if (countdown <= 0) {
      window.api?.updater?.quitAndInstall()
      return
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [status, countdown])

  const handleDoNow = (): void => {
    setProgress(0)
    setStatus('downloading')
    window.api?.updater?.startDownload()
  }

  const handleClose = (): void => {
    setStatus('idle')
  }

  if (status === 'idle') return null

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white/80 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-800/50 p-4 transition-all duration-300 animate-slide-up animate-duration-300">
      {status === 'available' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                Update Available!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Version <span className="font-semibold text-emerald-500">v{version}</span> of Xyvero is ready to download.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Dismiss update notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <button
              onClick={handleClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Remind Me Later
            </button>
            <button
              onClick={handleDoNow}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Do Now
            </button>
          </div>
        </div>
      )}

      {status === 'downloading' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg shrink-0">
              <Download className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                Downloading Update
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Fetching the latest assets from GitHub...
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-500">{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {status === 'downloaded' && (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg shrink-0">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              Installing Update
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Restarting in <span className="font-semibold text-emerald-500">{countdown}s</span> to apply v{version}...
            </p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                Update Failed
              </h4>
              <p className="text-xs text-rose-500 mt-0.5 break-words">
                {errorMsg || 'An unknown error occurred during update.'}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
