global.window = global; require('../js/normalizar.js');
const S = window.LE.stats; const { test } = require('node:test'); const assert = require('node:assert');
const falsos = require('../dados/dados-falsos.json');
test('passagem usa a média ponderada', () => {
  const d = structuredClone(falsos); d.rotas.RIO.passagens.estatisticas.media = d.faixas.preco_passagem.min;
  assert.strictEqual(S.perfilRadar(d, 'RIO')[0], 1);     // mais barato = 1
});
test('expandirPesos divide o clima em dois eixos', () => {
  assert.deepStrictEqual(S.expandirPesos({ passagem: .4, hospedagem: .2, alimentacao: .2, clima: .2 }), [.4, .2, .2, .1, .1]);
});
test('pesos zerados devolvem null', () => {
  assert.strictEqual(S.scoreComposto([1, 1, 1, 1, 1], [0, 0, 0, 0, 0]), null);
});
test('eixo null sai da média e seu peso sai da soma', () => {
  assert.strictEqual(S.scoreComposto([1, null, 0, 1, 1], [1, 1, 1, 1, 1]), 0.75);
});
test('todos os eixos null devolvem null', () => {
  assert.strictEqual(S.scoreComposto([null, null, null, null, null], [1, 1, 1, 1, 1]), null);
});
test('null em mês não puxa a média', () => {
  assert.strictEqual(S.media([100, null, 300]), 200);
});
test('faixa null deixa o eixo null', () => {
  const d = structuredClone(falsos); d.faixas.custo_hotel = null;
  assert.strictEqual(S.perfilRadar(d, 'RIO')[1], null);
});
test('clima com valor null deixa conforto térmico null', () => {
  const d = structuredClone(falsos); d.rotas.RIO.clima.temp_max[0] = null;
  assert.strictEqual(S.perfilRadar(d, 'RIO')[3], null);
});
test('normalizar mantém null e amplitude zero', () => {
  assert.strictEqual(S.normalizar(null, 0, 1), null);
  assert.strictEqual(S.normalizar(5, 3, 3), 0.5);
});
test('porcentagem', () => {
  assert.strictEqual(S.porcentagem(0.146), '14,6%');
  assert.strictEqual(S.porcentagem(null), '—');
  assert.strictEqual(S.porcentagem(undefined), '—');
});
