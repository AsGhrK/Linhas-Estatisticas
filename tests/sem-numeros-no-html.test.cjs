const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const PADROES = [
  /R\$\s*\d/g,
  /\d+[.,]\d+\s*(mm|°C|%)/g,
  /<td[^>]*>\s*[\d.,\s]+\s*<\/td>/g
];

function achados(html) {
  const lista = [];
  PADROES.forEach((re) => {
    const m = html.match(re);
    if (m) lista.push(...m);
  });
  return lista;
}

test('nenhum HTML da raiz tem número digitado', () => {
  const raiz = path.join(__dirname, '..');
  fs.readdirSync(raiz).filter((f) => f.endsWith('.html')).forEach((f) => {
    const a = achados(fs.readFileSync(path.join(raiz, f), 'utf8'));
    assert.deepStrictEqual(a, [], f + ' tem números fixos: ' + a.join(' | '));
  });
});

test('detector pega célula com preço', () => {
  assert.ok(achados('<td>R$ 730</td>').length > 0);
});

test('detector ignora códigos de aeroporto', () => {
  assert.deepStrictEqual(achados('<p>SBCG para SBRJ</p>'), []);
});
