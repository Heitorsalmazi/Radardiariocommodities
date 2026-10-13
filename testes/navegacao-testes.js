#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════════════
   TESTES DA NAVEGAÇÃO — Etapa 5
   ──────────────────────────────────────────────────────────────────────────
   A pergunta que esta suíte responde é uma só: REORGANIZAR PERDEU ALGUMA
   COISA? Ela confere a árvore, o lar único de cada seção, os atalhos entre
   grupos, o universo guiado pelo grupo, a sobrevivência dos filtros e o
   alcance de tudo — inclusive do painel que a Etapa 3 havia deixado sem
   rota.

       node navegacao-testes.js
       node navegacao-testes.js http://127.0.0.1:8777/local.html
   ══════════════════════════════════════════════════════════════════════════ */
const { chromium } = require(process.env.PW || '/home/claude/nm/node_modules/playwright-core');
const EXE = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = process.argv.find(a => /^https?:\/\//.test(a)) || 'http://127.0.0.1:8777/local.html';

const ok = [], falhas = [];
function ver(nome, cond, detalhe){
  if (cond) ok.push({ nome }); else falhas.push({ nome, detalhe: detalhe == null ? '' : String(detalhe) });
}

/* As 35 seções que existiam antes da Etapa 5. Nenhuma pode ter sumido —
   é literalmente o requisito da etapa. */
const SECOES_ANTES = [
  'm3_0_1','m3_1_1','m3_1_2','m3_1_2t','m3_1_3','m3_1_4','m3_1_5','m3_1_6','m3_1_7','m3_1_8','m3_1_9',
  'm3_2_1','m3_2_2','m3_2_3','m3_2_4','m3_2_5','m3_2_6','m3_2_7','m3_2_8','m3_2_9','m3_2_10','m3_2_11',
  'm3_3_1','m3_3_2','m3_3_3','m3_3_4','m3_3_5a','m3_3_5b','m3_3_5c','m3_3_5d','m3_3_5e','m3_3_5f',
  'm3_3_5g','m3_3_6','m3_3_7'
];
const GRUPOS = ['exec','agro','macro','confin','hedge','estudo','relato'];

(async () => {
  const b  = await chromium.launch({ executablePath:EXE, args:['--no-sandbox','--disable-dev-shm-usage'] });
  const pg = await b.newPage({ viewport:{ width:1440, height:1000 } });
  const erros = [];
  pg.on('pageerror', e => erros.push(String(e).slice(0,200)));
  pg.on('console', m => {
    const t = m.text();
    if (m.type() === 'error' && !/404|TUNNEL|Failed to load/.test(t)) erros.push('err ' + t.slice(0,200));
  });
  await pg.goto(URL, { waitUntil:'load', timeout:180000 });
  await pg.waitForFunction(() => window.workbook && window.workbook.SheetNames
                                 && window.workbook.SheetNames.length > 100, null, { timeout:300000 });
  await pg.waitForTimeout(2500);
  await pg.evaluate(() => { const l = document.getElementById('bms-lock'); if (l) l.style.display='none'; });
  await pg.evaluate(() => { const c = document.querySelector('.asel-choice[data-asel-group="agro"]'); if (c) c.click(); });
  await pg.waitForTimeout(400);
  await pg.evaluate(() => { const x = document.getElementById('aselEnterBtn'); if (x) x.click(); });
  await pg.waitForTimeout(3000);

  /* ── N1 · A árvore ─────────────────────────────────────────────────── */
  const A = await pg.evaluate(() => {
    const E = window._M3_ESTRUTURA || [], G = window._M3_AMBIENTES || [];
    const ids = E.map(s => s.id);
    return { grupos:G.map(g => g.id), rotulos:G.map(g => g.rot), univ:G.map(g => g.univ || null),
             ids, nSecoes:E.length,
             semGrupo: E.filter(s => !G.some(g => g.id === s.amb)).map(s => s.id),
             duplicadas: ids.filter((x,i) => ids.indexOf(x) !== i),
             botoesGrupo: [...document.querySelectorAll('.m3-amb-btn')].map(x => x.getAttribute('data-amb')) };
  });
  ver('N1 sete grupos na tabela', A.grupos.length === 7, A.grupos.join(','));
  ver('N1 os sete grupos na ordem combinada',
      GRUPOS.every((g,i) => A.grupos[i] === g), A.grupos.join(','));
  ver('N1 os sete grupos viraram botão na barra',
      GRUPOS.every(g => A.botoesGrupo.indexOf(g) >= 0), A.botoesGrupo.join(','));
  ver('N1 nenhuma seção ficou sem grupo', A.semGrupo.length === 0, A.semGrupo.join(','));
  ver('N1 nenhum id de seção duplicado', A.duplicadas.length === 0, A.duplicadas.join(','));
  ver('N1 as 35 seções anteriores continuam existindo',
      SECOES_ANTES.every(id => A.ids.indexOf(id) >= 0),
      SECOES_ANTES.filter(id => A.ids.indexOf(id) < 0).join(','));
  /* ETAPA 6 (inteligência operacional) — a expectativa mudou porque a árvore
     cresceu por pedido: 37 seções passaram a 42 com as cinco telas novas. O
     teste continua exigindo os ids nominalmente, que é o que importa; contar
     42 sem dizer quais passaria com qualquer conjunto de cinco. */
  ver('N1 duas seções da Etapa 5: Calculadora e Relatórios',
      A.ids.indexOf('m3_4_1') >= 0 && A.ids.indexOf('m3_7_1') >= 0, A.nSecoes);
  ver('N1 cinco seções da inteligência operacional',
      ['m3_4_2','m3_4_3','m3_3_8','m3_3_9','m3_3_10'].every(id => A.ids.indexOf(id) >= 0)
        && A.nSecoes === 42,
      A.nSecoes + ' seções · faltando: '
        + ['m3_4_2','m3_4_3','m3_3_8','m3_3_9','m3_3_10'].filter(id => A.ids.indexOf(id) < 0).join(',')
        || 'nenhuma');
  ver('N1 só Mercado Agropecuário, Macro, Confinamento, Hedge e Estudos fixam universo',
      A.univ[0] === null && A.univ[1] === 'agro' && A.univ[2] === 'macro'
      && A.univ[3] === 'agro' && A.univ[4] === 'agro' && A.univ[5] === 'agro' && A.univ[6] === null,
      JSON.stringify(A.univ));

  /* ── N2 · Lar único ────────────────────────────────────────────────── */
  const B = await pg.evaluate(() => {
    const E = window._M3_ESTRUTURA || [];
    const porId = {};
    E.forEach(s => { (porId[s.id] = porId[s.id] || []).push(s.amb); });
    const emDois = Object.keys(porId).filter(k => porId[k].length > 1);
    /* Um botão de seção por seção, em todo o documento. Dois botões com o
       mesmo data-sec seriam a mesma tela em dois menus — exatamente o que a
       etapa proíbe. */
    const botoes = [...document.querySelectorAll('.m3-sec-btn[data-sec]')].map(x => x.getAttribute('data-sec'));
    const botoesDuplicados = botoes.filter((x,i) => botoes.indexOf(x) !== i);
    /* E um slot por seção: dois slots seriam dois lugares para o mesmo
       componente cair. */
    const slots = E.map(s => document.querySelectorAll('[id="slot_' + s.id + '"]').length);
    return { emDois, botoesDuplicados, slotsFora: slots.filter(n => n !== 1).length, nBotoes: botoes.length };
  });
  ver('N2 nenhuma seção pertence a dois grupos', B.emDois.length === 0, B.emDois.join(','));
  ver('N2 nenhum botão de seção aparece duas vezes', B.botoesDuplicados.length === 0, B.botoesDuplicados.join(','));
  ver('N2 um slot por seção', B.slotsFora === 0, B.slotsFora);

  /* ── N3 · Nada inacessível ─────────────────────────────────────────── */
  const C = await pg.evaluate(() => {
    const E = window._M3_ESTRUTURA || [];
    const semConteudo = [], semBotao = [], falhou = [];
    E.forEach(s => {
      const slot = document.getElementById('slot_' + s.id);
      if (!s.oculta && (!slot || !slot.children.length)) semConteudo.push(s.id);
      if (!s.oculta && !document.querySelector('.m3-sec-btn[data-sec="' + s.id + '"]')) semBotao.push(s.id);
      try { window.m3Ir(s.id); } catch(e){ falhou.push(s.id + ': ' + e.message); }
    });
    /* Painel do documento que não esteja dentro de um slot e AINDA TENHA
       CONTEÚDO é painel sem rota — foi assim que a Apresentação ficou
       perdida. As cascas vazias dos painéis antigos continuam no documento
       de propósito: a migração da Etapa 3 move os cards para fora e deixa
       para trás só os cabeçalhos estruturais, marcados `data-m3-cabecalho`
       e escondidos. Medido: 30 cards sobraram fora dos slots e os 30 são
       cabeçalhos — "ATIVOS & MERCADO", "① PREÇO E MOMENTO" e companhia.
       Reprovar por eles seria reprovar o rollback. */
    const paineis = [...document.querySelectorAll('[data-page-pane]')]
      .filter(p => !(p.closest && p.closest('.m3-slot')))
      .filter(p => {
        const vivos = [...p.querySelectorAll('section.card')]
          .filter(c => c.getAttribute('data-m3-cabecalho') !== '1').length;
        return vivos > 0 || p.querySelector('[id^="chart"]');
      })
      .map(p => p.id);
    const cardsFora = [...document.querySelectorAll('section.card')]
      .filter(c => !(c.closest && c.closest('.m3-slot')) && c.getAttribute('data-m3-cabecalho') !== '1').length;
    return { semConteudo, semBotao, falhou, paineisSemRota:paineis, cardsFora };
  });
  ver('N3 toda seção visível tem conteúdo', C.semConteudo.length === 0, C.semConteudo.join(','));
  ver('N3 toda seção visível tem botão no menu', C.semBotao.length === 0, C.semBotao.join(','));
  ver('N3 toda seção abre sem lançar', C.falhou.length === 0, C.falhou.join(' | '));
  ver('N3 nenhum painel ficou fora da navegação', C.paineisSemRota.length === 0, C.paineisSemRota.join(','));
  ver('N3 nenhum card solto fora dos slots', C.cardsFora === 0, C.cardsFora);

  /* ── N4 · Subgrupos ────────────────────────────────────────────────── */
  const D = await pg.evaluate(() => {
    const out = {};
    (window._M3_AMBIENTES || []).forEach(a => {
      const sn = document.getElementById('secnav_' + a.id);
      out[a.id] = sn ? {
        titulos: [...sn.querySelectorAll('.m3-men-t')].map(t => t.textContent),
        secs: [...sn.querySelectorAll('.m3-sec-btn[data-sec]')].length,
        /* Botão fora de subgrupo só conta se estiver VISÍVEL. Os três
           baldes "Outros" não entram em nenhum subgrupo e são escondidos
           pela regra de slot vazio — contá-los seria reprovar o balde por
           existir. */
        soltos: [...sn.children].filter(c => !c.classList.contains('m3-men-g')
                                          && c.style.display !== 'none').length
      } : null;
    });
    return out;
  });
  ver('N4 todo grupo tem ao menos um subgrupo',
      GRUPOS.every(g => D[g] && D[g].titulos.length >= 1),
      GRUPOS.filter(g => !D[g] || !D[g].titulos.length).join(','));
  /* ETAPA 5.1 — a expectativa mudou porque a ESPECIFICAÇÃO mudou: o
     pedido foi reorganizar Mercado Agropecuário em Boi gordo / Milho /
     Soja / Bezerro e boi magro / Futuros e relações de troca / Oferta e
     demanda (interno e externo). Em vez de contar colunas — que passaria
     com qualquer conjunto de sete —, o teste agora exige os rótulos, na
     ordem, e que milho e soja estejam alcançáveis direto do menu. */
  const AGRO_SUB = ['Boi gordo','Milho','Soja','Bezerro e boi magro',
                    'Futuros e relações de troca',
                    'Oferta e demanda — mercado interno',
                    'Oferta e demanda — mercado externo','Ver também'];
  ver('N4 Mercado Agropecuário tem os subgrupos da Etapa 5.1, na ordem',
      D.agro && JSON.stringify(D.agro.titulos.map(t => t.trim())) === JSON.stringify(AGRO_SUB),
      D.agro && D.agro.titulos.map(t => t.trim()).join(' / '));
  ver('N4 milho e soja têm entrada própria no menu de Mercado Agropecuário',
      D.agro && ['Milho','Soja'].every(r => D.agro.titulos.some(t => t.trim() === r)),
      D.agro && D.agro.titulos.join(' / '));
  ver('N4 Inteligência tem os quatro subgrupos e o Ver também',
      D.estudo && D.estudo.titulos.length === 5, D.estudo && D.estudo.titulos.join(' / '));
  ver('N4 nenhum botão solto fora de subgrupo',
      GRUPOS.every(g => !D[g] || D[g].soltos === 0),
      GRUPOS.map(g => g + ':' + (D[g] ? D[g].soltos : '-')).join(' '));

  /* ── N5 · Ver também ───────────────────────────────────────────────── */
  const E5 = await pg.evaluate(() => {
    const refs = [...document.querySelectorAll('[data-m3-ref]')].map(b => ({
      destino: b.getAttribute('data-m3-ref'),
      grupo: (b.closest('.m3-amb-secnav') || {}).id || '',
      texto: (b.textContent || '').replace(/\s+/g,' ').trim(),
      rotulo: b.getAttribute('aria-label') || ''
    }));
    const E = window._M3_ESTRUTURA || [];
    /* ETAPA 5.1 — DUAS NATUREZAS DE ATALHO, DUAS REGRAS.
       "Ver também" (`.m3-men-ref`) leva para FORA do grupo: apontar para
       dentro dele seria repetir o menu logo acima, e a regra original
       vale inteira.
       As colunas de contexto (`.m3-men-ctx` — Milho, Soja, Bezerro e boi
       magro) existem justamente para apontar para dentro: a curva do CCM
       mora em "Futuros", no mesmo grupo, e o que o atalho acrescenta é o
       ATIVO ou o ALVO certo. Então a regra aqui não é "não aponte para
       dentro", é mais dura: atalho interno SEM ativo e SEM alvo é
       duplicata, e reprova. */
    const refs2 = [...document.querySelectorAll('[data-m3-ref]')].map(b => ({
      destino: b.getAttribute('data-m3-ref'),
      grupo: (b.closest('.m3-amb-secnav') || {}).id || '',
      ctx: !!b.closest('.m3-men-ctx'),
      ativo: b.getAttribute('data-m3-ativo') || '',
      alvo: b.getAttribute('data-m3-alvo') || '',
      prod: b.getAttribute('data-m3-prod') || ''
    }));
    const interno = r => { const s = E.filter(x => x.id === r.destino)[0];
                           return s && ('secnav_' + s.amb) === r.grupo; };
    return { refs,
      mortos: refs.filter(r => !E.some(s => s.id === r.destino)).map(r => r.destino),
      redundantes: refs2.filter(r => !r.ctx && interno(r)).map(r => r.destino),
      ctxSemContexto: refs2.filter(r => r.ctx && interno(r)
                                     && !r.ativo && !r.alvo && !r.prod).map(r => r.destino),
      ctxQuantos: refs2.filter(r => r.ctx).length,
      ctxComAtivo: refs2.filter(r => r.ctx && r.ativo).map(r => r.destino + '[' + r.ativo + ']'),
      dizOnde: refs.every(r => / em \S/.test(r.texto)),
      temRotulo: refs.every(r => /abrir em \S/.test(r.rotulo || '')) };
  });
  ver('N5 há atalhos entre grupos', E5.refs.length >= 15, E5.refs.length);
  ver('N5 nenhum atalho aponta para seção inexistente', E5.mortos.length === 0, E5.mortos.join(','));
  ver('N5 nenhum "Ver também" aponta para o próprio grupo', E5.redundantes.length === 0, E5.redundantes.join(','));
  ver('N5 todo atalho de contexto para dentro do grupo carrega ativo, alvo ou produto',
      E5.ctxSemContexto.length === 0, E5.ctxSemContexto.join(','));
  ver('N5 as colunas de contexto existem e levam ativo quando precisam',
      E5.ctxQuantos >= 10 && E5.ctxComAtivo.length >= 4,
      E5.ctxQuantos + ' atalhos · com ativo: ' + E5.ctxComAtivo.join(' '));
  ver('N5 todo atalho diz em que grupo a seção mora', E5.dizOnde);
  ver('N5 e diz isso também para quem usa leitor de tela', E5.temRotulo);

  const navRef = await pg.evaluate(async () => {
    const b = document.querySelector('#secnav_agro [data-m3-ref="m3_2_1"]');
    if (!b) return { erro:'atalho não encontrado' };
    b.click();
    await new Promise(r => setTimeout(r, 1200));
    return { amb:(window._M3_AMB||{}).atual, sec:window._m3SecAtual };
  });
  ver('N5 o atalho leva ao grupo onde a seção mora',
      navRef.amb === 'estudo' && navRef.sec === 'm3_2_1', JSON.stringify(navRef));

  /* ── N6 · O grupo manda no universo ────────────────────────────────── */
  const F = [];
  for (const g of GRUPOS){
    await pg.evaluate(a => { try { window._m3IrAmbiente(a); } catch(e){} }, g);
    await pg.waitForTimeout(1300);
    F.push(await pg.evaluate(() => ({
      amb:(window._M3_AMB||{}).atual, sec:window._m3SecAtual,
      univ:document.body.getAttribute('data-m3-univ'),
      temSecao: !!(window._m3SecAtual && document.getElementById('sec_' + window._m3SecAtual)
                   && document.getElementById('sec_' + window._m3SecAtual).style.display !== 'none')
    })));
  }
  ver('N6 todo grupo abre numa seção', F.every(x => !!x.sec && x.temSecao),
      F.map(x => x.amb + ':' + (x.sec || 'VAZIO')).join(' '));
  ver('N6 Mercado Agropecuário liga o universo agro',
      F[1].univ === 'agro', F[1].univ);
  ver('N6 Mercados & Macro liga o universo macro', F[2].univ === 'macro', F[2].univ);
  ver('N6 Confinamento, Hedge e Estudos voltam ao agro',
      F[3].univ === 'agro' && F[4].univ === 'agro' && F[5].univ === 'agro',
      [F[3].univ,F[4].univ,F[5].univ].join(','));
  ver('N6 o seletor de universo saiu da barra',
      await pg.evaluate(() => { const u = document.getElementById('m3Univ');
        return !u || getComputedStyle(u).display === 'none'; }));

  /* ── N7 · Filtros preservados ──────────────────────────────────────── */
  await pg.evaluate(() => { try { window._m3IrAmbiente('agro'); } catch(e){} });
  await pg.waitForTimeout(1200);
  const escolheu = await pg.evaluate(async () => {
    const s = document.getElementById('sheetSelect');
    const op = [...s.options].find(o => /^BGI[FGHJKMNQUVXZ]\d{2}$/.test(o.value) && !o.hidden && !o.disabled);
    if (!op) return null;
    s.value = op.value; s.dispatchEvent(new Event('change', { bubbles:true }));
    await new Promise(r => setTimeout(r, 1500));
    const i = document.getElementById('startDate');
    if (i){ i.value = '2026-03-02'; i.dispatchEvent(new Event('change', { bubbles:true })); }
    await new Promise(r => setTimeout(r, 1500));
    return { ativo:s.value, ini:(document.getElementById('startDate')||{}).value };
  });
  if (!escolheu) ver('N7 há contrato BGI para escolher', false, 'nenhum contrato vigente no seletor');
  else {
    const depois = [];
    for (const g of ['estudo','hedge','confin','exec','agro']){
      await pg.evaluate(a => { try { window._m3IrAmbiente(a); } catch(e){} }, g);
      await pg.waitForTimeout(1200);
      depois.push(await pg.evaluate(() => ({
        ativo:(document.getElementById('sheetSelect')||{}).value,
        ini:(document.getElementById('startDate')||{}).value })));
    }
    ver('N7 o contrato sobrevive a cinco trocas de grupo',
        depois.every(x => x.ativo === escolheu.ativo), JSON.stringify(depois.map(x=>x.ativo)));
    ver('N7 a janela de datas sobrevive a cinco trocas de grupo',
        depois.every(x => x.ini === escolheu.ini), JSON.stringify(depois.map(x=>x.ini)));

    await pg.evaluate(() => { try { window._m3IrAmbiente('macro'); } catch(e){} });
    await pg.waitForTimeout(1500);
    const noMacro = await pg.evaluate(() => (document.getElementById('sheetSelect')||{}).value);
    await pg.evaluate(() => { try { window._m3IrAmbiente('agro'); } catch(e){} });
    await pg.waitForTimeout(1500);
    const devolta = await pg.evaluate(() => (document.getElementById('sheetSelect')||{}).value);
    ver('N7 no macro o ativo muda, como deve', noMacro !== escolheu.ativo, noMacro);
    ver('N7 voltando ao agro o contrato é devolvido', devolta === escolheu.ativo,
        devolta + ' esperado ' + escolheu.ativo);
  }

  /* ── N8 · Relatórios e arquivos ────────────────────────────────────── */
  await pg.evaluate(() => { try { window.m3Ir('m3_7_1'); } catch(e){} });
  await pg.waitForTimeout(1600);
  const G = await pg.evaluate(() => {
    const vis = el => { while(el){ const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden') return false; el = el.parentElement; } return true; };
    const itens = [...document.querySelectorAll('.rel-item')].map(el => ({
      alvo: el.getAttribute('data-rel-alvo'),
      existe: !!document.getElementById(el.getAttribute('data-rel-alvo')),
      indisponivel: el.classList.contains('rel-indisponivel') }));
    const p = document.getElementById('apresPptxBtn');
    return { itens, apresVisivel: p ? vis(p) : false,
             apresNoSlot: !!(p && p.closest('.m3-slot')),
             apresGerar: !!document.getElementById('apresGerarBtn'),
             apresPdf: !!document.getElementById('apresPrintBtn') };
  });
  ver('N8 a Apresentação finalmente aparece', G.apresVisivel);
  ver('N8 a Apresentação está dentro de uma seção', G.apresNoSlot);
  ver('N8 os três botões dela existem', G.apresGerar && G.apresPdf && !!G.itens.length);
  ver('N8 o hub lista as saídas', G.itens.length >= 6, G.itens.length);
  ver('N8 toda saída anunciada tem botão de verdade',
      G.itens.every(i => i.existe && !i.indisponivel),
      G.itens.filter(i => !i.existe).map(i => i.alvo).join(','));

  /* ── N9 · Cobertura e blocos ───────────────────────────────────────── */
  const H = await pg.evaluate(() => {
    let cob = null; try { cob = window._m3Cobertura(); } catch(e){ cob = { ok:false, motivo:String(e) }; }
    const blocos = [...document.querySelectorAll('.panel-block')].map(bl => ({
      cards: bl.querySelectorAll('section.card').length,
      ctrl: !!bl.querySelector('input,select,textarea,button,[id^="chart"],table'),
      oculto: bl.style.display === 'none',
      titulo: ((bl.querySelector('.panel-title')||{}).textContent || '').trim().slice(0,40) }));
    return { cob, blocos };
  });
  ver('N9 migração sem perda de componentes', H.cob && H.cob.ok,
      H.cob ? ('gráficos ' + H.cob.graficosAntes + ' → ' + H.cob.graficosDepois) : '');
  ver('N9 nenhum componente no balde "Outros"', H.cob && (H.cob.orfaos||[]).length === 0,
      H.cob && (H.cob.orfaos||[]).map(o => o.nome).join(', '));
  ver('N9 bloco de controles sem card deixou de ser escondido',
      H.blocos.filter(b => !b.cards && b.ctrl).every(b => !b.oculto),
      H.blocos.filter(b => !b.cards && b.ctrl && b.oculto).map(b => b.titulo).join(', '));
  ver('N9 cabeçalho solto sem conteúdo continua escondido',
      H.blocos.filter(b => !b.cards && !b.ctrl).every(b => b.oculto),
      H.blocos.filter(b => !b.cards && !b.ctrl && !b.oculto).map(b => b.titulo).join(', '));


  /* ══════════════════════════════════════════════════════════════════════
     ETAPA 5.1 — os quatro defeitos que esta etapa corrigiu
     ══════════════════════════════════════════════════════════════════════
     Cada bloco abaixo nasceu de uma falha MEDIDA no painel em execução, e
     está escrito para reprovar se ela voltar. */

  /* ── N11 · Navegar não troca o ativo sem motivo ────────────────────── */
  const selAtivo = async (v) => pg.evaluate(async val => {
    const u = window._m3UnivDoAtivo ? window._m3UnivDoAtivo(val) : null;
    if (u && document.body.getAttribute('data-m3-univ') !== u) window._m3IrUniverso(u);
    const sel = document.getElementById('sheetSelect');
    const o = [...sel.options].find(x => x.value === val);
    if (o && !o.hidden && !o.disabled){ sel.value = val; sel.dispatchEvent(new Event('change',{bubbles:true})); }
    await new Promise(r => setTimeout(r, 1500));
    return sel.value;
  }, v);
  const estado = () => pg.evaluate(() => {
    const av = document.getElementById('m3AvisoUniv');
    return { ativo:(document.getElementById('sheetSelect')||{}).value,
             univ:document.body.getAttribute('data-m3-univ'),
             sec:window._m3SecAtual, amb:(window._M3_AMB||{}).atual,
             ini:(document.getElementById('startDate')||{}).value,
             aviso: !!(av && av.style.display !== 'none') };
  });
  /* Os oito cenários do pedido, na letra: ativo selecionado, análise de
     destino, e a exigência de que o contrato sobreviva à viagem. */
  const CENARIOS = [
    ['DOLX26','m3_1_2t','DOL → Indicadores técnicos'],
    ['DI1F27','m3_1_2', 'DI1 → Estudos estatísticos'],
    ['ETHZ26','m3_1_2', 'ETH → Análise de preços'],
    ['BGIZ26','m3_0_1', 'BGI → Visão Executiva'],
    ['CCMX26','m3_1_2', 'CCM → Inteligência'],
    ['SJCX26','m3_1_2', 'SJC → Inteligência'],
    ['DOLX26','m3_2_9', 'Macro → Visão Executiva → Macro'],
    ['BGIZ26','m3_3_5g','Agro → Hedge e Risco']
  ];
  for (const [ativo, sec, nome] of CENARIOS){
    const posto = await selAtivo(ativo);
    if (posto !== ativo){ ver('N11 ' + nome, false, 'não consegui selecionar ' + ativo); continue; }
    const a0 = await estado();
    await pg.evaluate(async x => { window.m3Ir(x); await new Promise(r => setTimeout(r, 1400)); }, sec);
    const a1 = await estado();
    ver('N11 ' + nome,
        a1.ativo === ativo && a1.sec === sec && a1.ini === a0.ini && !a1.aviso,
        a0.ativo + ' → ' + a1.ativo + ' · seção ' + a1.sec + ' · universo ' + a1.univ
          + ' · janela ' + (a0.ini === a1.ini ? 'intacta' : 'MUDOU') + ' · aviso ' + a1.aviso);
  }

  /* ── N12 · Quando a troca é inevitável, ela é anunciada ───────────── */
  await selAtivo('DOLX26');
  const t0 = await estado();
  await pg.evaluate(async () => { window.m3Ir('m3_1_3'); await new Promise(r => setTimeout(r, 1600)); });
  const t1 = await estado();
  const txtAviso = await pg.evaluate(() => {
    const a = document.getElementById('m3AvisoUniv');
    return a ? (a.textContent || '').replace(/\s+/g,' ').trim() : ''; });
  ver('N12 destino que não analisa o ativo troca o universo', t1.univ === 'agro' && t1.ativo !== t0.ativo,
      t0.ativo + '/' + t0.univ + ' → ' + t1.ativo + '/' + t1.univ);
  ver('N12 e avisa na tela, dizendo as duas pontas', t1.aviso
      && txtAviso.includes(t0.ativo) && txtAviso.includes(t1.ativo), txtAviso.slice(0,110));
  /* Navegação seguinte que não troca nada limpa o aviso: ele fala do salto
     que acabou de acontecer, não é um estado pendente. */
  await pg.evaluate(async () => { window.m3Ir('m3_1_4'); await new Promise(r => setTimeout(r, 1300)); });
  ver('N12 o aviso some na navegação seguinte', !(await estado()).aviso);

  /* ── N13 · Memória de ativo por universo ──────────────────────────── */
  await selAtivo('BGIZ26');
  await pg.evaluate(async () => { window._m3IrAmbiente('macro'); await new Promise(r => setTimeout(r, 1400)); });
  await selAtivo('DOLX26');
  await pg.evaluate(async () => { window._m3IrAmbiente('agro'); await new Promise(r => setTimeout(r, 1600)); });
  const volta = await estado();
  ver('N13 voltar ao grupo agro devolve o contrato que estava lá',
      volta.ativo === 'BGIZ26' && volta.univ === 'agro', volta.ativo + '/' + volta.univ);

  /* ── N14 · A busca alcança o que nasce depois ─────────────────────── */
  const busca = await pg.evaluate(async () => {
    window.m3Ir('m3_7_1');
    await new Promise(r => setTimeout(r, 1600));
    const q = t => (window._m3Buscar ? window._m3Buscar(t) : []);
    const r = {};
    ['saidas','apresentacao','pptx','calculadora','comex','exportacao'].forEach(t => {
      r[t] = q(t).map(x => ({ nome:x.nome, sec:x.sec, id:x.id }));
    });
    r.total = (window._M3_INDICE || []).length;
    /* Todo resultado precisa apontar para uma seção que existe e para um
       elemento que existe: resultado que não abre nada é pior que nenhum. */
    const todos = (window._M3_INDICE || []);
    const E = window._M3_ESTRUTURA || [];
    r.secInvalida = todos.filter(e => !E.some(s => s.id === e.sec)).map(e => e.sec);
    r.idInvalido  = todos.filter(e => !document.getElementById(e.id)).map(e => e.id);
    return r;
  });
  ver('N14 a busca encontra o hub de saídas, que é montado em tempo de execução',
      busca.saidas.length > 0, JSON.stringify(busca.saidas));
  ver('N14 e a Apresentação, que é painel sem card',
      busca.apresentacao.length > 0, JSON.stringify(busca.apresentacao));
  ver('N14 e a Calculadora do Boi, que é painel sem card e sem bloco',
      busca.calculadora.some(x => x.sec === 'm3_4_1'), JSON.stringify(busca.calculadora));
  ver('N14 "comex" chega ao comércio exterior', busca.comex.some(x => x.sec === 'm3_1_6'),
      JSON.stringify(busca.comex));
  ver('N14 "pptx" chega à geração de arquivo, não ao comércio exterior',
      busca.pptx.length > 0 && busca.pptx.every(x => x.sec === 'm3_7_1'), JSON.stringify(busca.pptx));
  ver('N14 todo resultado aponta para seção existente', busca.secInvalida.length === 0,
      busca.secInvalida.join(','));
  ver('N14 todo resultado aponta para um elemento que existe', busca.idInvalido.length === 0,
      busca.idInvalido.slice(0,5).join(','));
  /* E o resultado ABRE o destino — não basta constar no índice. */
  const abriu = await pg.evaluate(async () => {
    const r = window._m3Buscar('apresentacao')[0];
    if (!r) return { erro:'sem resultado' };
    window.m3IrAlvo(r.sec, r.id);
    await new Promise(x => setTimeout(x, 1500));
    const el = document.getElementById(r.id);
    return { sec:window._m3SecAtual, esperada:r.sec, visivel: !!el && el.offsetParent !== null };
  });
  ver('N14 clicar no resultado abre a seção e deixa o alvo visível',
      abriu.sec === abriu.esperada && abriu.visivel, JSON.stringify(abriu));

  /* ── N15 · Mercado externo é comércio exterior ────────────────────── */
  const ext = await pg.evaluate(async () => {
    const G = window._M3_GRUPOS_MENU || {};
    const sub = (G.agro || []).filter(x => /mercado externo/i.test(x.rot))[0];
    window.m3Ir('m3_1_6');
    await new Promise(r => setTimeout(r, 1600));
    const comex = {};
    for (const prod of ['boi','milho','soja']){
      try { if (window.switchExpSubTab) window.switchExpSubTab(prod); } catch(e){}
      await new Promise(r => setTimeout(r, 800));
      comex[prod] = [...document.querySelectorAll('[id^="exp_' + prod + '_chart"]')]
        .filter(d => d.data && d.data.length).length;
    }
    /* Relatórios e Arquivos não pode ter recebido indicador de COMEX. */
    const rel = document.getElementById('slot_m3_7_1');
    return { subExterno: sub ? sub.secs : null,
             cards: document.querySelectorAll('#slot_m3_1_6 section.card').length,
             comex,
             comexEmRelatorios: rel ? rel.querySelectorAll('[id^="exp_"]').length : -1 };
  });
  ver('N15 Mercado externo é subgrupo de Oferta e demanda e contém m3_1_6',
      ext.subExterno && ext.subExterno.length === 1 && ext.subExterno[0] === 'm3_1_6',
      JSON.stringify(ext.subExterno));
  ver('N15 os indicadores de comércio exterior continuam desenhando para os três produtos',
      ['boi','milho','soja'].every(p => ext.comex[p] >= 8), JSON.stringify(ext.comex));
  ver('N15 Relatórios e Arquivos não recebeu indicador de COMEX',
      ext.comexEmRelatorios === 0, String(ext.comexEmRelatorios));

  /* ── N16 · A Apresentação gera os slides de verdade ───────────────── */
  const apres = await pg.evaluate(async () => {
    window.m3Ir('m3_7_1');
    await new Promise(r => setTimeout(r, 1500));
    /* Conta quantas vezes a geração roda por clique: dois manipuladores no
       mesmo botão faziam a segunda geração zerar `_apresCharts` embaixo do
       PPTX, e o operador ficava com "pronto" na tela e nada na pasta. */
    let n = 0; const o = window._apresGerar;
    window._apresGerar = function(){ n++; return o.apply(this, arguments); };
    if (window._apresInit) window._apresInit();
    const chips = [...document.querySelectorAll('#apresContractList .apres-contract-chip')];
    chips.slice(0,1).forEach(c => c.click());
    document.getElementById('apresGerarBtn').click();
    for (let i=0;i<60;i++){ await new Promise(r => setTimeout(r, 1000));
      if (/pronto/.test((document.getElementById('apresStatus')||{}).textContent||'')) break; }
    await new Promise(r => setTimeout(r, 1500));
    window._apresGerar = o;
    const wraps = [...document.querySelectorAll('.apres-chart-wrap')];
    return { geracoesPorClique:n, chips:chips.length,
             slides: document.querySelectorAll('.apres-slide').length,
             wraps: wraps.length,
             desenhados: wraps.filter(w => w.data && w.data.length).length,
             comAltura: wraps.filter(w => w.style.height).length,
             semNaN: !/NaN|undefined/.test(document.getElementById('apresSlides').textContent||''),
             status: (document.getElementById('apresStatus')||{}).textContent };
  });
  ver('N16 um clique em Gerar roda a geração uma vez', apres.geracoesPorClique === 1,
      String(apres.geracoesPorClique));
  ver('N16 a lista de contratos BGI é montada', apres.chips >= 5, String(apres.chips));
  ver('N16 cinco slides por contrato, com status de pronto',
      apres.slides === 5 && /pronto/.test(apres.status || ''),
      apres.slides + ' slides · ' + apres.status);
  ver('N16 todo contêiner de gráfico do slide recebeu altura e desenhou',
      apres.wraps > 0 && apres.comAltura === apres.wraps && apres.desenhados === apres.wraps,
      apres.desenhados + '/' + apres.wraps + ' desenhados · ' + apres.comAltura + ' com altura');
  ver('N16 nenhum "NaN" ou "undefined" no texto dos slides', apres.semNaN);

  /* ── N10 · Os endereços antigos continuam valendo ──────────────────── */
  const I = await pg.evaluate(() => {
    const E = window._M3_ESTRUTURA || [];
    const alvos = [...document.querySelectorAll('#slot_m3_0_1 [data-ve-sec]')]
      .map(b => ({ sec:b.getAttribute('data-ve-sec'), alvo:b.getAttribute('data-ve-alvo') }));
    return { nAtalhos:alvos.length,
      secsInvalidas: alvos.filter(a => !E.some(s => s.id === a.sec)).map(a => a.sec),
      alvosInvalidos: alvos.filter(a => a.alvo && !document.getElementById(a.alvo)).map(a => a.alvo) };
  });
  ver('N10 os atalhos da Visão Executiva ainda apontam para seções existentes',
      I.secsInvalidas.length === 0, I.secsInvalidas.join(','));
  ver('N10 e para alvos que existem no documento',
      I.alvosInvalidos.length === 0, I.alvosInvalidos.join(','));
  ver('N10 console limpo durante toda a navegação', erros.length === 0, erros.slice(0,3).join(' | '));

  await b.close();
  console.log('');
  console.log('NAVEGAÇÃO — Etapas 5 e 5.1');
  ok.forEach(x => console.log('  ok      ' + x.nome));
  falhas.forEach(x => console.log('  FALHOU  ' + x.nome + (x.detalhe ? ' — ' + x.detalhe : '')));
  console.log('  ' + ok.length + ' passaram' + (falhas.length ? ', ' + falhas.length + ' FALHARAM' : ''));
  console.log('');
  process.exit(falhas.length ? 1 : 0);
})().catch(e => { console.error('QUEBROU:', e.message); process.exit(2); });
