/* ══════════════════════════════════════════════════════════════════════════
   FÓRMULAS FINANCEIRAS DE REFERÊNCIA — Radar Diário de Commodities
   Etapa 2 · 12/10/2026
   ──────────────────────────────────────────────────────────────────────────
   Este arquivo é a DEFINIÇÃO. Não é usado pelo painel em tempo de execução:
   é a régua contra a qual o painel é medido em `financeiro-testes.js` e a
   fonte do que está escrito em docs/METODOLOGIA_FINANCEIRA.md.

   A regra que organiza tudo: SOBRE RECEITA e SOBRE CUSTO são dois números
   diferentes, e cada um tem nome próprio.

       margemSobreReceita = (R − C) / R        ← quanto de cada real vendido sobra
       retornoSobreCusto  = (R − C) / C        ← quanto cada real investido rendeu

   Com R = 350 e C = 300 os dois saem 14,2857% e 16,6667%. Trocar um pelo
   outro infla o resultado — sempre para cima, enquanto houver lucro.
   ══════════════════════════════════════════════════════════════════════════ */
'use strict';

/* ── 0 · Convenções de ausência ────────────────────────────────────────────
   Toda função devolve `null` quando a conta não existe (dado faltando,
   divisor zero). Nunca devolve 0, nunca devolve o próprio insumo fingindo
   que é resultado. NaN só aparece se alguém passar NaN. */
function num(v){ return (typeof v === 'number' && isFinite(v)) ? v : null; }

/* ══ 1 · MARGENS E RETORNOS ══════════════════════════════════════════════ */

/* Resultado absoluto. Mesma unidade das entradas (R$/@, R$/cab, R$ do lote). */
function resultado(receita, custo){
  var R = num(receita), C = num(custo);
  return (R == null || C == null) ? null : R - C;
}

/* MARGEM SOBRE RECEITA — (R − C)/R. Fração, não percentual.
   Indefinida com receita zero: não existe "quanto sobra de nada". */
function margemSobreReceita(receita, custo){
  var R = num(receita), C = num(custo);
  if (R == null || C == null || R === 0) return null;
  return (R - C) / R;
}

/* RETORNO SOBRE CUSTO — (R − C)/C. Fração, não percentual.
   Indefinido com custo zero: retorno infinito não é informação. */
function retornoSobreCusto(receita, custo){
  var R = num(receita), C = num(custo);
  if (R == null || C == null || C === 0) return null;
  return (R - C) / C;
}

/* As duas se convertem uma na outra. Serve de prova cruzada nos testes e
   permite renomear um indicador sem recalcular a base. */
function margemParaRetorno(m){
  var x = num(m);
  if (x == null || x === 1) return null;         // margem 100% ⇒ custo zero
  return x / (1 - x);
}
function retornoParaMargem(r){
  var x = num(r);
  if (x == null || x === -1) return null;        // retorno −100% ⇒ receita zero
  return x / (1 + x);
}

/* RETORNO SOBRE CAPITAL (ROI) — lucro ÷ capital empregado.
   Diferente de retorno sobre custo: o denominador é o dinheiro PARADO, não
   o dinheiro GASTO. Um ciclo pode ter custo alto e capital baixo (insumo
   pago no fim) ou o contrário. */
function retornoSobreCapital(lucro, capital){
  var L = num(lucro), K = num(capital);
  if (L == null || K == null || K <= 0) return null;
  return L / K;
}

/* Anualização composta de um retorno de `dias`. Só existe enquanto sobra
   capital: prejuízo maior que o principal não tem equivalente anual. */
function anualizaRetorno(retornoDoPeriodo, dias){
  var r = num(retornoDoPeriodo), d = num(dias);
  if (r == null || d == null || d <= 0 || (1 + r) <= 0) return null;
  return Math.pow(1 + r, 365 / d) - 1;
}

/* ══ 2 · BREAK-EVEN ══════════════════════════════════════════════════════
   Preço de venda por arroba que zera um resultado. A regra que o painel
   errava: deduções proporcionais à receita (Funrural e afins) NÃO entram no
   numerador — elas pertencem ao DENOMINADOR, como (1 − ded). Senão o
   break-even passa a depender do preço que está sendo testado, e um
   break-even que muda com o preço não é break-even. */

/* Break-even da MARGEM BRUTA: zera receita líquida − CMV. */
function breakEvenMargemBruta(cmv, arrobasVendidas, fracaoSobrevivencia, fracaoDeducao){
  var C = num(cmv), A = num(arrobasVendidas);
  var hS = (fracaoSobrevivencia == null) ? 1 : num(fracaoSobrevivencia);
  var dd = (fracaoDeducao == null) ? 0 : num(fracaoDeducao);
  if (C == null || A == null || hS == null || dd == null) return null;
  if (!(A > 0) || !(hS > 0) || dd >= 1) return null;
  return C / (A * hS * (1 - dd));
}

