import './Footer.css';

const footerColumns = [
  { title: 'Rotas', links: [{ label: 'Campo Grande → Rio de Janeiro', href: '#voos' }, { label: 'Campo Grande → São Paulo', href: '#voos' }, { label: 'Buscar', href: '#buscar' }] },
  { title: 'Comparação', links: [{ label: 'Passagens', href: '#voos' }, { label: 'Hotéis', href: '#hospedagem' }, { label: 'Alimentação', href: '#hospedagem' }] },
  { title: 'Fontes', links: [{ label: 'ANAC', href: 'https://www.gov.br/anac/pt-br/assuntos/dados-e-estatisticas' }, { label: 'ClimaTempo', href: 'https://www.climatempo.com.br/climatologia/321/riodejaneiro-rj' }, { label: 'Quanto Custa Viajar', href: 'https://quantocustaviajar.com/brasil/rio-de-janeiro/alimentacao' }] },
  { title: 'Páginas', links: [{ label: 'Voos', href: '#voos' }, { label: 'Clima', href: '#clima' }, { label: 'Visão geral', href: '#visao-geral' }] },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <a className="brand" href="#inicio">Linhas Estatísticas</a>
          <p>Plataforma de comparação de viagens orientada a dados: Campo Grande para Rio de Janeiro e São Paulo.</p>
        </div>
        {footerColumns.map((column) => (
          <div key={column.title}>
            <h4>{column.title}</h4>
            <ul>{column.links.map((link) => <li key={link.label}><a href={link.href} {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{link.label}</a></li>)}</ul>
          </div>
        ))}
      </div>
      <div className="wrap footer-bottom">
        <span>© 2026 Linhas Estatísticas · Projeto Final de Estatística — TADS, IFMS Nova Andradina</span>
        <span>Dados coletados de fontes públicas, com fins acadêmicos</span>
      </div>
    </footer>
  );
}
