import { hotels, mealStats, typicalFoods } from '../data/mockData';
import SectionHeading from './SectionHeading';
import StatsGrid from './StatsGrid';
import './LodgingFoodSection.css';

export default function LodgingFoodSection() {
  return (
    <section id="hospedagem" className="content-section">
      <div className="wrap">
        <SectionHeading tag="Seção 03 — Hospedagem e alimentação" title="Hotéis, restaurantes e pratos típicos de cada destino" description="Diárias de hotéis da rede Accor nas duas cidades e o custo médio das refeições do dia, para estimar quanto a estadia pesa no orçamento."
          source={<>hotéis da <a href="https://all.accor.com" target="_blank" rel="noopener noreferrer">rede Accor</a>; refeições do Quanto Custa Viajar, faixa econômica (acesso em 17/11/2026)</>}
        />
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
            <p>No Rio, vale provar a feijoada carioca, o filé à Oswaldo Aranha e o biscoito Globo com mate gelado na praia. Em São Paulo, os clássicos são o virado à paulista, o sanduíche de mortadela e o pastel com caldo de cana das feiras.</p>
            <p className="section-source">Fonte: Quanto Custa Viajar — <a href="https://quantocustaviajar.com/brasil/rio-de-janeiro/alimentacao" target="_blank" rel="noopener noreferrer">Rio de Janeiro</a> e <a href="https://quantocustaviajar.com/brasil/sao-paulo/alimentacao" target="_blank" rel="noopener noreferrer">São Paulo</a> (acesso em 17/11/2026)</p>
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
