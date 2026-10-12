#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════════════
   TESTES DAS FÓRMULAS FINANCEIRAS — Etapa 2
   ──────────────────────────────────────────────────────────────────────────
   Parte A  roda sem navegador: confere as fórmulas de referência contra
            valores calculados à mão.
   Parte B  abre o painel e confere o MOTOR DE VERDADE (`__3M_calcEngine`)
            contra a referência. É a parte que pega divergência entre o que
            está documentado e o que o produtor vê na tela.

       node financeiro-testes.js                 # A + B
       node financeiro-testes.js --sem-navegador # só A (uns 2 segundos)
   ══════════════════════════════════════════════════════════════════════════ */
const path = require('path');
const F = require(path.join(__dirname, 'formulas-referencia.js'));

let ok = 0, falhas = [];
const EPS = 1e-9;

function eq(nome, obtido, esperado, tol){
  const t = (tol == null) ? EPS : tol;
  let passou;
  if (esperado === null || obtido === null) passou = (obtido === esperado);
  /* Comparar string com a régua numérica dá NaN e reprova o que estava
     certo. Fora dos números, igualdade é igualdade. */
  else if (typeof esperado !== 'number' || typeof obtido !== 'number') passou = (obtido === esperado);
  else passou = Math.abs(obtido - esperado) <= t;
  if (passou){ ok++; }
  else falhas.push({ nome, obtido, esperado, tol:t });
  return passou;
}
function eqStr(nome, obtido, esperado){
  if (obtido === esperado) ok++;
  else falhas.push({ nome, obtido, esperado });
}

/* ══════════════════════════════════════════════════════════════════════════
   PARTE A — as fórmulas de referência
   ══════════════════════════════════════════════════════════════════════════ */

/* ── A1 · O caso obrigatório da Etapa 2 ─────────────────────────────────── */
eq('A1 resultado 350−300',                F.resultado(350, 300), 50);
eq('A1 margem sobre receita 350/300',     F.margemSobreReceita(350, 300), 0.142857142857142857, 1e-12);
eq('A1 retorno sobre custo 350/300',      F.retornoSobreCusto(350, 300),  0.166666666666666666, 1e-12);
eq('A1 margem em % com 4 casas',          F.arredonda(F.margemSobreReceita(350,300)*100, 4), 14.2857);
eq('A1 retorno em % com 4 casas',         F.arredonda(F.retornoSobreCusto(350,300)*100, 4), 16.6667);
/* As duas se convertem uma na outra — prova cruzada. */
eq('A1 margem → retorno',                 F.margemParaRetorno(F.margemSobreReceita(350,300)), 1/6, 1e-12);
eq('A1 retorno → margem',                 F.retornoParaMargem(F.retornoSobreCusto(350,300)), 1/7, 1e-12);
/* O retorno sobre custo é SEMPRE maior que a margem quando há lucro. */
eq('A1 retorno > margem (lucro)',
   F.retornoSobreCusto(350,300) > F.margemSobreReceita(350,300) ? 1 : 0, 1);

/* ── A2 · Resultado negativo ────────────────────────────────────────────── */
eq('A2 resultado 280−300',                F.resultado(280, 300), -20);
eq('A2 margem negativa',                  F.margemSobreReceita(280, 300), -20/280, 1e-12);
eq('A2 retorno negativo',                 F.retornoSobreCusto(280, 300),  -20/300, 1e-12);
/* Com prejuízo a ordem se inverte: a margem fica MAIS negativa que o retorno. */
eq('A2 margem < retorno (prejuízo)',
   F.margemSobreReceita(280,300) < F.retornoSobreCusto(280,300) ? 1 : 0, 1);
eq('A2 conversão sobrevive ao negativo',  F.margemParaRetorno(-20/280), -20/300, 1e-12);

/* ── A3 · Custo zero, receita zero, dado ausente ────────────────────────── */
eq('A3 retorno com custo zero é nulo',    F.retornoSobreCusto(350, 0), null);
eq('A3 margem com receita zero é nula',   F.margemSobreReceita(0, 300), null);
eq('A3 margem com custo zero = 100%',     F.margemSobreReceita(350, 0), 1);
eq('A3 receita ausente',                  F.margemSobreReceita(null, 300), null);
eq('A3 custo ausente',                    F.retornoSobreCusto(350, undefined), null);
eq('A3 receita NaN',                      F.margemSobreReceita(NaN, 300), null);
eq('A3 receita infinita',                 F.margemSobreReceita(Infinity, 300), null);
eq('A3 texto no lugar de número',         F.retornoSobreCusto('350', 300), null);
eq('A3 margem 100% não vira retorno',     F.margemParaRetorno(1), null);
eq('A3 retorno −100% não vira margem',    F.retornoParaMargem(-1), null);

/* ── A4 · Break-even ────────────────────────────────────────────────────── */
/* Sem dedução: 5.000 de CMV em 20 @ = 250,00/@. */
eq('A4 BE margem bruta sem dedução',      F.breakEvenMargemBruta(5000, 20, 1, 0), 250);
/* Com 1,5% de dedução sobre a receita o preço precisa subir para pagar a dedução. */
eq('A4 BE margem bruta com 1,5%',         F.breakEvenMargemBruta(5000, 20, 1, 0.015), 5000/(20*0.985), 1e-10);
eq('A4 BE lucro líquido sem dedução',     F.breakEvenLucroLiquido(5000, 400, 100, 20, 1, 0), 275);
eq('A4 BE lucro líquido com 1,5%',        F.breakEvenLucroLiquido(5000, 400, 100, 20, 1, 0.015), 5500/(20*0.985), 1e-10);
/* Perda de 2% de cabeças: menos arrobas para pagar o mesmo custo. */
eq('A4 BE com 2% de perda',               F.breakEvenLucroLiquido(5000, 400, 100, 20, 0.98, 0), 5500/(20*0.98), 1e-10);
/* O TESTE QUE PEGA O ERRO: o break-even não pode depender do preço testado.
   Calculado duas vezes, com os mesmos custos, tem de dar o mesmo número. */
eq('A4 BE independe do preço (1)',        F.breakEvenMargemBruta(5000, 20, 1, 0.015),
                                          F.breakEvenMargemBruta(5000, 20, 1, 0.015), 0);
