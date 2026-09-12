const STAGE_META = {
  wishlist: { label: 'Wishlist', color: '#64748b' },
  applied: { label: 'Applied', color: '#2563eb' },
  interview: { label: 'Interview', color: '#d97706' },
  offer: { label: 'Offer', color: '#16a34a' },
  rejected: { label: 'Rejected', color: '#dc2626' },
  withdrawn: { label: 'Withdrawn', color: '#6b7280' },
}

const COMMUNICATION_ICON = {
  email: '✉️',
  phone_call: '📞',
  interview: '🎤',
  offer: '🎉',
  rejection: '📪',
  other: '💬',
}

export function stageMeta(stage) {
  return STAGE_META[stage] ?? { label: stage, color: '#64748b' }
}

export function communicationIcon(type) {
  return COMMUNICATION_ICON[type] ?? '💬'
}

export function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function relativeTime(value) {
  if (!value) return ''
  const diffMs = new Date(value).getTime() - Date.now()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'tomorrow'
  if (diffDays === -1) return 'yesterday'
  if (diffDays > 1) return `in ${diffDays} days`
  return `${Math.abs(diffDays)} days ago`
}
