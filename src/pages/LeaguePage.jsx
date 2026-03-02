import { useParams, Navigate } from 'react-router-dom';
import { getLeagueBySlug } from '../config/leagues';
import Header from '../components/Header';
import StandingsSection from '../components/StandingsSection';
import FixturesSection from '../components/FixturesSection';
import Footer from '../components/Footer';

export default function LeaguePage() {
  const { slug } = useParams();
  const league = getLeagueBySlug(slug);

  if (!league) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <Header league={league} />
      <main className="container">
        <StandingsSection league={league} />
        <FixturesSection league={league} />
      </main>
      <Footer />
    </>
  );
}
