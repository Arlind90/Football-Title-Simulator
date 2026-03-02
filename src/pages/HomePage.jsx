import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LEAGUES } from '../config/leagues';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function HomePage() {
  useEffect(() => {
    document.title = 'Title Simulator';
  }, []);

  return (
    <>
      <Header />
      <main className="container">
        <section className="section">
          <h2 className="section-title">Choose a League</h2>
          <div className="league-hero-list">
            {LEAGUES.map(league => (
              <Link
                key={league.slug}
                to={`/${league.slug}`}
                className="league-hero-row"
              >
                <img
                  src={league.logoUrl}
                  alt={league.name}
                  className="league-hero-logo"
                />
                <div className="league-hero-info">
                  <span className="league-hero-name">{league.name}</span>
                  <span className="league-hero-country">{league.country} · {league.season} Season</span>
                </div>
                <span className="league-hero-chevron">›</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
