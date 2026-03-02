import { Link } from 'react-router-dom';

export default function Header({ league }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        {league ? (
          <div className="header-brand">
            <Link to="/" className="header-back" title="All Leagues">
              ← All Leagues
            </Link>
            <img
              src={league.logoUrl}
              alt={league.name}
              className="league-logo"
            />
            <div>
              <h1>{league.name}</h1>
              <span className="season-label">{league.country} · {league.season} Season</span>
            </div>
          </div>
        ) : (
          <div className="header-brand">
            <div>
              <h1>Title Race Simulator</h1>
              <span className="season-label">Select a league to get started</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
