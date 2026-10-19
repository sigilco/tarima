import { useEffect, useRef, useState } from 'react'
import * as m from '../paraglide/messages.js'

export interface BoardRow {
  name: string
  area: string
  seats: string
  terms: string
}

type Status = 'idle' | 'calling' | 'emailed' | 'replied' | 'quoted' | 'approval'

interface Step {
  row?: number
  status?: Status
  fillTerms?: boolean
  showApproval?: boolean
  anchor?: string
}

const VENUE_ROWS: BoardRow[] = [
  { name: 'Bistrot Léa', area: 'Le Marais', seats: '24', terms: '€2,800 buyout' },
  { name: 'Casa Miró', area: 'Canal St-Martin', seats: '30', terms: '€1,900 min spend' },
  { name: 'Table Ouest', area: 'Saint-Germain', seats: '20', terms: '€3,200 hire' },
  { name: 'Le Cellier', area: 'Bastille', seats: '26', terms: '€2,400 min spend' },
  { name: 'Jardin Neuf', area: 'République', seats: '32', terms: '€2,600 buyout' },
]

const SPONSOR_ROWS: BoardRow[] = [
  { name: 'Northwind', area: 'Gold tier', seats: '', terms: 'Invoice sent' },
  { name: 'Acme Dev', area: 'Silver tier', seats: '', terms: 'Logo received' },
  { name: 'Kernel & Co', area: 'Venue partner', seats: '', terms: 'Contract signed' },
  { name: 'Driftline', area: 'Gold tier', seats: '', terms: 'Slides due Fri' },
  { name: 'Beacon Labs', area: 'Community', seats: '', terms: 'Bio received' },
]

const VENUE_SEQ: Step[] = [
  { anchor: 'brief' },
  { row: 0, status: 'calling' },
  { row: 1, status: 'emailed' },
  { row: 0, status: 'replied' },
  { row: 0, status: 'quoted', fillTerms: true },
  { row: 2, status: 'calling' },
  { row: 1, status: 'quoted', fillTerms: true },
  { row: 3, status: 'emailed' },
  { row: 2, status: 'quoted', fillTerms: true },
  { row: 0, status: 'approval' },
  { showApproval: true, anchor: 'approve' },
  { showApproval: true, anchor: 'approve' },
]

const SPONSOR_SEQ: Step[] = [
  { anchor: 'brief' },
  { row: 0, status: 'emailed' },
  { row: 1, status: 'calling' },
  { row: 0, status: 'replied' },
  { row: 0, status: 'quoted', fillTerms: true },
  { row: 2, status: 'emailed' },
  { row: 1, status: 'quoted', fillTerms: true },
  { row: 3, status: 'calling' },
  { row: 2, status: 'quoted', fillTerms: true },
  { row: 4, status: 'emailed' },
  { row: 3, status: 'replied' },
  { row: 0, status: 'approval' },
  { showApproval: true, anchor: 'approve' },
]

const STEP_MS = 1350
const HOLD_MS = 3000

const STATUS_LABEL: Record<Status, () => string> = {
  idle: () => '—',
  calling: m['board.statusCalling'],
  emailed: m['board.statusEmailed'],
  replied: m['board.statusReplied'],
  quoted: m['board.statusQuoted'],
  approval: m['board.statusApproval'],
}

const STATUS_CLASS: Record<Status, string> = {
  idle: 'bg-transparent text-ink-3',
  calling: 'bg-amber-soft text-amber-w',
  emailed: 'bg-paper-2 text-ink-2',
  replied: 'bg-sage-soft text-sage',
  quoted: 'bg-sage text-paper',
  approval: 'bg-clay text-paper',
}