/* E, no preço de break-even, o resultado tem de ser exatamente zero. */
(function(){
  const cmv = 5000, arc = 20, hS = 1, dd = 0.015;
  const be  = F.breakEvenMargemBruta(cmv, arc, hS, dd);
  const rec = F.receitaLiquida(arc * be * hS, dd);
  eq('A4 no BE a margem bruta zera',      rec - cmv, 0, 1e-9);
  const beL = F.breakEvenLucroLiquido(cmv, 400, 100, arc, hS, dd);
  const recL= F.receitaLiquida(arc * beL * hS, dd);
  eq('A4 no BE o lucro líquido zera',     recL - cmv - 400 - 100, 0, 1e-9);
})();
eq('A4 BE com zero arrobas é nulo',       F.breakEvenMargemBruta(5000, 0, 1, 0), null);
eq('A4 BE com dedução de 100% é nulo',    F.breakEvenMargemBruta(5000, 20, 1, 1), null);

/* ── A5 · Peso, rendimento e arroba ─────────────────────────────────────── */
eq('A5 330 kg vivos em @ de peso vivo',   F.arrobasPesoVivo(330), 11);
eq('A5 carcaça de 612 kg a 53%',          F.pesoCarcacaKg(612, 0.53), 324.36, 1e-9);
eq('A5 @ de carcaça de 612 kg a 53%',     F.arrobasCarcaca(612, 0.53), 21.624, 1e-9);
/* A 50% de rendimento as duas arrobas coincidem — é a origem da confusão. */
eq('A5 a 50% as duas @ coincidem',        F.arrobasCarcaca(330, 0.50), F.arrobasPesoVivo(330), 1e-12);
/* Acima de 50% elas divergem, e a @ de peso vivo subestima. */
eq('A5 a 53% a @ de peso vivo subestima',
   F.arrobasCarcaca(330, 0.53) > F.arrobasPesoVivo(330) ? 1 : 0, 1);
/* @ produzidas comercial × ganho físico: números diferentes, nomes diferentes. */
eq('A5 @ produzidas (comercial)',         F.arrobasProduzidasComercial(330, 612, 0.53), 21.624 - 11, 1e-9);
eq('A5 @ ganhas (físicas)',               F.arrobasGanhasFisicas(330, 612, 0.53), (282*0.53)/15, 1e-9);
eq('A5 comercial > física a 53%',
   F.arrobasProduzidasComercial(330,612,0.53) > F.arrobasGanhasFisicas(330,612,0.53) ? 1 : 0, 1);
eq('A5 carcaça R$/kg → R$/@',             F.carcacaKgParaArroba(24.27), 364.05, 1e-9);
eq('A5 rendimento acima de 100% é nulo',  F.arrobasCarcaca(612, 1.3), null);
eq('A5 peso negativo é nulo',             F.arrobasPesoVivo(-10), null);

/* ── A6 · Juros ─────────────────────────────────────────────────────────── */
eq('A6 fator de 340 dias a 12% a.a.',     F.fatorPeriodo(0.12, 340), Math.pow(1.12, 340/365) - 1, 1e-12);
eq('A6 fator de 365 dias = a própria taxa',F.fatorPeriodo(0.12, 365), 0.12, 1e-12);
eq('A6 fator de 0 dias = 0',              F.fatorPeriodo(0.12, 0), 0, 1e-12);
eq('A6 mensal equivalente a 14% a.a.',    F.taxaMensalEquivalente(0.14), Math.pow(1.14, 1/12) - 1, 1e-12);
/* 14% a.a. NÃO são 14/12 = 1,1667% ao mês. */
eq('A6 mensal composto < linear',
   F.taxaMensalEquivalente(0.14) < 0.14/12 ? 1 : 0, 1);
/* Nominal × efetiva — a diferença que a Etapa 2 pede para explicitar. */
eq('A6 12% nominal m/mensal → efetiva',   F.nominalParaEfetiva(0.12, 12), Math.pow(1.01, 12) - 1, 1e-12);
eq('A6 12% nominal → 12,6825%',           F.arredonda(F.nominalParaEfetiva(0.12,12)*100, 4), 12.6825);
eq('A6 ida e volta nominal⇄efetiva',      F.efetivaParaNominal(F.nominalParaEfetiva(0.12,12), 12), 0.12, 1e-12);
/* Simples × composto, mesmo prazo. */
eq('A6 simples 340d a 14%',               F.jurosSimplesPeriodo(0.14, 340), 0.14*340/365, 1e-12);
/* Abaixo de um ano o composto cobra MENOS que o simples; acima de um ano,
   mais. Quem usa a regra linear "taxa ÷ 365 × dias" num ciclo de 340 dias
   está superestimando o custo financeiro, não subestimando. */
eq('A6 em 340 dias o composto é menor que o simples',
   F.fatorPeriodo(0.14,340) < F.jurosSimplesPeriodo(0.14,340) ? 1 : 0, 1);
eq('A6 em 730 dias o composto é maior que o simples',
   F.fatorPeriodo(0.14,730) > F.jurosSimplesPeriodo(0.14,730) ? 1 : 0, 1);
eq('A6 em 365 dias os dois coincidem',
   Math.abs(F.fatorPeriodo(0.14,365) - F.jurosSimplesPeriodo(0.14,365)), 0, 1e-12);
eq('A6 a vista de 100 em 30d a 14%',      F.aVista(100, 0.14, 30), 100/(1+F.fatorPeriodo(0.14,30)), 1e-12);
eq('A6 taxa ausente',                     F.fatorPeriodo(null, 30), null);
eq('A6 dias negativos',                   F.fatorPeriodo(0.14, -1), null);

/* ── A7 · Retorno sobre capital e anualização ───────────────────────────── */
eq('A7 ROI 500 sobre 4.000',              F.retornoSobreCapital(500, 4000), 0.125, 1e-12);
eq('A7 ROI com capital zero é nulo',      F.retornoSobreCapital(500, 0), null);
eq('A7 anualiza 12,5% em 340 dias',       F.anualizaRetorno(0.125, 340), Math.pow(1.125, 365/340) - 1, 1e-12);
eq('A7 anualizar 365 dias não muda nada', F.anualizaRetorno(0.125, 365), 0.125, 1e-12);
eq('A7 prejuízo total não anualiza',      F.anualizaRetorno(-1.2, 340), null);
eq('A7 anualizar com 0 dias é nulo',      F.anualizaRetorno(0.125, 0), null);

