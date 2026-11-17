import { flightRoutes, flightStats } from '../data/mockData';
import SectionHeading from './SectionHeading';
import StatsGrid from './StatsGrid';
import './FlightComparison.css';

export default function FlightComparison() {
  return (
    <section id="voos" className="content-section">
      <div className="wrap">
        <SectionHeading tag="Seção 01 — Voos" title="Duas rotas, lado a lado, sem abas escondidas" description="Compare as tarifas da GOL, da LATAM e da Azul saindo de Campo Grande para o Rio de Janeiro e para São Paulo. Os preços vêm de dados públicos da ANAC." />
        <div className="route-tabs" aria-label="Rotas demonstradas">
          <span className="route-tab route-tab--active">SBCG → SBRJ</span>
          <span className="route-tab">SBCG → SBSP</span>
        </div>
        <div className="flight-grid">
          {flightRoutes.map((route) => (
            <article className="flight-col" key={route.title}>
              <h3>{route.title}</h3>
              <p className="flight-route">{route.route}</p>
              {route.flights.map((flight) => (
                <div className="flight-row" key={flight.carrier}>
                  <div><div className="carrier">{flight.carrier}</div><div className="duration">{flight.duration}</div></div>
                  <div className="flight-price">{flight.price}</div>
                </div>
              ))}
            </article>
          ))}
        </div>
        <StatsGrid items={flightStats} />
      </div>
    </section>
  );
}
