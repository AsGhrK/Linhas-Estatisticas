import './Footer.css';

const footerColumns = [
  { title: 'Categories', links: [{ label: 'Voos nacionais', href: '#voos' }, { label: 'Voos internacionais', href: '#voos' }, { label: 'Pacotes', href: '#hospedagem' }] },
  { title: 'Shopping', links: [{ label: 'Passagens', href: '#buscar' }, { label: 'Hotéis', href: '#hospedagem' }, { label: 'Seguro viagem', href: '#hospedagem' }] },
  { title: 'Customer care', links: [{ label: 'Central de ajuda', href: '#' }, { label: 'Fale conosco', href: '#' }, { label: 'Cancelamentos', href: '#' }] },
  { title: 'Pages', links: [{ label: 'Voos', href: '#voos' }, { label: 'Clima', href: '#clima' }, { label: 'Visão geral', href: '#visao-geral' }] },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <a className="brand" href="#inicio">Linhas Estatísticas</a>
          <p>Lorem ipsum dolor sit amet consectetur adipiscing elit, plataforma de comparação de viagens orientada a dados.</p>
        </div>
        {footerColumns.map((column) => (
          <div key={column.title}>
            <h4>{column.title}</h4>
            <ul>{column.links.map((link) => <li key={link.label}><a href={link.href}>{link.label}</a></li>)}</ul>
          </div>
        ))}
      </div>
      <div className="wrap footer-bottom">
        <span>© 2023 Estrella Inc. All rights reserved</span>
        <span>Privacidade · Termos de uso</span>
      </div>
    </footer>
  );
}
