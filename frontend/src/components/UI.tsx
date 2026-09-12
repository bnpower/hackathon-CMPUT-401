import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, Bookmark, Check, CircleDashed, KeyRound, ShoppingBag, X, Zap } from 'lucide-react';
import type { Job, Status } from '../types';

export function Brand({ compact = false }: { compact?: boolean }) {
  return <span className="brand"><span className="brand-mark"><Zap size={23} fill="currentColor" strokeWidth={1.5} /></span>{!compact && <span>Hire<span className="brand-light">Power</span><span className="brand-dot">.</span></span>}</span>;
}
export function CompanyLogo({ job, size = 'md' }: { job: Job; size?: 'sm' | 'md' | 'lg' }) {
  return <span className={`company-logo logo-${job.logo} logo-${size}`} style={{ background: job.color }} aria-hidden="true">
    {job.logo === 'shopify' ? <><ShoppingBag size={size === 'sm' ? 24 : 32} fill="#85b441" color="#528123" strokeWidth={1.3} /><b className="shopify-letter">S</b></> :
      job.logo === 'linear' ? <span className="linear-symbol" /> :
      job.logo === 'figma' ? <span className="figma-symbol"><i /><i /><i /><i /><i /></span> :
      job.logo === '1password' ? <KeyRound size={28} color="#2262d5" /> :
      <span className={`letter-logo ${job.logo}`}>{job.logo === 'notion' ? 'N' : job.logo === 'wealthsimple' ? 'W' : job.logo === 'clio' ? 'clio' : 'ada'}</span>}
  </span>;
}
export function StatusBadge({ status }: { status: Status }) {
  return <span className={`status-badge status-${status.toLowerCase()}`}><span />{status}</span>;
}
export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { dialog?.close(); document.body.style.overflow = previousOverflow; previouslyFocused?.focus(); };
  }, []);
  return createPortal(<dialog ref={ref} className={`modal ${wide ? 'modal-wide' : ''}`} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === ref.current) { const bounds = ref.current.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose(); } }}>
    <div className="modal-header"><h2 id={titleId}>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={20} /></button></div>
    <div className="modal-body">{children}</div>
  </dialog>, document.body);
}
export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon">{icon ?? <CircleDashed size={30} />}</span><h3>{title}</h3><p>{description}</p>{action}</div>;
}
export function SaveButton({ saved, onClick, label = false }: { saved: boolean; onClick: () => void; label?: boolean }) {
  return <button className={label ? `btn btn-secondary ${saved ? 'is-saved' : ''}` : `icon-button save-button ${saved ? 'is-saved' : ''}`} onClick={onClick} aria-label={saved ? 'Unsave job' : 'Save job'} aria-pressed={saved}><Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />{label && (saved ? 'Saved' : 'Save job')}</button>;
}
export function Toast({ message }: { message: string }) {
  return <div className={`toast ${message ? 'toast-visible' : ''}`} role="status" aria-live="polite">{message && <><span><Check size={17} /></span>{message}</>}</div>;
}
export function ExternalArrow() { return <ArrowUpRight size={17} />; }
