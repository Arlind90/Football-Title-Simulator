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
