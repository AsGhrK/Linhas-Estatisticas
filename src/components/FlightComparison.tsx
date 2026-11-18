import { flightRoutes, flightStats } from '../data/mockData';
import SectionHeading from './SectionHeading';
import StatsGrid from './StatsGrid';
import './FlightComparison.css';

export default function FlightComparison() {
  return (
    <section id="voos" className="content-section">
      <div className="wrap">
        <SectionHeading tag="Seção 01 — Voos" title="Duas rotas, lado a lado, sem abas escondidas" description="As tarifas vêm dos microdados de tarifas aéreas domésticas da ANAC, que reúnem os preços das passagens vendidas ao público e registrados todo mês pelas companhias aéreas."
          source={<><a href="https://www.gov.br/anac/pt-br/assuntos/dados-e-estatisticas" target="_blank" rel="noopener noreferrer">ANAC — Dados e Estatísticas</a> (acesso em 17/11/2026)</>}
        />
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
