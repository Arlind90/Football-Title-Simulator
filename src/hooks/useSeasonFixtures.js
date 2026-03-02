import { useState, useEffect } from 'react';
import { apiFetchV1 } from '../utils/api';

export function useSeasonFixtures({ leagueId, season }) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!leagueId || !season) return;
    setLoading(true);
    setData([]);
    apiFetchV1(`/eventsseason.php?id=${leagueId}&s=${season}`)
      .then(res => {
        const remaining = (res.events || []).filter(e => e.strStatus === 'Not Started');
        setData(remaining);
      })
      .catch(err => console.warn('Could not load season fixtures for calculator:', err.message))
      .finally(() => setLoading(false));
  }, [leagueId, season]);

  return { data, loading };
}
