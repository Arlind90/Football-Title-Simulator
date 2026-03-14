/**
 * Patches standings entries when the season-fixtures endpoint has recorded more
 * finished matches than the standings API has processed yet.  For each team
 * where finishedFixtures.length > intPlayed, the surplus matches are applied
 * on top of the API values so that MP, W, D, L, GF, GA, GD, Pts and Form
 * stay consistent with the fixture list shown to the user.
 */
export function reconcileStandings(standings, finishedFixtures) {
  if (!finishedFixtures || finishedFixtures.length === 0) return standings;

  // Group finished fixtures (with valid scores) by team id
  const byTeam = {};
  finishedFixtures.forEach(f => {
    const homeScore = parseInt(f.intHomeScore, 10);
    const awayScore = parseInt(f.intAwayScore, 10);
    if (isNaN(homeScore) || isNaN(awayScore)) return;

    [f.idHomeTeam, f.idAwayTeam].forEach(teamId => {
      if (!byTeam[teamId]) byTeam[teamId] = [];
      byTeam[teamId].push(f);
    });
  });

  // Sort each team's fixtures oldest → newest so slice(apiPlayed) gives the
  // most-recently-played matches that the standings API hasn't counted yet.
  Object.values(byTeam).forEach(arr =>
    arr.sort((a, b) => new Date(a.strTimestamp) - new Date(b.strTimestamp))
  );

  return standings.map(entry => {
    const teamId    = entry.idTeam;
    const apiPlayed = parseInt(entry.intPlayed, 10);
    const teamDone  = byTeam[teamId] || [];

    if (teamDone.length <= apiPlayed) return entry; // already in sync

    const unrecorded = teamDone.slice(apiPlayed);
    let extraW = 0, extraD = 0, extraL = 0, extraGF = 0, extraGA = 0;
    let formAppend = '';

    unrecorded.forEach(f => {
      const homeScore = parseInt(f.intHomeScore, 10);
      const awayScore = parseInt(f.intAwayScore, 10);
      const isHome    = f.idHomeTeam === teamId;
      const teamScore = isHome ? homeScore : awayScore;
      const oppScore  = isHome ? awayScore : homeScore;

      extraGF += teamScore;
      extraGA += oppScore;

      if (teamScore > oppScore)      { extraW++; formAppend += 'W'; }
      else if (teamScore === oppScore){ extraD++; formAppend += 'D'; }
      else                           { extraL++; formAppend += 'L'; }
    });

    const extraPts = extraW * 3 + extraD;

    return {
      ...entry,
      intPlayed:         String(apiPlayed + unrecorded.length),
      intWin:            String(parseInt(entry.intWin,  10) + extraW),
      intDraw:           String(parseInt(entry.intDraw, 10) + extraD),
      intLoss:           String(parseInt(entry.intLoss, 10) + extraL),
      intGoalsFor:       String(parseInt(entry.intGoalsFor,      10) + extraGF),
      intGoalsAgainst:   String(parseInt(entry.intGoalsAgainst,  10) + extraGA),
      intGoalDifference: String(parseInt(entry.intGoalDifference,10) + extraGF - extraGA),
      intPoints:         String(parseInt(entry.intPoints, 10) + extraPts),
      strForm:           (entry.strForm || '') + formAppend,
    };
  });
}

// Given rival must score ≤ pointsNeeded from freeGames non-H2H games,
// return a W/D/L breakdown that hits exactly that points tally (or as close
// as possible without exceeding it).
export function computeRivalBreakdown(pointsNeeded, freeGames, hasDirectClash) {
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

export function calculateTitle(selectedId, standingsData, remainingFixtures) {
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

  const selMax       = selCurrentPts + selRemaining.length * 3;
  const rivFreeGames = rivRemaining.length - (hasDirectClash ? 1 : 0);
  const rivBestCase  = rivCurrentPts + rivFreeGames * 3;

  const selGD = parseInt(selected.intGoalDifference, 10);
  const rivGD = parseInt(rival.intGoalDifference, 10);

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

  let guaranteeInfo = null;
  if (selectedRank === 1) {
    const rivAbsoluteMax      = rivCurrentPts + rivRemaining.length * 3;
    const guaranteeTotal      = canWinOnGD ? rivAbsoluteMax : rivAbsoluteMax + 1;
    const guaranteeAdditional = guaranteeTotal - selCurrentPts;

    if (guaranteeAdditional <= 0) {
      guaranteeInfo = { status: 'done', guaranteeTotal, rivAbsoluteMax };
    } else if (guaranteeAdditional > selRemaining.length * 3) {
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

  const UNCONFIRMED = ['PST', 'TBD', 'Match Postponed'];
  const byDate = (a, b) => {
    const aPost = UNCONFIRMED.includes(a.strStatus);
    const bPost = UNCONFIRMED.includes(b.strStatus);
    if (aPost && !bPost) return 1;
    if (!aPost && bPost) return -1;
    return new Date(a.strTimestamp) - new Date(b.strTimestamp);
  };

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
