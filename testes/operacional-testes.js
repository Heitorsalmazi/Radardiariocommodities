#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════════════
   INTELIGÊNCIA OPERACIONAL DO CONFINAMENTO — testes
   ──────────────────────────────────────────────────────────────────────────
   A pergunta que esta suíte responde: AS CINCO TELAS NOVAS CALCULAM O QUE
   DIZEM QUE CALCULAM, E SEMPRE O MESMO?

   Ela não confere se a tela "abriu". Confere que cada número exibido é
   rastreável até o motor que o produziu, que as composições feitas na
   camada nova batem com a aritmética declarada, e que as mesmas entradas
   produzem as mesmas saídas.

       node operacional-testes.js http://127.0.0.1:8777/local.html
   ══════════════════════════════════════════════════════════════════════════ */
const { chromium } = require('/home/claude/nm/node_modules/playwright-core');
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = process.argv[2] || 'http://127.0.0.1:8777/local.html';

const ok = [], falhas = [];
function ver(nome, cond, detalhe){ (cond ? ok : falhas).push({ nome, detalhe }); }
const perto = (a, b, t) => a != null && b != null && isFinite(a) && isFinite(b) && Math.abs(a - b) < (t == null ? 1e-9 : t);

(async () => {
  const b = await chromium.launch({ executablePath:EXE, args:['--no-sandbox','--disable-dev-shm-usage'] });
  const pg = await b.newPage({ viewport:{ width:1440, height:1000 } });
  const erros = [];
  pg.on('pageerror', e => erros.push(String(e).slice(0,200)));
  await pg.goto(URL, { waitUntil:'load', timeout:180000 });
  await pg.waitForFunction(() => window.workbook && window.workbook.SheetNames
    && window.workbook.SheetNames.length > 100, null, { timeout:300000 });
  await pg.waitForTimeout(2500);
  await pg.evaluate(() => { const l = document.getElementById('bms-lock'); if (l) l.style.display = 'none';
    const c = document.querySelector('.asel-choice[data-asel-group="agro"]'); if (c) c.click(); });
  await pg.waitForTimeout(400);
  await pg.evaluate(() => { const x = document.getElementById('aselEnterBtn'); if (x) x.click(); });
  await pg.waitForTimeout(3500);
  /* Lote de tamanho realista: com uma cabeça só, um contrato de 330 @ sobre
     19 @ físicas torna todos os degraus da escada iguais e o teste não
     mediria nada. */
  await pg.evaluate(() => { const m = window._veMotor, p = m.premissas();
    p.cabecas = '300'; m.salvarPremissas(p); });

  /* ── O1 · As cinco seções existem e são alcançáveis ─────────────────── */
  const SECS = ['m3_4_2','m3_4_3','m3_3_8','m3_3_9','m3_3_10'];
  const O1 = await pg.evaluate(ids => ids.map(id => {
    const s = (window._M3_ESTRUTURA || []).filter(x => x.id === id)[0];
    const bt = document.querySelector('.m3-sec-btn[data-sec="' + id + '"]');
    const slot = document.getElementById('slot_' + id);
    return { id, grupo: s ? s.amb : null, render: s ? (s.render || []) : [],
             botaoVisivel: !!bt && bt.style.display !== 'none',
             filhos: slot ? slot.children.length : -1 };
  }), SECS);
  ver('O1 as cinco seções estão na árvore', O1.every(x => x.grupo), O1.map(x => x.id + ':' + x.grupo).join(' '));
  ver('O1 todas com botão visível', O1.every(x => x.botaoVisivel),
      O1.filter(x => !x.botaoVisivel).map(x => x.id).join(','));
  ver('O1 nenhuma com slot vazio', O1.every(x => x.filhos > 0),
      O1.map(x => x.id + ':' + x.filhos).join(' '));
  ver('O1 cada uma tem a sua função de desenho', O1.every(x => x.render.length === 1),
      O1.map(x => x.id + ':' + x.render.join('/')).join(' '));
  ver('O1 os simuladores antigos continuam de pé',
      await pg.evaluate(() => ['m3_4_1','m3_3_6','m3_3_5a'].every(id => {
        const sl = document.getElementById('slot_' + id);
        return sl && sl.children.length > 0;
      })), 'Calculadora do Boi, Simulador de Hedge e matriz de contratos');

  /* ── O2 · Peso final ↔ GMD: a mesma equação nos dois sentidos ───────── */
  const O2 = await pg.evaluate(() => {
    const mo = window._ioMotor, E = mo.premissas();
    const a = mo.reconcilia(E.p, 'gmd');
    const alvo = Math.round((a.pesoFinal || 500) + 25);
    const p2 = Object.assign({}, E.p, { pesoFinalKg: String(alvo) });
    const c = mo.reconcilia(p2, 'peso');
    return { a:{ gmd:a.gmd, pesoFinal:a.pesoFinal, derivado:a.derivado, dias:a.dias, pE:a.pesoEntrada },
             c:{ gmd:c.gmd, pesoFinal:c.pesoFinal, derivado:c.derivado }, alvo };
  });
  ver('O2 modo GMD: peso final = entrada + GMD × dias',
      O2.a.derivado === 'pesoFinal' && perto(O2.a.pesoFinal, O2.a.pE + O2.a.gmd * O2.a.dias),
      O2.a.pE + ' + ' + O2.a.gmd + ' × ' + O2.a.dias + ' = ' + O2.a.pesoFinal);
  ver('O2 modo peso: GMD = (final − entrada) ÷ dias',
      O2.c.derivado === 'gmd' && perto(O2.c.gmd, (O2.alvo - O2.a.pE) / O2.a.dias),
      '(' + O2.alvo + ' − ' + O2.a.pE + ') ÷ ' + O2.a.dias + ' = ' + O2.c.gmd);
  ver('O2 o GMD derivado não é absurdo (parser decimal)',
      O2.a.gmd > 0.1 && O2.a.gmd < 5, String(O2.a.gmd) + ' kg/dia');

  /* ── O3 · Os dois custos por arroba, rastreados até o motor ─────────── */
  const O3 = await pg.evaluate(() => {
    const mo = window._ioMotor, m = window._veMotor, E = mo.premissas();
    const sn = m.primeiroVigente('BGI'), u = m.ultima(sn);
    const S = mo.simular(E.p, u.preco, 'gmd');
    const d = window.__3M_calcEngine(mo.paraMotor(E.p, 'gmd').st, u.preco);
    return { produzida:S.custoArrobaProduzida, cAI:d.cAI,
             comercializada:S.custoArrobaComercializada, cTsobreArC:d.cT / d.arC,
             arProd:S.arrobasProduzidas, arCmenosArE:d.arC - d.arE,
             be:S.breakEvenBruto, bMB:d.bMB, mB:S.resultadoCabecaBruto, mBd:d.mB,
             lote:S.resultadoLote, lLote:d.lLote, roi:S.roi, roiD:d.roi };
  });
  ver('O3 custo da @ PRODUZIDA é o cAI do motor, sem recálculo',
      perto(O3.produzida, O3.cAI), O3.produzida + ' vs ' + O3.cAI);
  ver('O3 custo da @ COMERCIALIZADA é custo total ÷ arrobas de carcaça',
      perto(O3.comercializada, O3.cTsobreArC), O3.comercializada + ' vs ' + O3.cTsobreArC);
  ver('O3 os dois conceitos são números diferentes',
      Math.abs(O3.produzida - O3.comercializada) > 1,
      'produzida ' + O3.produzida.toFixed(2) + ' · comercializada ' + O3.comercializada.toFixed(2));
  ver('O3 arrobas produzidas = carcaça − entrada', perto(O3.arProd, O3.arCmenosArE));
  ver('O3 break-even, margem, lote e ROI vêm do motor sem toque',
      perto(O3.be, O3.bMB) && perto(O3.mB, O3.mBd) && perto(O3.lote, O3.lLote) && perto(O3.roi, O3.roiD));

  /* ── O4 · Reprodutibilidade: mesmas entradas, mesmas saídas ─────────── */
  const O4 = await pg.evaluate(() => {
    const mo = window._ioMotor, m = window._veMotor, E = mo.premissas();
    const u = m.ultima(m.primeiroVigente('BGI'));
    const a = mo.simular(E.p, u.preco, 'gmd');
    const c = mo.simular(E.p, u.preco, 'gmd');
    const campos = ['custoTotalCabeca','custoArrobaProduzida','custoArrobaComercializada',
                    'resultadoCabecaBruto','resultadoLote','breakEvenBruto','roi'];
    return { iguais: campos.every(k => a[k] === c[k]),
             dif: campos.filter(k => a[k] !== c[k]) };
  });
  ver('O4 duas chamadas com as mesmas entradas devolvem os mesmos números',
      O4.iguais, O4.dif.join(','));

  /* ── O5 · Escada de proteção ───────────────────────────────────────── */
  await pg.evaluate(() => { const m = window._veMotor, p = m.premissas();
    p.ioPrecoLiq = '340'; m.salvarPremissas(p); });
  await pg.evaluate(() => window.m3Ir('m3_3_9'));
  await pg.waitForTimeout(3000);
  const O5 = await pg.evaluate(() => {
    const mo = window._ioMotor, m = window._veMotor, E = mo.premissas();
    const S = mo.simular(E.p, 1, 'gmd');
    const arr = S.arrobasComercializadas * S.cabecas;
    const sn = m.primeiroVigente('BGI'), u = m.ultima(sn);
    const pior = mo.piorVariacao(sn, [21]);
    const pj = pior.janelas[0].pior;
    const deg = mo.escada({ arrobasFisicas:arr, precoTravado:u.preco, precoCenario:340,
                            baseRS:0, custoOpContrato:'', arredonda:'cima',
                            piorAjusteRS: pj ? pj.abs : null,
                            custoArroba:S.custoArrobaComercializada });
    return { arr, trav:u.preco, pior: pj ? pj.abs : null,
             deg: deg.map(d => ({ pct:d.pct, fis:d.volumeFisico, tr:d.volumeTravado,
                                  res:d.exposicaoResidual, n:d.nContratos, tam:d.tamanho,
                                  rf:d.receitaFisica, rd:d.resultadoDerivativo,
                                  ch:d.custoHedge, re:d.receitaEconomica,
                                  pe:d.precoEfetivo, cx:d.caixaAjuste, sobre:d.sobreprotege })),
             naTela: document.querySelectorAll('#ioEsc tbody tr').length };
  });
  ver('O5 cinco degraus: 0, 25, 50, 75 e 100%',
      O5.deg.map(d => d.pct).join(',') === '0,25,50,75,100' && O5.naTela === 5, O5.naTela + ' linhas');
  ver('O5 o volume travado é sempre múltiplo do contrato',
      O5.deg.every(d => d.tam > 0 && Math.abs(d.tr % d.tam) < 1e-9),
      O5.deg.map(d => d.tr + '/' + d.tam).join(' '));
  ver('O5 contratos × tamanho = volume travado',
      O5.deg.every(d => perto(d.n * d.tam, d.tr)));
  ver('O5 exposição residual = físico − travado, nunca negativa',
      O5.deg.every(d => perto(d.res, Math.max(0, d.fis - d.tr))),
      O5.deg.map(d => d.pct + '%:' + d.res.toFixed(1)).join(' '));
  ver('O5 resultado do derivativo = (travado − liquidação) × volume travado',
      O5.deg.every(d => perto(d.rd, (O5.trav - 340) * d.tr, 0.01)));
  ver('O5 resultado econômico = físico + derivativo − custo do hedge',
      O5.deg.every(d => perto(d.re, d.rf + d.rd - d.ch, 0.01)));
  ver('O5 preço efetivo = resultado econômico ÷ volume físico',
      O5.deg.every(d => perto(d.pe, d.re / d.fis, 1e-6)));
  ver('O5 caixa do ajuste = pior alta observada × volume travado',
      O5.deg.every(d => perto(d.cx, O5.pior * d.tr, 0.01)),
      'pior 21 pregões: ' + (O5.pior != null ? O5.pior.toFixed(2) : '—'));
  ver('O5 caixa é zero sem posição e cresce com a trava',
      O5.deg[0].cx === 0 && O5.deg[4].cx > O5.deg[1].cx);
  ver('O5 sobreproteção é sinalizada quando o arredondamento passa do físico',
      O5.deg.every(d => d.sobre === (d.tr > d.fis)),
      O5.deg.filter(d => d.sobre).map(d => d.pct + '%').join(',') || 'nenhum degrau sobreprotege');
  ver('O5 proteger mais muda o resultado — os degraus não são iguais',
      new Set(O5.deg.map(d => Math.round(d.re))).size > 1,
      O5.deg.map(d => Math.round(d.re)).join(' '));

  /* ── O6 · Pior variação é medida, não modelada ──────────────────────── */
  const O6 = await pg.evaluate(() => {
    const mo = window._ioMotor, m = window._veMotor;
    const sn = m.primeiroVigente('BGI');
    const p = mo.piorVariacao(sn, [1,5,21]);
    if (!p) return null;
    const s = window._baseSerieDiaria(sn);
    return { contrato:p.contrato, n:p.nPregoes,
             j: p.janelas.map(j => j.pior ? ({ k:j.k, abs:j.pior.abs, de:j.pior.de, ate:j.pior.ate,
                   pDe:j.pior.precoDe, pAte:j.pior.precoAte,
                   confereDe: s[j.pior.de], confereAte: s[j.pior.ate], nJan:j.nJanelas }) : null) };
  });
  ver('O6 a pior variação aponta pregões que existem na série',
      O6 && O6.j.every(j => !j || (j.confereDe === j.pDe && j.confereAte === j.pAte)),
      O6 ? O6.j.filter(Boolean).map(j => j.k + 'p ' + j.de + '→' + j.ate).join(' · ') : 'sem série');
  ver('O6 a variação bate com os preços dos dois pregões',
      O6 && O6.j.every(j => !j || perto(j.abs, j.pAte - j.pDe, 1e-9)));
  ver('O6 janela maior nunca encontra alta menor que a janela curta',
      O6 && (() => { const v = O6.j.filter(Boolean).map(j => j.abs);
        for (let i=1;i<v.length;i++) if (v[i] < v[i-1] - 1e-9) return false; return true; })(),
      O6 ? O6.j.filter(Boolean).map(j => j.k + 'p:+' + j.abs.toFixed(2)).join(' ') : '');

  /* ── O7 · Risco de base: três pernas, nenhuma presumida ─────────────── */
  await pg.evaluate(() => window.m3Ir('m3_3_10'));
  await pg.waitForTimeout(2500);
  const O7 = await pg.evaluate(() => {
    const mo = window._ioMotor, m = window._veMotor;
    const pr = mo.pracas();
    const sn = m.primeiroVigente('BGI');
    const comPraca = pr.length ? mo.baseObservada(pr[0].chave, sn, 12) : null;
    const semPraca = mo.baseObservada(null, sn, 12);
    const venc = mo.baseNoVencimento(pr.length ? pr[0].chave : null, 5);
    return { nPracas:pr.length,
             temCepeaBgi: !!semPraca.cepeaBgi,
             nObsCepeaBgi: semPraca.cepeaBgi ? semPraca.cepeaBgi.n : 0,
             temPracaCepea: !!(comPraca && comPraca.pracaCepea),
             temPracaBgi: !!(comPraca && comPraca.pracaBgi),
             somaPernas: (comPraca && comPraca.pracaCepea && comPraca.cepeaBgi && comPraca.pracaBgi)
               ? { a:comPraca.pracaCepea.mediana, c:comPraca.cepeaBgi.mediana, soma:comPraca.pracaBgi.mediana } : null,
             vencidos: venc.length,
             bases: venc.filter(v => v.cepeaMenosBgi).map(v => v.cepeaMenosBgi.media),
             zeros: venc.filter(v => v.cepeaMenosBgi && Math.abs(v.cepeaMenosBgi.media) < 0.01).length };
  });
  ver('O7 a base CEPEA × contrato é medida, com pregões pareados',
      O7.temCepeaBgi && O7.nObsCepeaBgi > 20, O7.nObsCepeaBgi + ' pregões em comum');
  ver('O7 a praça entra como terceira perna quando escolhida',
      O7.nPracas > 0 ? (O7.temPracaCepea && O7.temPracaBgi) : true,
      O7.nPracas + ' praças na planilha');
  ver('O7 nenhum contrato vencido fechou com base zero',
      O7.vencidos > 0 && O7.zeros === 0,
      O7.vencidos + ' contratos vencidos · bases: '
        + O7.bases.map(x => x.toFixed(2)).join(', '));
  ver('O7 e a tela diz isso em vez de presumir convergência',
      await pg.evaluate(() => /não presuma base zero/i.test(document.getElementById('ioBase').textContent)));

  /* ── O8 · Cenários sem probabilidade ───────────────────────────────── */
  await pg.evaluate(() => window.m3Ir('m3_4_3'));
  await pg.waitForTimeout(2500);
  const O8 = await pg.evaluate(() => {
    const t = document.getElementById('ioCen').textContent;
    return { cols: document.querySelectorAll('#ioCen .io-cen-col').length,
             titulos: [...document.querySelectorAll('#ioCen .io-cen-tit')].map(x => x.textContent.trim().split(' ')[0]),
             falaProbabilidade: /probabilidade|chance de|% de chance|provável/i.test(t),
             declaraAusencia: /sem probabilidade/i.test(t) };
  });
  ver('O8 três cenários lado a lado', O8.cols === 3, O8.titulos.join(','));
  ver('O8 conservador, base e otimista',
      JSON.stringify(O8.titulos) === JSON.stringify(['Conservador','Base','Otimista']), O8.titulos.join(','));
  ver('O8 nenhuma probabilidade atribuída', O8.declaraAusencia);

  /* ── O9 · Observado × estimado ─────────────────────────────────────── */
  await pg.evaluate(() => window.m3Ir('m3_3_8'));
  await pg.waitForTimeout(2500);
  const O9 = await pg.evaluate(() => ({
    obs: document.querySelectorAll('#ioVenc .io-obs').length,
    est: document.querySelectorAll('#ioVenc .io-est').length,
    linhas: document.querySelectorAll('#ioVenc tbody tr').length,
    refDestacada: document.querySelectorAll('#ioVenc .io-tr-ref').length
  }));
  ver('O9 a tabela marca o que é observado e o que é estimado',
      O9.obs >= 2 && O9.est >= 4, O9.obs + ' obs · ' + O9.est + ' est');
  ver('O9 um contrato por vencimento vigente', O9.linhas > 0, O9.linhas + ' linhas');
  ver('O9 no máximo um vencimento destacado como o do abate',
      O9.refDestacada <= 1, String(O9.refDestacada));

  /* ── O10 · Sem premissas, nada de número ───────────────────────────── */
  const O10 = await pg.evaluate(async () => {
    const m = window._veMotor;
    const salvo = localStorage.getItem('ve_premissas_v1');
    const guarda = window._caiCenarioPadrao;
    try { localStorage.removeItem('ve_premissas_v1'); } catch(e){}
    window._caiCenarioPadrao = function(){ return null; };
    try { delete window.__CAI_CENARIO; } catch(e){ window.__CAI_CENARIO = null; }
    window._ioSim(); window._ioEscada(); window._ioVencimentos();
    await new Promise(r => setTimeout(r, 900));
    const t = id => (document.getElementById(id) || {}).textContent || '';
    const out = { sim:t('ioSim'), esc:t('ioEsc'), venc:t('ioVenc'),
                  /* O que não pode existir é RESULTADO. O preço observado no
                     topo da tela continua aparecendo, e deve: ele vem da
                     planilha e não depende de premissa nenhuma. */
                  kpisSim: document.querySelectorAll('#ioSim .io-kpi').length,
                  linhasEsc: document.querySelectorAll('#ioEsc tbody tr').length,
                  linhasVenc: document.querySelectorAll('#ioVenc tbody tr').length };
    window._caiCenarioPadrao = guarda;
    if (salvo != null) localStorage.setItem('ve_premissas_v1', salvo);
    window._ioSim(); window._ioEscada(); window._ioVencimentos();
    await new Promise(r => setTimeout(r, 900));
    return out;
  });
  ver('O10 a simulação declara a ausência e não desenha resultado nenhum',
      /Dados insuficientes para análise/.test(O10.sim) && O10.kpisSim === 0,
      O10.kpisSim + ' indicadores · ' + O10.sim.replace(/\s+/g,' ').slice(0,90));
  ver('O10 a escada declara a ausência e não desenha degrau',
      /Dados insuficientes para análise/.test(O10.esc) && O10.linhasEsc === 0,
      O10.linhasEsc + ' linhas');
  ver('O10 a comparação de vencimentos declara a ausência e não desenha linha',
      /Dados insuficientes para análise/.test(O10.venc) && O10.linhasVenc === 0,
      O10.linhasVenc + ' linhas');
  ver('O10 mas o preço observado continua visível — ele não depende de premissa',
      /R\$\s*\d/.test(O10.sim), 'preço da planilha no topo da simulação');

  /* ── O11 · Sem rolagem horizontal ──────────────────────────────────── */
  const larguras = [1440, 1366, 1024, 768, 390];
  const transbordos = [];
  for (const w of larguras){
    await pg.setViewportSize({ width:w, height:1000 });
    await pg.waitForTimeout(600);
    transbordos.push({ w, x: await pg.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth) });
  }
  ver('O11 nenhuma das telas novas alarga a página',
      transbordos.every(t => t.x <= 0), transbordos.map(t => t.w + ':' + t.x).join(' '));

  ver('O12 console limpo em toda a varredura', erros.length === 0, erros.slice(0,3).join(' | '));

  await b.close();
  console.log('');
  console.log('INTELIGÊNCIA OPERACIONAL DO CONFINAMENTO');
  ok.forEach(x => console.log('  ok      ' + x.nome));
  falhas.forEach(x => console.log('  FALHOU  ' + x.nome + (x.detalhe ? ' — ' + x.detalhe : '')));
  console.log('  ' + ok.length + ' passaram' + (falhas.length ? ', ' + falhas.length + ' FALHARAM' : ''));
  console.log('');
  process.exit(falhas.length ? 1 : 0);
})().catch(e => { console.error('QUEBROU:', e.message); process.exit(2); });
