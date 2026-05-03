import { useState, useEffect, useRef } from 'react';
import { useStandings } from '../hooks/useStandings';
import { useSeasonFixtures } from '../hooks/useSeasonFixtures';
import { calculateTitle, reconcileStandings } from '../utils/calculator';
import StandingsTable from './StandingsTable';
import ChampionCalc from './ChampionCalc';

export default function StandingsSection({ league }) {
  const { data: standings, loading, error } = useStandings({ leagueId: league.id, season: league.season });
  const { data: seasonFixtures, finished: finishedFixtures, loading: seasonLoading } = useSeasonFixtures({ leagueId: league.id, season: league.season });
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

  // Reset selection when league changes
  useEffect(() => {
    setSelectedTeamId(null);
  }, [league.id]);

  const reconciledStandings = reconcileStandings(standings, finishedFixtures);

  const selected = reconciledStandings.find(t => t.idTeam === selectedTeamId) || null;
  const result   = selected && !seasonLoading && seasonFixtures.length > 0
    ? calculateTitle(selectedTeamId, reconciledStandings, seasonFixtures, { tiebreaker: league.tiebreaker })
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
          <div className="how-to-banner">
            <span className="how-to-icon">ℹ</span>
            <span>Click any team in the table to open the <strong>Title Race Calculator</strong> — it shows the team&apos;s maximum possible points and what the closest rival needs to drop for that team to win.</span>
          </div>

          <StandingsTable
            standings={reconciledStandings}
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
