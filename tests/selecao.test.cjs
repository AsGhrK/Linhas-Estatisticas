global.window = global;
require('../js/normalizar.js');
require('../js/selecao.js');
require('../js/pesos.js');
const { test } = require('node:test');
const assert = require('node:assert');
const falsos = require('../dados/dados-falsos.json');

const Sel = window.LE.selecao;
const P = window.LE.pesos;
const S = window.LE.stats;
const VALIDAS = ['RIO', 'SAO', 'CPQ', 'BSB', 'REC', 'BHZ'];
const IGUAIS = { passagem: 25, hospedagem: 25, alimentacao: 25, clima: 25 };

test('escolha vazia ou inválida cai em Rio e São Paulo', () => {
  assert.deepStrictEqual(Sel.normalizar([], VALIDAS), ['RIO', 'SAO', null]);
  assert.deepStrictEqual(Sel.normalizar(['XXX'], VALIDAS), ['RIO', 'SAO', null]);
});

test('cada cidade guarda a sua posição; repetida e inválida viram vazio', () => {
  assert.deepStrictEqual(Sel.normalizar(['BSB', '', 'REC'], VALIDAS), ['BSB', null, 'REC']);
  assert.deepStrictEqual(Sel.normalizar(['BSB', 'BSB', 'XXX', 'RIO'], VALIDAS), ['BSB', null, null]);
  assert.strictEqual(Sel.normalizar(['RIO', 'SAO', 'CPQ', 'BSB'], VALIDAS).length, Sel.MAX);
});

test('destino da busca ocupa a primeira posição livre', () => {
  assert.deepStrictEqual(Sel.normalizar(['RIO', 'SAO'], VALIDAS, 'REC'), ['RIO', 'SAO', 'REC']);
  assert.deepStrictEqual(Sel.normalizar(['RIO', '', 'SAO'], VALIDAS, 'REC'), ['RIO', 'REC', 'SAO']);
  assert.deepStrictEqual(Sel.normalizar(['RIO', 'SAO', 'CPQ'], VALIDAS, 'REC'), ['RIO', 'SAO', 'REC']);
  assert.deepStrictEqual(Sel.normalizar(['RIO', 'SAO'], VALIDAS, 'RIO'), ['RIO', 'SAO', null]);
});

test('siglas tira os vazios e mantém a ordem das posições', () => {
  assert.deepStrictEqual(Sel.siglas(['BSB', null, 'REC']), ['BSB', 'REC']);
});

test('filtrar mantém as faixas do estudo inteiro e a ordem da escolha', () => {
  const d = Sel.filtrar(falsos, ['SAO', 'RIO']);
  assert.deepStrictEqual(Object.keys(d.rotas), ['SAO', 'RIO']);
  assert.strictEqual(d.faixas, falsos.faixas);
  assert.strictEqual(Object.keys(falsos.rotas).length, 2);   // não mexe no original
});

function tresCidades() {
  const d = structuredClone(falsos);
  d.rotas.CWB = structuredClone(d.rotas.RIO);
  d.rotas.CWB.cidade = 'Curitiba';
  const f = d.faixas.preco_passagem;
  d.rotas.CWB.passagens.estatisticas.media = f.min;   // a passagem mais barata do estudo
  return d;
}

test('com três cidades a conclusão lista todas, da maior para a menor', () => {
  const d = tresCidades();
  const texto = P.conclusao(d, { passagem: 100, hospedagem: 0, alimentacao: 0, clima: 0 });
  assert.ok(texto.startsWith('Com estes pesos, Curitiba soma 1,00, '), texto);
  assert.strictEqual((texto.match(/ soma /g) || []).length, 3, texto);
});

test('com três cidades e as duas primeiras empatadas, a frase avisa', () => {
  const d = tresCidades();
  d.rotas.RIO.passagens.estatisticas.media = d.faixas.preco_passagem.min;
  const texto = P.conclusao(d, { passagem: 100, hospedagem: 0, alimentacao: 0, clima: 0 });
  assert.ok(texto.endsWith('As duas primeiras ficam praticamente empatadas.'), texto);
});

test('ranking traz todas as cidades em ordem de score', () => {
  const d = tresCidades();
  const r = P.ranking(d, IGUAIS);
  assert.deepStrictEqual(r.map((c) => c.sigla).sort(), ['CWB', 'RIO', 'SAO']);
  for (let i = 1; i < r.length; i++) assert.ok(r[i - 1].score >= r[i].score);
  const pesos5 = S.expandirPesos(IGUAIS);
  assert.strictEqual(r[0].score, S.scoreComposto(S.perfilRadar(d, r[0].sigla), pesos5));
});

test('cidade sem score vai para o fim do ranking', () => {
  const d = tresCidades();
  d.rotas.SAO.passagens.estatisticas.media = null;
  const r = P.ranking(d, { passagem: 100, hospedagem: 0, alimentacao: 0, clima: 0 });
  assert.strictEqual(r[r.length - 1].sigla, 'SAO');
  assert.strictEqual(r[r.length - 1].score, null);
});
