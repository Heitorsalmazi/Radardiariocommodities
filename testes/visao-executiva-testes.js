#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════════════
   TESTES DA VISÃO EXECUTIVA — Etapa 4
   ──────────────────────────────────────────────────────────────────────────
   Tudo roda contra o CÓDIGO QUE VAI AO AR, nunca contra uma cópia da
   fórmula: o motor de leitura está exposto em `window._veMotor` e a tela em
   `window._veRender`. Medir a cópia foi o erro que a Etapa 1 encontrou no
   capturador, e ele não se repete aqui.

   A tela é aberta duas vezes:
     · SEM premissas  — para provar que a ausência vira "Dados insuficientes
                        para análise", e não um número de enchimento;
     · COM premissas  — para conferir margem, impacto e cobertura contra os
                        motores auditados nas Etapas 2 e 2.1.

       node visao-executiva-testes.js
       node visao-executiva-testes.js http://127.0.0.1:8777/local.html
   ══════════════════════════════════════════════════════════════════════════ */
const { chromium } = require(process.env.PW || '/home/claude/nm/node_modules/playwright-core');
const EXE = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = process.argv.find(a => /^https?:\/\//.test(a)) || 'http://127.0.0.1:8777/local.html';

const ok = [], falhas = [];
function ver(nome, cond, detalhe){
  if (cond) ok.push({ nome }); else falhas.push({ nome, detalhe: detalhe == null ? '' : String(detalhe) });
}
function perto(nome, obtido, esperado, tol){
  const t = (tol == null) ? 1e-9 : tol;
  const bom = (typeof obtido === 'number') && isFinite(obtido) && Math.abs(obtido - esperado) <= t;
  ver(nome, bom, bom ? '' : (obtido + ' esperado ' + esperado));
}

/* Premissas de um confinamento com dieta formada pelo preço do milho. Os
   valores são os do cenário padrão do próprio painel, para que a conta possa
   ser conferida à mão contra a Calculadora. */
const PREM = {
  sistema:'conf', cabecas:'300', pesoEntradaKg:'380', rendimento:'55', perdasPct:'1',
  custoArrobaEntrada:'340', freteCab:'60', comissaoCab:'25', dedPct:'1.5',
  diasCocho:'105', gmdConf:'1.55', dietaModo:'ms', milhoSc:'62', milhoMS:'86',
  consumoPctPV:'2.35', sanClostridia:'8', sanBrucelose:'4', sanRaiva:'3',
  sanVermifugo:'6', sanEctoparasita:'5', sanOutros:'0',
  rastChip:'0', rastBrinco:'0', arrCabMes:'0', custoOperDia:'1.75',
  gta:'12', outrosTrib:'0', taxaJuros:'14', jurosMult:'1',
  veCabecasVender:'300', veMilhoSacas:'9000', vePctTrava:'80', veArredonda:'cima'
};
const TRAVAS = [
  { data:'2026-08-20', contrato:'BGIV26', oper:'venda',  preco:365, qtd:12 },
  { data:'2026-08-21', contrato:'CCMX26', oper:'compra', preco:77,  qtd:10 },
  { data:'2026-08-22', contrato:'XXXZ99', oper:'venda',  preco:10,  qtd:1  }  /* inválido de propósito */
];

async function abrir(b, semeia){
  const pg = await b.newPage({ viewport: { width:1440, height:1000 } });
  const erros = [];
  pg.on('pageerror', e => erros.push(String(e).slice(0,200)));
  pg.on('console', m => {
    const t = m.text();
    if (m.type() === 'error' && !/404|TUNNEL|Failed to load/.test(t)) erros.push('err ' + t.slice(0,200));
    if (m.type() === 'warning' && /Visão Executiva/.test(t))          erros.push('warn ' + t.slice(0,200));
  });
  if (semeia) await pg.addInitScript(semeia);
  await pg.goto(URL, { waitUntil:'load', timeout:180000 });
  await pg.waitForFunction(() => window.workbook && window.workbook.SheetNames
                                 && window.workbook.SheetNames.length > 100, null, { timeout:300000 });
  await pg.waitForTimeout(2500);
  await pg.evaluate(() => { const l = document.getElementById('bms-lock'); if (l) l.style.display='none'; });
  await pg.evaluate(() => { const c = document.querySelector('.asel-choice[data-asel-group="agro"]'); if (c) c.click(); });
  await pg.waitForTimeout(400);
  await pg.evaluate(() => { const x = document.getElementById('aselEnterBtn'); if (x) x.click(); });
  await pg.waitForTimeout(3000);
  return { pg, erros };
}

(async () => {
  const b = await chromium.launch({ executablePath:EXE, args:['--no-sandbox','--disable-dev-shm-usage'] });

  /* ════════════════════════════════════════════════════════════════════════
     PRIMEIRA ABERTURA — sem premissas e sem travas
     ════════════════════════════════════════════════════════════════════════ */
  const A = await abrir(b, () => {
    try { localStorage.removeItem('ve_premissas_v1'); localStorage.removeItem('m3_travas_v1'); } catch(e){}
  });

  /* ── V1 · Unidades por símbolo ─────────────────────────────────────────
     Unidade é função do símbolo, não do seletor da tela: a Visão Executiva
     mostra sete instrumentos ao mesmo tempo. */
  const U = await A.pg.evaluate(() => {
    const M = window._veMotor; if (!M) return { erro:'motor ausente' };
    const f = s => { const u = M.unidade(s); return u ? [u.moeda, u.un, u.rot, u.casas, u.fator] : null; };
    return { bgi:f('BGIV26'), ccm:f('CCMX26'), sjc:f('SJCX26'), dol:f('DOLV26'),
             boiFis:f('BOI GORDO'), milhoFis:f('MILHO - CEPEA'), sojaFis:f('SOJA - PARANAGUÁ'),
             minusculo:f('bgiv26'), desconhecido:f('ZZZ'), vazio:f(''), nulo:f(null),
             precoDol:M.preco(5219.4, 'DOLV26'), precoSjc:M.preco(29.05, 'SJCX26'),
             precoBgi:M.preco(367.85, 'BGIV26'), precoSemUnidade:M.preco(10, 'ZZZ') };
  });
  if (U.erro) { ver('V1 motor exposto', false, U.erro); }
  else {
    ver('V1 motor exposto', true);
    ver('V1 BGI é R$/@',              U.bgi && U.bgi[2] === 'R$/@',   JSON.stringify(U.bgi));
    ver('V1 CCM é R$/saca',           U.ccm && U.ccm[2] === 'R$/sc',  JSON.stringify(U.ccm));
    ver('V1 SJC é US$/saca',          U.sjc && U.sjc[2] === 'US$/sc', JSON.stringify(U.sjc));
    ver('V1 DOL é R$/US$ e divide por mil',
        U.dol && U.dol[2] === 'R$/US$' && Math.abs(U.dol[4] - 0.001) < 1e-12, JSON.stringify(U.dol));
    ver('V1 boi físico é R$/@',       U.boiFis && U.boiFis[2] === 'R$/@',  JSON.stringify(U.boiFis));
    ver('V1 milho físico é R$/saca',  U.milhoFis && U.milhoFis[2] === 'R$/sc', JSON.stringify(U.milhoFis));
    /* A prova aritmética está no comentário do motor: o físico de Paranaguá
       dividido pelo SJC convertido dá 1,07, não 5,2. */
    ver('V1 soja física é R$/saca, não US$', U.sojaFis && U.sojaFis[2] === 'R$/sc', JSON.stringify(U.sojaFis));
    ver('V1 minúsculo resolve igual',  U.minusculo && U.minusculo[2] === 'R$/@');
    ver('V1 símbolo desconhecido não vira reais por suposição', U.desconhecido === null);
    ver('V1 vazio e nulo não têm unidade', U.vazio === null && U.nulo === null);
    ver('V1 dólar formatado com quatro casas', U.precoDol === 'R$ 5,2194', U.precoDol);
    ver('V1 soja futura formatada em dólar',   U.precoSjc === 'US$ 29,05', U.precoSjc);
    ver('V1 boi formatado em reais',           U.precoBgi === 'R$ 367,85', U.precoBgi);
    ver('V1 sem unidade conhecida não formata', U.precoSemUnidade === '—', U.precoSemUnidade);
  }

  /* ── V2 · Números e datas ──────────────────────────────────────────────
     O que é ambíguo vira ausência. Adivinhar separador de milhar é o erro
     que a Etapa 2.1 mandou tirar do break-even. */
  const N = await A.pg.evaluate(() => {
    const M = window._veMotor;
    return { n1:M.num(12.5), n2:M.num('12,5'), n3:M.num('12.5'), n4:M.num('1.234'),
             n5:M.num(''), n6:M.num(null), n7:M.num('abc'), n8:M.num(NaN), n9:M.num(0), n10:M.num(-3),
             n11:M.num('1.234,56'), n12:M.num('1 234'), n13:M.num('12,5%'), n14:M.num('1234'),
             d1:M.data(45659) && M.data(45659).toISOString().slice(0,10),
             d2:M.data('2026-09-01') && M.data('2026-09-01').toISOString().slice(0,10),
             d3:M.data('01/09/2026') && M.data('01/09/2026').toISOString().slice(0,10),
             d4:M.data(5), d5:M.data(' '), d6:M.data(null), d7:M.data('xx'),
             fmt:M.dBR(M.data(45659)) };
  });
  perto('V2 número puro',            N.n1, 12.5);
  perto('V2 vírgula decimal',        N.n2, 12.5);
  perto('V2 ponto decimal',          N.n3, 12.5);
  perto('V2 o ponto é sempre decimal: "1.234" é 1,234', N.n4, 1.234);
  ver  ('V2 texto que mistura os dois separadores é recusado', N.n11 === null, N.n11);
  ver  ('V2 espaço como separador é recusado', N.n12 === null, N.n12);
  ver  ('V2 número com sufixo é recusado', N.n13 === null, N.n13);
  perto('V2 inteiro sem separador entra', N.n14, 1234);
  ver  ('V2 vazio, nulo e texto viram ausência', N.n5===null && N.n6===null && N.n7===null);
  ver  ('V2 NaN vira ausência',      N.n8 === null);
  perto('V2 zero é zero, não ausência', N.n9, 0);
  perto('V2 negativo passa',         N.n10, -3);
  ver  ('V2 serial do Excel vira 02/01/2025', N.d1 === '2025-01-02', N.d1);
  ver  ('V2 ISO entra',              N.d2 === '2026-09-01', N.d2);
  ver  ('V2 dd/mm/aaaa entra',       N.d3 === '2026-09-01', N.d3);
  ver  ('V2 serial fora da faixa de pregão vira ausência', N.d4 === null);
  ver  ('V2 branco, nulo e lixo viram ausência', N.d5===null && N.d6===null && N.d7===null);
  ver  ('V2 formata em pt-BR',       N.fmt === '02/01/2025', N.fmt);

  /* ── V3 · Leitura de série ─────────────────────────────────────────────── */
  const S = await A.pg.evaluate(() => {
    const M = window._veMotor;
    const crua = (window.parseSheet('BOI GORDO') || []);
    const s = M.serie('BOI GORDO');
    const ordenada = s ? s.every((p,i) => i===0 || p.d >= s[i-1].d) : false;
    const positivos = s ? s.every(p => p.p > 0) : false;
    return { linhasCruas:crua.length, pontos:s ? s.length : null, ordenada, positivos,
             inexistente: M.serie('ABA QUE NÃO EXISTE'), vazia: M.serie(''), nula: M.serie(null) };
  });
  ver('V3 a aba tem mais linhas do que pontos válidos', S.linhasCruas > S.pontos,
      S.linhasCruas + ' linhas → ' + S.pontos + ' pontos');
  ver('V3 série ordenada por data',   S.ordenada);
  ver('V3 nenhum preço zero ou negativo', S.positivos);
  ver('V3 aba inexistente devolve nulo', S.inexistente === null);
  ver('V3 nome vazio e nulo devolvem nulo', S.vazia === null && S.nula === null);

  /* ── V4 · Última cotação e variação ────────────────────────────────────── */
  const Q = await A.pg.evaluate(() => {
    const M = window._veMotor;
    const u = M.ultima('BOI GORDO');
    const s = M.serie('BOI GORDO');
    const v30 = M.variacao('BOI GORDO', 30);
    return { preco:u && u.preco, data:u && u.data.toISOString().slice(0,10),
             ultimoDaSerie: s && s[s.length-1].p,
             anterior:u && u.anterior, varAbs:u && u.varAbs, varPct:u && u.varPct,
             repetidas:u && u.repetidas,
             datasDiferentes: !!(u && u.dataAnterior && u.dataAnterior.getTime() < u.data.getTime()),
             v30: v30 && { pct:v30.pct, dias:v30.diasReais },
             semSerie: M.ultima('ABA QUE NÃO EXISTE'),
             janelaImpossivel: M.variacao('BOI GORDO', 99999) };
  });
  ver  ('V4 última cotação é o último ponto da série', Q.preco === Q.ultimoDaSerie, Q.preco + ' / ' + Q.ultimoDaSerie);
  perto('V4 variação absoluta confere', Q.varAbs, Q.preco - Q.anterior, 1e-9);
  perto('V4 variação percentual confere', Q.varPct, (Q.preco/Q.anterior - 1)*100, 1e-9);
  ver  ('V4 o pregão de comparação é de OUTRO dia', Q.datasDiferentes);
  ver  ('V4 datas repetidas são contadas', typeof Q.repetidas === 'number', Q.repetidas);
  ver  ('V4 variação de 30 dias usa um pregão real', Q.v30 && Q.v30.dias >= 28 && Q.v30.dias <= 40,
        Q.v30 && Q.v30.dias);
  ver  ('V4 sem série não há cotação', Q.semSerie === null);
  ver  ('V4 janela que a série não alcança devolve nulo', Q.janelaImpossivel === null);

  /* ── V5 · Relação de troca ─────────────────────────────────────────────── */
  const R = await A.pg.evaluate(() => {
    const M = window._veMotor;
    return { normal:M.relacaoTroca(350, 70), zeroDenominador:M.relacaoTroca(350, 0),
             negativo:M.relacaoTroca(350, -1), nulo:M.relacaoTroca(null, 70),
             texto:M.relacaoTroca('350', '70'), numeradorZero:M.relacaoTroca(0, 70) };
  });
  perto('V5 350 ÷ 70 = 5 sacas por arroba', R.normal, 5);
  ver  ('V5 denominador zero devolve nulo',    R.zeroDenominador === null);
  ver  ('V5 preço negativo devolve nulo',      R.negativo === null);
  ver  ('V5 ponta ausente devolve nulo',       R.nulo === null);
  perto('V5 texto numérico entra',             R.texto, 5);
  ver  ('V5 numerador zero devolve nulo',      R.numeradorZero === null);

  /* ── V6 · Tela sem premissas: ausência declarada ───────────────────────── */
  const V = await A.pg.evaluate(() => {
    const sec = document.getElementById('sec_m3_0_1');
    const slot = document.getElementById('slot_m3_0_1');
    const txt = id => { const e = document.getElementById(id); return e ? e.textContent.replace(/\s+/g,' ') : ''; };
    const alvos = [...document.querySelectorAll('#slot_m3_0_1 [data-ve-sec]')].map(b => ({
      sec:b.getAttribute('data-ve-sec'), alvo:b.getAttribute('data-ve-alvo') }));
    const ids = (window._M3_ESTRUTURA||[]).map(s => s.id);
    return {
      secaoExiste: !!sec, cards: slot ? slot.querySelectorAll('section.card').length : 0,
      botaoVisivel: !!document.querySelector('.m3-sec-btn[data-sec="m3_0_1"]:not([style*="none"])'),
      ambiente: !!document.querySelector('.m3-amb-btn[data-amb="exec"]'),
      nCards: document.querySelectorAll('#veCards .ve-card').length,
      venda: txt('veVenda'), insumos: txt('veInsumos'), protecao: txt('veProtecao'),
      graficos: [...document.querySelectorAll('#veGraficos [id^=chart]')]
                  .map(e => ({ id:e.id, pts:(window.__3M_PONTOS||{})[e.id] || 0 })),
      secInvalidas: alvos.filter(a => ids.indexOf(a.sec) < 0).map(a => a.sec),
      alvosInvalidos: alvos.filter(a => a.alvo && !document.getElementById(a.alvo)).map(a => a.alvo),
      nLinks: alvos.length
    };
  });
  ver('V6 a seção existe e está montada', V.secaoExiste && V.cards >= 7, V.cards + ' cards');
  ver('V6 o botão da seção não foi escondido por slot vazio', V.botaoVisivel);
  ver('V6 o ambiente novo está na barra', V.ambiente);
  ver('V6 os indicadores aparecem independentemente das premissas', V.nCards >= 9, V.nCards);
  /* ETAPA 6 — a expectativa mudou porque a ESPECIFICAÇÃO mudou. Até a
     Etapa 4 a tela abria sem premissa nenhuma e estes dois blocos tinham de
     declarar a ausência. Agora ela abre com o cenário de confinamento que o
     Radar já usa, e declarar ausência com cenário carregado seria o defeito.
     O teste da ausência não sumiu: foi para V20, que derruba o cenário
     padrão de propósito e exige a declaração de volta. */
  ver('V6 venda do boi traz break-even e margem com o cenário carregado',
      !/Dados insuficientes para análise/.test(V.venda)
        && /Break-even/.test(V.venda) && /\d+,\d{2}/.test(V.venda), V.venda.slice(0,120));
  ver('V6 compra de insumos responde com o cenário carregado',
      !/Dados insuficientes para análise/.test(V.insumos), V.insumos.slice(0,120));
  ver('V6 proteção declara a ausência',
      /Dados insuficientes para análise/.test(V.protecao), V.protecao.slice(0,120));
  ver('V6 venda do boi mostra preço e data da planilha',
      /\d{2}\/\d{2}\/\d{4}/.test(V.venda));
  ver('V6 todo gráfico criado foi desenhado com dados',
      V.graficos.length > 0 && V.graficos.every(g => g.pts > 0), JSON.stringify(V.graficos));
  ver('V6 todo link aponta para uma seção que existe',
      V.secInvalidas.length === 0, V.secInvalidas.join(', '));
  ver('V6 todo alvo de link existe no documento',
      V.alvosInvalidos.length === 0, V.alvosInvalidos.join(', '));
  ver('V6 há navegação para a análise detalhada', V.nLinks >= 8, V.nLinks);
  ver('V6 console limpo na abertura sem premissas', A.erros.length === 0, A.erros.slice(0,3).join(' | '));
  await A.pg.close();

  /* ════════════════════════════════════════════════════════════════════════
     SEGUNDA ABERTURA — com premissas e travas
     ════════════════════════════════════════════════════════════════════════ */
  /* `abrir` acima não leva argumento para dentro da página; aqui a semeadura
     precisa carregar as premissas e as travas, então a abertura é feita à
     mão com o par função+dado que o `addInitScript` aceita. */
  const D = await (async () => {
    const pg = await b.newPage({ viewport:{ width:1440, height:1000 } });
    const erros = [];
    pg.on('pageerror', e => erros.push(String(e).slice(0,200)));
    pg.on('console', m => {
      const tx = m.text();
      if (m.type() === 'error' && !/404|TUNNEL|Failed to load/.test(tx)) erros.push('err ' + tx.slice(0,200));
      if (m.type() === 'warning' && /Visão Executiva/.test(tx))          erros.push('warn ' + tx.slice(0,200));
    });
    await pg.addInitScript(({ p, t }) => {
      try {
        localStorage.setItem('ve_premissas_v1', JSON.stringify(p));
        localStorage.setItem('m3_travas_v1', JSON.stringify(t));
      } catch(e){}
    }, { p:PREM, t:TRAVAS });
    await pg.goto(URL, { waitUntil:'load', timeout:180000 });
    await pg.waitForFunction(() => window.workbook && window.workbook.SheetNames
                                   && window.workbook.SheetNames.length > 100, null, { timeout:300000 });
    await pg.waitForTimeout(2500);
    await pg.evaluate(() => { const l = document.getElementById('bms-lock'); if (l) l.style.display='none'; });
    await pg.evaluate(() => { const c = document.querySelector('.asel-choice[data-asel-group="agro"]'); if (c) c.click(); });
    await pg.waitForTimeout(400);
    await pg.evaluate(() => { const x = document.getElementById('aselEnterBtn'); if (x) x.click(); });
    await pg.waitForTimeout(3000);
    return { pg, erros };
  })();

  /* ── V7 · Margem e break-even saem do motor auditado ───────────────────── */
  const G = await D.pg.evaluate(() => {
    const M = window._veMotor, p = M.premissas();
    const preco = 367.85;
    const doMotor = window.__3M_calcEngine(p, preco);
    const daTela  = M.custo(preco, p);
    const semPreco = M.custo(1, p);
    const vazio = M.custo(preco, {});
    return {
      completas: M.premissasCompletas(p),
      incompletas: M.premissasCompletas({ pesoEntradaKg:'380' }),
      bMBiguais: Math.abs(doMotor.bMB - daTela.bMB),
      mBiguais:  Math.abs(doMotor.mB  - daTela.mB),
      bMB: daTela.bMB, mB: daTela.mB, mbP: daTela.mbP, arC: daTela.arC, recB: daTela.recB, cmv: daTela.cmv,
      bMBindependeDoPreco: Math.abs(semPreco.bMB - daTela.bMB),
      semPremissas: vazio
    };
  });
  ver  ('V7 premissas do cenário são completas',   G.completas === true);
  ver  ('V7 premissas pela metade são incompletas', G.incompletas === false);
  ver  ('V7 sem premissas o motor não é chamado',  G.semPremissas === null);
  perto('V7 break-even da tela é o do motor',      G.bMBiguais, 0, 1e-12);
  perto('V7 margem bruta da tela é a do motor',    G.mBiguais, 0, 1e-12);
  perto('V7 break-even não muda com o preço de venda', G.bMBindependeDoPreco, 0, 1e-12);
  /* Prova aritmética independente, com os números do próprio cenário:
     arC = (380 + 1,55×105) × 0,55 ÷ 15 ; bMB = cmv ÷ (arC × 0,99 × 0,985). */
  perto('V7 arrobas de carcaça conferem à mão', G.arC, (380 + 1.55*105) * 0.55 / 15, 1e-9);
  perto('V7 break-even confere à mão', G.bMB, G.cmv / (G.arC * 0.99 * 0.985), 1e-9);
  perto('V7 receita bruta confere à mão', G.recB, G.arC * 367.85 * 0.99, 1e-7);
  perto('V7 margem sobre a receita confere à mão',
        G.mbP, (G.recB*0.985 - G.cmv) / (G.recB*0.985), 1e-12);

  /* ── V8 · Dimensionamento de hedge sai do motor da Etapa 2.1 ───────────── */
  const H = await D.pg.evaluate(() => {
    const M = window._veMotor;
    const a = M.hedge('BGI', 5910.3, 80, 'cima');
    const b = M.hedge('BGI', 5910.3, 80, 'baixo');
    const c = M.hedge('CCM', 9000, 80, 'cima');       /* 7200 ÷ 450 = 16 exato */
    const d = M.hedge('BGI', 100, 100, 'cima');       /* abaixo de um contrato */
    const e = M.hedge('BGI', 0, 80, 'cima');
    const f = M.hedge('BGI', -10, 80, 'cima');
    const g = M.hedge('BGI', 5910.3, 0, 'cima');
    const direto = window._hsDimensiona({ ativo:'BGI', qtdFisica:5910.3, pctTrava:80,
                                          arredonda:'cima', estrategia:'venda_futuro',
                                          precoFuturo:0, custoProd:0, margemRS:0 });
    return { aCima:a.nContratos, aBaixo:b.nContratos, aEfet:a.qtdEfetiva,
             asDuasSempre: (a.nContrBaixo === b.nContrBaixo && a.nContrCima === b.nContrCima),
             cBaixo:c.nContrBaixo, cCima:c.nContrCima,
             dAbaixoDeUm:d.abaixoDeUmContrato, dBaixo:d.nContrBaixo, dCima:d.nContrCima,
             eZero:e.nContratos, eCobertura:e.coberturaFisicaPct,
             fNegativo:f, gZeroPct:g.nContratos,
             igualAoMotor: Math.abs(direto.qtdEfetiva - a.qtdEfetiva) };
  });
  ver  ('V8 80% de 5910,3 @ são 15 contratos para cima', H.aCima === 15, H.aCima);
  ver  ('V8 e 14 para baixo',                             H.aBaixo === 14, H.aBaixo);
  perto('V8 15 contratos travam 4.950 @',                 H.aEfet, 4950);
  ver  ('V8 as duas opções aparecem nas duas chamadas',   H.asDuasSempre);
  ver  ('V8 múltiplo exato dá o mesmo número nos dois lados', H.cBaixo === 16 && H.cCima === 16,
        H.cBaixo + '/' + H.cCima);
  ver  ('V8 alvo menor que um contrato é sinalizado',     H.dAbaixoDeUm === true);
  ver  ('V8 abaixo de um contrato: zero para baixo, um para cima',
        H.dBaixo === 0 && H.dCima === 1, H.dBaixo + '/' + H.dCima);
  ver  ('V8 volume zero não protege nada e não afirma cobertura',
        H.eZero === 0 && H.eCobertura === null);
  ver  ('V8 volume negativo é recusado',                  H.fNegativo === null);
  ver  ('V8 travar 0% dá zero contrato',                  H.gZeroPct === 0);
  perto('V8 a tela usa o mesmo motor do simulador',       H.igualAoMotor, 0, 1e-12);

  /* ── V9 · Travas registradas ───────────────────────────────────────────── */
  const T = await D.pg.evaluate(() => {
    const M = window._veMotor, t = M.travas();
    return { bgiVenda:t.BGI.venda, bgiCompra:t.BGI.compra, bgiContratos:t.BGI.contratos,
             ccmCompra:t.CCM.compra, ccmVenda:t.CCM.venda, ccmContratos:t.CCM.contratos,
             registros:t.registros, invalidos:t.invalidos, sjc:t.SJC.venda };
  });
  perto('V9 12 contratos de boi vendidos são 3.960 @', T.bgiVenda, 3960);
  perto('V9 nada comprado em boi',                     T.bgiCompra, 0);
  perto('V9 10 contratos de milho comprados são 4.500 sacas', T.ccmCompra, 4500);
  perto('V9 nada vendido em milho',                    T.ccmVenda, 0);
  ver  ('V9 contratos contados por produto', T.bgiContratos === 12 && T.ccmContratos === 10);
  ver  ('V9 registro com contrato inválido é descartado e contado', T.invalidos === 1, T.invalidos);
  ver  ('V9 só os válidos entram na conta', T.registros === 2, T.registros);
  perto('V9 produto sem trava fica em zero',           T.sjc, 0);

  /* ── V10 · Tela com premissas ──────────────────────────────────────────── */
  const W = await D.pg.evaluate(() => {
    const txt = id => { const e = document.getElementById(id); return e ? e.textContent.replace(/\s+/g,' ') : ''; };
    const linhas = [...document.querySelectorAll('#veVenda tbody tr')].map(tr =>
      [...tr.querySelectorAll('td')].map(td => td.textContent.trim()));
    return { venda:txt('veVenda'), insumos:txt('veInsumos'), protecao:txt('veProtecao'),
             cards:[...document.querySelectorAll('#veCards .ve-card')].map(c =>
               ((c.querySelector('.ve-card-rot')||{}).textContent||'') + '|' +
               ((c.querySelector('.ve-card-val')||{}).textContent||'')),
             linhas, nLinhas:linhas.length,
             refMarcada: document.querySelectorAll('#veVenda tr.ve-tr-ref').length };
  });
  ver('V10 a tabela de venda lista os vencimentos vigentes', W.nLinhas >= 5, W.nLinhas);
  ver('V10 toda linha traz break-even e margem', W.linhas.every(l => l.length === 7 && l[3] !== '—'),
      JSON.stringify(W.linhas[0]));
  ver('V10 o break-even é o mesmo em todas as linhas',
      new Set(W.linhas.map(l => l[3])).size === 1, [...new Set(W.linhas.map(l => l[3]))].join(' / '));
  ver('V10 o vencimento de referência está destacado', W.refMarcada === 1, W.refMarcada);
  ver('V10 "Dados insuficientes" some da venda quando há premissas',
      !/Dados insuficientes/.test(W.venda));
  ver('V10 o impacto do milho é medido rodando o motor duas vezes',
      /Efeito no break-even/.test(W.insumos) && /Milho nas premissas/.test(W.insumos),
      W.insumos.slice(0,140));
  ver('V10 a cobertura do boi aparece', /Cobertura efetiva/.test(W.protecao));
  ver('V10 as duas opções de arredondamento aparecem',
      /para baixo/.test(W.protecao) && /para cima/.test(W.protecao));
  ver('V10 riscos observados não recomendam operação',
      /observação calculada/.test(W.protecao) && !/recomendamos|sugerimos|deve vender|deve comprar/i.test(W.protecao));
  ver('V10 o card de break-even aparece com as premissas',
      W.cards.some(c => /Break-even/.test(c)), W.cards.join(' ; ').slice(0,200));
  ver('V10 o registro inválido é avisado, não escondido',
      /registro\(s\) de trava sem contrato ou quantidade válidos/.test(W.protecao));
  ver('V10 console limpo com premissas', D.erros.length === 0, D.erros.slice(0,3).join(' | '));

  /* ── V11 · Coerência entre a tela e as contas ──────────────────────────── */
  const X = await D.pg.evaluate(() => {
    const M = window._veMotor, p = M.premissas();
    const venc = M.primeiroVigente('BGI');
    const u = M.ultima(venc);
    const r = M.custo(u.preco, p);
    const arrCab = r.recB / u.preco;
    const vol = 300 * arrCab;
    const t = M.travas();
    const linha = [...document.querySelectorAll('#veVenda tbody tr')][0];
    const cels = [...linha.querySelectorAll('td')].map(td => td.textContent.trim());
    const numBR = s => Number(String(s).replace(/[^\d,.-]/g,'').replace(/\./g,'').replace(',', '.'));
    return { precoNaTela:numBR(cels[1]), precoReal:u.preco,
             beNaTela:numBR(cels[3]), beReal:r.bMB,
             distNaTela:numBR(cels[4]), distReal:u.preco - r.bMB,
             margemNaTela:numBR(cels[5]), margemReal:r.mbP*100,
             volume:vol, travado:t.BGI.venda, cobertura: t.BGI.venda / vol * 100,
             textoProtecao: document.getElementById('veProtecao').textContent.replace(/\s+/g,' ') };
  });
  perto('V11 o preço da tabela é o da planilha', X.precoNaTela, X.precoReal, 0.005);
  perto('V11 o break-even da tabela é o do motor', X.beNaTela, X.beReal, 0.005);
  perto('V11 a distância é preço menos break-even', X.distNaTela, X.distReal, 0.01);
  perto('V11 a margem da tabela é a do motor', X.margemNaTela, X.margemReal, 0.005);
  ver  ('V11 a cobertura informada na tela confere com travado ÷ exposição',
        new RegExp(X.cobertura.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})
                   .replace('.','\\.') + '%').test(X.textoProtecao),
        X.cobertura.toFixed(1) + '%');

  /* ── V12 · Filtros e navegação ──────────────────────────────────────────
     A Visão Executiva é tela de painel, não de ativo: trocar o contrato ou o
     universo no topo não pode escondê-la nem esvaziá-la. O único filtro dela
     é o vencimento de referência, e ele precisa chegar ao card, à tabela e
     ao armazenamento. */
  const est = () => D.pg.evaluate(() => ({
    amb:(window._M3_AMB||{}).atual, sec:window._m3SecAtual,
    botao: !!document.querySelector('.m3-sec-btn[data-sec="m3_0_1"]:not([style*="none"])'),
    cards: document.querySelectorAll('#veCards .ve-card').length,
    graf: [...document.querySelectorAll('#veGraficos [id^=chart]')].length
  }));
  const e0 = await est();
  await D.pg.evaluate(() => { const s = document.getElementById('sheetSelect');
    if (s){ s.value = 'MILHO - CEPEA'; s.dispatchEvent(new Event('change', { bubbles:true })); } });
  await D.pg.waitForTimeout(2000);
  const e1 = await est();
  await D.pg.evaluate(() => { try { window._m3IrUniverso('macro'); } catch(e){} });
  await D.pg.waitForTimeout(2000);
  const e2 = await est();
  await D.pg.evaluate(() => { try { window._m3IrUniverso('agro'); window.m3Ir('m3_0_1'); } catch(e){} });
  await D.pg.waitForTimeout(2000);
  const e3 = await est();
  ver('V12 trocar de ativo não esvazia a tela',
      e1.cards === e0.cards && e1.graf === e0.graf && e1.botao, JSON.stringify(e1));
  ver('V12 trocar de universo não esconde a tela', e2.botao && e2.cards === e0.cards, JSON.stringify(e2));
  ver('V12 voltar ao universo agro mantém a seção aberta', e3.sec === 'm3_0_1', JSON.stringify(e3));

  const filtro = await D.pg.evaluate(() => {
    const s = document.getElementById('veVencRef');
    if (!s) return { erro:'sem seletor de vencimento' };
    const antes = s.value;
    const outro = [...s.options].map(o => o.value).find(v => v !== antes);
    if (!outro) return { erro:'só há um vencimento vigente' };
    s.value = outro; s.dispatchEvent(new Event('change', { bubbles:true }));
    return { antes, outro };
  });
  if (filtro.erro) ver('V12 filtro de vencimento disponível', false, filtro.erro);
  else {
    await D.pg.waitForTimeout(2000);
    const dep = await D.pg.evaluate(() => ({
      seletor:(document.getElementById('veVencRef')||{}).value,
      salvo:(JSON.parse(localStorage.getItem('ve_premissas_v1')||'{}')).veVencRef,
      card:[...document.querySelectorAll('#veCards .ve-card-pe')].map(e => e.textContent)
             .filter(t => /BGI[FGHJKMNQUVXZ]\d{2}/.test(t))[0] || '',
      linhaRef:[...document.querySelectorAll('#veVenda tr.ve-tr-ref td')].map(t => t.textContent.trim())[0] || ''
    }));
    ver('V12 o filtro de vencimento muda de valor', dep.seletor === filtro.outro, dep.seletor);
    ver('V12 o filtro chega ao card do futuro', dep.card.indexOf(filtro.outro) >= 0, dep.card);
    ver('V12 o filtro move o destaque da tabela de venda',
        dep.linhaRef.indexOf(filtro.outro) >= 0, dep.linhaRef);
    ver('V12 o filtro fica salvo no navegador', dep.salvo === filtro.outro, dep.salvo);
  }


  /* ══════════════════════════════════════════════════════════════════════
     ETAPA 6 — vencimentos casados e premissas pré-carregadas
     ══════════════════════════════════════════════════════════════════════ */

  /* ── V13 · Casamento de vencimentos ────────────────────────────────── */
  const CAS = await D.pg.evaluate(() => {
    const m = window._veMotor, K = n => m.chaveVenc(n);
    const out = { linhas:[], erros:[] };
    m.vigentes('BGI').forEach(bgi => {
      const c = m.casaVenc('CCM', bgi), j = m.casaVenc('SJC', bgi);
      out.linhas.push({ bgi, k:K(bgi),
        ccm:c.aba, kc:c.aba ? K(c.aba) : null, critC:c.criterio,
        sjc:j.aba, kj:j.aba ? K(j.aba) : null, critJ:j.criterio });
    });
    out.vencidosCCM = m.vigentes('CCM').filter(sn => window._isContractExpired(sn));
    out.vencidosSJC = m.vigentes('SJC').filter(sn => window._isContractExpired(sn));
    out.primeiroCCM = m.primeiroVigente('CCM');
    out.primeiroSJC = m.primeiroVigente('SJC');
    return out;
  });
  /* A regra inteira, linha a linha: ou o escolhido é do mesmo mês, ou é o
     primeiro posterior, ou não existe. Nunca anterior, nunca um pulo. */
  const regraOk = CAS.linhas.every(l => {
    for (const [sn, k, crit] of [[l.ccm, l.kc, l.critC], [l.sjc, l.kj, l.critJ]]){
      if (!sn){ if (crit !== 'indisponivel') return false; continue; }
      if (crit === 'mesmo'  && k !== l.k) return false;
      if (crit === 'posterior' && !(k > l.k)) return false;
      if (k < l.k) return false;
    }
    return true;
  });
  ver('V13 todo par casado é do mesmo mês ou do primeiro posterior, nunca anterior',
      regraOk, CAS.linhas.map(l => l.bgi+'→'+l.ccm+'/'+l.sjc).join(' '));
  /* E o salto nunca passa do primeiro posterior disponível: se existe um
     contrato entre o BGI e o escolhido, a regra errou. */
  const semPulo = await D.pg.evaluate(C => {
    const m = window._veMotor;
    return C.linhas.every(l => ['CCM','SJC'].every(pre => {
      const sn = pre === 'CCM' ? l.ccm : l.sjc;
      if (!sn) return true;
      const k = m.chaveVenc(sn);
      return !m.vigentes(pre).some(o => { const ko = m.chaveVenc(o); return ko >= l.k && ko < k; });
    }));
  }, CAS);
  ver('V13 nenhum vencimento intermediário foi pulado', semPulo);
  ver('V13 nenhum contrato vencido entra na lista de casamento',
      CAS.vencidosCCM.length === 0 && CAS.vencidosSJC.length === 0,
      CAS.vencidosCCM.concat(CAS.vencidosSJC).join(','));
  /* O defeito que esta etapa corrige: antes, TODO BGI devolvia o primeiro
     vigente do milho. Se ainda devolvesse, mais de um BGI apontaria para o
     primeiro da curva sem que o mês justificasse. */
  ver('V13 o milho deixou de ser sempre o primeiro vigente',
      CAS.linhas.filter(l => l.ccm === CAS.primeiroCCM).length < CAS.linhas.length,
      CAS.linhas.filter(l => l.ccm === CAS.primeiroCCM).length + ' de ' + CAS.linhas.length
        + ' usam ' + CAS.primeiroCCM);
  /* Dois BGI seguidos podem cair no mesmo grão — é o calendário da B3, e a
     tela precisa aceitar isso sem tratar como erro. */
  const repetidos = {};
  CAS.linhas.forEach(l => { if (l.ccm) repetidos[l.ccm] = (repetidos[l.ccm]||0)+1; });
  ver('V13 um mesmo CCM pode servir a mais de um BGI (calendário da B3)',
      Object.keys(repetidos).some(k => repetidos[k] > 1),
      JSON.stringify(repetidos));

  /* ── V14 · A tela usa os contratos casados ─────────────────────────── */
  const TELA = await D.pg.evaluate(async () => {
    /* `renderFiltro` reescreve o HTML do filtro a cada redesenho, então o
       <select> é OUTRO elemento depois de cada troca. Guardar a referência
       antes do laço faz as trocas seguintes acontecerem num nó solto do
       documento, que não dispara nada — e o teste passaria a medir sempre o
       primeiro vencimento achando que mediu todos. */
    const opcoes = [...document.getElementById('veVencRef').options].map(o => o.value).slice(0, 5);
    const out = { passos:[] };
    for (const v of opcoes){
      const sel = document.getElementById('veVencRef');
      sel.value = v; sel.dispatchEvent(new Event('change', { bubbles:true }));
      await new Promise(r => setTimeout(r, 1300));
      const m = window._veMotor;
      const c = m.casaVenc('CCM', v), j = m.casaVenc('SJC', v);
      const itens = [...document.querySelectorAll('#veFiltro .ve-cas-item strong')].map(x => x.textContent);
      const cards = {};
      [...document.querySelectorAll('#veCards .ve-card')].forEach(x => {
        const rot = ((x.querySelector('.ve-card-rot')||{}).textContent||'').trim();
        const pe  = ((x.querySelector('.ve-card-pe') ||{}).textContent||'').trim();
        cards[rot] = pe;
      });
      out.passos.push({ v, ccm:c.aba, sjc:j.aba, itens, cards,
        kpiPreco:((document.querySelector('#veMargem .ve-kpi-val')||{}).textContent||'').trim() });
    }
    return out;
  });
  ver('V14 o painel de contratos em uso nomeia os três',
      TELA.passos.every(p => p.itens.length === 3), JSON.stringify(TELA.passos[0]?.itens));
  ver('V14 o CCM nomeado na tela é o que o motor casou',
      TELA.passos.every(p => !p.ccm || p.itens[1].indexOf(p.ccm) >= 0),
      TELA.passos.map(p => p.v+':'+p.itens[1]).join(' | '));
  ver('V14 o SJC nomeado na tela é o que o motor casou',
      TELA.passos.every(p => !p.sjc || p.itens[2].indexOf(p.sjc) >= 0),
      TELA.passos.map(p => p.v+':'+p.itens[2]).join(' | '));
  ver('V14 quando não há correspondente, a tela diz — e não cai no primeiro da curva',
      TELA.passos.every(p => p.sjc || /sem contrato/i.test(p.itens[2])),
      TELA.passos.filter(p => !p.sjc).map(p => p.v+':'+p.itens[2]).join(' | ') || 'todos têm par');
  /* O card do milho futuro tem de citar o contrato casado no pé. */
  ver('V14 o card do milho futuro cita o contrato casado',
      TELA.passos.every(p => {
        const pe = p.cards['Milho — futuro (CCM)'] || '';
        return !p.ccm || pe.indexOf(p.ccm) >= 0;
      }), TELA.passos.map(p => p.v+'→'+(p.cards['Milho — futuro (CCM)']||'')).join(' | ').slice(0,180));

  /* ── V15 · Físico não depende de vencimento ────────────────────────── */
  const FIS = {};
  TELA.passos.forEach(p => {
    Object.keys(p.cards).forEach(k => {
      if (/físic|CEPEA|Paranagu/i.test(k)){ (FIS[k] = FIS[k] || []).push(p.cards[k]); }
    });
  });
  const fisEstavel = await D.pg.evaluate(async () => {
    const vals = [...document.getElementById('veVencRef').options].map(o => o.value).slice(0, 4);
    const obs = [];
    for (const v of vals){
      const sel = document.getElementById('veVencRef');
      sel.value = v; sel.dispatchEvent(new Event('change', { bubbles:true }));
      await new Promise(r => setTimeout(r, 1200));
      const t = {};
      [...document.querySelectorAll('#veCards .ve-card')].forEach(x => {
        const rot = ((x.querySelector('.ve-card-rot')||{}).textContent||'').trim();
        if (/físic/i.test(rot)) t[rot] = ((x.querySelector('.ve-card-val')||{}).textContent||'').trim();
      });
      obs.push(t);
    }
    const chaves = Object.keys(obs[0] || {});
    return { chaves, mudou:chaves.filter(k => obs.some(o => o[k] !== obs[0][k])), obs:obs[0] };
  });
  ver('V15 os preços físicos CEPEA não mudam com o vencimento futuro',
      fisEstavel.chaves.length >= 2 && fisEstavel.mudou.length === 0,
      fisEstavel.mudou.join(',') || JSON.stringify(fisEstavel.obs));

  /* ── V16 · Premissas pré-carregadas ────────────────────────────────── */
  const PRE = await D.pg.evaluate(async () => {
    try { localStorage.removeItem('ve_premissas_v1'); } catch(e){}
    window._veRender();
    await new Promise(r => setTimeout(r, 1600));
    const E = window._veMotor.premissasEfetivas();
    return { completas:E.completas, nPers:E.nPersonalizado, nCalc:E.nCalculadora,
             nPad:E.nPadrao, falta:E.falta.map(f => f[0]), temPadrao:E.temPadrao,
             sistema:E.p.sistema, origemSistema:E.origem.sistema,
             custoEnt:E.p.custoArrobaEntrada, origemCusto:E.origem.custoArrobaEntrada,
             salvo:localStorage.getItem('ve_premissas_v1'),
             kpis:[...document.querySelectorAll('#veMargem .ve-kpi-rot')].map(x => x.textContent) };
  });
  ver('V16 no primeiro acesso a tela abre com o cenário padrão do Radar',
      PRE.temPadrao && PRE.nPad > 20 && PRE.sistema === 'conf',
      PRE.nPad + ' campos do padrão · sistema ' + PRE.sistema);
  ver('V16 e com premissas suficientes para o motor de custo', PRE.completas,
      PRE.falta.join(','));
  ver('V16 o custo da @ de entrada vem da reposição, não de um número inventado',
      PRE.origemCusto === 'padrao' && parseFloat(PRE.custoEnt) > 0, PRE.custoEnt);
  ver('V16 o cenário padrão NÃO é gravado como dado da operação',
      !PRE.salvo || Object.keys(JSON.parse(PRE.salvo)).every(k => k.indexOf('veVenc') === 0),
      String(PRE.salvo));
  ver('V16 a margem do ciclo aparece sozinha, com os indicadores pedidos',
      ['Peso projetado de abate','Arrobas comercializadas','Custo total por cabeça',
       'Custo por arroba vendida','Break-even — margem bruta','Margem bruta por cabeça',
       'ROI do ciclo'].every(k => PRE.kpis.indexOf(k) >= 0),
      PRE.kpis.join(' · '));

  /* ── V17 · Trocar o vencimento não mexe na operação ────────────────── */
  const TROCA = await D.pg.evaluate(async () => {
    const vals = [...document.getElementById('veVencRef').options].map(o => o.value).slice(0, 4);
    const obs = [];
    for (const v of vals){
      const sel = document.getElementById('veVencRef');
      sel.value = v; sel.dispatchEvent(new Event('change', { bubbles:true }));
      await new Promise(r => setTimeout(r, 1300));
      const k = {};
      [...document.querySelectorAll('#veMargem .ve-kpi')].forEach(x => {
        k[(x.querySelector('.ve-kpi-rot')||{}).textContent] = (x.querySelector('.ve-kpi-val')||{}).textContent;
      });
      const E = window._veMotor.premissasEfetivas();
      obs.push({ v, preco:k['Preço de venda'], margem:k['Margem bruta por cabeça'],
                 be:k['Break-even — margem bruta'], peso:k['Peso projetado de abate'],
                 arrobas:k['Arrobas comercializadas'], custo:k['Custo total por cabeça'],
                 dias:E.p.diasCocho, gmd:E.p.gmdConf, ent:E.p.custoArrobaEntrada });
    }
    return obs;
  });
  const mudou = c => TROCA.some(o => o[c] !== TROCA[0][c]);
  ver('V17 trocar o vencimento muda o preço de venda', mudou('preco'),
      TROCA.map(o => o.v+':'+o.preco).join(' '));
  ver('V17 e a margem acompanha o novo preço', mudou('margem'),
      TROCA.map(o => o.margem).join(' '));
  ver('V17 e NÃO muda dias de cocho, GMD nem custo de entrada',
      !mudou('dias') && !mudou('gmd') && !mudou('ent'),
      TROCA.map(o => o.dias+'/'+o.gmd+'/'+o.ent).join(' '));
  ver('V17 e NÃO muda peso de abate, arrobas nem custo total',
      !mudou('peso') && !mudou('arrobas') && !mudou('custo'),
      TROCA.map(o => o.peso+'/'+o.arrobas+'/'+o.custo).join(' '));
  ver('V17 o break-even não depende do vencimento', !mudou('be'),
      TROCA.map(o => o.be).join(' '));

  /* ── V18 · Personalização e seleção manual ─────────────────────────── */
  const PERS = await D.pg.evaluate(async () => {
    const det = document.querySelector('#vePrem details'); if (det) det.open = true;
    const el = document.getElementById('ve_diasCocho');
    const antes = el.value;
    el.value = String(parseFloat(antes || '105') + 35);
    el.dispatchEvent(new Event('change', { bubbles:true }));
    document.getElementById('veSalvar').click();
    await new Promise(r => setTimeout(r, 1500));
    const salvo1 = JSON.parse(localStorage.getItem('ve_premissas_v1') || '{}');
    const sel = document.getElementById('veVencRef');
    const outro = [...sel.options].map(o => o.value).filter(v => v !== sel.value)[0];
    sel.value = outro; sel.dispatchEvent(new Event('change', { bubbles:true }));
    await new Promise(r => setTimeout(r, 1400));
    const E1 = window._veMotor.premissasEfetivas();
    /* Agora o milho à mão. */
    const mc = document.getElementById('veVencCCM');
    const alvoM = [...mc.options].map(o => o.value).filter(v => v && v !== mc.value)[0];
    mc.value = alvoM; mc.dispatchEvent(new Event('change', { bubbles:true }));
    await new Promise(r => setTimeout(r, 1400));
    const itensM = [...document.querySelectorAll('#veFiltro .ve-cas-item strong')].map(x => x.textContent);
    const E2 = window._veMotor.premissasEfetivas();
    /* E de volta ao automático. */
    const mc2 = document.getElementById('veVencCCM');
    mc2.value = ''; mc2.dispatchEvent(new Event('change', { bubbles:true }));
    await new Promise(r => setTimeout(r, 1400));
    const itensA = [...document.querySelectorAll('#veFiltro .ve-cas-item strong')].map(x => x.textContent);
    /* Restaurar padrão. */
    document.getElementById('veLimpar').click();
    await new Promise(r => setTimeout(r, 1500));
    const salvo2 = JSON.parse(localStorage.getItem('ve_premissas_v1') || '{}');
    const E3 = window._veMotor.premissasEfetivas();
    return { antes, salvo1:Object.keys(salvo1), diasDepois:E1.p.diasCocho,
             origemDias:E1.origem.diasCocho, nPers1:E1.nPersonalizado,
             alvoM, itensM, manualPreservado:E2.p.diasCocho, itensA,
             salvo2:Object.keys(salvo2), diasRestaurado:E3.p.diasCocho,
             origemRestaurado:E3.origem.diasCocho,
             vencPreservado:(document.getElementById('veVencRef')||{}).value };
  });
  ver('V18 salvar grava só o campo editado, não o cenário padrão inteiro',
      PERS.salvo1.filter(k => k.indexOf('veVenc') !== 0).length === 1,
      PERS.salvo1.join(','));
  ver('V18 a edição sobrevive à troca de vencimento',
      PERS.origemDias === 'personalizado' && PERS.diasDepois !== PERS.antes,
      PERS.antes + ' → ' + PERS.diasDepois + ' [' + PERS.origemDias + ']');
  ver('V18 a escolha manual do milho é respeitada',
      /escolhido à mão/.test(PERS.itensM[1] || '') && (PERS.itensM[1]||'').indexOf(PERS.alvoM) >= 0,
      PERS.itensM[1]);
  ver('V18 e o automático volta quando se pede',
      !/escolhido à mão/.test(PERS.itensA[1] || ''), PERS.itensA[1]);
  ver('V18 "Restaurar premissas padrão" apaga a edição e preserva o vencimento',
      PERS.origemRestaurado === 'padrao' && PERS.diasRestaurado === PERS.antes
        && PERS.salvo2.every(k => k.indexOf('veVenc') === 0) && !!PERS.vencPreservado,
      PERS.diasRestaurado + ' [' + PERS.origemRestaurado + '] · guardado: ' + PERS.salvo2.join(','));

  /* ── V19 · Nenhuma fórmula financeira nova ─────────────────────────── */
  const MOTOR = await D.pg.evaluate(async () => {
    const E = window._veMotor.premissasEfetivas();
    const sel = document.getElementById('veVencRef');
    const v = sel.value;
    const u = window._veMotor.ultima(v);
    const r = window._veMotor.custo(u.preco, E.p);
    const direto = window.__3M_calcEngine(E.p, u.preco);
    const k = {};
    [...document.querySelectorAll('#veMargem .ve-kpi')].forEach(x => {
      k[(x.querySelector('.ve-kpi-rot')||{}).textContent] = (x.querySelector('.ve-kpi-val')||{}).textContent;
    });
    const n = s => parseFloat(String(s||'').replace(/[^\d,.-]/g,'').replace(/\./g,'').replace(',','.'));
    return { bateMotor: Math.abs(r.bMB - direto.bMB) < 1e-9 && Math.abs(r.mB - direto.mB) < 1e-9,
             telaBE:n(k['Break-even — margem bruta']), motorBE:direto.bMB,
             telaMB:n(k['Margem bruta por cabeça']), motorMB:direto.mB,
             telaCusto:n(k['Custo total por cabeça']), motorCusto:direto.cT };
  });
  ver('V19 a tela não recalcula: o que ela mostra é o que o calcEngine devolveu',
      MOTOR.bateMotor
        && Math.abs(MOTOR.telaBE - MOTOR.motorBE) < 0.01
        && Math.abs(MOTOR.telaMB - MOTOR.motorMB) < 0.01
        && Math.abs(MOTOR.telaCusto - MOTOR.motorCusto) < 0.01,
      'BE ' + MOTOR.telaBE + '/' + MOTOR.motorBE.toFixed(2)
        + ' · MB ' + MOTOR.telaMB + '/' + MOTOR.motorMB.toFixed(2)
        + ' · custo ' + MOTOR.telaCusto + '/' + MOTOR.motorCusto.toFixed(2));


  /* ── V20 · Sem fonte válida, a ausência é declarada ────────────────────
     O teste que saiu de V6 volta aqui, mais exigente: derruba o cenário
     padrão de propósito, limpa o que estiver salvo e exige que a tela diga
     que faltam premissas — e diga QUAIS — em vez de mostrar margem de
     enchimento. */
  const SEM = await D.pg.evaluate(async () => {
    const guarda = window._caiCenarioPadrao;
    const salvo = localStorage.getItem('ve_premissas_v1');
    try { localStorage.removeItem('ve_premissas_v1'); } catch(e){}
    window._caiCenarioPadrao = function(){ return null; };
    try { delete window.__CAI_CENARIO; } catch(e){ window.__CAI_CENARIO = null; }
    window._veRender();
    await new Promise(r => setTimeout(r, 1600));
    const t = id => { const e = document.getElementById(id); return e ? e.textContent.replace(/\s+/g,' ') : ''; };
    const E = window._veMotor.premissasEfetivas();
    const out = { margem:t('veMargem'), venda:t('veVenda'), protecao:t('veProtecao'),
                  prem:t('vePrem'), completas:E.completas, falta:E.falta.map(f => f[1]),
                  nPad:E.nPadrao };
    /* devolve o painel ao estado anterior */
    window._caiCenarioPadrao = guarda;
    if (salvo != null) localStorage.setItem('ve_premissas_v1', salvo);
    window._veRender();
    await new Promise(r => setTimeout(r, 1500));
    return out;
  });
  ver('V20 sem cenário padrão e sem personalização, não há premissas',
      !SEM.completas && SEM.nPad === 0 && SEM.falta.length > 0, SEM.falta.join(', '));
  ver('V20 a margem do ciclo declara a ausência em vez de mostrar número',
      /Dados insuficientes para análise/.test(SEM.margem) && !/R\$\s*\d/.test(SEM.margem),
      SEM.margem.slice(0,140));
  ver('V20 e diz exatamente o que falta',
      SEM.falta.every(f => SEM.margem.indexOf(f) >= 0 || SEM.prem.indexOf(f) >= 0),
      SEM.falta.join(' · '));
  ver('V20 a venda do boi volta a declarar a ausência de custo',
      /Dados insuficientes para análise/.test(SEM.venda), SEM.venda.slice(0,120));
  ver('V20 a proteção também', /Dados insuficientes para análise/.test(SEM.protecao),
      SEM.protecao.slice(0,120));
  ver('V20 e a tela volta ao normal depois do teste',
      await D.pg.evaluate(() => window._veMotor.premissasEfetivas().completas));

  await D.pg.close();
  await b.close();

  console.log('');
  console.log('VISÃO EXECUTIVA — Etapas 4 e 6');
  ok.forEach(x => console.log('  ok      ' + x.nome));
  falhas.forEach(x => console.log('  FALHOU  ' + x.nome + (x.detalhe ? ' — ' + x.detalhe : '')));
  console.log('  ' + ok.length + ' passaram' + (falhas.length ? ', ' + falhas.length + ' FALHARAM' : ''));
  console.log('');
  process.exit(falhas.length ? 1 : 0);
})().catch(e => { console.error('QUEBROU:', e.message); process.exit(2); });
