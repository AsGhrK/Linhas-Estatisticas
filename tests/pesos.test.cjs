global.window = global;
require('../js/normalizar.js');
require('../js/pesos.js');
const { test } = require('node:test');
const assert = require('node:assert');
const falsos = require('../dados/dados-falsos.json');
const reais = require('../dados/dados.json');

const P = window.LE.pesos;
const S = window.LE.stats;
const SO_PASSAGEM = { passagem: 100, hospedagem: 0, alimentacao: 0, clima: 0 };
const IGUAIS = { passagem: 25, hospedagem: 25, alimentacao: 25, clima: 25 };

test('só passagem: vence a cidade com a média ponderada de passagem menor', () => {
  const r = falsos.rotas;
  const barata = r.RIO.passagens.estatisticas.media < r.SAO.passagens.estatisticas.media ? r.RIO : r.SAO;
  const cara = barata === r.RIO ? r.SAO : r.RIO;
  const texto = P.conclusao(falsos, SO_PASSAGEM);
  assert.ok(texto.startsWith('Com estes pesos, ' + barata.cidade + ' soma '), texto);
  assert.ok(texto.includes(' e ' + cara.cidade + ' soma '), texto);
});

test('o score sai com duas casas e vírgula, a maior primeiro', () => {
  const pesos5 = S.expandirPesos(SO_PASSAGEM);
  const sao = S.scoreComposto(S.perfilRadar(falsos, 'SAO'), pesos5);
  const rio = S.scoreComposto(S.perfilRadar(falsos, 'RIO'), pesos5);
  assert.strictEqual(P.conclusao(falsos, SO_PASSAGEM),
    'Com estes pesos, São Paulo soma ' + S.numero(sao, 2) + ' e Rio de Janeiro soma ' + S.numero(rio, 2) + '.');
  assert.match(S.numero(sao, 2), /^\d,\d\d$/);
});

test('pesos todos em zero pedem um peso maior que zero', () => {
  assert.strictEqual(P.conclusao(falsos, { passagem: 0, hospedagem: 0, alimentacao: 0, clima: 0 }),
    'Defina ao menos um peso maior que zero.');
});

test('diferença menor que 0,01 é empate', () => {
  const d = structuredClone(falsos);
  d.rotas.RIO.passagens.estatisticas.media = d.rotas.SAO.passagens.estatisticas.media;
  assert.strictEqual(P.conclusao(d, SO_PASSAGEM), 'As duas cidades ficam praticamente empatadas com estes pesos.');
});

test('diferença de 0,01 ou mais não é empate', () => {
  const d = structuredClone(falsos);
  const f = d.faixas.preco_passagem;
  // Passagem normalizada: 1 − (media − min) / (max − min). Diferença de 0,02 entre as cidades.
  d.rotas.SAO.passagens.estatisticas.media = f.min + 0.50 * (f.max - f.min);
  d.rotas.RIO.passagens.estatisticas.media = f.min + 0.52 * (f.max - f.min);
  const texto = P.conclusao(d, SO_PASSAGEM);
  assert.ok(texto.startsWith('Com estes pesos, São Paulo soma 0,50 e Rio de Janeiro soma 0,48.'), texto);
});

test('eixo sem dado é listado pelo nome do radar', () => {
  const d = structuredClone(falsos);
  d.faixas.custo_hotel = null;
  const texto = P.conclusao(d, IGUAIS);
  assert.ok(texto.startsWith('Com estes pesos, '), texto);
  assert.ok(texto.endsWith(' Fora do cálculo por falta de dados: Hospedagem.'), texto);
});

test('com tudo coletado não há frase de eixo de fora', () => {
  assert.ok(!P.conclusao(falsos, IGUAIS).includes('Fora do cálculo'));
});

test('dados reais: alimentação coletada com poucos preços fica de fora junto com os eixos sem dado', () => {
  const texto = P.conclusao(reais, IGUAIS);
  assert.ok(texto.startsWith('Com estes pesos, '), texto);
  assert.ok(texto.endsWith(' Fora do cálculo por falta de dados: Hospedagem, Alimentação, Conforto térmico e Tempo seco.'), texto);
});

test('peso só em eixos sem dado: faltam dados, não peso zero', () => {
  const texto = P.conclusao(reais, { passagem: 0, hospedagem: 50, alimentacao: 0, clima: 0 });
  assert.ok(texto.startsWith('Ainda faltam dados para calcular o score com estes pesos.'), texto);
  assert.ok(texto.includes('Fora do cálculo por falta de dados: '), texto);
});

test('eixos de fora diferentes em cada cidade saem por cidade', () => {
  const d = structuredClone(falsos);
  d.rotas.RIO.hotel.diaria_mediana = null;
  d.rotas.SAO.clima.precipitacao[0] = null;
  const texto = P.conclusao(d, IGUAIS);
  assert.ok(texto.endsWith(' Fora do cálculo por falta de dados: Rio de Janeiro, Hospedagem; São Paulo, Tempo seco.'), texto);
});

test('só uma cidade com score', () => {
  const d = structuredClone(falsos);
  d.rotas.RIO.passagens.estatisticas.media = null;
  const texto = P.conclusao(d, SO_PASSAGEM);
  assert.ok(texto.startsWith('Com estes pesos, São Paulo soma '), texto);
  assert.ok(texto.includes('Rio de Janeiro ainda não tem dados para estes pesos.'), texto);
});

test('partes separa a frase do score da frase dos eixos de fora', () => {
  const p = P.partes(reais, IGUAIS);
  assert.ok(p.principal.startsWith('Com estes pesos, '), p.principal);
  assert.ok(p.fora.startsWith('Fora do cálculo por falta de dados: '), p.fora);
  assert.strictEqual(P.conclusao(reais, IGUAIS), p.principal + ' ' + p.fora);
  assert.strictEqual(P.partes(falsos, IGUAIS).fora, '');
});
