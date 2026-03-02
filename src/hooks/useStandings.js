import { useState, useEffect } from 'react';
import { apiFetchV1 } from '../utils/api';

export function useStandings({ leagueId, season }) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!leagueId || !season) return;
    setLoading(true);
    setError(null);
    setData([]);
    apiFetchV1(`/lookuptable.php?l=${leagueId}&s=${season}`)
      .then(res => {
        const table = res.table;
        if (!table || table.length === 0) {
          throw new Error('No standings data available for this season yet.');
        }
        setData(table);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [leagueId, season]);

  return { data, loading, error };
}
