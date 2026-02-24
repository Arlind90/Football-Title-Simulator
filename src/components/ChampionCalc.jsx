import { badgeUrl, formatDate, gdStr } from '../utils/formatters';

function GuaranteeBlock({ selected, result }) {
  const g = result.guaranteeInfo;

  if (g.status === 'done') {
    return (
      <div className="calc-guarantee calc-guarantee--done">
        <span className="calc-guarantee-label">Title Guarantee</span>
        <span className="calc-guarantee-status">
          ✓ Already secured — no other team can overtake {selected.strTeam}
        </span>
      </div>
    );
  }

  if (g.status === 'unreachable') {
    return (
      <div className="calc-guarantee calc-guarantee--unreachable">
        <span className="calc-guarantee-label">Title Guarantee</span>
        <span className="calc-guarantee-status">
          Cannot be mathematically secured this matchday — even winning all remaining games (
          {result.selMax} pts) falls short of the {g.guaranteeTotal} needed to guarantee ahead of{' '}
          {result.rival.strTeam}&apos;s maximum of {g.rivAbsoluteMax} pts
        </span>
      </div>
    );
  }

  const minResultStr = g.gDraws > 0 ? `${g.gWins}W · ${g.gDraws}D` : `${g.gWins}W`;

  return (
    <div className="calc-guarantee">
      <span className="calc-guarantee-label">Title Guarantee</span>
      <div className="calc-guarantee-body">
        <div className="calc-guarantee-row">
          <span>Points needed</span>
          <span>
            <strong>{g.guaranteeTotal}</strong> total &nbsp;(+{g.guaranteeAdditional} from{' '}
            {g.gamesRemaining} remaining)
            {g.gdDecides && (
              <span className="calc-guarantee-gd">
                &nbsp;(tie on points is enough — wins on GD: {gdStr(result.selGD)} vs{' '}
                {gdStr(result.rivGD)})
              </span>
            )}
          </span>
        </div>
        <div className="calc-guarantee-row">
          <span>Minimum results</span>
          <span>
            <strong>{minResultStr}</strong> from {g.gamesRemaining} games
          </span>
        </div>
        <div className="calc-guarantee-note">
          Based on {result.rival.strTeam} winning all {result.rivRemaining} remaining games (
          {g.rivAbsoluteMax} pts max)
          {g.gdDecides ? ` — a points tie goes to ${selected.strTeam} on GD` : ''}
        </div>
      </div>
    </div>
  );
}

function FixtureItem({ f, isH2H }) {
  return (
    <div className={`calc-fixture-item${isH2H ? ' calc-fixture--h2h' : ''}`}>
      <div className="calc-fixture-meta">
        <span className="calc-fixture-round">R{f.intRound}</span>
        <span className="calc-fixture-date">{formatDate(f.strTimestamp)}</span>
        {isH2H && <span className="calc-fixture-h2h-badge">H2H</span>}
      </div>
      <div className="calc-fixture-teams">
        {f.strHomeTeamBadge && (
          <img src={badgeUrl(f.strHomeTeamBadge)} alt={f.strHomeTeam} />
        )}
        <span className="calc-fixture-name">{f.strHomeTeam}</span>
        <span className="calc-fixture-vs">vs</span>
        <span className="calc-fixture-name">{f.strAwayTeam}</span>
        {f.strAwayTeamBadge && (
          <img src={badgeUrl(f.strAwayTeamBadge)} alt={f.strAwayTeam} />
        )}
      </div>
    </div>
  );
}

