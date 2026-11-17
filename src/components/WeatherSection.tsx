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
        <SectionHeading tag="Seção 02 — Clima" title="Previsão baseada em 30 anos de histórico meteorológico" description="Lorem ipsum dolor sit amet consectetur adipiscing elit. Praesent euismod, nibh non luctus dictum, arcu erat facilisis nulla, at gravida elit purus id ante." />
        <div className="weather-grid">
          <WeatherCard city="Rio de Janeiro" blueLine="0,70 40,60 80,66 120,50 160,40 200,55 240,62 280,45" coralLine="0,90 40,85 80,88 120,80 160,70 200,82 240,86 280,75" coolSeason="20°C · 36mm de chuva" warmSeason="24°C · 158mm de chuva" />
          <WeatherCard city="São Paulo" blueLine="0,60 40,55 80,58 120,45 160,38 200,50 240,55 280,42" coralLine="0,95 40,90 80,92 120,85 160,78 200,86 240,90 280,80" coolSeason="17°C · 49mm de chuva" warmSeason="21°C · 155mm de chuva" />
        </div>
      </div>
    </section>
  );
}
