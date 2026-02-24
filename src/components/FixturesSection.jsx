import { useFixtures } from '../hooks/useFixtures';
import FixtureCard from './FixtureCard';

export default function FixturesSection() {
  const { data: fixtures, loading, error } = useFixtures();

  const rounds = new Map();
  fixtures.forEach(f => {
    const key = `Matchday ${f.intRound}`;
    if (!rounds.has(key)) rounds.set(key, []);
    rounds.get(key).push(f);
  });

  return (
    <section className="section" id="fixtures-section">
      <h2 className="section-title">Upcoming Fixtures</h2>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <span>Loading fixtures…</span>
        </div>
      )}

      {error && (
        <div className="error-state">Could not load fixtures: {error}</div>
      )}

      {!loading && !error && fixtures.length === 0 && (
        <p style={{ padding: '24px', color: 'var(--text-muted)' }}>
          No upcoming fixtures found.
        </p>
      )}

      {!loading && !error && fixtures.length > 0 && (
        <div id="fixtures-container">
          {[...rounds.entries()].map(([roundLabel, matches]) => (
            <div className="round-group" key={roundLabel}>
              <div className="round-title">{roundLabel}</div>
              <div className="fixtures-grid">
                {[...matches]
                  .sort((a, b) => new Date(a.strTimestamp) - new Date(b.strTimestamp))
                  .map(f => (
                    <FixtureCard key={f.idEvent} fixture={f} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
