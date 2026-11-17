import './Hero.css';

export default function Hero() {
  return (
    <section className="hero" id="inicio" aria-labelledby="hero-title">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <div className="eyebrow">Planejamento de viagens orientado a dados</div>
          <h1 id="hero-title">Compare voos, clima e custos antes de decidir para onde ir</h1>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Reunimos tarifas aéreas, previsão do tempo, hospedagem e alimentação em um único painel para cada rota que você pesquisar.</p>
          <div className="route-line" aria-label="Rota ilustrativa de Campo Grande a um destino">
            <span>SBCG</span><span className="rule" /><span className="dot" /><span className="rule" /><span>Destino</span>
          </div>
        </div>
        <div className="hero-art" role="img" aria-label="Ilustração de uma rota aérea com avião">
          <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect width="400" height="300" fill="#0F4568" />
            <path d="M20 240 C120 200 180 260 260 190 S 380 120 390 90" stroke="#4A90D9" strokeWidth="1.5" fill="none" strokeDasharray="4 5" opacity=".7" />
            <circle cx="20" cy="240" r="4" fill="#E8734A" />
            <circle cx="390" cy="90" r="4" fill="#E8734A" />
            <path d="M250 150l30-10 8 4-22 14 6 16-9 3-11-13-14 9-2-8 11-8-9-11 8-3z" fill="#fff" />
          </svg>
        </div>
      </div>
    </section>
  );
}
