import type { ReactNode } from 'react'
import { XIcon } from './icons'

type ModalProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
}

function ModalShell({ open, onClose, children }: ModalProps) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative w-full rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-700"
        >
          <XIcon className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  )
}

export type ChangelogCopy = {
  version: string
  date: string
  title: string
  closeLabel: string
  features: { title: string; text: string }[]
}

type ChangelogModalProps = {
  open: boolean
  onClose: () => void
  copy: ChangelogCopy
}

export function ChangelogModal({ open, onClose, copy }: ChangelogModalProps) {
  return (
    <ModalShell open={open} onClose={onClose}>
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded bg-[#FACC15] px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-neutral-900">
          {copy.version}
        </span>
        <span className="text-xs text-neutral-400">{copy.date}</span>
      </div>
      <h3 className="text-xl font-bold text-neutral-900">{copy.title}</h3>

      <div className="mt-4 space-y-3 text-sm text-neutral-600">
        {copy.features.map((f) => (
          <div key={f.title} className="rounded-xl border border-neutral-100 bg-neutral-50 p-3">
            <h4 className="mb-1 text-xs font-semibold text-neutral-900">{f.title}</h4>
            <p className="text-xs text-neutral-500">{f.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={onClose}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-neutral-800"
        >
          {copy.closeLabel}
        </button>
      </div>
    </ModalShell>
  )
}
