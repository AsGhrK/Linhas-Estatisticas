import { useState } from 'react';
import './Header.css';

const navItems = [
  { href: '#voos', label: 'Voos' },
  { href: '#clima', label: 'Clima' },
  { href: '#hospedagem', label: 'Hospedagem' },
  { href: '#visao-geral', label: 'Visão geral' },
];

function PlaneMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2.5 1.8V22L12 21l4.5 1v-1.2L14 19v-5.5L21 16z" fill="currentColor" />
    </svg>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <div className="nav">
        <a className="brand" href="#inicio" aria-label="Linhas Estatísticas — início" onClick={closeMenu}>
          <PlaneMark />
          <span>Linhas Estatísticas</span>
        </a>
        <nav id="mobile-navigation" className={`navlinks${menuOpen ? ' navlinks--open' : ''}`} aria-label="Navegação principal">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} onClick={closeMenu}>{item.label}</a>
          ))}
        </nav>
        <div className="navicons" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.8 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.8-3.8-9s1.3-6.5 3.8-9z"/></svg>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c1.6-3.6 4.4-5.5 7.5-5.5s5.9 1.9 7.5 5.5"/></svg>
        </div>
        <button
          className="navtoggle"
          type="button"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span /><span /><span />
        </button>
      </div>
    </header>
  );
}
