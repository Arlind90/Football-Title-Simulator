import { useState, useEffect } from 'react';
import { apiFetchV1 } from '../utils/api';

export function useFixtures({ leagueId }) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!leagueId) return;
    setLoading(true);
    setError(null);
    setData([]);
    apiFetchV1(`/eventsnextleague.php?id=${leagueId}`)
      .then(res => {
        const fixtures = (res.events || []).filter(e => e.strStatus === 'Not Started');
        setData(fixtures);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [leagueId]);

  return { data, loading, error };
}
