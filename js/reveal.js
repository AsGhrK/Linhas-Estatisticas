(function () {
  'use strict';

  const alvos = document.querySelectorAll('.folha > section');
  if (!alvos.length) return;

  const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const estilo = document.createElement('style');
  estilo.textContent = `
    .folha > section[data-revelar]{opacity:0;transform:translateY(18px);transition:opacity .5s ease,transform .5s ease}
    .folha > section[data-revelar].visivel{opacity:1;transform:none}
  `;
  document.head.appendChild(estilo);

  if (reduzMovimento || !('IntersectionObserver' in window)) {
    alvos.forEach((sec) => sec.classList.add('visivel'));
    return;
  }

  alvos.forEach((sec) => sec.setAttribute('data-revelar', ''));

  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('visivel');
          observador.unobserve(entrada.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  );

  alvos.forEach((sec) => observador.observe(sec));
})();
