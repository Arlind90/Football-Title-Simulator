import { formatDateTime } from '../utils/formatters';

export default function FixtureCard({ fixture: f }) {
  return (
    <div className="fixture-card">
      <div className="fixture-date">
        <span className="dot"></span>
        {formatDateTime(f.strTimestamp)}
      </div>
      <div className="fixture-teams">
        <div className="fixture-team">
          <img src={f.strHomeTeamBadge} alt={f.strHomeTeam} loading="lazy" />
          <span className="fixture-team-name">{f.strHomeTeam}</span>
        </div>
        <div className="fixture-vs">vs</div>
        <div className="fixture-team">
          <img src={f.strAwayTeamBadge} alt={f.strAwayTeam} loading="lazy" />
          <span className="fixture-team-name">{f.strAwayTeam}</span>
        </div>
      </div>
    </div>
  );
}