/* Break-even do LUCRO LÍQUIDO: zera receita líquida − CMV − despesas − tributos.
   Despesas e tributos são valores absolutos por cabeça: entram no numerador
   porque não dependem do preço. */
function breakEvenLucroLiquido(cmv, despesas, tributos, arrobasVendidas,
                               fracaoSobrevivencia, fracaoDeducao){
  var C = num(cmv), D = num(despesas), T = num(tributos), A = num(arrobasVendidas);
  var hS = (fracaoSobrevivencia == null) ? 1 : num(fracaoSobrevivencia);
  var dd = (fracaoDeducao == null) ? 0 : num(fracaoDeducao);
  if (C == null || D == null || T == null || A == null || hS == null || dd == null) return null;
  if (!(A > 0) || !(hS > 0) || dd >= 1) return null;
  return (C + D + T) / (A * hS * (1 - dd));
}

/* ══ 3 · PESO, RENDIMENTO E ARROBA ═══════════════════════════════════════
   Duas arrobas convivem no mercado brasileiro e NÃO são a mesma coisa:

     @ de peso vivo  = 30 kg vivos      → como a reposição é cotada
     @ de carcaça    = 15 kg de carcaça → como o boi gordo é cotado e pago

   Elas coincidem exatamente quando o rendimento é 50%. Acima disso, a @ de
   peso vivo subestima a carcaça. */
var KG_ARROBA_PESO_VIVO = 30;
var KG_ARROBA_CARCACA   = 15;

function arrobasPesoVivo(pesoVivoKg){
  var p = num(pesoVivoKg);
  return (p == null || p <= 0) ? null : p / KG_ARROBA_PESO_VIVO;
}
function pesoCarcacaKg(pesoVivoKg, rendimentoFracao){
  var p = num(pesoVivoKg), r = num(rendimentoFracao);
  if (p == null || r == null || p <= 0 || r <= 0 || r > 1) return null;
  return p * r;
}
function arrobasCarcaca(pesoVivoKg, rendimentoFracao){
  var c = pesoCarcacaKg(pesoVivoKg, rendimentoFracao);
  return c == null ? null : c / KG_ARROBA_CARCACA;
}

/* ARROBAS PRODUZIDAS — a medida COMERCIAL do confinamento, não a física.
   É (@ de carcaça na saída) − (@ de peso vivo na entrada): as arrobas pelas
   quais o produtor recebe e que não pagou na compra. Mistura as duas
   convenções DE PROPÓSITO, porque é assim que a compra e a venda são
   cotadas. A leitura física do ganho é outra função, abaixo. */
function arrobasProduzidasComercial(pesoEntradaKg, pesoAbateKg, rendimentoFracao){
  var e = arrobasPesoVivo(pesoEntradaKg);
  var s = arrobasCarcaca(pesoAbateKg, rendimentoFracao);
  if (e == null || s == null) return null;
  return s - e;
}
/* Ganho de carcaça de fato, sob um mesmo rendimento nas duas pontas. */
function arrobasGanhasFisicas(pesoEntradaKg, pesoAbateKg, rendimentoFracao){
  var a = num(pesoEntradaKg), b = num(pesoAbateKg), r = num(rendimentoFracao);
  if (a == null || b == null || r == null || r <= 0 || r > 1) return null;
  return ((b - a) * r) / KG_ARROBA_CARCACA;
}

/* Equivalência de carcaça: R$/kg de carcaça → R$/@. Quinze quilos por @. */
function carcacaKgParaArroba(precoPorKgCarcaca){
  var p = num(precoPorKgCarcaca);
  return p == null ? null : p * KG_ARROBA_CARCACA;
}

/* ══ 4 · JUROS ═══════════════════════════════════════════════════════════
   O painel trabalha com TAXA ANUAL EFETIVA em todo lugar. Converter para
   outro prazo é sempre por composição, base 365 dias corridos.

   Efetiva ≠ nominal: 12% a.a. nominais com capitalização mensal valem
   12,6825% efetivos ao ano. Quem digitar a nominal no campo está declarando
   uma taxa menor do que pensa. */