function FixturesBlock({ selected, result }) {
  const selId = selected.idTeam;
  const rivId = result.rival.idTeam;

  const isH2H = f =>
    (f.idHomeTeam === selId && f.idAwayTeam === rivId) ||
    (f.idHomeTeam === rivId && f.idAwayTeam === selId);

  return (
    <div className="calc-fixtures">
      <div className="calc-fixtures-title">Remaining Fixtures</div>
      <div className="calc-fixtures-cols">
        <div className="calc-fixtures-col">
          <div className="calc-fixtures-col-header">
            <img src={badgeUrl(selected.strBadge)} alt={selected.strTeam} />
            <span>{selected.strTeam}</span>
            <span className="calc-fixtures-count">{result.selRemaining} games</span>
          </div>
          <div className="calc-fixtures-list">
            {result.selFixtures.map(f => (
              <FixtureItem key={f.idEvent} f={f} isH2H={isH2H(f)} />
            ))}
          </div>
        </div>
        <div className="calc-fixtures-col">
          <div className="calc-fixtures-col-header">
            <img src={badgeUrl(result.rival.strBadge)} alt={result.rival.strTeam} />
            <span>{result.rival.strTeam}</span>
            <span className="calc-fixtures-count">{result.rivRemaining} games</span>
          </div>
          <div className="calc-fixtures-list">
            {result.rivFixtures.map(f => (
              <FixtureItem key={f.idEvent} f={f} isH2H={isH2H(f)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChampionCalc({ selected, result, seasonLoading, onClose }) {
  if (seasonLoading) {
    return (
      <div className="champion-calc" id="champion-calc">
        <p className="calc-loading">Season fixtures still loading — please try again in a moment.</p>
      </div>
    );
  }

  if (!selected || !result) return null;

  const rivalLabel =
    parseInt(result.rival.intRank, 10) === 1 ? '1st · Leader' : '2nd · Challenger';

  const verdictConfig = {
    win: {
      cls:  'calc-verdict--win',
      icon: '✓',
      text: `Wins the title — even in ${result.rival.strTeam}'s best case they only reach ${result.rivBestCase} pts, ${result.selMax - result.rivBestCase} pt${result.selMax - result.rivBestCase !== 1 ? 's' : ''} short of ${selected.strTeam}'s ${result.selMax}`,
    },
    impossible: {
      cls:  'calc-verdict--lose',
      icon: '✗',
      text: `Cannot win — ${result.rival.strTeam} already has ${result.rivCurrentPts} pts, exceeding ${selected.strTeam}'s maximum of ${result.selMax} pts`,
    },
    'gd-win': {
      cls:  'calc-verdict--gd',
      icon: '~',
      text: `Points tied at ${result.selMax} in rival's best case — wins the title on Goal Difference (${gdStr(result.selGD)} vs ${gdStr(result.rivGD)})`,
    },
    'gd-lose': {
      cls:  'calc-verdict--gd',
      icon: '~',
      text: `Points tied at ${result.selMax} in rival's best case — loses on Goal Difference (${gdStr(result.selGD)} vs ${result.rival.strTeam}'s ${gdStr(result.rivGD)}). Rival needs to drop 1 more point for ${selected.strTeam} to win outright.`,
    },
    possible: {
      cls:  'calc-verdict--possible',
      icon: '✓',
      text: result.canWinOnGD
        ? `Mathematically possible — ${selected.strTeam} reaches ${result.selMax} pts; ${result.rival.strTeam} can tie on points but ${selected.strTeam} wins on GD (${gdStr(result.selGD)} vs ${gdStr(result.rivGD)}), so rival must score ≤ ${result.rivPointsNeeded} more from ${result.rivRemaining} games`
        : `Mathematically possible — ${selected.strTeam} reaches ${result.selMax} pts; ${result.rival.strTeam} must finish with ≤ ${result.rivPointsAllowed} pts (score ≤ ${result.rivPointsNeeded} more from their ${result.rivRemaining} remaining games)`,
    },
  };

  const v = verdictConfig[result.verdict];

  const scenarioNote =
    result.verdict === 'possible'
      ? `${selected.strTeam} wins all ${result.selRemaining} remaining games · ${result.rival.strTeam} must score ≤ ${result.rivPointsNeeded} more pts from ${result.rivRemaining} games${result.canWinOnGD ? ` (GD tiebreaker favours ${selected.strTeam})` : ''}`
      : `${selected.strTeam} wins all ${result.selRemaining} remaining games · ${result.rival.strTeam} wins all except the direct clash`;

  const rivBestWins  = result.rivFreeGames;
  const rivGamesNote = result.hasDirectClash
    ? `${rivBestWins} win${rivBestWins !== 1 ? 's' : ''}, 1 loss (H2H)`
    : `${rivBestWins} win${rivBestWins !== 1 ? 's' : ''}`;

  return (
    <div className="champion-calc" id="champion-calc">
      <div className="calc-header">
        <img src={badgeUrl(selected.strBadge)} alt={selected.strTeam} className="calc-logo" />
        <div className="calc-title-block">
          <div className="calc-team-name">{selected.strTeam}</div>
          <div className="calc-subtitle">Title Race Calculator — best case scenario</div>
        </div>
        <button className="calc-close" onClick={onClose} title="Close">×</button>
      </div>

      <div className="calc-scenario">{scenarioNote}</div>

      {result.hasDirectClash ? (
        <div className="calc-clash">
          <span className="calc-clash-label">Direct clash</span>
          <span className="calc-clash-match">
            {result.directClash.strHomeTeam} vs {result.directClash.strAwayTeam}
          </span>
          <span className="calc-clash-meta">
            Round {result.directClash.intRound} · {formatDate(result.directClash.strTimestamp)}
          </span>
          <span className="calc-clash-note">→ {selected.strTeam} wins this match in the simulation</span>
        </div>
      ) : (
        <div className="calc-clash calc-clash--none">
          No direct clash remaining between these two teams.
        </div>
      )}

      <div className="calc-grid">
        <div className="calc-col calc-col--selected">
          <div className="calc-col-header">
            <img src={badgeUrl(selected.strBadge)} alt={selected.strTeam} />
            <span>{selected.strTeam}</span>
          </div>
          <div className="calc-pts-row">
            <span className="calc-pts-label">Current</span>
            <span>{result.selCurrentPts} pts</span>
          </div>
          <div className="calc-pts-row">
            <span className="calc-pts-label">{result.selRemaining} wins</span>
            <span>+{result.selRemaining * 3} pts</span>
          </div>
          <div className="calc-pts-row calc-pts-total">
            <span>Maximum</span>
            <span>{result.selMax} pts</span>
          </div>
          <div className="calc-pts-row calc-pts-gd">
            <span className="calc-pts-label">GD</span>
            <span>{gdStr(result.selGD)}</span>
          </div>
        </div>

        <div className="calc-col calc-col--rival">
          <div className="calc-col-header">
            <img src={badgeUrl(result.rival.strBadge)} alt={result.rival.strTeam} />
            <span>
              {result.rival.strTeam}{' '}
              <small className="rival-label">{rivalLabel}</small>
            </span>
          </div>
          {result.verdict === 'possible' ? (
            <>
              <div className="calc-pts-row">
                <span className="calc-pts-label">Current</span>
                <span>{result.rivCurrentPts} pts</span>
              </div>
              <div className="calc-pts-row">
                <span className="calc-pts-label">
                  Max allowed{result.canWinOnGD ? ' (tie OK — GD wins)' : ''}
                </span>
                <span>{result.rivPointsAllowed} pts</span>
              </div>
              <div className="calc-pts-row calc-pts-total">
                <span>Must score ≤ {result.rivPointsNeeded} more</span>
                <span>from {result.rivRemaining} games</span>
              </div>
              <div className="calc-pts-row calc-breakdown">
                <span className="calc-pts-label">e.g.</span>
                <span>
                  {result.rivBreakdown.wins}W &middot; {result.rivBreakdown.draws}D &middot;{' '}
                  {result.rivBreakdown.losses}L = {result.rivBreakdown.ptsScored} pts
                </span>
              </div>
              <div className="calc-pts-row calc-pts-gd">
                <span className="calc-pts-label">GD</span>
                <span>{gdStr(result.rivGD)}</span>
              </div>
            </>
          ) : (
            <>
              <div className="calc-pts-row">
                <span className="calc-pts-label">Current</span>
                <span>{result.rivCurrentPts} pts</span>
              </div>
              <div className="calc-pts-row">
                <span className="calc-pts-label">{rivGamesNote} (best case)</span>
                <span>+{rivBestWins * 3} pts</span>
              </div>
              <div className="calc-pts-row calc-pts-total">
                <span>Best case total</span>
                <span>{result.rivBestCase} pts</span>
              </div>
              <div className="calc-pts-row calc-pts-gd">
                <span className="calc-pts-label">GD</span>
                <span>{gdStr(result.rivGD)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {result.guaranteeInfo && <GuaranteeBlock selected={selected} result={result} />}

      <div className={`calc-verdict ${v.cls}`}>{v.icon} {v.text}</div>

      <FixturesBlock selected={selected} result={result} />
    </div>
  );
}
