import { getZone } from '../utils/zones';
import { badgeUrl } from '../utils/formatters';

function FormBadges({ formStr }) {
  if (!formStr) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  return (
    <div className="form-badges">
      {formStr.slice(-5).split('').map((c, i) => (
        <span key={i} className={`form-badge ${c}`}>{c}</span>
      ))}
    </div>
  );
}

export default function StandingsRow({ entry, isSelected, onClick }) {
  const zone = getZone(entry.strDescription);
  const gd   = parseInt(entry.intGoalDifference, 10);

  return (
    <tr
      data-zone={zone}
      data-team-id={entry.idTeam}
      className={isSelected ? 'calc-selected' : ''}
      onClick={() => onClick(entry.idTeam)}
      title="Click to simulate title race"
    >
      <td className="col-rank">{entry.intRank}</td>
      <td className="col-team">
        <div className="team-cell">
          <img
            className="team-logo"
            src={badgeUrl(entry.strBadge)}
            alt={entry.strTeam}
            loading="lazy"
          />
          <span className="team-name">{entry.strTeam}</span>
        </div>
      </td>
      <td className="col-num">{entry.intPlayed}</td>
      <td className="col-num">{entry.intWin}</td>
      <td className="col-num">{entry.intDraw}</td>
      <td className="col-num">{entry.intLoss}</td>
      <td className="col-num">{entry.intGoalsFor}</td>
      <td className="col-num">{entry.intGoalsAgainst}</td>
      <td className="col-num">{gd >= 0 ? `+${gd}` : gd}</td>
      <td className="col-num col-pts">{entry.intPoints}</td>
      <td className="col-form">
        <FormBadges formStr={entry.strForm} />
      </td>
    </tr>
  );
}