function fatorPeriodo(taxaAnualEfetivaFracao, dias){
  var i = num(taxaAnualEfetivaFracao), d = num(dias);
  if (i == null || d == null || d < 0) return null;
  return Math.pow(1 + i, d / 365) - 1;
}
function taxaMensalEquivalente(taxaAnualEfetivaFracao){
  var i = num(taxaAnualEfetivaFracao);
  return i == null ? null : Math.pow(1 + i, 1 / 12) - 1;
}
function nominalParaEfetiva(taxaNominalAnualFracao, capitalizacoesPorAno){
  var i = num(taxaNominalAnualFracao), m = num(capitalizacoesPorAno);
  if (i == null || m == null || m <= 0) return null;
  return Math.pow(1 + i / m, m) - 1;
}
function efetivaParaNominal(taxaEfetivaAnualFracao, capitalizacoesPorAno){
  var i = num(taxaEfetivaAnualFracao), m = num(capitalizacoesPorAno);
  if (i == null || m == null || m <= 0) return null;
  return (Math.pow(1 + i, 1 / m) - 1) * m;
}
/* Juro SIMPLES, para quando o contrato realmente for simples. Existe aqui
   para o contraste ficar explícito: a 14% a.a. por 340 dias o simples dá
   13,04% e o composto 13,10%. A diferença cresce com o prazo. */
function jurosSimplesPeriodo(taxaAnualFracao, dias){
  var i = num(taxaAnualFracao), d = num(dias);
  if (i == null || d == null || d < 0) return null;
  return i * (d / 365);
}
/* Valor presente de um preço a prazo. */
function aVista(valorAPrazo, taxaAnualEfetivaFracao, dias){
  var v = num(valorAPrazo), f = fatorPeriodo(taxaAnualEfetivaFracao, dias);
  return (v == null || f == null) ? null : v / (1 + f);
}

/* ══ 5 · COMISSÃO, DEDUÇÃO E TRIBUTO ═════════════════════════════════════
   Três naturezas diferentes que o painel precisa manter separadas:
     comissão percentual  → incide sobre o PREÇO de origem
     comissão por cabeça  → valor absoluto, não escala com preço
     dedução sobre receita→ percentual da receita bruta (Funrural e afins)
     tributo por cabeça   → valor absoluto (GTA e afins) */
function comissaoPercentual(precoOrigem, percentual){
  var p = num(precoOrigem), v = num(percentual);
  if (p == null || v == null) return null;
  if (!(v > 0)) return 0;
  return p * (v / 100);
}
function comissaoPorCabeca(valorPorCabeca){
  var v = num(valorPorCabeca);
  if (v == null) return null;
  return v > 0 ? v : 0;
}
function receitaLiquida(receitaBruta, fracaoDeducao){
  var r = num(receitaBruta);
  var d = (fracaoDeducao == null) ? 0 : num(fracaoDeducao);
  if (r == null || d == null || d < 0 || d >= 1) return null;
  return r * (1 - d);
}

/* ══ 6 · BASE E HEDGE ════════════════════════════════════════════════════ */

/* BASE = físico − futuro, na mesma data e na mesma unidade. */
function base(precoFisico, precoFuturo){
  var f = num(precoFisico), u = num(precoFuturo);
  return (f == null || u == null) ? null : f - u;
}
function basePercentual(precoFisico, precoFuturo){
  var f = num(precoFisico), u = num(precoFuturo);
  if (f == null || u == null || u === 0) return null;
  return (f - u) / u;
}
/* Preço realizado por quem travou venda e entrega físico. */
function precoRealizadoHedgeVenda(precoTravado, baseNaVenda){
  var p = num(precoTravado), b = num(baseNaVenda);
  return (p == null || b == null) ? null : p + b;
}
/* AJUSTE de uma posição de futuros, na MOEDA DO CONTRATO.
   sinal: venda = +1 (ganha quando o preço cai), compra = −1.
   quantidade: arrobas (BGI) ou sacas (CCM, SJC) — a unidade do contrato. */
function ajusteFuturos(precoTravado, precoAtual, quantidade, operacao){
  var p = num(precoTravado), q = num(precoAtual), n = num(quantidade);
  if (p == null || q == null || n == null) return null;
  var sinal = (String(operacao).toLowerCase() === 'compra') ? -1 : 1;
  return (p - q) * sinal * n;
}

/* ══ 7 · UNIDADES DE CONTRATO ════════════════════════════════════════════
   A moeda faz parte da unidade. O SJC é o caso que mais engana: cotado em
   DÓLAR por saca, com liquidação em reais convertida pregão a pregão. */
