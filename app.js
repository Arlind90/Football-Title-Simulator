const API_KEY   = (window.APP_CONFIG || {}).API_KEY || '';
const BASE_V1   = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;
const BASE_V2   = 'https://www.thesportsdb.com/api/v2/json';
const LEAGUE_ID = 4332;
const SEASON    = '2025-2026';

let standingsData     = [];
let remainingFixtures = [];

// ── Zone detection ─────────────────────────────────────────────────────────
function getZone(description) {
  if (!description) return '';
  const d = description.toLowerCase();
  if (d.includes('conference'))       return 'uecl';
  if (d.includes('champions league')) return 'ucl';
  if (d.includes('europa league'))    return 'uel';
  if (d.includes('relegation'))       return 'rel';
  return '';
}

// ── Fetch helpers ──────────────────────────────────────────────────────────
async function apiFetchV1(path) {
  const res = await fetch(`${BASE_V1}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiFetchV2(path) {
  const res = await fetch(`${BASE_V2}${path}`, {
    headers: { 'X-API-KEY': API_KEY },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }

function formatDateTime(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleDateString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short',
  }) + ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function badgeUrl(url) {
  if (!url) return '';
  return url.replace(/\/(tiny|small|medium)$/, '');
}

function gdStr(n) {
  const v = parseInt(n, 10);
  return v >= 0 ? `+${v}` : `${v}`;
}

// ── Season fixtures (cached for Champion Calculator) ───────────────────────
async function loadSeasonFixtures() {
  try {
    const data = await apiFetchV1(`/eventsseason.php?id=${LEAGUE_ID}&s=${SEASON}`);
    remainingFixtures = (data.events || []).filter(e => e.strStatus === 'Not Started');
  } catch (e) {
    console.warn('Could not load season fixtures for calculator:', e.message);
  }
}

// ── Standings ──────────────────────────────────────────────────────────────
async function loadStandings() {
  const loadingEl = document.getElementById('standings-loading');
  const errorEl   = document.getElementById('standings-error');
  const wrapperEl = document.getElementById('standings-table-wrapper');
  const bodyEl    = document.getElementById('standings-body');

  try {
    const data  = await apiFetchV1(`/lookuptable.php?l=${LEAGUE_ID}&s=${SEASON}`);
    const table = data.table;

    if (!table || table.length === 0) {
      throw new Error('No standings data available for this season yet.');
    }

    standingsData = table;

    bodyEl.innerHTML = table.map(entry => {
      const zone     = getZone(entry.strDescription);
      const formHtml = buildFormBadges(entry.strForm || '');
      const gd       = parseInt(entry.intGoalDifference, 10);

      return `
        <tr data-zone="${zone}" data-team-id="${entry.idTeam}" title="Click to simulate title race">
          <td class="col-rank">${entry.intRank}</td>
          <td class="col-team">
            <div class="team-cell">
              <img class="team-logo" src="${badgeUrl(entry.strBadge)}" alt="${entry.strTeam}" loading="lazy" />
              <span class="team-name">${entry.strTeam}</span>
            </div>
          </td>
          <td class="col-num">${entry.intPlayed}</td>
          <td class="col-num">${entry.intWin}</td>
          <td class="col-num">${entry.intDraw}</td>
          <td class="col-num">${entry.intLoss}</td>
          <td class="col-num">${entry.intGoalsFor}</td>
          <td class="col-num">${entry.intGoalsAgainst}</td>
          <td class="col-num">${gd >= 0 ? '+' + gd : gd}</td>
          <td class="col-num col-pts">${entry.intPoints}</td>
          <td class="col-form">${formHtml}</td>
        </tr>`;
    }).join('');

    // Delegated click handler on tbody
    bodyEl.addEventListener('click', e => {
      const row = e.target.closest('tr[data-team-id]');
      if (!row) return;

      // Toggle off if already selected
      if (row.classList.contains('calc-selected')) {
        hideChampionCalc();
        return;
      }

      bodyEl.querySelectorAll('tr.calc-selected').forEach(r => r.classList.remove('calc-selected'));
      row.classList.add('calc-selected');

      const panelEl = document.getElementById('champion-calc');

      if (remainingFixtures.length === 0) {
        panelEl.innerHTML = '<p class="calc-loading">Season fixtures still loading — please try again in a moment.</p>';
        show(panelEl);
        return;
      }

      const result = calculateTitle(row.dataset.teamId);
      if (result) {
        const selected = standingsData.find(t => t.idTeam === row.dataset.teamId);
        renderChampionCalc(selected, result);
      }
    });

    wrapperEl.insertAdjacentHTML('afterend', `
      <div class="standings-legend">
        <div class="legend-item"><span class="legend-dot" style="background:var(--ucl)"></span>UEFA Champions League</div>
        <div class="legend-item"><span class="legend-dot" style="background:var(--uel)"></span>UEFA Europa League</div>
        <div class="legend-item"><span class="legend-dot" style="background:var(--uecl)"></span>UEFA Conference League</div>
        <div class="legend-item"><span class="legend-dot" style="background:var(--rel)"></span>Relegation</div>
      </div>`);

    hide(loadingEl);
    show(wrapperEl);

  } catch (err) {
    hide(loadingEl);
    errorEl.textContent = `Could not load standings: ${err.message}`;
    show(errorEl);
  }
}

function buildFormBadges(formStr) {
  if (!formStr) return '<span style="color:var(--text-muted)">—</span>';
  return `<div class="form-badges">${
    formStr.slice(-5).split('').map(c =>
      `<span class="form-badge ${c}">${c}</span>`
    ).join('')
  }</div>`;
}

// ── Champion Calculator ────────────────────────────────────────────────────

// Given rival must score ≤ pointsNeeded from freeGames non-H2H games,
// return a W/D/L breakdown that hits exactly that points tally (or as close
// as possible without exceeding it).
function computeRivalBreakdown(pointsNeeded, freeGames, hasDirectClash) {
  let wins  = Math.floor(pointsNeeded / 3);
  let draws = pointsNeeded % 3; // 0, 1 or 2

  // Clamp: wins + draws must not exceed freeGames
  while (wins + draws > freeGames && draws > 0) draws--;
  if (wins > freeGames) { wins = freeGames; draws = 0; }

  const freeLosses  = freeGames - wins - draws;
  const totalLosses = freeLosses + (hasDirectClash ? 1 : 0);
  const totalGames  = freeGames  + (hasDirectClash ? 1 : 0);

  return { wins, draws, losses: totalLosses, totalGames, ptsScored: wins * 3 + draws };
}

function calculateTitle(selectedId) {
  const selected = standingsData.find(t => t.idTeam === selectedId);
  if (!selected) return null;

  const selectedRank = parseInt(selected.intRank, 10);
  const rivalRank    = selectedRank === 1 ? 2 : 1;
  const rival        = standingsData.find(t => parseInt(t.intRank, 10) === rivalRank);
  if (!rival) return null;

  const selRemaining = remainingFixtures.filter(f =>
    f.idHomeTeam === selectedId || f.idAwayTeam === selectedId
  );
  const rivRemaining = remainingFixtures.filter(f =>
    f.idHomeTeam === rival.idTeam || f.idAwayTeam === rival.idTeam
  );

  const directClash = remainingFixtures.find(f =>
    (f.idHomeTeam === selectedId   && f.idAwayTeam === rival.idTeam) ||
    (f.idHomeTeam === rival.idTeam && f.idAwayTeam === selectedId)
  );
  const hasDirectClash = !!directClash;

  const selCurrentPts = parseInt(selected.intPoints, 10);
  const rivCurrentPts = parseInt(rival.intPoints, 10);

  // Selected wins ALL remaining games
  const selMax       = selCurrentPts + selRemaining.length * 3;
  // Free games for rival = all their remaining minus the H2H loss (selected wins that)
  const rivFreeGames = rivRemaining.length - (hasDirectClash ? 1 : 0);
  // Rival's best case: wins every free game, loses H2H
  const rivBestCase  = rivCurrentPts + rivFreeGames * 3;

  const selGD = parseInt(selected.intGoalDifference, 10);
  const rivGD = parseInt(rival.intGoalDifference, 10);

  // If points are equal, the team with higher GD wins — so selected can allow a points tie
  // when they currently hold the GD advantage.
  const canWinOnGD = selGD > rivGD;

  let verdict, rivPointsAllowed, rivPointsNeeded, rivBreakdown;

  if (rivCurrentPts >= selMax) {
    verdict = 'impossible';
  } else if (rivBestCase < selMax) {
    verdict = 'win';
  } else if (rivBestCase === selMax) {
    verdict = canWinOnGD ? 'gd-win' : 'gd-lose';
  } else {
    verdict          = 'possible';
    rivPointsAllowed = canWinOnGD ? selMax : selMax - 1;
    rivPointsNeeded  = rivPointsAllowed - rivCurrentPts;
    rivBreakdown     = computeRivalBreakdown(rivPointsNeeded, rivFreeGames, hasDirectClash);
  }

  // ── Title Guarantee (only for 1st-place team) ───────────────────────────
  // Uses rival's ABSOLUTE maximum (rival wins ALL games including H2H) — worst case for selected.
  // If selected has the GD edge, tying on points is sufficient to guarantee the title.
  let guaranteeInfo = null;
  if (selectedRank === 1) {
    const rivAbsoluteMax     = rivCurrentPts + rivRemaining.length * 3;
    const guaranteeTotal     = canWinOnGD ? rivAbsoluteMax : rivAbsoluteMax + 1;
    const guaranteeAdditional = guaranteeTotal - selCurrentPts;

    if (guaranteeAdditional <= 0) {
      guaranteeInfo = { status: 'done', guaranteeTotal, rivAbsoluteMax };
    } else if (guaranteeAdditional > selRemaining.length * 3) {
      // Even winning all remaining games won't reach the guarantee threshold
      guaranteeInfo = { status: 'unreachable', guaranteeTotal, guaranteeAdditional, rivAbsoluteMax };
    } else {
      const gWins  = Math.floor(guaranteeAdditional / 3);
      const gDraws = guaranteeAdditional % 3;
      guaranteeInfo = {
        status: 'achievable',
        guaranteeTotal,
        guaranteeAdditional,
        gamesRemaining: selRemaining.length,
        gWins,
        gDraws,
        rivAbsoluteMax,
        gdDecides: canWinOnGD,
      };
    }
  }

  const byDate = (a, b) => new Date(a.strTimestamp) - new Date(b.strTimestamp);

  return {
    selMax, rivBestCase, rivFreeGames,
    selCurrentPts, rivCurrentPts,
    selRemaining: selRemaining.length,
    rivRemaining: rivRemaining.length,
    selFixtures: [...selRemaining].sort(byDate),
    rivFixtures: [...rivRemaining].sort(byDate),
    hasDirectClash, directClash,
    rival, verdict,
    selGD, rivGD,
    canWinOnGD,
    rivPointsAllowed, rivPointsNeeded, rivBreakdown,
    guaranteeInfo,
  };
}

function buildGuaranteeHtml(selected, result) {
  const g = result.guaranteeInfo;

  if (g.status === 'done') {
    return `
      <div class="calc-guarantee calc-guarantee--done">
        <span class="calc-guarantee-label">Title Guarantee</span>
        <span class="calc-guarantee-status">✓ Already secured — no other team can overtake ${selected.strTeam}</span>
      </div>`;
  }

  if (g.status === 'unreachable') {
    return `
      <div class="calc-guarantee calc-guarantee--unreachable">
        <span class="calc-guarantee-label">Title Guarantee</span>
        <span class="calc-guarantee-status">Cannot be mathematically secured this matchday — even winning all remaining games (${result.selMax} pts) falls short of the ${g.guaranteeTotal} needed to guarantee ahead of ${result.rival.strTeam}'s maximum of ${g.rivAbsoluteMax} pts</span>
      </div>`;
  }

  // status === 'achievable'
  const minResultStr = g.gDraws > 0
    ? `${g.gWins}W · ${g.gDraws}D`
    : `${g.gWins}W`;

  const gdNote = g.gdDecides
    ? ` &nbsp;<span class="calc-guarantee-gd">(tie on points is enough — wins on GD: ${gdStr(result.selGD)} vs ${gdStr(result.rivGD)})</span>`
    : '';

  return `
    <div class="calc-guarantee">
      <span class="calc-guarantee-label">Title Guarantee</span>
      <div class="calc-guarantee-body">
        <div class="calc-guarantee-row">
          <span>Points needed</span>
          <span><strong>${g.guaranteeTotal}</strong> total &nbsp;(+${g.guaranteeAdditional} from ${g.gamesRemaining} remaining)${gdNote}</span>
        </div>
        <div class="calc-guarantee-row">
          <span>Minimum results</span>
          <span><strong>${minResultStr}</strong> from ${g.gamesRemaining} games</span>
        </div>
        <div class="calc-guarantee-note">
          Based on ${result.rival.strTeam} winning all ${result.rivRemaining} remaining games (${g.rivAbsoluteMax} pts max)${g.gdDecides ? ' — a points tie goes to ' + selected.strTeam + ' on GD' : ''}
        </div>
      </div>
    </div>`;
}

function buildFixturesHtml(selected, result) {
  const selId  = selected.idTeam;
  const rivId  = result.rival.idTeam;

  const isH2H = f =>
    (f.idHomeTeam === selId && f.idAwayTeam === rivId) ||
    (f.idHomeTeam === rivId && f.idAwayTeam === selId);

  const fixtureRow = f => {
    const h2h   = isH2H(f);
    const hBadge = f.strHomeTeamBadge ? `<img src="${badgeUrl(f.strHomeTeamBadge)}" alt="${f.strHomeTeam}" />` : '';
    const aBadge = f.strAwayTeamBadge ? `<img src="${badgeUrl(f.strAwayTeamBadge)}" alt="${f.strAwayTeam}" />` : '';
    return `
      <div class="calc-fixture-item${h2h ? ' calc-fixture--h2h' : ''}">
        <div class="calc-fixture-meta">
          <span class="calc-fixture-round">R${f.intRound}</span>
          <span class="calc-fixture-date">${formatDate(f.strTimestamp)}</span>
          ${h2h ? '<span class="calc-fixture-h2h-badge">H2H</span>' : ''}
        </div>
        <div class="calc-fixture-teams">
          ${hBadge}<span class="calc-fixture-name">${f.strHomeTeam}</span>
          <span class="calc-fixture-vs">vs</span>
          <span class="calc-fixture-name">${f.strAwayTeam}</span>${aBadge}
        </div>
      </div>`;
  };

  const selRows = result.selFixtures.map(fixtureRow).join('');
  const rivRows = result.rivFixtures.map(fixtureRow).join('');

  return `
    <div class="calc-fixtures">
      <div class="calc-fixtures-title">Remaining Fixtures</div>
      <div class="calc-fixtures-cols">
        <div class="calc-fixtures-col">
          <div class="calc-fixtures-col-header">
            <img src="${badgeUrl(selected.strBadge)}" alt="${selected.strTeam}" />
            <span>${selected.strTeam}</span>
            <span class="calc-fixtures-count">${result.selRemaining} games</span>
          </div>
          <div class="calc-fixtures-list">${selRows}</div>
        </div>
        <div class="calc-fixtures-col">
          <div class="calc-fixtures-col-header">
            <img src="${badgeUrl(result.rival.strBadge)}" alt="${result.rival.strTeam}" />
            <span>${result.rival.strTeam}</span>
            <span class="calc-fixtures-count">${result.rivRemaining} games</span>
          </div>
          <div class="calc-fixtures-list">${rivRows}</div>
        </div>
      </div>
    </div>`;
}

function renderChampionCalc(selected, result) {
  const panelEl = document.getElementById('champion-calc');

  const rivalLabel = parseInt(result.rival.intRank, 10) === 1
    ? '1st · Leader'
    : '2nd · Challenger';

  const verdictConfig = {
    'win': {
      cls:  'calc-verdict--win',
      icon: '✓',
      text: `Wins the title — even in ${result.rival.strTeam}'s best case they only reach ${result.rivBestCase} pts, ${result.selMax - result.rivBestCase} pt${result.selMax - result.rivBestCase !== 1 ? 's' : ''} short of ${selected.strTeam}'s ${result.selMax}`,
    },
    'impossible': {
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
    'possible': {
      cls:  'calc-verdict--possible',
      icon: '✓',
      text: result.canWinOnGD
        ? `Mathematically possible — ${selected.strTeam} reaches ${result.selMax} pts; ${result.rival.strTeam} can tie on points but ${selected.strTeam} wins on GD (${gdStr(result.selGD)} vs ${gdStr(result.rivGD)}), so rival must score ≤ ${result.rivPointsNeeded} more from ${result.rivRemaining} games`
        : `Mathematically possible — ${selected.strTeam} reaches ${result.selMax} pts; ${result.rival.strTeam} must finish with ≤ ${result.rivPointsAllowed} pts (score ≤ ${result.rivPointsNeeded} more from their ${result.rivRemaining} remaining games)`,
    },
  };
  const v = verdictConfig[result.verdict];

  const directClashHtml = result.hasDirectClash
    ? `<div class="calc-clash">
        <span class="calc-clash-label">Direct clash</span>
        <span class="calc-clash-match">${result.directClash.strHomeTeam} vs ${result.directClash.strAwayTeam}</span>
        <span class="calc-clash-meta">Round ${result.directClash.intRound} · ${formatDate(result.directClash.strTimestamp)}</span>
        <span class="calc-clash-note">→ ${selected.strTeam} wins this match in the simulation</span>
      </div>`
    : `<div class="calc-clash calc-clash--none">No direct clash remaining between these two teams.</div>`;

  // Rival column content differs for 'possible' vs other verdicts
  let rivColRows;
  if (result.verdict === 'possible') {
    const bd = result.rivBreakdown;
    rivColRows = `
      <div class="calc-pts-row">
        <span class="calc-pts-label">Current</span>
        <span>${result.rivCurrentPts} pts</span>
      </div>
      <div class="calc-pts-row">
        <span class="calc-pts-label">Max allowed${result.canWinOnGD ? ' (tie OK — GD wins)' : ''}</span>
        <span>${result.rivPointsAllowed} pts</span>
      </div>
      <div class="calc-pts-row calc-pts-total">
        <span>Must score ≤ ${result.rivPointsNeeded} more</span>
        <span>from ${result.rivRemaining} games</span>
      </div>
      <div class="calc-pts-row calc-breakdown">
        <span class="calc-pts-label">e.g.</span>
        <span>${bd.wins}W &middot; ${bd.draws}D &middot; ${bd.losses}L = ${bd.ptsScored} pts</span>
      </div>
      <div class="calc-pts-row calc-pts-gd">
        <span class="calc-pts-label">GD</span>
        <span>${gdStr(result.rivGD)}</span>
      </div>`;
  } else {
    const rivBestWins = result.rivFreeGames;
    const rivGamesNote = result.hasDirectClash
      ? `${rivBestWins} win${rivBestWins !== 1 ? 's' : ''}, 1 loss (H2H)`
      : `${rivBestWins} win${rivBestWins !== 1 ? 's' : ''}`;
    rivColRows = `
      <div class="calc-pts-row">
        <span class="calc-pts-label">Current</span>
        <span>${result.rivCurrentPts} pts</span>
      </div>
      <div class="calc-pts-row">
        <span class="calc-pts-label">${rivGamesNote} (best case)</span>
        <span>+${rivBestWins * 3} pts</span>
      </div>
      <div class="calc-pts-row calc-pts-total">
        <span>Best case total</span>
        <span>${result.rivBestCase} pts</span>
      </div>
      <div class="calc-pts-row calc-pts-gd">
        <span class="calc-pts-label">GD</span>
        <span>${gdStr(result.rivGD)}</span>
      </div>`;
  }

  const scenarioNote = result.verdict === 'possible'
    ? `${selected.strTeam} wins all <strong>${result.selRemaining}</strong> remaining games · ${result.rival.strTeam} must score ≤ ${result.rivPointsNeeded} more pts from ${result.rivRemaining} games${result.canWinOnGD ? ' (GD tiebreaker favours ' + selected.strTeam + ')' : ''}`
    : `${selected.strTeam} wins all <strong>${result.selRemaining}</strong> remaining games · ${result.rival.strTeam} wins all except the direct clash`;

  panelEl.innerHTML = `
    <div class="calc-header">
      <img src="${badgeUrl(selected.strBadge)}" alt="${selected.strTeam}" class="calc-logo" />
      <div class="calc-title-block">
        <div class="calc-team-name">${selected.strTeam}</div>
        <div class="calc-subtitle">Title Race Calculator — best case scenario</div>
      </div>
      <button class="calc-close" onclick="hideChampionCalc()" title="Close">×</button>
    </div>

    <div class="calc-scenario">${scenarioNote}</div>

    ${directClashHtml}

    <div class="calc-grid">
      <div class="calc-col calc-col--selected">
        <div class="calc-col-header">
          <img src="${badgeUrl(selected.strBadge)}" alt="${selected.strTeam}" />
          <span>${selected.strTeam}</span>
        </div>
        <div class="calc-pts-row">
          <span class="calc-pts-label">Current</span>
          <span>${result.selCurrentPts} pts</span>
        </div>
        <div class="calc-pts-row">
          <span class="calc-pts-label">${result.selRemaining} wins</span>
          <span>+${result.selRemaining * 3} pts</span>
        </div>
        <div class="calc-pts-row calc-pts-total">
          <span>Maximum</span>
          <span>${result.selMax} pts</span>
        </div>
        <div class="calc-pts-row calc-pts-gd">
          <span class="calc-pts-label">GD</span>
          <span>${gdStr(result.selGD)}</span>
        </div>
      </div>

      <div class="calc-col calc-col--rival">
        <div class="calc-col-header">
          <img src="${badgeUrl(result.rival.strBadge)}" alt="${result.rival.strTeam}" />
          <span>${result.rival.strTeam} <small class="rival-label">${rivalLabel}</small></span>
        </div>
        ${rivColRows}
      </div>
    </div>

    ${result.guaranteeInfo ? buildGuaranteeHtml(selected, result) : ''}

    <div class="calc-verdict ${v.cls}">${v.icon} ${v.text}</div>

    ${buildFixturesHtml(selected, result)}
  `;

  show(panelEl);
  panelEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideChampionCalc() {
  const panelEl = document.getElementById('champion-calc');
  if (panelEl) hide(panelEl);
  document.querySelectorAll('#standings-body tr.calc-selected')
    .forEach(r => r.classList.remove('calc-selected'));
}

// ── Upcoming Fixtures ──────────────────────────────────────────────────────
async function loadFixtures() {
  const loadingEl   = document.getElementById('fixtures-loading');
  const errorEl     = document.getElementById('fixtures-error');
  const containerEl = document.getElementById('fixtures-container');

  try {
    const data = await apiFetchV1(`/eventsnextleague.php?id=${LEAGUE_ID}`);

    const fixtures = (data.events || [])
      .filter(e => e.strStatus === 'Not Started');

    if (fixtures.length === 0) {
      hide(loadingEl);
      containerEl.innerHTML = '<p style="padding:24px;color:var(--text-muted)">No upcoming fixtures found.</p>';
      show(containerEl);
      return;
    }

    const rounds = new Map();
    fixtures.forEach(f => {
      const key = `Matchday ${f.intRound}`;
      if (!rounds.has(key)) rounds.set(key, []);
      rounds.get(key).push(f);
    });

    containerEl.innerHTML = [...rounds.entries()].map(([roundLabel, matches]) => {
      const cardsHtml = matches
        .sort((a, b) => new Date(a.strTimestamp) - new Date(b.strTimestamp))
        .map(buildFixtureCard)
        .join('');
      return `
        <div class="round-group">
          <div class="round-title">${roundLabel}</div>
          <div class="fixtures-grid">${cardsHtml}</div>
        </div>`;
    }).join('');

    hide(loadingEl);
    show(containerEl);

  } catch (err) {
    hide(loadingEl);
    errorEl.textContent = `Could not load fixtures: ${err.message}`;
    show(errorEl);
  }
}

function buildFixtureCard(f) {
  const dateStr = formatDateTime(f.strTimestamp);
  return `
    <div class="fixture-card">
      <div class="fixture-date">
        <span class="dot"></span>${dateStr}
      </div>
      <div class="fixture-teams">
        <div class="fixture-team">
          <img src="${f.strHomeTeamBadge}" alt="${f.strHomeTeam}" loading="lazy" />
          <span class="fixture-team-name">${f.strHomeTeam}</span>
        </div>
        <div class="fixture-vs">vs</div>
        <div class="fixture-team">
          <img src="${f.strAwayTeamBadge}" alt="${f.strAwayTeam}" loading="lazy" />
          <span class="fixture-team-name">${f.strAwayTeam}</span>
        </div>
      </div>
    </div>`;
}

// ── Init ───────────────────────────────────────────────────────────────────
loadStandings();
loadFixtures();
loadSeasonFixtures();
