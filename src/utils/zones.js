export function getZone(description) {
  if (!description) return '';
  const d = description.toLowerCase();
  if (d.includes('conference'))       return 'uecl';
  if (d.includes('champions league')) return 'ucl';
  if (d.includes('europa league'))    return 'uel';
  if (d.includes('relegation'))       return 'rel';
  return '';
}