var CONTRATOS = {
  BGI: { produto:'Boi Gordo',  unidade:'@',  kgPorUnidade:15,  moeda:'BRL', cifrao:'R$',  porContrato:330 },
  CCM: { produto:'Milho',      unidade:'sc', kgPorUnidade:60,  moeda:'BRL', cifrao:'R$',  porContrato:450 },
  SJC: { produto:'Soja',       unidade:'sc', kgPorUnidade:60,  moeda:'USD', cifrao:'US$', porContrato:450 },
  DOL: { produto:'Dólar',      unidade:'pts',kgPorUnidade:null,moeda:'BRL', cifrao:'R$',  porContrato:1000,
         nota:'cotado em R$ por US$ 1.000' },
  ETH: { produto:'Etanol',     unidade:'m³', kgPorUnidade:null,moeda:'BRL', cifrao:'R$',  porContrato:30 },
  DI1: { produto:'DI de 1 dia',unidade:'%aa',kgPorUnidade:null,moeda:null,  cifrao:'',    porContrato:null,
         nota:'é taxa, não preço' }
};
function contratoDe(nomeAba){
  var m = String(nomeAba||'').trim().toUpperCase().match(/^(BGI|CCM|SJC|DOL|ETH|DI1)[FGHJKMNQUVXZ]\d{2}$/);
  return m ? CONTRATOS[m[1]] : null;
}

/* ══ 8 · DIMENSIONAMENTO DO HEDGE ════════════════════════════════════════
   Contrato não se fraciona. O volume protegido quase nunca bate com o que se
   queria proteger, e a diferença tem dois nomes muito diferentes:

     arredondar para CIMA  → pode travar MAIS do que existe no pasto. O
                             excedente é posição vendida a descoberto: ganha
                             na queda, perde na alta, e não tem boi atrás.
     arredondar para BAIXO → nunca sobra, mas deixa um resto exposto.

   A cobertura é medida contra o volume FÍSICO, porque a pergunta de quem tem
   boi é "quanto do MEU boi está travado", não "quanto do meu alvo". */
function dimensionaHedge(volumeFisico, pctTrava, tamanhoContrato, modo){
  var V = num(volumeFisico), p = num(pctTrava), T = num(tamanhoContrato);
  if (V == null || p == null || T == null || T <= 0 || V < 0) return null;
  var alvo   = V * (p / 100);
  var nBaixo = Math.floor(alvo / T);
  var nCima  = Math.ceil(alvo / T);
  var m      = (modo === 'baixo') ? 'baixo' : 'cima';
  var n      = (m === 'baixo') ? nBaixo : nCima;
  var efet   = n * T;
  return {
    volumeFisico: V, alvo: alvo, tamanhoContrato: T, modo: m,
    contratos: n, contratosBaixo: nBaixo, contratosCima: nCima,
    volumeTravado: efet,
    volumeTravadoBaixo: nBaixo * T, volumeTravadoCima: nCima * T,
    coberturaFisicaPct: V > 0 ? (efet / V) * 100 : null,
    coberturaAlvoPct:   alvo > 0 ? (efet / alvo) * 100 : null,
    excedente:    efet > V ? efet - V : 0,
    desprotegido: V > efet ? V - efet : 0,
    sobreprotege: efet > V,
    semContrato:  (n === 0 && alvo > 0),
    abaixoDeUmContrato: (alvo > 0 && alvo < T)
  };
}

/* ══ 9 · VALIDAÇÃO DO BREAKEVEN ══════════════════════════════════════════
   Espelho da função que roda na tela. NÃO corrige escala: valida e, quando
   não fecha, diz por quê e sugere. Corrigir calado é como consertar o
   termômetro em vez de medir a febre. */
var BE_MIN_REL = 0.20, BE_MAX_REL = 5.0;
function validaBreakeven(be, refPrice){
  var out = { estado:'ausente', valor:null, bruto:null, sugestao:null, fator:null };
  if (be === null || be === undefined || be === '') return out;
  var n = (typeof be === 'number') ? be : parseFloat(String(be).replace(',', '.'));
  if (!isFinite(n)) { out.estado = 'invalido'; return out; }
  out.bruto = n;
  if (n <= 0) { out.estado = 'invalido'; return out; }
  var r = num(refPrice);
  if (r == null || r <= 0) { out.estado = 'sem_referencia'; out.valor = n; return out; }
  var min = r * BE_MIN_REL, max = r * BE_MAX_REL;
  if (n >= min && n <= max) { out.estado = 'ok'; out.valor = n; return out; }
  var cand = [100, 1000];
  for (var i = 0; i < cand.length; i++){
    var v = n / cand[i];
    if (v >= min && v <= max){ out.sugestao = v; out.fator = cand[i]; break; }
  }
  out.estado = 'fora_escala';
  return out;
}

