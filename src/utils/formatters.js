export function formatDateTime(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleDateString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short',
  }) + ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

export function badgeUrl(url) {
  if (!url) return '';
  return url.replace(/\/(tiny|small|medium)$/, '');
}

export function gdStr(n) {
  const v = parseInt(n, 10);
  return v >= 0 ? `+${v}` : `${v}`;
}