/* ── A8 · Comissão, dedução e tributo ───────────────────────────────────── */
eq('A8 comissão 2% sobre 300',            F.comissaoPercentual(300, 2), 6);
eq('A8 comissão por cabeça de 45',        F.comissaoPorCabeca(45), 45);
eq('A8 comissão zero é zero, não nulo',   F.comissaoPercentual(300, 0), 0);
eq('A8 receita líquida com 1,5%',         F.receitaLiquida(10000, 0.015), 9850, 1e-9);
eq('A8 receita líquida sem dedução',      F.receitaLiquida(10000, null), 10000);
eq('A8 dedução de 100% é nula',           F.receitaLiquida(10000, 1), null);

/* ── A9 · Base e hedge ──────────────────────────────────────────────────── */
eq('A9 base física 340 × futuro 350',     F.base(340, 350), -10);
eq('A9 base em % do futuro',              F.basePercentual(340, 350), -10/350, 1e-12);
eq('A9 realizado = travado + base',       F.precoRealizadoHedgeVenda(350, -10), 340);
eq('A9 realizado com base positiva',      F.precoRealizadoHedgeVenda(350, 10), 360);
/* Venda travada a 350, mercado a 370: pagou ajuste. 330 @ por contrato. */
eq('A9 ajuste de venda com alta',         F.ajusteFuturos(350, 370, 330, 'venda'), -6600);
eq('A9 ajuste de venda com baixa',        F.ajusteFuturos(350, 330, 330, 'venda'),  6600);
eq('A9 ajuste de compra inverte o sinal', F.ajusteFuturos(350, 370, 330, 'compra'), 6600);
/* Soja: 450 sacas por contrato, e o ajuste sai em DÓLAR. */
eq('A9 ajuste de SJC em dólar',           F.ajusteFuturos(25.40, 24.90, 450, 'venda'), 225, 1e-9);
eq('A9 base com futuro zero é nula',      F.basePercentual(340, 0), null);

/* ── A10 · Unidades de contrato ─────────────────────────────────────────── */
eqStr('A10 BGI é arroba em reais',        F.contratoDe('BGIZ26').cifrao + '/' + F.contratoDe('BGIZ26').unidade, 'R$/@');
eqStr('A10 CCM é saca em reais',          F.contratoDe('CCMK27').cifrao + '/' + F.contratoDe('CCMK27').unidade, 'R$/sc');
eqStr('A10 SJC é saca em DÓLAR',          F.contratoDe('SJCN27').cifrao + '/' + F.contratoDe('SJCN27').unidade, 'US$/sc');
eq('A10 BGI são 330 @ por contrato',      F.contratoDe('BGIZ26').porContrato, 330);
eq('A10 CCM são 450 sacas',               F.contratoDe('CCMK27').porContrato, 450);
eq('A10 SJC são 450 sacas',               F.contratoDe('SJCN27').porContrato, 450);
eq('A10 aba que não é contrato',          F.contratoDe('BOI GORDO'), null);
eqStr('A10 DI1 é taxa, não preço',        F.contratoDe('DI1F30').unidade, '%aa');

/* ── A11 · Arredondamento ───────────────────────────────────────────────── */
eq('A11 arredonda 14,28571 para 4 casas', F.arredonda(14.285714285, 4), 14.2857);
eq('A11 arredonda 16,66666 para 4 casas', F.arredonda(16.666666666, 4), 16.6667);
eq('A11 arredonda meio para cima',        F.arredonda(2.675, 2), 2.68);
eq('A11 arredonda negativo',              F.arredonda(-2.345, 2), -2.35);
eq('A11 arredonda nulo continua nulo',    F.arredonda(null, 2), null);
/* Arredondar no fim ≠ arredondar no meio: a conta não pode arredondar antes. */
(function(){
  const certo  = F.margemSobreReceita(350.004, 300.004) * 100;
  const errado = F.margemSobreReceita(F.arredonda(350.004,2), F.arredonda(300.004,2)) * 100;
  eq('A11 arredondar no meio desloca',    Math.abs(certo - errado) > 0 ? 1 : 0, 1);
})();

/* ══════════════════════════════════════════════════════════════════════════
   TESTES DE LIMITE — Etapa 2.1
   Cada bloco abaixo existe porque alguém pode digitar aquilo.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── L1 · Dedução sobre a receita: 0%, 1,5%, 99% e 100% ─────────────────── */
(function(){
  const cmv = 5000, arc = 20, hS = 1;
  eq('L1 dedução 0% não muda o break-even',    F.breakEvenMargemBruta(cmv, arc, hS, 0),     250);
  eq('L1 dedução 1,5%',                        F.breakEvenMargemBruta(cmv, arc, hS, 0.015), 5000/(20*0.985), 1e-10);
  /* 99% é absurdo mas é aritmético: o preço tem de ser 100x o custo unitário. */
  eq('L1 dedução 99% exige preço 100x',        F.breakEvenMargemBruta(cmv, arc, hS, 0.99),  5000/(20*0.01), 1e-9);
  eq('L1 dedução 99% dá 25.000/@',             F.arredonda(F.breakEvenMargemBruta(cmv, arc, hS, 0.99), 2), 25000);
  /* 100% da receita deduzida: não existe preço que pague. Null, não Infinity. */
  eq('L1 dedução 100% não tem break-even',     F.breakEvenMargemBruta(cmv, arc, hS, 1),     null);
  eq('L1 dedução 100% no lucro líquido',       F.breakEvenLucroLiquido(cmv, 400, 100, arc, hS, 1), null);
  eq('L1 dedução acima de 100%',               F.breakEvenMargemBruta(cmv, arc, hS, 1.2),   null);
  eq('L1 receita líquida com 99%',             F.receitaLiquida(10000, 0.99), 100, 1e-9);
  eq('L1 receita líquida com 100% é nula',     F.receitaLiquida(10000, 1), null);
  /* Em cada caso válido, o preço de break-even tem de zerar o resultado. */
  [0, 0.015, 0.99].forEach(function(d){
    const be  = F.breakEvenMargemBruta(cmv, arc, hS, d);
    const rec = F.receitaLiquida(arc * be * hS, d);
    eq('L1 no BE com dedução de ' + (d*100) + '% a margem zera', rec - cmv, 0, 1e-6);
  });
})();

