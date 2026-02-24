export default function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="header-brand">
          <img
            src="https://media.api-sports.io/football/leagues/135.png"
            alt="Serie A"
            className="league-logo"
          />
          <div>
            <h1>Serie A</h1>
            <span className="season-label">2025 Season</span>
          </div>
        </div>
      </div>
    </header>
  );
}
