function toUtcDate(isoString) {
  const utc = isoString.replace(' ', 'T').replace(/Z?$/, 'Z');
  return new Date(utc);
}

export function formatDateTime(isoString) {
  if (!isoString) return '—';
  const d = toUtcDate(isoString);
  return d.toLocaleDateString('en-GB', {
    timeZone: 'Europe/Paris',
    weekday: 'short', day: 'numeric', month: 'short',
  }) + ' · ' + d.toLocaleTimeString('en-GB', {
    timeZone: 'Europe/Paris',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatDate(isoString) {
  if (!isoString) return '—';
  return toUtcDate(isoString).toLocaleDateString('en-GB', {
    timeZone: 'Europe/Paris',
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
