export const CURRENT_VERSION = '0.3';

export const CHANGELOG = [
  {
    version: '0.3',
    date: 'Mar 2026',
    changes: [
      'Standings now reconcile against live fixture results — matches played today are reflected immediately even when the standings API lags behind',
      'Matches played (MP), W/D/L, GF, GA, GD, Pts and Form badges all update from fixture data when a discrepancy is detected',
      'Title Race Calculator automatically uses the corrected standings, keeping max-points and verdict accurate',
    ],
  },
  {
    version: '0.2',
    date: 'Mar 2026',
    changes: [
      'Postponed and unscheduled fixtures (PST / TBD) now appear in Remaining Fixtures with a TBC label',
      'Postponed games correctly count toward a team\'s remaining games total and maximum points',
      'Postponed fixtures sort to the bottom of the list; auto-promote to correct position once confirmed',
    ],
  },
  {
    version: '0.1',
    date: 'Mar 2026',
    changes: [
      'Initial release — Premier League, La Liga, Serie A, Bundesliga, Ligue 1',
      'Title Race Calculator: best-case scenario, maximum points, verdict, head-to-head detection',
      'Title Guarantee block showing points and minimum results needed to seal the title',
      'Remaining fixtures list with round, date, badges and H2H highlighting',
    ],
  },
];