/* ══ 10 · MAGNITUDE DE PREÇO POR CONTRATO ════════════════════════════════
   Um preço de soja em torno de 25 é US$/saca; em torno de 150, alguém somou
   reais na coluna errada. Faixas declaradas, não adivinhadas — servem para
   ACUSAR incompatibilidade, nunca para converter nada. */
var FAIXA_PRECO = {
  BGI: { min: 100,  max: 800,   unidade:'R$/@'  },
  CCM: { min: 20,   max: 200,   unidade:'R$/sc' },
  SJC: { min: 8,    max: 60,    unidade:'US$/sc'},
  DOL: { min: 2000, max: 15000, unidade:'R$/US$ mil' },
  ETH: { min: 1000, max: 8000,  unidade:'R$/m³' },
  DI1: { min: 0,    max: 60,    unidade:'% a.a.' }
};
function precoCompativel(prefixo, preco){
  var f = FAIXA_PRECO[String(prefixo || '').toUpperCase()];
  var v = num(preco);
  if (!f) return { estado:'contrato_desconhecido', ok:null };
  if (v == null) return { estado:'ausente', ok:null, unidade:f.unidade };
  if (v >= f.min && v <= f.max) return { estado:'ok', ok:true, unidade:f.unidade };
  return { estado:'fora_da_faixa', ok:false, unidade:f.unidade,
           faixa:[f.min, f.max],
           motivo:'preço ' + v + ' fora da faixa ' + f.min + '–' + f.max + ' esperada para ' + f.unidade };
}

/* ══ 11 · CUSTO DA @ INCREMENTAL ═════════════════════════════════════════
   Denominador zero ou negativo significa que o animal não ganhou arroba
   comercial nenhuma — e aí não existe custo por arroba produzida. Devolver
   um número aqui seria inventar. */
function custoArrobaIncremental(cmv, originacao, jurosReposicao, arrobasIncrementais){
  var C = num(cmv), O = num(originacao), J = num(jurosReposicao), A = num(arrobasIncrementais);
  if (C == null || O == null || A == null) return null;
  if (!(A > 0)) return null;
  return (C - O - (J || 0)) / A;
}

/* ══ 12 · ARREDONDAMENTO ═════════════════════════════════════════════════
   Arredonda só na EXIBIÇÃO, nunca no meio da conta. Esta função existe para
   os testes poderem comparar o que a tela mostra. */
function arredonda(v, casas){
  var x = num(v);
  if (x == null) return null;
  var f = Math.pow(10, casas == null ? 2 : casas);
  return Math.round(x * f) / f;
}

var API = {
  num:num, resultado:resultado,
  margemSobreReceita:margemSobreReceita, retornoSobreCusto:retornoSobreCusto,
  margemParaRetorno:margemParaRetorno, retornoParaMargem:retornoParaMargem,
  retornoSobreCapital:retornoSobreCapital, anualizaRetorno:anualizaRetorno,
  breakEvenMargemBruta:breakEvenMargemBruta, breakEvenLucroLiquido:breakEvenLucroLiquido,
  KG_ARROBA_PESO_VIVO:KG_ARROBA_PESO_VIVO, KG_ARROBA_CARCACA:KG_ARROBA_CARCACA,
  arrobasPesoVivo:arrobasPesoVivo, pesoCarcacaKg:pesoCarcacaKg, arrobasCarcaca:arrobasCarcaca,
  arrobasProduzidasComercial:arrobasProduzidasComercial, arrobasGanhasFisicas:arrobasGanhasFisicas,
  carcacaKgParaArroba:carcacaKgParaArroba,
  fatorPeriodo:fatorPeriodo, taxaMensalEquivalente:taxaMensalEquivalente,
  nominalParaEfetiva:nominalParaEfetiva, efetivaParaNominal:efetivaParaNominal,
  jurosSimplesPeriodo:jurosSimplesPeriodo, aVista:aVista,
  comissaoPercentual:comissaoPercentual, comissaoPorCabeca:comissaoPorCabeca,
  receitaLiquida:receitaLiquida,
  base:base, basePercentual:basePercentual,
  dimensionaHedge:dimensionaHedge, validaBreakeven:validaBreakeven,
  precoCompativel:precoCompativel, custoArrobaIncremental:custoArrobaIncremental,
  FAIXA_PRECO:FAIXA_PRECO,
  precoRealizadoHedgeVenda:precoRealizadoHedgeVenda, ajusteFuturos:ajusteFuturos,
  CONTRATOS:CONTRATOS, contratoDe:contratoDe, arredonda:arredonda
};
if (typeof module !== 'undefined' && module.exports) module.exports = API;
if (typeof window !== 'undefined') window.__3M_FORMULAS = API;
