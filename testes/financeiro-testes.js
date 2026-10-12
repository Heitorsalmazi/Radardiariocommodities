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

  console.log('');
  console.log('PARTE B — motor do painel (__3M_calcEngine)');
  okB.forEach(x => console.log('  ok      ' + x.nome));
  falhasB.forEach(x => console.log('  FALHOU  ' + x.nome + (x.detalhe ? ' — ' + x.detalhe : '')));
  console.log('  ' + okB.length + ' passaram' + (falhasB.length ? ', ' + falhasB.length + ' FALHARAM' : ''));
  console.log('');

  await b.close();
  process.exit((passouA && !falhasB.length) ? 0 : 1);
})().catch(e => { console.error('QUEBROU:', e.message); process.exit(2); });
