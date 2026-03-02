export const LEAGUES = [
  {
    slug:    'serie-a',
    name:    'Serie A',
    country: 'Italy',
    id:      4332,
    season:  '2025-2026',
    logoUrl: 'https://media.api-sports.io/football/leagues/135.png',
  },
  {
    slug:    'premier-league',
    name:    'Premier League',
    country: 'England',
    id:      4328,
    season:  '2025-2026',
    logoUrl: 'https://media.api-sports.io/football/leagues/39.png',
  },
  {
    slug:    'la-liga',
    name:    'La Liga',
    country: 'Spain',
    id:      4335,
    season:  '2025-2026',
    logoUrl: 'https://media.api-sports.io/football/leagues/140.png',
  },
  {
    slug:    'bundesliga',
    name:    'Bundesliga',
    country: 'Germany',
    id:      4331,
    season:  '2025-2026',
    logoUrl: 'https://media.api-sports.io/football/leagues/78.png',
  },
  {
    slug:    'ligue-1',
    name:    'Ligue 1',
    country: 'France',
    id:      4334,
    season:  '2025-2026',
    logoUrl: 'https://media.api-sports.io/football/leagues/61.png',
  },
];

export function getLeagueBySlug(slug) {
  return LEAGUES.find(l => l.slug === slug) || null;
}
