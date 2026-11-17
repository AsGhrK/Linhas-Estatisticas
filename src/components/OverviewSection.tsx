import SectionHeading from './SectionHeading';
import './OverviewSection.css';

const checklist = [
  'Preço da passagem', 'Clima / temperatura',
  'Chuva / precipitação', 'Hotéis / hospedagem',
  'Alimentação', 'Distância',
];

export default function OverviewSection() {
  return (
    <section id="visao-geral" className="content-section section-alt">
      <div className="wrap overview-grid">
        <div>
          <SectionHeading tag="Seção 04 — Visão geral" title="Todos os critérios, um só painel comparativo" description="Lorem ipsum dolor sit amet consectetur adipiscing elit. Nulla facilisi, vestibulum ante ipsum primis in faucibus orci luctus et ultrices." />
          <div className="legend">
            <span><i className="legend-swatch legend-swatch--sp" />São Paulo</span>
            <span><i className="legend-swatch legend-swatch--rj" />Rio de Janeiro</span>
          </div>
          <div className="checklist">
            {checklist.map((item) => <div key={item}>{item}</div>)}
          </div>
        </div>
        <svg className="radar-chart" viewBox="0 0 360 320" role="img" aria-label="Gráfico radar ilustrativo comparando São Paulo e Rio de Janeiro">
          <g stroke="#DCE3E9" fill="none">
            <polygon points="180,20 320,110 275,270 85,270 40,110" />
            <polygon points="180,80 260,140 232,235 128,235 100,140" />
            <polygon points="180,140 200,170 190,200 170,200 160,170" />
          </g>
          <polygon points="180,50 290,120 240,255 130,240 90,130" fill="#4A90D9" fillOpacity=".28" stroke="#4A90D9" strokeWidth="1.6" />
          <polygon points="180,90 250,150 220,245 145,220 110,160" fill="#E8734A" fillOpacity=".28" stroke="#E8734A" strokeWidth="1.6" />
        </svg>
      </div>
    </section>
  );
}
