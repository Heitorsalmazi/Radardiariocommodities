#!/usr/bin/env node
/* REGISTRO DO COMPORTAMENTO ATUAL — Etapa 1 da evolução do Radar.
   Não julga nada. Abre o painel num Chromium, percorre tudo e grava um
   retrato numérico dos oito módulos em testes/baseline.json.

   A ideia é simples e vale mais do que parece: a suíte de regressão prova
   que a TELA não quebrou; este arquivo prova que os NÚMEROS não mudaram.
   Depois de qualquer alteração, `node baseline-comparar.js` recaptura e
   aponta o que saiu do lugar.

       node baseline-captura.js [url] [arquivo-de-saida]                  */
const { chromium } = require(process.env.PW || '/home/claude/nm/node_modules/playwright-core');
const fs = require('fs'), path = require('path');
const URL = process.argv[2] || 'http://127.0.0.1:8777/local.html';
const EXE = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SAIDA = process.argv[3] || path.join(__dirname, 'baseline.json');

(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox','--disable-dev-shm-usage'] });
  const pg = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const erros = [];
  pg.on('pageerror', e => erros.push(String(e).slice(0, 200)));
  pg.on('console', m => { if (m.type() === 'error' && !/404|TUNNEL|Failed to load/.test(m.text())) erros.push(m.text().slice(0,200)); });

  await pg.goto(URL, { waitUntil: 'load', timeout: 180000 });
  await pg.waitForFunction(() => window.workbook && window.workbook.SheetNames && window.workbook.SheetNames.length > 100,
                           null, { timeout: 300000 });
  await pg.waitForTimeout(3000);
  /* A tela de senha é um overlay sobre um painel que já carregou; escondê-la
     aqui é só tirar a cortina para o robô enxergar. */
  await pg.evaluate(() => { const l = document.getElementById('bms-lock'); if (l) l.style.display = 'none'; });
  await pg.evaluate(() => { const c = document.querySelector('.asel-choice[data-asel-group="agro"]'); if (c) c.click(); });
  await pg.waitForTimeout(400);
  await pg.evaluate(() => { const x = document.getElementById('aselEnterBtn'); if (x) x.click(); });
  await pg.waitForTimeout(2000);
  /* COLHER ENQUANTO A SEÇÃO ESTÁ ABERTA, não no fim.
     Uma varredura única depois de passar por todas as 34 seções perdia de
     forma intermitente os quatro gráficos do Ciclo pecuário — não porque o
     painel falhe (sondado à parte: desenham sempre, até com 300 ms), mas
     porque o retrato tirado no fim depende de o card ainda estar lá. Colher
     com a seção aberta é o que o usuário vê, e é estável. */
  const secs = await pg.evaluate(() => (window._M3_ESTRUTURA || []).map(s => s.id));
  const graficosAcum = {};
  const colher = async (secId) => {
    const r = await pg.evaluate(() => {
      const r6 = v => (typeof v === 'number' && isFinite(v)) ? Number(v.toFixed(6)) : (v == null ? null : v);
      const out = {};
      document.querySelectorAll('div[id^=chart]').forEach(e => {
        if (!e.data) return;
        out[e.id] = e.data.map(t => ({ nome: t.name || null,
          n: Array.isArray(t.y) ? t.y.filter(v=>v!=null).length : 0,
          primeiro: Array.isArray(t.y) ? r6(t.y.find(v=>v!=null)) : null,
          ultimo: Array.isArray(t.y) ? r6([...t.y].reverse().find(v=>v!=null)) : null }));
      });
      return out;
    });
    Object.keys(r).forEach(id => { if (!(id in graficosAcum)) graficosAcum[id] = { secao: secId, series: r[id] }; });
  };

  for (const s of secs) {
    await pg.evaluate(id => { try { m3Ir(id); } catch(e){} }, s);
    await pg.waitForTimeout(600);
    await colher(s);
  }
  /* Segunda volta: pega o que só desenha depois de algo assíncrono chegar. */
  for (const s of secs) {
    await pg.evaluate(id => { try { m3Ir(id); } catch(e){} }, s);
    await pg.waitForTimeout(350);
    await colher(s);
  }
  await pg.waitForTimeout(3000);
  await colher('varredura-final');

  const foto = await pg.evaluate(() => {
    const r6 = v => (typeof v === 'number' && isFinite(v)) ? Number(v.toFixed(6)) : (v == null ? null : v);
    const prof = (o, d) => { try { return JSON.parse(JSON.stringify(o)); } catch(e){ return d; } };
    const el = id => document.getElementById(id);
    const txt = id => { const e = el(id); return e ? (e.textContent||'').replace(/\s+/g,' ').trim() : null; };
    const serie = id => { const e = el(id); if (!e || !e.data) return null;
      return e.data.map(t => ({ nome: t.name || null, n: Array.isArray(t.y) ? t.y.filter(v=>v!=null).length : 0,
        primeiro: Array.isArray(t.y) ? r6(t.y.find(v=>v!=null)) : null,
        ultimo: Array.isArray(t.y) ? r6([...t.y].reverse().find(v=>v!=null)) : null })); };

    /* 1 · PREÇOS E CONTRATOS ------------------------------------------- */
    const contratos = {};
    (window.workbook.SheetNames || []).filter(s => /^(BGI|CCM|SJC|DOL|ETH)[FGHJKMNQUVXZ]\d{2}$/.test(s)).forEach(sn => {
      let rows = []; try { rows = XLSX.utils.sheet_to_json(window.workbook.Sheets[sn], {defval:null}); } catch(e){ return; }
      const p = rows.map(x => x['Preço']).filter(v => typeof v === 'number' && v > 0);
      if (p.length) contratos[sn] = { pregoes: p.length, primeiro: r6(p[0]), ultimo: r6(p[p.length-1]) };
    });

    /* 2 · CALCULADORA DO BOI (custo da arroba incremental) -------------- */
    const cai = prof(window.__3M_CAI, null);

    /* 3 · GESTÃO DE RISCO (os sinais que os cards publicam) ------------- */
    const sinais = prof(window.__3M_SINAIS, null);

    /* 4 · SIMULADOR DE HEDGE / BACKTEST -------------------------------- */
    const backtest = prof(window.__3M_BACKTEST, null);

    /* 5 · OPÇÕES -------------------------------------------------------- */
    const opcoes = {
      graficos: ['opcGraficoPremio','opcGraficoFutStrike','opcGraficoPct','opcGraficoCadeia']
                  .map(id => ({ id, series: serie(id) })),
      /* Leituras da tela por id — não por classe CSS, que muda de nome. */
      leituras: ['opcProduto','opcMercado','opcSerieTit','opcData','opcFuturo',
                 'opcDte','opcMoney','opcLiquidez','opcAviso','opcErro']
                  .reduce((o,id) => { const t = txt(id); if (t) o[id] = t.slice(0,120); return o; }, {}),
      linhasDaCadeia: (() => { const c = el('opcCorpo');
        return c ? c.querySelectorAll('tr').length : null; })()
    };

    /* 6 · EXPORTAÇÕES ---------------------------------------------------
       A chave do produto é 'boi' | 'milho' | 'soja' (CX_PRODUTOS). Passar
       'BOVINA' devolvia {erro:…} e o retrato gravava um 1 sem significado —
       era um falso âncora, e falso âncora é pior que âncora nenhuma. */
    const exportacoes = {};
    ['boi','milho','soja'].forEach(prod => {
      try {
        const H = (typeof getComexHistorical === 'function') ? getComexHistorical(prod) : null;
        exportacoes[prod] = (!H || H.erro) ? { erro: (H && H.erro) || 'sem retorno' }
          : { anos: H.anos.length, anoAtual: H.anoAtual, ultimoMes: H.ultimoMes,
              mesesDoAnoAtual: H.mesesDoAnoAtual.length, paises: H.paises.length };
      } catch(e){ exportacoes[prod] = { erro: String(e.message||e).slice(0,60) }; }
      try {
        const W = (typeof getComexWeekly === 'function') ? getComexWeekly(prod) : null;
        exportacoes[prod + '_semanal'] = W ? { campos: Object.keys(W).length } : null;
      } catch(e){}
    });

    /* ENTRADA FIXA NAS CONTAS — o teste de regressão de verdade.
       Capturar só o estado de tela não pega erro de fórmula: a tela pode
       ficar igual com a conta errada. Aqui as funções financeiras são
       chamadas com argumentos fixos, escolhidos à mão, e o resultado é
       gravado. Se alguém mexer na fórmula, estes números mudam.

       As cinco funções da reposição vivem dentro de um fechamento e NÃO
       existem no escopo da página. Chego nelas por `window._pcrMotor`, que
       é a porta que o próprio código já abriu (index.html:58253). Nada foi
       alterado no painel para este registro existir. */
    const contasFixas = {};
    const tenta = (nome, fn) => {
      try { const v = fn();
            contasFixas[nome] = (typeof v === 'number') ? r6(v)
                              : (v == null ? null : (typeof v === 'object' ? prof(v, '[objeto]') : v)); }
      catch(e){ contasFixas[nome] = 'ERRO: ' + String((e && e.message) || e).slice(0,80); }
    };

    /* ── motor da reposição (frete ANTT, comissão, preço colocado) ────── */
    const PM = window._pcrMotor || {};
    contasFixas['_pcrMotor_presente'] = !!window._pcrMotor;
    tenta('freteANTT_1000km_ccd3.5_cc500',  () => PM.calcularFreteANTT(1000, 3.5, 500));
    tenta('freteANTT_km_zero',              () => PM.calcularFreteANTT(0, 3.5, 500));
    tenta('retornoVazio_1000km_ccd3.5_on',  () => PM.calcularRetornoVazio(1000, 3.5, true));
    tenta('retornoVazio_desligado',         () => PM.calcularRetornoVazio(1000, 3.5, false));
    tenta('fatorRetornoVazio',              () => PM.FATOR_RETORNO_VAZIO);
    tenta('fretePorCabeca_9000_30cab',      () => PM.calcularFretePorCabeca(9000, 30));
    tenta('fretePorCabeca_zero_cabecas',    () => PM.calcularFretePorCabeca(9000, 0));
    tenta('comissao_300a_2pct',             () => PM.calcularComissao(300, 2, 'pct'));
    tenta('comissao_300a_45porcabeca',      () => PM.calcularComissao(300, 45, 'cab'));
    tenta('comissao_valor_zero',            () => PM.calcularComissao(300, 0, 'pct'));
    tenta('precoColocado_300_10_5_2',       () => PM.calcularPrecoColocado(300, 10, 5, 2));
    tenta('precoColocado_sem_outros',       () => PM.calcularPrecoColocado(300, 10, 5, null));
    tenta('escolherVeiculo_25cab',          () => PM.escolherVeiculo(25, null));
    tenta('escolherVeiculo_26cab',          () => PM.escolherVeiculo(26, null));
    tenta('escolherVeiculo_70cab',          () => PM.escolherVeiculo(70, null));
    tenta('escolherVeiculo_110cab',         () => PM.escolherVeiculo(110, null));
    tenta('escolherVeiculo_111cab',         () => PM.escolherVeiculo(111, null));
    tenta('veiculosANTT',                   () => PM.VEICULOS);

    /* ── Calculadora do Boi: um ciclo inteiro com entrada congelada ─────
       Não leio a tela: monto o estado à mão e chamo o motor de custo. Assim
       o número não depende de quais campos estavam preenchidos na captura. */
    const ST_FIXO = {
      sistema:'rc', cabecas:'100', pesoEntradaKg:'330', rendimento:'53', perdasPct:'0',
      custoArrobaEntrada:'290', freteCab:'0', comissaoCab:'0', dedRc:'0', dedPct:'0',
      diasSeca:'120', diasAguas:'120', gmdSeca:'0.350', gmdAguas:'0.750',
      tipoSeca:'prot01', tipoAguas:'prot01', precoSuplSeca:'3.20', precoSuplAguas:'2.80',
      diasCocho:'100', gmdConf:'1.500', dietaModo:'direto', custoDietaDia:'14.00',
      milhoSc:'70', milhoMS:'87', consumoPctPV:'2.2',
      sanClostridia:'0', sanBrucelose:'0', sanRaiva:'0', sanVermifugo:'0',
      sanEctoparasita:'0', sanOutros:'0', rastChip:'0', rastBrinco:'0',
      arrCabMes:'0', custoOperDia:'1.50', gta:'0', outrosTrib:'0',
      taxaJuros:'12', jurosMult:'1'
    };
    const CAMPOS_CAI = ['cAI','d','arE','arC','bLL','bMB','lL','llP','custoTotal','receita','mb'];
    tenta('calcEngine_cicloFixo_sp320', () => {
      if (typeof window.__3M_calcEngine !== 'function') throw new Error('__3M_calcEngine ausente');
      const c = window.__3M_calcEngine(ST_FIXO, '320'); const o = {};
      CAMPOS_CAI.forEach(k => { if (typeof c[k] === 'number' && isFinite(c[k])) o[k] = r6(c[k]); });
      return o;
    });
    tenta('calcEngine_cicloFixo_sp280', () => {
      const c = window.__3M_calcEngine(ST_FIXO, '280'); const o = {};
      CAMPOS_CAI.forEach(k => { if (typeof c[k] === 'number' && isFinite(c[k])) o[k] = r6(c[k]); });
      return o;
    });

    /* ── corrigidos pelo IGP-M e carcaça (séries longas) ───────────────── */
    tenta('igpm_jan2003', () => shFatorIgpm(2003, 0));
    tenta('igpm_jan2024', () => shFatorIgpm(2024, 0));
    /* _atkCarcacaArroba devolve um mapa data→valor com centenas de entradas:
       guardo só a impressão digital, não a série toda. */
    tenta('carcacaArroba_impressao', () => {
      const m = _atkCarcacaArroba(); if (!m) return null;
      const ks = Object.keys(m).sort();
      return ks.length ? { n: ks.length, primeiraData: ks[0], primeiro: r6(m[ks[0]]),
                           ultimaData: ks[ks.length-1], ultimo: r6(m[ks[ks.length-1]]) } : { n: 0 };
    });
    /* _atkVivoSP devolve {mapa, nPracas, unidade} e exige o produto. */
    const impressaoMapa = (R) => {
      if (!R || !R.mapa) return null;
      const ks = Object.keys(R.mapa).sort(); if (!ks.length) return { n: 0 };
      return { n: ks.length, nPracas: R.nPracas, unidade: R.unidade,
               primeiraData: ks[0], primeiro: r6(R.mapa[ks[0]]),
               ultimaData: ks[ks.length-1], ultimo: r6(R.mapa[ks[ks.length-1]]) };
    };
    tenta('vivoSP_boiGordo', () => impressaoMapa(_atkVivoSP('Boi Gordo')));
    tenta('vivoSP_vacaGorda', () => impressaoMapa(_atkVivoSP('Vaca Gorda')));

    /* 7 · LOGÍSTICA E REPOSIÇÃO ---------------------------------------- */
    const logistica = {};
    try { logistica.pracas = (typeof _rgPracas === 'function') ? _rgPracas('Boi Magro').length : null; } catch(e){}
    try { logistica.veiculos = prof(window.VEICULOS_REPOSICAO, null); } catch(e){}
    try { logistica.pedagioPorEixo = prof(window.PEDAGIO_POR_EIXO, null); } catch(e){}

    /* 8 · ATUALIZAÇÃO: idade do dado, aba por aba ----------------------- */
    const dt = v => (v instanceof Date) ? v : (typeof v === 'number' && v > 20000 && v < 60000
      ? new Date(Date.UTC(1899,11,30) + v*86400000) : null);
    const frescor = {};
    (window.workbook.SheetNames || []).forEach(sn => {
      let rows = []; try { rows = XLSX.utils.sheet_to_json(window.workbook.Sheets[sn], {defval:null}); } catch(e){ return; }
      if (!rows.length) return;
      const c = Object.keys(rows[0]).filter(k => /^(data|dia)$/i.test(k))[0]; if (!c) return;
      let mx = null; rows.forEach(x => { const d = dt(x[c]); if (d && (!mx || d > mx)) mx = d; });
      if (mx) frescor[sn] = mx.toISOString().slice(0,10);
    });

    /* 9 · ARQUITETURA DE CARGA — sem milissegundos de propósito: o tempo
       varia de máquina para máquina, mas O CAMINHO não pode mudar sem
       alguém ter decidido isso.

       ATENÇÃO ao ler `html2canvasPresente` e `pptxPresente`: no laboratório
       local essas duas bibliotecas são substituídas por um `noop.js`, então
       vêm `false` SEMPRE — isso descreve o laboratório, não o site. O que o
       campo serve para pegar é a mudança: se um dia vierem `true` aqui, o
       laboratório mudou e alguém precisa saber. Em produção as três vêm do
       jsdelivr e devem estar presentes. */
    const WK = window._WK_ESTADO || {};
    const carga = { parseVia: WK.via || null, parseErro: WK.erro || null,
                    plotlyOrigem: window.__M3_PLOTLY || null,
                    xlsxPresente: (typeof XLSX !== 'undefined'),
                    html2canvasPresente: (typeof html2canvas !== 'undefined'),
                    pptxPresente: (typeof PptxGenJS !== 'undefined') };

    return { contratos, cai, contasFixas, sinais, backtest, opcoes, exportacoes, logistica, frescor, carga,
             abas: window.workbook.SheetNames.length };
  });

  foto.graficos = graficosAcum;
  const saida = { capturadoEm: new Date().toISOString(), url: URL,
                  errosDeConsole: erros, resumo: {
                    abas: foto.abas, contratos: Object.keys(foto.contratos).length,
                    graficos: Object.keys(foto.graficos).length,
                    sinais: foto.sinais ? Object.keys(foto.sinais).length : 0 },
                  dados: foto };
  fs.writeFileSync(SAIDA, JSON.stringify(saida, null, 1));
  console.error('baseline gravada em', SAIDA);
  console.error(JSON.stringify(saida.resumo), '| erros de console:', erros.length);
  await b.close();
})().catch(e => { console.error('QUEBROU:', e.message); process.exit(1); });
