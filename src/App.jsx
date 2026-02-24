import Header from './components/Header';
import StandingsSection from './components/StandingsSection';
import FixturesSection from './components/FixturesSection';
import Footer from './components/Footer';

export default function App() {
  return (
    <>
      <Header />
      <main className="container">
        <StandingsSection />
        <FixturesSection />
      </main>
      <Footer />
    </>
  );
}