/* ── L2 · Receita e volume iguais a zero ────────────────────────────────── */
eq('L2 margem com receita zero',             F.margemSobreReceita(0, 300), null);
eq('L2 retorno com receita zero',            F.retornoSobreCusto(0, 300), -1);
eq('L2 resultado com receita zero',          F.resultado(0, 300), -300);
eq('L2 break-even com zero arrobas',         F.breakEvenMargemBruta(5000, 0, 1, 0), null);
eq('L2 break-even com arrobas negativas',    F.breakEvenMargemBruta(5000, -5, 1, 0), null);
eq('L2 break-even com perda total de lote',  F.breakEvenMargemBruta(5000, 20, 0, 0), null);
eq('L2 @ de peso vivo com peso zero',        F.arrobasPesoVivo(0), null);
eq('L2 @ de carcaça com peso zero',          F.arrobasCarcaca(0, 0.53), null);
eq('L2 hedge com volume zero',               (function(){ const d=F.dimensionaHedge(0,100,330,'cima');
                                               return d && d.contratos; })(), 0);
eq('L2 hedge com volume zero não sobreprotege',(function(){ const d=F.dimensionaHedge(0,100,330,'cima');
                                               return d && d.sobreprotege ? 1 : 0; })(), 0);
eq('L2 cobertura é nula sem volume',         (function(){ const d=F.dimensionaHedge(0,100,330,'cima');
                                               return d && d.coberturaFisicaPct; })(), null);

/* ── L3 · Arrobas incrementais zero ou negativas ────────────────────────── */
eq('L3 cAI com incremento positivo',         F.custoArrobaIncremental(8000, 3000, 300, 10), 470, 1e-9);
eq('L3 cAI com incremento zero é nulo',      F.custoArrobaIncremental(8000, 3000, 300, 0), null);
eq('L3 cAI com incremento negativo é nulo',  F.custoArrobaIncremental(8000, 3000, 300, -2), null);
eq('L3 cAI sem CMV é nulo',                  F.custoArrobaIncremental(null, 3000, 300, 10), null);
/* Incremento negativo acontece de verdade: boi que entra pesado e rende
   pouco pode sair com menos @ de carcaça do que as @ de peso vivo da compra. */
eq('L3 @ produzidas podem ser negativas',
   F.arrobasProduzidasComercial(600, 620, 0.45) < 0 ? 1 : 0, 1);
eq('L3 e aí o cAI não existe',
   F.custoArrobaIncremental(8000, 3000, 300, F.arrobasProduzidasComercial(600, 620, 0.45)), null);

/* ── L4 · Taxas de juros inválidas ──────────────────────────────────────── */
eq('L4 taxa nula',                           F.fatorPeriodo(null, 340), null);
eq('L4 taxa texto',                          F.fatorPeriodo('14%', 340), null);
eq('L4 taxa NaN',                            F.fatorPeriodo(NaN, 340), null);
eq('L4 dias negativos',                      F.fatorPeriodo(0.14, -30), null);
eq('L4 dias nulos',                          F.fatorPeriodo(0.14, null), null);
eq('L4 taxa zero é zero, não nulo',          F.fatorPeriodo(0, 340), 0);
/* Taxa de −100% zera o capital: (1−1)^x = 0, fator −1. Aritmético e inútil,
   mas não pode virar NaN silencioso. */
eq('L4 taxa de −100%',                       F.fatorPeriodo(-1, 340), -1, 1e-12);
eq('L4 taxa abaixo de −100% é NaN controlado',
   isFinite(F.fatorPeriodo(-1.5, 340)) ? 1 : 0, 0);
eq('L4 nominal com zero capitalizações',     F.nominalParaEfetiva(0.12, 0), null);
eq('L4 mensal equivalente de taxa nula',     F.taxaMensalEquivalente(null), null);

/* ── L5 · Prejuízo ──────────────────────────────────────────────────────── */
eq('L5 resultado negativo',                  F.resultado(250, 300), -50);
eq('L5 margem negativa',                     F.margemSobreReceita(250, 300), -0.2, 1e-12);
eq('L5 retorno negativo',                    F.retornoSobreCusto(250, 300), -1/6, 1e-12);
eq('L5 ROI negativo',                        F.retornoSobreCapital(-500, 4000), -0.125, 1e-12);
eq('L5 prejuízo de 50% anualiza',            F.anualizaRetorno(-0.5, 340), Math.pow(0.5, 365/340)-1, 1e-12);
eq('L5 prejuízo de 100% não anualiza',       F.anualizaRetorno(-1, 340), null);
eq('L5 prejuízo maior que o capital não anualiza', F.anualizaRetorno(-1.4, 340), null);
/* Com prejuízo, margem < retorno — o oposto do que vale com lucro. */
eq('L5 com prejuízo a margem é mais severa',
   F.margemSobreReceita(250,300) < F.retornoSobreCusto(250,300) ? 1 : 0, 1);

