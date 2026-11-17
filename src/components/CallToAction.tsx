import './CallToAction.css';

export default function CallToAction() {
  return (
    <section className="cta-section">
      <div className="wrap">
        <div className="cta">
          <div>
            <h2>Pronto para comparar seu próximo destino?</h2>
            <p>Escolha o destino e veja passagens, clima, hospedagem e alimentação reunidos numa só comparação.</p>
          </div>
          <a className="btn-primary cta-button" href="#buscar">Buscar passagens</a>
        </div>
      </div>
    </section>
  );
}
