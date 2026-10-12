#!/usr/bin/env node
/* COMPARA O PAINEL DE AGORA COM O RETRATO GRAVADO — Etapa 1.
   `rodar.js` prova que a tela não quebrou. Este prova que os NÚMEROS não
   mudaram, e é a diferença entre "abriu" e "está certo".

   Separa de propósito duas naturezas de diferença:

     DURO  — fórmula, estrutura, inventário. NÃO deve mudar sozinho. Toda
             diferença aqui é regressão até que alguém explique.
     MOLE  — o dado do dia. Muda porque a planilha mudou; muda TODO dia.
             Só é sinal se desaparecer ou virar nulo.

   Uso:
       node baseline-comparar.js                 # recaptura e compara
       node baseline-comparar.js --sem-recaptura # compara arquivo já pronto
       node baseline-comparar.js --atualizar     # grava o retrato novo

   Saída: código 0 quando nada DURO mudou; 1 quando mudou.               */
const fs = require('fs'), path = require('path'), cp = require('child_process');

const DIR    = __dirname;
const BASE   = path.join(DIR, 'baseline.json');
const NOVO   = path.join(DIR, 'baseline-agora.json');
const args   = process.argv.slice(2);
const URL    = (args.find(a => /^https?:\/\//.test(a))) || 'http://127.0.0.1:8777/local.html';
const pular  = args.includes('--sem-recaptura');
const gravar = args.includes('--atualizar');

if (!fs.existsSync(BASE)) { console.error('Não existe', BASE, '— rode baseline-captura.js primeiro.'); process.exit(2); }

if (!pular) {
  console.error('Recapturando (uns 3 minutos)…');
  const r = cp.spawnSync(process.execPath, ['--max-old-space-size=4096',
            path.join(DIR,'baseline-captura.js'), URL, NOVO], { stdio: 'inherit' });
  if (r.status !== 0) { console.error('A captura falhou; nada a comparar.'); process.exit(2); }
}
if (!fs.existsSync(NOVO)) { console.error('Não existe', NOVO); process.exit(2); }

const A = JSON.parse(fs.readFileSync(BASE)).dados;
const B = JSON.parse(fs.readFileSync(NOVO)).dados;

/* Caminhos cujo valor é o dado do dia. Tudo o que NÃO casa aqui é DURO. */
const MOLE = [
  /^frescor\./,
  /^contratos\.[^.]+\.(pregoes|ultimo|primeiro)$/,
  /^graficos\.[^.]+\.series\.\d+\.(n|primeiro|ultimo)$/,
  /^(cai|sinais|backtest)\./,
  /^opcoes\./,
  /^exportacoes\./,
  /^contasFixas\.(carcacaArroba_impressao|vivoSP_boiGordo|vivoSP_vacaGorda)\./
];
const ehMole = c => MOLE.some(re => re.test(c));

/* Comparação numérica com folga relativa: 1e-9 absorve o ruído de ponto
   flutuante do próprio JavaScript e nada além disso. */
function igual(a, b){
  if (typeof a === 'number' && typeof b === 'number'){
    if (!isFinite(a) || !isFinite(b)) return String(a) === String(b);
    const d = Math.abs(a - b), e = Math.max(1e-9, Math.abs(a) * 1e-9);
    return d <= e;
  }
  return a === b;
}

const dif = { duro: [], mole: [], sumiu: [], nasceu: [] };

function anda(a, b, c){
  const ta = a === null ? 'null' : Array.isArray(a) ? 'array' : typeof a;
  const tb = b === null ? 'null' : Array.isArray(b) ? 'array' : typeof b;

  if (ta === 'object' && tb === 'object'){
    const ks = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of ks){
      const cc = c ? c + '.' + k : k;
      if (!(k in b)) dif.sumiu.push({ caminho: cc, antes: resumo(a[k]) });
      else if (!(k in a)) dif.nasceu.push({ caminho: cc, agora: resumo(b[k]) });
      else anda(a[k], b[k], cc);
    }
    return;
  }
  if (ta === 'array' && tb === 'array'){
    if (a.length !== b.length)
      (ehMole(c + '.length') ? dif.mole : dif.duro).push({ caminho: c + '.length', antes: a.length, agora: b.length });
    for (let i = 0; i < Math.min(a.length, b.length); i++) anda(a[i], b[i], c + '.' + i);
    return;
  }
  if (!igual(a, b))
    (ehMole(c) ? dif.mole : dif.duro).push({ caminho: c, antes: resumo(a), agora: resumo(b) });
}
const resumo = v => (v && typeof v === 'object') ? (Array.isArray(v) ? '[' + v.length + ' itens]' : '{' + Object.keys(v).length + ' campos}') : v;

anda(A, B, '');

/* Um "mole" que virou nulo ou zero não é o dado do dia: é um dado que
   parou de chegar. Promovo para DURO. */
const promovidos = [];
for (let i = dif.mole.length - 1; i >= 0; i--){
  const d = dif.mole[i];
  if (d.agora === null || d.agora === 0 || d.agora === undefined){ promovidos.push(d); dif.mole.splice(i, 1); }
}

const linha = d => '  ' + d.caminho + ': ' + JSON.stringify(d.antes) + ' → ' + JSON.stringify(d.agora);
const pr = console.error;
pr('');
pr('RETRATO ANTERIOR : ' + JSON.parse(fs.readFileSync(BASE)).capturadoEm);
pr('AGORA            : ' + JSON.parse(fs.readFileSync(NOVO)).capturadoEm);
pr('');
if (dif.sumiu.length){ pr('DESAPARECEU (' + dif.sumiu.length + ') — isto é sempre regressão:');
  dif.sumiu.slice(0,60).forEach(d => pr('  ' + d.caminho + ' (era ' + JSON.stringify(d.antes) + ')'));
  if (dif.sumiu.length > 60) pr('  … e mais ' + (dif.sumiu.length-60)); pr(''); }
if (promovidos.length){ pr('DADO QUE PAROU DE CHEGAR (' + promovidos.length + '):');
  promovidos.slice(0,40).forEach(d => pr(linha(d))); pr(''); }
if (dif.duro.length){ pr('MUDOU O QUE NÃO DEVIA MUDAR (' + dif.duro.length + '):');
  dif.duro.slice(0,80).forEach(d => pr(linha(d)));
  if (dif.duro.length > 80) pr('  … e mais ' + (dif.duro.length-80)); pr(''); }
if (dif.nasceu.length){ pr('NOVO (' + dif.nasceu.length + ') — confira se era esperado:');
  dif.nasceu.slice(0,40).forEach(d => pr('  ' + d.caminho + ' = ' + JSON.stringify(d.agora)));
  if (dif.nasceu.length > 40) pr('  … e mais ' + (dif.nasceu.length-40)); pr(''); }
pr('DADO DO DIA que se mexeu: ' + dif.mole.length + ' (esperado; não é regressão)');

const falhou = dif.duro.length + dif.sumiu.length + promovidos.length;
pr('');
pr(falhou ? 'VEREDITO: ' + falhou + ' diferença(s) que exigem explicação.' : 'VEREDITO: nada que não devia mudar mudou.');

if (gravar){ fs.copyFileSync(NOVO, BASE); pr('Retrato atualizado em ' + BASE + '.'); }
process.exit(falhou ? 1 : 0);