export function AgentBoard({
  variant = 'venues',
  brief,
  className = '',
}: {
  variant?: 'venues' | 'sponsors'
  brief: string
  className?: string
}) {
  const isVenues = variant === 'venues'
  const rows = isVenues ? VENUE_ROWS : SPONSOR_ROWS
  const seq = isVenues ? VENUE_SEQ : SPONSOR_SEQ
  // below 560px the area/tier column drops so the status pill stays on-screen
  const gridCols = isVenues
    ? 'grid-cols-[1.4fr_1fr_0.55fr_1.1fr_1.15fr] max-[560px]:grid-cols-[1.5fr_0.55fr_1.15fr_1.2fr]'
    : 'grid-cols-[1.4fr_1fr_1.3fr_1.15fr] max-[560px]:grid-cols-[1.4fr_1.3fr_1.15fr]'

  const [stepIdx, setStepIdx] = useState(-1)
  const [rowStatus, setRowStatus] = useState<Status[]>(rows.map(() => 'idle'))
  const [termsLit, setTermsLit] = useState<boolean[]>(rows.map(() => false))
  const [termsFilled, setTermsFilled] = useState<boolean[]>(rows.map(() => false))
  const [showApproval, setShowApproval] = useState(false)
  const [workingRow, setWorkingRow] = useState(-1)

  const boardRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)

  // step sequencer
  useEffect(() => {
    let i = 0
    let timer: ReturnType<typeof setTimeout>

    const advance = () => {
      if (i >= seq.length) {
        timer = setTimeout(() => {
          setRowStatus(rows.map(() => 'idle'))
          setTermsLit(rows.map(() => false))
          setTermsFilled(rows.map(() => false))
          setShowApproval(false)
          setWorkingRow(-1)
          setStepIdx(-1)
          i = 0
          timer = setTimeout(advance, 1200)
        }, HOLD_MS)
        return
      }

      const step = seq[i]
      setStepIdx(i)

      if (typeof step.row === 'number') {
        setWorkingRow(step.row)
        if (step.status) {
          setRowStatus((prev) => prev.map((s, r) => (r === step.row ? step.status! : s)))
        }
        if (step.fillTerms) {
          setTermsLit((prev) => prev.map((v, r) => (r === step.row ? true : v)))
          setTermsFilled((prev) => prev.map((v, r) => (r === step.row ? true : v)))
          setTimeout(() => setTermsLit((prev) => prev.map((v, r) => (r === step.row ? false : v))), 2400)
        }
      }
      if (typeof step.showApproval === 'boolean') setShowApproval(step.showApproval)

      // move cursor to anchor
      const anchorSel =
        step.anchor === 'brief'
          ? '[data-anchor="brief"]'
          : step.anchor === 'approve'
            ? '[data-anchor="approve"]'
            : typeof step.row === 'number'
              ? `[data-anchor="status-${step.row}"]`
              : null
      if (anchorSel && boardRef.current && cursorRef.current) {
        const board = boardRef.current.getBoundingClientRect()
        const el = boardRef.current.querySelector(anchorSel)
        if (el) {
          const r = el.getBoundingClientRect()
          const x = r.left - board.left + r.width - 14
          const y = r.top - board.top + r.height - 6
          cursorRef.current.style.transform = `translate(${x}px, ${y}px)`
          cursorRef.current.classList.add('is-acting')
          setTimeout(() => cursorRef.current?.classList.remove('is-acting'), 450)
        }
      }

      i += 1
      timer = setTimeout(advance, STEP_MS)
    }

    timer = setTimeout(advance, 900)
    return () => clearTimeout(timer)
  }, [seq, rows])

  return (
    <div className={`rounded-[1.9rem] bg-ink/[0.045] p-1.5 ring-1 ring-ink/10 shadow-[0_40px_80px_-40px_rgba(26,22,19,0.35)] ${className}`}>
      <div ref={boardRef} className="relative overflow-hidden rounded-[calc(1.9rem-0.375rem)] bg-white">
        {/* brief bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <div
            data-anchor="brief"
            className="inline-flex max-w-full items-center gap-2.5 rounded-full bg-paper-2 px-3.5 py-1.5 ring-1 ring-line"
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-3">
              {m['board.briefLabel']()}
            </span>
            <span className="truncate text-[13px] font-medium text-ink">{brief}</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-clay-soft px-3 py-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clay opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-clay" />
            </span>
            <span className="text-[11px] font-medium text-clay-deep">{m['board.agentChip']()}</span>
          </div>
        </div>

        {/* table — internal horizontal scroll keeps cells legible below 560px */}
        <div className="overflow-x-auto">
          <div className="min-w-[400px] px-5 pb-5 pt-2">
          <div className={`grid ${gridCols} items-center gap-x-3 border-b border-line py-2 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3`}>
            <span>{isVenues ? m['board.colName']() : m['board.colSponsor']()}</span>
            <span className="max-[560px]:hidden">{isVenues ? m['board.colArea']() : m['board.colTier']()}</span>
            {isVenues && <span className="text-right">{m['board.colCapacity']()}</span>}
            <span>{isVenues ? m['board.colTerms']() : m['board.colDeliverable']()}</span>
            <span>{m['board.colStatus']()}</span>
          </div>

          {rows.map((row, i) => {
            const status = rowStatus[i]
            return (
              <div
                key={row.name}
                className={`grid ${gridCols} items-center gap-x-3 border-b border-line/60 py-2.5 text-[13px] transition-colors ${
                  workingRow === i ? 'row-working' : ''
                }`}
              >
                <span className="truncate font-medium text-ink">{row.name}</span>
                <span className="truncate text-ink-2 max-[560px]:hidden">{row.area}</span>
                {isVenues && <span className="text-right tabular-nums text-ink-2">{row.seats}</span>}
                <span
                  className={`truncate rounded-md px-1.5 py-0.5 text-ink-2 transition-all duration-500 ${
                    termsFilled[i] ? 'bg-sage-soft/60 text-ink' : 'text-ink-3'
                  } ${termsLit[i] ? 'cell-lit' : ''}`}
                >
                  {termsFilled[i] ? row.terms : '· · ·'}
                </span>
                <span data-anchor={`status-${i}`} className="flex">
                  <span
                    className={`pill inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_CLASS[status]}`}
                  >
                    {status === 'calling' && (
                      <span className="h-1 w-1 animate-pulse rounded-full bg-current" />
                    )}
                    {STATUS_LABEL[status]()}
                  </span>
                </span>
              </div>
            )
          })}
          </div>
        </div>

        {/* approval card */}
        <div
          className={`pointer-events-none absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-2xl bg-ink px-4 py-3 text-paper shadow-[0_24px_50px_-20px_rgba(26,22,19,0.55)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            showApproval ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <span className="min-w-0 text-[13px] font-medium">
            {isVenues ? m['board.approval']() : m['board.approvalSponsors']()}
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <span
              data-anchor="approve"
              className="pointer-events-auto rounded-full bg-paper px-3.5 py-1.5 text-[12px] font-semibold text-ink"
            >
              {m['board.approveYes']()}
            </span>
            <span className="rounded-full bg-paper/10 px-3.5 py-1.5 text-[12px] font-medium text-paper/80 ring-1 ring-paper/15">
              {m['board.approveNo']()}
            </span>
          </span>
        </div>

        {/* agent cursor */}
        <div
          ref={cursorRef}
          className={`agent-cursor pointer-events-none absolute left-0 top-0 z-10 transition-opacity ${
            stepIdx >= 0 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" className="drop-shadow-[0_2px_4px_rgba(26,22,19,0.4)]">
            <path
              d="M4 2.5 19.5 11.2c.6.34.65 1.17.13 1.6-.16.13-.35.2-.55.2l-5.86.4-2.63 5.27c-.27.55-.96.75-1.5.43-.28-.17-.45-.46-.5-.77L4.36 3.2c-.08-.5-.2-.85-.36-.7Z"
              fill="#1a1613"
              stroke="#f7f4ed"
              strokeWidth="1.4"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}
