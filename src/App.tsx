import Header from './components/Header';
import Hero from './components/Hero';
import SearchCard from './components/SearchCard';
import FlightComparison from './components/FlightComparison';
import WeatherSection from './components/WeatherSection';
import LodgingFoodSection from './components/LodgingFoodSection';
import OverviewSection from './components/OverviewSection';
import CallToAction from './components/CallToAction';
import Footer from './components/Footer';

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <div className="wrap search-wrap" id="buscar">
          <SearchCard />
        </div>
        <FlightComparison />
        <WeatherSection />
        <LodgingFoodSection />
        <OverviewSection />
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