/* ── L6 · Sobreproteção de hedge ────────────────────────────────────────── */
(function(){
  /* 500 @ travando 100%: para cima são 2 contratos = 660 @, 160 @ a descoberto. */
  const d = F.dimensionaHedge(500, 100, 330, 'cima');
  eq('L6 500 @ → 2 contratos para cima',     d.contratos, 2);
  eq('L6 trava 660 @',                       d.volumeTravado, 660);
  eq('L6 cobertura de 132%',                 d.coberturaFisicaPct, 132, 1e-9);
  eq('L6 excedente de 160 @',                d.excedente, 160);
  eq('L6 nada desprotegido',                 d.desprotegido, 0);
  eq('L6 marca sobreproteção',               d.sobreprotege ? 1 : 0, 1);

  const b = F.dimensionaHedge(500, 100, 330, 'baixo');
  eq('L6 para baixo é 1 contrato',           b.contratos, 1);
  eq('L6 trava 330 @',                       b.volumeTravado, 330);
  eq('L6 cobertura de 66%',                  b.coberturaFisicaPct, 66, 1e-9);
  eq('L6 deixa 170 @ sem trava',             b.desprotegido, 170);
  eq('L6 não sobreprotege',                  b.sobreprotege ? 1 : 0, 0);
  /* Soma de controle: o que está travado mais o que falta dá o físico. */
  eq('L6 travado + desprotegido = físico',   b.volumeTravado + b.desprotegido, 500);

  /* MENOS DE UM CONTRATO — o caso que a bolsa não resolve. */
  const p = F.dimensionaHedge(200, 100, 330, 'cima');
  eq('L6 200 @ para cima vira 1 contrato',   p.contratos, 1);
  eq('L6 e trava 130 @ a mais do que existe',p.excedente, 130);
  eq('L6 marca abaixo de um contrato',       p.abaixoDeUmContrato ? 1 : 0, 1);
  const p2 = F.dimensionaHedge(200, 100, 330, 'baixo');
  eq('L6 200 @ para baixo não trava nada',   p2.contratos, 0);
  eq('L6 e marca que nenhum contrato cabe',  p2.semContrato ? 1 : 0, 1);
  eq('L6 com os 200 @ todos expostos',       p2.desprotegido, 200);

  /* VOLUME NÃO MÚLTIPLO DE 330 — o caso comum, não a exceção. */
  const m = F.dimensionaHedge(1000, 100, 330, 'cima');
  eq('L6 1.000 @ → 4 contratos para cima',   m.contratos, 4);
  eq('L6 travando 1.320 @',                  m.volumeTravado, 1320);
  eq('L6 com 320 @ a descoberto',            m.excedente, 320);
  const m2 = F.dimensionaHedge(1000, 100, 330, 'baixo');
  eq('L6 1.000 @ → 3 contratos para baixo',  m2.contratos, 3);
  eq('L6 travando 990 @',                    m2.volumeTravado, 990);
  eq('L6 com 10 @ de sobra',                 m2.desprotegido, 10);

  /* MÚLTIPLO EXATO — as duas opções têm de coincidir. */
  const x = F.dimensionaHedge(990, 100, 330, 'cima');
  const y = F.dimensionaHedge(990, 100, 330, 'baixo');
  eq('L6 múltiplo exato: para cima = para baixo', x.contratos, y.contratos);
  eq('L6 múltiplo exato cobre 100%',         x.coberturaFisicaPct, 100, 1e-9);
  eq('L6 múltiplo exato não sobra nem falta', x.excedente + x.desprotegido, 0);

  /* TRAVA PARCIAL — 50% de 1.000 @ não sobreprotege o físico. */
  const h = F.dimensionaHedge(1000, 50, 330, 'cima');
  eq('L6 trava de 50% → 2 contratos',        h.contratos, 2);
  eq('L6 cobre 66% do físico',               h.coberturaFisicaPct, 66, 1e-9);
  eq('L6 cobre 132% do alvo',                h.coberturaAlvoPct, 132, 1e-9);
  eq('L6 sem excedente sobre o físico',      h.excedente, 0);

  /* Soja e milho: 450 sacas por contrato. */
  const sj = F.dimensionaHedge(1000, 100, 450, 'cima');
  eq('L6 1.000 sacas → 3 contratos',         sj.contratos, 3);
  eq('L6 travando 1.350 sacas',              sj.volumeTravado, 1350);
  eq('L6 tamanho zero é nulo',               F.dimensionaHedge(500, 100, 0, 'cima'), null);
  eq('L6 volume negativo é nulo',            F.dimensionaHedge(-10, 100, 330, 'cima'), null);
})();

/* ── L7 · Breakeven: alto válido, separador trocado, ausente ────────────── */
(function(){
  const v = F.validaBreakeven;
  /* Breakeven ALTO mas legítimo: 1.200 contra preço de 350 é 3,4x — caro, e
     pode ser real. Não pode ser dividido por 100 às escondidas. */
  eq('L7 breakeven alto válido é aceito',    v(1200, 350).estado === 'ok' ? 1 : 0, 1);
  eq('L7 e o valor sai intacto',             v(1200, 350).valor, 1200);
  /* Separador decimal trocado: 28962 em vez de 289,62 contra preço de 350. */
  eq('L7 separador trocado é sinalizado',    v(28962, 350).estado, 'fora_escala');
  eq('L7 e o valor NÃO é usado',             v(28962, 350).valor, null);
  eq('L7 mas o bruto é preservado',          v(28962, 350).bruto, 28962);
  eq('L7 com sugestão de 289,62',            v(28962, 350).sugestao, 289.62, 1e-9);
  eq('L7 e o fator identificado',            v(28962, 350).fator, 100);
  /* Fora de escala sem explicação simples: nenhuma divisão resolve. */
  eq('L7 absurdo sem sugestão',              v(7, 350).estado, 'fora_escala');
  eq('L7 e sem sugestão plausível',          v(7, 350).sugestao, null);
  /* Ausente, zero, negativo, texto. */
  eq('L7 ausente',                           v(null, 350).estado, 'ausente');
  eq('L7 indefinido',                        v(undefined, 350).estado, 'ausente');
  eq('L7 string vazia',                      v('', 350).estado, 'ausente');
  eq('L7 zero é inválido',                   v(0, 350).estado, 'invalido');
  eq('L7 negativo é inválido',               v(-10, 350).estado, 'invalido');
  eq('L7 texto não numérico é inválido',     v('abc', 350).estado, 'invalido');
  eq('L7 vírgula decimal é lida',            v('289,62', 350).estado, 'ok');
  eq('L7 e vira 289,62',                     v('289,62', 350).valor, 289.62, 1e-9);
  /* Sem preço de referência não há como julgar magnitude — aceita e declara. */
  eq('L7 sem referência aceita com ressalva',v(28962, null).estado, 'sem_referencia');
  eq('L7 e devolve o valor como veio',       v(28962, null).valor, 28962);
  /* As bordas exatas da faixa entram. */
  eq('L7 borda inferior (20% do preço)',     v(70, 350).estado, 'ok');
  eq('L7 logo abaixo da borda inferior',     v(69, 350).estado, 'fora_escala');
  eq('L7 borda superior (5x o preço)',       v(1750, 350).estado, 'ok');
  eq('L7 logo acima da borda superior',      v(1751, 350).estado, 'fora_escala');
})();

/* ── L8 · Preço com unidade incompatível ────────────────────────────────── */
(function(){
  const c = F.precoCompativel;
  eq('L8 boi a 350 é compatível',            c('BGI', 350).ok ? 1 : 0, 1);
  eq('L8 milho a 70 é compatível',           c('CCM', 70).ok ? 1 : 0, 1);
  eq('L8 soja a 25 é compatível (US$/sc)',   c('SJC', 25).ok ? 1 : 0, 1);
  /* O erro clássico: soja lida como se fosse reais por saca. */
  eq('L8 soja a 150 é incompatível',         c('SJC', 150).ok ? 1 : 0, 0);
  eq('L8 e diz a unidade esperada',          c('SJC', 150).unidade, 'US$/sc');
  /* Dólar vem em pontos (R$ por US$ mil), não em reais por dólar. */
  eq('L8 dólar a 5,40 é incompatível',       c('DOL', 5.40).ok ? 1 : 0, 0);
  eq('L8 dólar a 5.400 é compatível',        c('DOL', 5400).ok ? 1 : 0, 1);
  /* Boi lido como centavos. */
  eq('L8 boi a 35.000 é incompatível',       c('BGI', 35000).ok ? 1 : 0, 0);
  eq('L8 DI a 14% é compatível',             c('DI1', 14).ok ? 1 : 0, 1);
  eq('L8 contrato desconhecido',             c('XYZ', 10).estado, 'contrato_desconhecido');
  eq('L8 preço ausente',                     c('BGI', null).estado, 'ausente');
})();

