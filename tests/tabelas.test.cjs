const test = require('node:test');
const assert = require('node:assert');

global.window = global;
/* DOM mínimo: só o que o tabelas.js usa. */
class El {
  constructor(tag, attrs) {
    this.tagName = tag.toUpperCase();
    this.attrs = Object.assign({}, attrs);
    this.children = [];
    this.parentNode = null;
    this.textContent = '';
    this.className = '';
    this.content = null;
  }
  getAttribute(n) { return Object.prototype.hasOwnProperty.call(this.attrs, n) ? this.attrs[n] : null; }
  setAttribute(n, v) { this.attrs[n] = String(v); }
  hasAttribute(n) { return Object.prototype.hasOwnProperty.call(this.attrs, n); }
  appendChild(c) { c.parentNode = this; this.children.push(c); return c; }
  insertBefore(c, ref) {
    c.parentNode = this;
    this.children.splice(this.children.indexOf(ref), 0, c);
    return c;
  }
  remove() {
    if (!this.parentNode) return;
    this.parentNode.children.splice(this.parentNode.children.indexOf(this), 1);
    this.parentNode = null;
  }
  cloneNode() {
    const c = new El(this.tagName, this.attrs);
    c.textContent = this.textContent;
    c.className = this.className;
    this.children.forEach((f) => c.appendChild(f.cloneNode()));
    return c;
  }
  all() {
    const r = [];
    this.children.forEach((c) => { r.push(c); r.push(...c.all()); });
    return r;
  }
  querySelectorAll(sel) {
    const m = /^\[([\w-]+)\]$/.exec(sel);
    return this.all().filter((e) => (m ? e.hasAttribute(m[1]) : e.tagName === sel.toUpperCase()));
  }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
}
function el(tag, attrs, filhos) {
  const e = new El(tag, attrs);
  (filhos || []).forEach((f) => e.appendChild(f));
  return e;
}
function template(filhos) {
  const t = new El('template');
  t.content = { children: filhos, cloneNode() { return { children: filhos.map((f) => f.cloneNode()) }; } };
  return t;
}
global.document = {
  addEventListener() {},
  createElement: (tag) => new El(tag),
  querySelectorAll() { return []; }
};
require('../js/normalizar.js');
require('../js/tabelas.js');
const T = window.LE.tabelas;

const dados = { a: { b: [{ c: 5 }, { c: 7 }] }, n: null };

test('resolver: caminho aninhado e índice de array', () => {
  assert.strictEqual(T.resolver(dados, 'a.b.1.c'), 7);
  assert.strictEqual(T.resolver(dados, 'a.b.0.c'), 5);
});

test('resolver: caminho inexistente vira undefined', () => {
  assert.strictEqual(T.resolver(dados, 'a.x.y'), undefined);
  assert.strictEqual(T.resolver(dados, 'a.b.9.c'), undefined);
});

test('formatar: cada formato', () => {
  assert.match(T.formatar(730, 'moeda'), /R\$\s?730,00/);
  assert.strictEqual(T.formatar(12.34, 'numero'), '12,3');
  assert.strictEqual(T.formatar(0.256, 'porcentagem'), '25,6%');
  assert.strictEqual(T.formatar(1234.6, 'inteiro'), '1.235');
  assert.strictEqual(T.formatar('Gol', 'texto'), 'Gol');
  assert.strictEqual(T.formatar(42), '42');
});

test('formatar: null vira traço em todo formato', () => {
  ['moeda', 'numero', 'porcentagem', 'inteiro', 'texto'].forEach((f) => {
    assert.strictEqual(T.formatar(null, f), '—');
  });
});

test('formatar: periodo converte AAAA-MM', () => {
  assert.strictEqual(T.formatar('2026-01', 'periodo'), 'jan. de 2026');
  assert.strictEqual(T.formatar('2026-09', 'periodo'), 'set. de 2026');
  assert.strictEqual(T.formatar('1991-2020', 'periodo'), '1991-2020');
});

test('formatar: mes por extenso, os doze', () => {
  const abr = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const ext = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto',
    'setembro', 'outubro', 'novembro', 'dezembro'];
  abr.forEach((m, i) => assert.strictEqual(T.formatar(m, 'mes'), ext[i]));
  assert.strictEqual(T.formatar('xyz', 'mes'), 'xyz');
  assert.strictEqual(T.formatar(null, 'mes'), '—');
  assert.strictEqual(T.formatar(null, 'periodo'), '—');
});

function lista(caminho, vazio) {
  const li = el('li', {}, [
    el('span', { 'data-campo': '.nome' }),
    el('span', { 'data-campo': '.diaria', 'data-formato': 'moeda' })
  ]);
  const attrs = { 'data-lista': caminho };
  if (vazio) attrs['data-vazio'] = vazio;
  return el('ul', attrs, [template([li])]);
}
function geradas(ul) { return ul.children.filter((c) => c.tagName !== 'TEMPLATE'); }

test('data-lista: um item por elemento, campos relativos ao item', () => {
  window.LE.dados = { x: { hoteis: [{ nome: 'A', diaria: 400 }, { nome: 'B', diaria: 500 }] } };
  const ul = lista('x.hoteis');
  T.preencher(el('div', {}, [ul]));
  const g = geradas(ul);
  assert.strictEqual(g.length, 2);
  assert.strictEqual(g[0].children[0].textContent, 'A');
  assert.match(g[1].children[1].textContent, /R\$\s?500,00/);
  assert.strictEqual(ul.children[ul.children.length - 1].tagName, 'TEMPLATE');
});

test('data-lista: "." é o próprio item', () => {
  window.LE.dados = { t: ['Feijoada', 'Pastel'] };
  const ul = el('ul', { 'data-lista': 't' }, [template([el('li', { 'data-campo': '.' })])]);
  T.preencher(el('div', {}, [ul]));
  assert.deepStrictEqual(geradas(ul).map((c) => c.textContent), ['Feijoada', 'Pastel']);
});

test('data-lista: vazia, null ou ausente mostra data-vazio', () => {
  [[], null].forEach((v) => {
    window.LE.dados = { x: { hoteis: v } };
    const ul = lista('x.hoteis', 'Diárias ainda não coletadas.');
    T.preencher(el('div', {}, [ul]));
    const g = geradas(ul);
    assert.strictEqual(g.length, 1);
    assert.strictEqual(g[0].className, 'lista-vazia');
    assert.strictEqual(g[0].textContent, 'Diárias ainda não coletadas.');
  });
  window.LE.dados = {};
  const ul = lista('x.hoteis');
  T.preencher(el('div', {}, [ul]));
  assert.strictEqual(geradas(ul)[0].textContent, 'Ainda não coletado.');
});

test('data-lista: preencher de novo não duplica', () => {
  window.LE.dados = { x: { hoteis: [{ nome: 'A', diaria: 1 }] } };
  const ul = lista('x.hoteis');
  const raiz = el('div', {}, [ul]);
  T.preencher(raiz);
  T.preencher(raiz);
  assert.strictEqual(geradas(ul).length, 1);
  window.LE.dados = { x: { hoteis: [] } };
  T.preencher(raiz);
  assert.strictEqual(geradas(ul).length, 1);
  assert.strictEqual(geradas(ul)[0].className, 'lista-vazia');
});

test('data-campo dentro do template nunca é preenchido direto', () => {
  window.LE.dados = { x: { hoteis: [{ nome: 'A', diaria: 1 }] } };
  const ul = lista('x.hoteis');
  const modelo = ul.children[0].content.children[0];
  T.preencher(el('div', {}, [ul]));
  assert.strictEqual(modelo.children[0].textContent, '');
});
