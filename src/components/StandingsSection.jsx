import { useState, useEffect, useRef } from 'react';
import { useStandings } from '../hooks/useStandings';
import { useSeasonFixtures } from '../hooks/useSeasonFixtures';
import { calculateTitle } from '../utils/calculator';
import StandingsTable from './StandingsTable';
import ChampionCalc from './ChampionCalc';

export default function StandingsSection() {
  const { data: standings, loading, error } = useStandings();
  const { data: seasonFixtures, loading: seasonLoading } = useSeasonFixtures();
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const calcRef = useRef(null);

  const handleSelectTeam = (teamId) => {
    if (selectedTeamId === teamId) {
      setSelectedTeamId(null);
      return;
    }
    setSelectedTeamId(teamId);
  };

  useEffect(() => {
    if (selectedTeamId && calcRef.current) {
      calcRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedTeamId]);

  const selected = standings.find(t => t.idTeam === selectedTeamId) || null;
  const result   = selected && !seasonLoading && seasonFixtures.length > 0
    ? calculateTitle(selectedTeamId, standings, seasonFixtures)
    : null;

  const showCalc = selectedTeamId !== null;

  return (
    <section className="section" id="standings-section">
      <h2 className="section-title">Current Standings</h2>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <span>Loading standings…</span>
        </div>
      )}

      {error && (
        <div className="error-state">Could not load standings: {error}</div>
      )}

      {!loading && !error && (
        <>
          <StandingsTable
            standings={standings}
            selectedTeamId={selectedTeamId}
            onSelectTeam={handleSelectTeam}
          />

          {showCalc && (
            <div ref={calcRef}>
              <ChampionCalc
                selected={selected}
                result={result}
                seasonLoading={seasonLoading}
                onClose={() => setSelectedTeamId(null)}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}
