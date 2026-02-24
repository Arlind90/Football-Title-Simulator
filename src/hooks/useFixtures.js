import { useState, useEffect } from 'react';
import { apiFetchV1, LEAGUE_ID } from '../utils/api';

export function useFixtures() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    apiFetchV1(`/eventsnextleague.php?id=${LEAGUE_ID}`)
      .then(res => {
        const fixtures = (res.events || []).filter(e => e.strStatus === 'Not Started');
        setData(fixtures);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
