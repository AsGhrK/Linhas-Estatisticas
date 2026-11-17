const test = require('node:test');
const assert = require('node:assert');

global.window = global;
global.document = { addEventListener() {}, querySelectorAll() { return []; } };
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
