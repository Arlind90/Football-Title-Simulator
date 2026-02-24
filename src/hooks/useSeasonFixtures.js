import { useState, useEffect } from 'react';
import { apiFetchV1, LEAGUE_ID, SEASON } from '../utils/api';

export function useSeasonFixtures() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetchV1(`/eventsseason.php?id=${LEAGUE_ID}&s=${SEASON}`)
      .then(res => {
        const remaining = (res.events || []).filter(e => e.strStatus === 'Not Started');
        setData(remaining);
      })
      .catch(err => console.warn('Could not load season fixtures for calculator:', err.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
