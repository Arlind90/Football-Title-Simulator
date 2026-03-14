import { useState, useEffect } from 'react';
import { apiFetchV1 } from '../utils/api';

const FINISHED_STATUSES = new Set(['Match Finished', 'FT', 'AET', 'PEN']);
const REMAINING_STATUSES = new Set(['Not Started', 'NS', 'PST', 'TBD', 'Match Postponed']);

export function useSeasonFixtures({ leagueId, season }) {
  const [data, setData]         = useState([]);
  const [finished, setFinished] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!leagueId || !season) return;
    setLoading(true);
    setData([]);
    setFinished([]);
    apiFetchV1(`/eventsseason.php?id=${leagueId}&s=${season}`)
      .then(res => {
        const events = res.events || [];
        setData(events.filter(e => REMAINING_STATUSES.has(e.strStatus)));
        setFinished(events.filter(e => FINISHED_STATUSES.has(e.strStatus)));
      })
      .catch(err => console.warn('Could not load season fixtures for calculator:', err.message))
      .finally(() => setLoading(false));
  }, [leagueId, season]);

  return { data, finished, loading };
}