/* ══════════════════════════════════════════════════════════════════════════
   RELATÓRIO DA PARTE A
   ══════════════════════════════════════════════════════════════════════════ */
function relatarA(){
  console.log('');
  console.log('PARTE A — fórmulas de referência');
  console.log('  ' + ok + ' verificações passaram' + (falhas.length ? ', ' + falhas.length + ' FALHARAM' : ''));
  falhas.forEach(f => console.log('  FALHOU  ' + f.nome + ': obtido ' + JSON.stringify(f.obtido)
                                 + ', esperado ' + JSON.stringify(f.esperado)));
  return falhas.length === 0;
}

if (process.argv.includes('--sem-navegador')){
  process.exit(relatarA() ? 0 : 1);
}

/* ══════════════════════════════════════════════════════════════════════════
   PARTE B — o motor de verdade, no navegador
   ══════════════════════════════════════════════════════════════════════════ */
const { chromium } = require(process.env.PW || '/home/claude/nm/node_modules/playwright-core');
const EXE = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = process.argv.find(a => /^https?:\/\//.test(a)) || 'http://127.0.0.1:8777/local.html';

(async () => {
  const passouA = relatarA();

  const b  = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox','--disable-dev-shm-usage'] });
  const pg = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  await pg.goto(URL, { waitUntil: 'load', timeout: 180000 });
  await pg.waitForFunction(() => window.workbook && window.workbook.SheetNames
                                 && window.workbook.SheetNames.length > 100, null, { timeout: 300000 });
  await pg.evaluate(() => { const l = document.getElementById('bms-lock'); if (l) l.style.display='none'; });
  await pg.evaluate(() => { const c = document.querySelector('.asel-choice[data-asel-group="agro"]'); if (c) c.click(); });
  await pg.waitForTimeout(400);
  await pg.evaluate(() => { const x = document.getElementById('aselEnterBtn'); if (x) x.click(); });
  await pg.waitForTimeout(2500);

  /* Estado fixo. Dedução em 1,5%, que é o ponto onde o break-even era errado. */
  const ST = {
    sistema:'rc', cabecas:'100', pesoEntradaKg:'330', rendimento:'53', perdasPct:'0',
    custoArrobaEntrada:'290', freteCab:'0', comissaoCab:'0', dedRc:'0', dedPct:'1.5',
    diasSeca:'120', diasAguas:'120', gmdSeca:'0.350', gmdAguas:'0.750',
    tipoSeca:'prot01', tipoAguas:'prot01', precoSuplSeca:'3.20', precoSuplAguas:'2.80',
    diasCocho:'100', gmdConf:'1.500', dietaModo:'direto', custoDietaDia:'14.00',
    milhoSc:'70', milhoMS:'87', consumoPctPV:'2.2',
    sanClostridia:'0', sanBrucelose:'0', sanRaiva:'0', sanVermifugo:'0',
    sanEctoparasita:'0', sanOutros:'0', rastChip:'0', rastBrinco:'0',
    arrCabMes:'0', custoOperDia:'1.50', gta:'0', outrosTrib:'0',
    taxaJuros:'12', jurosMult:'1'
  };

  const M = await pg.evaluate(([st]) => {
    if (typeof window.__3M_calcEngine !== 'function') return { erro:'__3M_calcEngine ausente' };
    const a = window.__3M_calcEngine(st, '320');
    const c = window.__3M_calcEngine(st, '400');   // mesmo custo, outro preço de venda
    const campos = o => ({ arE:o.arE, arC:o.arC, cmv:o.cmv, desp:o.desp, trib:o.trib,
                           rec:o.rec, recB:o.recB, ded:o.ded, mB:o.mB, lO:o.lO, lL:o.lL,
                           mbP:o.mbP, loP:o.loP, llP:o.llP, cT:o.cT, bMB:o.bMB, bLL:o.bLL,
                           cAI:o.cAI, roi:o.roi, d:o.d });
    return { a:campos(a), c:campos(c) };
  }, [ST]);

  const okB = [];
  const falhasB = [];
  const ver = (nome, cond, detalhe) => (cond ? okB : falhasB).push({ nome, detalhe });

  if (M.erro){
    falhasB.push({ nome:'motor acessível', detalhe:M.erro });
  } else {
    const A = M.a, C = M.c;
    const dd = 0.015, hS = 1;

    /* B1 · as margens do motor são SOBRE RECEITA, como o nome diz */
    ver('B1 mbP = margem bruta sobre receita',
        Math.abs(A.mbP - F.margemSobreReceita(A.rec, A.cmv)) < 1e-12,
        'motor ' + A.mbP + ' · referência ' + F.margemSobreReceita(A.rec, A.cmv));
    ver('B1 llP = lucro líquido sobre receita',
        Math.abs(A.llP - F.margemSobreReceita(A.rec, A.cT)) < 1e-12,
        'motor ' + A.llP + ' · referência ' + F.margemSobreReceita(A.rec, A.cT));

    /* B2 · a receita líquida desconta a dedução */
    ver('B2 receita líquida = bruta × (1 − ded)',
        Math.abs(A.rec - F.receitaLiquida(A.recB, dd)) < 1e-9,
        'motor ' + A.rec + ' · referência ' + F.receitaLiquida(A.recB, dd));

    /* B3 · O TESTE DECISIVO: break-even não pode mudar com o preço de venda */
    ver('B3 break-even de margem bruta independe do preço',
        Math.abs(A.bMB - C.bMB) < 1e-9,
        'a R$ 320/@ dá ' + A.bMB + ' e a R$ 400/@ dá ' + C.bMB);
    ver('B3 break-even de lucro líquido independe do preço',
        Math.abs(A.bLL - C.bLL) < 1e-9,
        'a R$ 320/@ dá ' + A.bLL + ' e a R$ 400/@ dá ' + C.bLL);

    /* B4 · no preço de break-even o resultado tem de ser zero */
    const beMB = F.breakEvenMargemBruta(A.cmv, A.arC, hS, dd);
    const beLL = F.breakEvenLucroLiquido(A.cmv, A.desp, A.trib, A.arC, hS, dd);
    ver('B4 bMB do motor zera a margem bruta',
        Math.abs(A.bMB - beMB) < 1e-6,
        'motor ' + A.bMB + ' · referência ' + beMB);
    ver('B4 bLL do motor zera o lucro líquido',
        Math.abs(A.bLL - beLL) < 1e-6,
        'motor ' + A.bLL + ' · referência ' + beLL);

    /* B5 · conversões de peso */
    ver('B5 @ de entrada = peso vivo ÷ 30',
        Math.abs(A.arE - F.arrobasPesoVivo(330)) < 1e-12, 'motor ' + A.arE);
    ver('B5 @ de carcaça = peso × rendimento ÷ 15',
        Math.abs(A.arC - F.arrobasCarcaca(612, 0.53)) < 1e-9, 'motor ' + A.arC);

    /* B6 · custo total e ROI */
    ver('B6 custo total = CMV + despesas + tributos',
        Math.abs(A.cT - (A.cmv + A.desp + A.trib)) < 1e-9, 'motor ' + A.cT);
    ver('B6 roi é lucro ÷ capital, não ÷ custo',
        Math.abs(A.roi - A.lL / A.cT) > 1e-9,
        'roi ' + A.roi + ' · lL/cT seria ' + (A.lL / A.cT));

    /* B7 · o custo não muda quando só o preço de venda muda */
    ver('B7 CMV não depende do preço de venda', Math.abs(A.cmv - C.cmv) < 1e-9);
    ver('B7 cAI não depende do preço de venda', Math.abs(A.cAI - C.cAI) < 1e-9);
  }

  /* ════════════════════════════════════════════════════════════════════
     B8 a B11 — Etapa 2.1, contra o código que roda na tela
     ════════════════════════════════════════════════════════════════════ */

  /* ── B8 · Dedução nos extremos, no motor de verdade ─────────────────── */
  const LIM = await pg.evaluate(([st]) => {
    if (typeof window.__3M_calcEngine !== 'function') return { erro:'motor ausente' };
    const f = d => { const c = window.__3M_calcEngine(Object.assign({}, st, {dedPct:String(d)}), '320');
                     return { bMB:c.bMB, bLL:c.bLL, rec:c.rec, recB:c.recB, cmv:c.cmv,
                              desp:c.desp, trib:c.trib, arC:c.arC }; };
    return { d0:f(0), d15:f(1.5), d99:f(99), d100:f(100) };
  }, [ST]);

  if (!LIM.erro){
    ver('B8 dedução 0%: break-even sem fator de dedução',
        Math.abs(LIM.d0.bLL - (LIM.d0.cmv + LIM.d0.desp + LIM.d0.trib) / LIM.d0.arC) < 1e-6,
        'motor ' + LIM.d0.bLL);
    ver('B8 dedução 1,5% bate com a referência',
        Math.abs(LIM.d15.bLL - F.breakEvenLucroLiquido(LIM.d15.cmv, LIM.d15.desp, LIM.d15.trib,
                                                        LIM.d15.arC, 1, 0.015)) < 1e-6,
        'motor ' + LIM.d15.bLL);
    ver('B8 dedução 99% bate com a referência',
        Math.abs(LIM.d99.bLL - F.breakEvenLucroLiquido(LIM.d99.cmv, LIM.d99.desp, LIM.d99.trib,
                                                        LIM.d99.arC, 1, 0.99)) < 1e-6,
        'motor ' + LIM.d99.bLL);
    ver('B8 dedução 99% empurra o break-even para ~100x',
        LIM.d99.bLL > LIM.d0.bLL * 90 && LIM.d99.bLL < LIM.d0.bLL * 110,
        'de ' + LIM.d0.bLL.toFixed(2) + ' para ' + LIM.d99.bLL.toFixed(2));
    ver('B8 dedução 100%: receita líquida zera',
        Math.abs(LIM.d100.rec) < 1e-9, 'rec ' + LIM.d100.rec);
    ver('B8 dedução 100%: break-even não existe (não é Infinity)',
        !isFinite(LIM.d100.bLL) || LIM.d100.bLL === null,
        'bLL ' + LIM.d100.bLL);
  } else falhasB.push({ nome:'B8 motor acessível', detalhe:LIM.erro });

  /* ── B9 · validaBreakeven: a função da tela, não a cópia ────────────── */
  const BE = await pg.evaluate(() => {
    if (typeof window._mbValidaBreakeven !== 'function') return { erro:'validaBreakeven não exposta' };
    const v = window._mbValidaBreakeven;
    return { altoValido:v(1200,350), separador:v(28962,350), ausente:v(null,350),
             zero:v(0,350), virgula:v('289,62',350), semRef:v(28962,null),
             bordaBaixa:v(70,350), foraBaixa:v(69,350) };
  });
  if (!BE.erro){
    ver('B9 breakeven alto válido é aceito na tela',   BE.altoValido.estado === 'ok' && BE.altoValido.valor === 1200,
        JSON.stringify(BE.altoValido));
    ver('B9 separador trocado é sinalizado, não corrigido',
        BE.separador.estado === 'fora_escala' && BE.separador.valor === null
        && Math.abs(BE.separador.sugestao - 289.62) < 1e-9,
        JSON.stringify(BE.separador));
    ver('B9 ausente, zero e vírgula se comportam',
        BE.ausente.estado === 'ausente' && BE.zero.estado === 'invalido'
        && BE.virgula.estado === 'ok' && Math.abs(BE.virgula.valor - 289.62) < 1e-9);
    ver('B9 sem referência aceita e declara',          BE.semRef.estado === 'sem_referencia');
    ver('B9 bordas da faixa',                          BE.bordaBaixa.estado === 'ok' && BE.foraBaixa.estado === 'fora_escala');
    /* A tela e a referência precisam dar o MESMO veredito. */
    ['altoValido','separador','ausente','zero','virgula','semRef','bordaBaixa','foraBaixa'].forEach(k => {
      const arg = { altoValido:[1200,350], separador:[28962,350], ausente:[null,350], zero:[0,350],
                    virgula:['289,62',350], semRef:[28962,null], bordaBaixa:[70,350], foraBaixa:[69,350] }[k];
      const ref = F.validaBreakeven(arg[0], arg[1]);
      ver('B9 tela e referência concordam em ' + k, BE[k].estado === ref.estado,
          'tela ' + BE[k].estado + ' · referência ' + ref.estado);
    });
  } else falhasB.push({ nome:'B9 validaBreakeven exposta', detalhe:BE.erro });

  /* ── B10 · Dimensionamento do hedge na tela ─────────────────────────── */
  const HD = await pg.evaluate(() => {
    if (typeof window._hsDimensiona !== 'function') return { erro:'motor de hedge não exposto' };
    const base = { ativo:'BGI', estrategia:'venda_futuro', precoFuturo:350, custoProd:300, margemRS:0 };
    const f = (q, pct, arr) => {
      const r = window._hsDimensiona(Object.assign({}, base, {qtdFisica:q, pctTrava:pct, arredonda:arr}));
      return { n:r.nContratos, trav:r.qtdEfetiva, cob:r.coberturaFisicaPct,
               exc:r.excedente, desp:r.desprotegido, sobre:r.sobreprotege,
               sem:r.semContrato, sub:r.abaixoDeUmContrato,
               nB:r.nContrBaixo, nC:r.nContrCima };
    };
    return { c500:f(500,100,'cima'), b500:f(500,100,'baixo'),
             c200:f(200,100,'cima'), b200:f(200,100,'baixo'),
             c1000:f(1000,100,'cima'), b1000:f(1000,100,'baixo'),
             exato:f(990,100,'cima'), meio:f(1000,50,'cima') };
  });
  if (!HD.erro){
    const refC500 = F.dimensionaHedge(500,100,330,'cima');
    ver('B10 500 @ para cima: 2 contratos, 660 @, 132%, 160 @ a descoberto',
        HD.c500.n === 2 && HD.c500.trav === 660 && Math.abs(HD.c500.cob - 132) < 1e-9
        && HD.c500.exc === 160 && HD.c500.sobre === true, JSON.stringify(HD.c500));
    ver('B10 tela e referência concordam no caso 500 @',
        HD.c500.n === refC500.contratos && HD.c500.trav === refC500.volumeTravado
        && HD.c500.exc === refC500.excedente);
    ver('B10 500 @ para baixo: 1 contrato, 330 @, 170 @ sem trava',
        HD.b500.n === 1 && HD.b500.trav === 330 && HD.b500.desp === 170 && HD.b500.sobre === false,
        JSON.stringify(HD.b500));
    ver('B10 menos de um contrato é marcado',
        HD.c200.sub === true && HD.b200.sem === true && HD.b200.n === 0,
        JSON.stringify(HD.b200));
    ver('B10 volume não múltiplo de 330',
        HD.c1000.n === 4 && HD.c1000.exc === 320 && HD.b1000.n === 3 && HD.b1000.desp === 10,
        JSON.stringify(HD.c1000) + ' / ' + JSON.stringify(HD.b1000));
    ver('B10 múltiplo exato cobre 100% sem sobra',
        Math.abs(HD.exato.cob - 100) < 1e-9 && HD.exato.exc === 0 && HD.exato.desp === 0);
    ver('B10 trava parcial não sobreprotege o físico',
        HD.meio.exc === 0 && Math.abs(HD.meio.cob - 66) < 1e-9);
    ver('B10 as duas opções são sempre apresentadas',
        HD.c500.nB === 1 && HD.c500.nC === 2 && HD.b500.nB === 1 && HD.b500.nC === 2);
  } else falhasB.push({ nome:'B10 motor de hedge exposto', detalhe:HD.erro });

  /* ── B11 · Retorno vazio: três hipóteses ────────────────────────────── */
  const RV = await pg.evaluate(() => {
    const M = window._pcrMotor;
    if (!M || typeof M.calcularRetornoVazio !== 'function') return { erro:'_pcrMotor ausente' };
    return {
      naoAplicavel: M.calcularRetornoVazio(1000, 5.0977, false),
      legadoTrue:   M.calcularRetornoVazio(1000, 5.0977, true),
      obrigatorio:  M.calcularRetornoVazio(1000, 5.0977, {modo:'obrigatorio', km:null}),
      negociado:    M.calcularRetornoVazio(1000, 5.0977, {modo:'negociado',  km:null}),
      kmContratado: M.calcularRetornoVazio(1000, 5.0977, {modo:'obrigatorio', km:600}),
      modoInvalido: M.calcularRetornoVazio(1000, 5.0977, {modo:'nao'}),
      semKm:        M.calcularRetornoVazio(0, 5.0977, {modo:'obrigatorio', km:null}),
      fator:        M.FATOR_RETORNO_VAZIO
    };
  });
  if (!RV.erro){
    const esperado1000 = 1000 * 5.0977 * 0.92;
    ver('B11 não aplicável devolve zero, não nulo',   RV.naoAplicavel === 0, String(RV.naoAplicavel));
    ver('B11 fator é 92% do CCD',                     Math.abs(RV.fator - 0.92) < 1e-12);
    ver('B11 obrigatório usa 92% do CCD na ida',      Math.abs(RV.obrigatorio - esperado1000) < 1e-9,
        RV.obrigatorio + ' esperado ' + esperado1000);
    ver('B11 negociado calcula igual ao obrigatório', Math.abs(RV.negociado - esperado1000) < 1e-9);
    ver('B11 o booleano antigo continua funcionando', Math.abs(RV.legadoTrue - esperado1000) < 1e-9);
    ver('B11 distância contratada substitui a da ida',
        Math.abs(RV.kmContratado - 600 * 5.0977 * 0.92) < 1e-9,
        RV.kmContratado + ' esperado ' + (600*5.0977*0.92));
    ver('B11 modo fora das hipóteses devolve zero',   RV.modoInvalido === 0);
    ver('B11 sem quilometragem devolve nulo',         RV.semKm === null);
  } else falhasB.push({ nome:'B11 motor de reposição acessível', detalhe:RV.erro });

  console.log('');
  console.log('PARTE B — motor do painel (__3M_calcEngine)');
  okB.forEach(x => console.log('  ok      ' + x.nome));
  falhasB.forEach(x => console.log('  FALHOU  ' + x.nome + (x.detalhe ? ' — ' + x.detalhe : '')));
  console.log('  ' + okB.length + ' passaram' + (falhasB.length ? ', ' + falhasB.length + ' FALHARAM' : ''));
  console.log('');

  await b.close();
  process.exit((passouA && !falhasB.length) ? 0 : 1);
})().catch(e => { console.error('QUEBROU:', e.message); process.exit(2); });
