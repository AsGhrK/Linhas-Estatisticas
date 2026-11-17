import { hotels, mealStats, typicalFoods } from '../data/mockData';
import SectionHeading from './SectionHeading';
import StatsGrid from './StatsGrid';
import './LodgingFoodSection.css';

export default function LodgingFoodSection() {
  return (
    <section id="hospedagem" className="content-section">
      <div className="wrap">
        <SectionHeading tag="Seção 03 — Hospedagem e alimentação" title="Hotéis, restaurantes e pratos típicos de cada destino" description="Diárias de hotéis da mesma rede nas duas cidades e o custo médio das refeições do dia, para estimar quanto a estadia pesa no orçamento." />
        <div className="hospitality-grid">
          <div className="hotel-list">
            {hotels.map((hotel) => (
              <div className="hotel-row" key={`${hotel.name}-${hotel.city}`}>
                <div><div className="hotel-name">{hotel.name}</div><div className="hotel-city">{hotel.city}</div></div>
                <div className="hotel-price">{hotel.price}</div>
              </div>
            ))}
            <div className="cost-box">
              <div className="cost-amount">R$ 2.672 / R$ 3.163</div>
              <div className="cost-label">Custo médio de hospedagem — São Paulo / Rio de Janeiro, 7 dias</div>
            </div>
          </div>
          <div className="food-panel">
            <h3>Comidas típicas</h3>
            <p>Alguns pratos tradicionais do Rio de Janeiro e de São Paulo para provar durante a viagem.</p>
            <div className="tag-list">
              {typicalFoods.map((food) => <span key={food}>{food}</span>)}
            </div>
            <StatsGrid items={mealStats} columns={3} className="meal-stats" />
          </div>
        </div>
      </div>
    </section>
  );
}
