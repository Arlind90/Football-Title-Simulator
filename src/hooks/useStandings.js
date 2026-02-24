import { useState, useEffect } from 'react';
import { apiFetchV1, LEAGUE_ID, SEASON } from '../utils/api';

export function useStandings() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    apiFetchV1(`/lookuptable.php?l=${LEAGUE_ID}&s=${SEASON}`)
      .then(res => {
        const table = res.table;
        if (!table || table.length === 0) {
          throw new Error('No standings data available for this season yet.');
        }
        setData(table);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
