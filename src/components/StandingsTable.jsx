import StandingsRow from './StandingsRow';

export default function StandingsTable({ standings, selectedTeamId, onSelectTeam }) {
  return (
    <>
      <div className="table-wrapper" id="standings-table-wrapper">
        <table className="standings-table" id="standings-table">
          <thead>
            <tr>
              <th className="col-rank">#</th>
              <th className="col-team">Team</th>
              <th className="col-num" title="Matches Played">MP</th>
              <th className="col-num" title="Wins">W</th>
              <th className="col-num" title="Draws">D</th>
              <th className="col-num" title="Losses">L</th>
              <th className="col-num" title="Goals For">GF</th>
              <th className="col-num" title="Goals Against">GA</th>
              <th className="col-num" title="Goal Difference">GD</th>
              <th className="col-num col-pts" title="Points">Pts</th>
              <th className="col-form">Form</th>
            </tr>
          </thead>
          <tbody id="standings-body">
            {standings.map(entry => (
              <StandingsRow
                key={entry.idTeam}
                entry={entry}
                isSelected={selectedTeamId === entry.idTeam}
                onClick={onSelectTeam}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="standings-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: 'var(--ucl)' }}></span>
          UEFA Champions League
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: 'var(--uel)' }}></span>
          UEFA Europa League
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: 'var(--uecl)' }}></span>
          UEFA Conference League
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: 'var(--rel)' }}></span>
          Relegation
        </div>
      </div>
    </>
  );
}
