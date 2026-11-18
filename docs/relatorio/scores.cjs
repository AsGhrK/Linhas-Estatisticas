// Notas do radar e scores por cenário de pesos, com a mesma conta do site (js/normalizar.js).
// Uso: node docs/relatorio/scores.cjs  ->  docs/relatorio/scores.json
global.window = global;
require('../../js/normalizar.js');
const path = require('path');
const fs = require('fs');
const S = window.LE.stats;
const d = require('../../dados/dados.json');
const CENARIOS = {
  iguais: { passagem: 25, hospedagem: 25, alimentacao: 25, clima: 25 },
  so_passagem: { passagem: 100, hospedagem: 0, alimentacao: 0, clima: 0 },
  custo: { passagem: 34, hospedagem: 33, alimentacao: 33, clima: 0 },
  so_clima: { passagem: 0, hospedagem: 0, alimentacao: 0, clima: 100 }
};
const arred = (v) => (v === null ? null : Math.round(v * 1000) / 1000);
const out = { eixos: S.EIXOS_RADAR, cidades: {}, cenarios: {} };
for (const k of Object.keys(d.rotas)) {
  out.cidades[k] = { cidade: d.rotas[k].cidade, perfil: S.perfilRadar(d, k).map(arred) };
}
for (const [nome, pesos] of Object.entries(CENARIOS)) {
  const w = S.expandirPesos(pesos);
  out.cenarios[nome] = {
    pesos,
    score: Object.fromEntries(Object.keys(d.rotas).map((k) => [k, arred(S.scoreComposto(S.perfilRadar(d, k), w))]))
  };
}
fs.writeFileSync(path.join(__dirname, 'scores.json'), JSON.stringify(out, null, 1) + '\n');
console.log('gravado', path.join(__dirname, 'scores.json'));
