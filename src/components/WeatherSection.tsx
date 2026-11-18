import SectionHeading from './SectionHeading';
import './WeatherSection.css';

interface WeatherCardProps {
  city: string;
  blueLine: string;
  coralLine: string;
  coolSeason: string;
  warmSeason: string;
}

function WeatherCard({ city, blueLine, coralLine, coolSeason, warmSeason }: WeatherCardProps) {
  return (
    <article className="weather-card">
      <h3>{city}</h3>
      <svg className="weather-chart" viewBox="0 0 300 110" role="img" aria-label={`Gráfico ilustrativo de clima de ${city}`}>
        <polyline points={blueLine} fill="none" stroke="var(--sky)" strokeWidth="2" />
        <polyline points={coralLine} fill="none" stroke="var(--coral)" strokeWidth="2" />
      </svg>
      <div className="weather-notes">
        <div><b>Jun/Jul/Ago</b>{coolSeason}</div>
        <div><b>Out/Nov/Dez</b>{warmSeason}</div>
      </div>
    </article>
  );
}

export default function WeatherSection() {
  return (
    <section id="clima" className="content-section section-alt">
      <div className="wrap">
        <SectionHeading tag="Seção 02 — Clima" title="O clima típico de cada mês, com base em 30 anos de observações"
          description="As médias climatológicas são calculadas com 30 anos de dados observados e mostram as épocas mais quentes, frias, chuvosas e secas de cada cidade. Elas descrevem o comportamento típico do mês, não a previsão do tempo para uma data."
          source={<>ClimaTempo — Climatologia (<a href="https://www.climatempo.com.br/climatologia/321/riodejaneiro-rj" target="_blank" rel="noopener noreferrer">Rio de Janeiro</a> e <a href="https://www.climatempo.com.br/climatologia/558/saopaulo-sp" target="_blank" rel="noopener noreferrer">São Paulo</a>) e <a href="https://portal.inmet.gov.br/servicos/normais-climatol%C3%B3gicas" target="_blank" rel="noopener noreferrer">INMET — Normais Climatológicas</a> (acesso em 17/11/2026)</>}
        />
        <div className="weather-grid">
          <WeatherCard city="Rio de Janeiro" blueLine="0,70 40,60 80,66 120,50 160,40 200,55 240,62 280,45" coralLine="0,90 40,85 80,88 120,80 160,70 200,82 240,86 280,75" coolSeason="20 °C · 36 mm de chuva por mês" warmSeason="24 °C · 158 mm de chuva por mês" />
          <WeatherCard city="São Paulo" blueLine="0,60 40,55 80,58 120,45 160,38 200,50 240,55 280,42" coralLine="0,95 40,90 80,92 120,85 160,78 200,86 240,90 280,80" coolSeason="17 °C · 49 mm de chuva por mês" warmSeason="21 °C · 155 mm de chuva por mês" />
        </div>
      </div>
    </section>
  );
}
