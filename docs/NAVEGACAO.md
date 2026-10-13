# Navegação do Radar — Etapas 5 e 5.1

*Radar Diário de Commodities · BMS AgroBrasil · 13/10/2026*

Sete grupos no lugar de três ambientes, com subgrupos dentro do menu de cada
um. **Nenhum ID de seção mudou**: `m3IrAlvo`, os roteiros de decisão, os
atalhos da Visão Executiva e qualquer link salvo continuam chegando ao mesmo
lugar. O que mudou foi o endereço de cada seção no menu.

A Etapa 5.1 não refez nada disto. Ela corrigiu quatro defeitos medidos no
painel em execução e deixou a estrutura de pé: os sete grupos, os IDs das
seções, os cards, os contêineres de gráfico e os recursos existentes.

**Inventário antes e depois da Etapa 5.1**, medido pelo mesmo método, no mesmo
ponto do ciclo de vida, com o index da Etapa 5 reconstruído à parte para a
comparação (`tools/build_e5_ref.py`, que reproduz o arquivo da Etapa 5 byte a
byte — sha256 `703071fdedab3392…`):

| Métrica | Etapa 5 | Etapa 5.1 |
|---|---|---|
| `section.card` no documento | 197 | **197** |
| contêineres `[id^="chart"]` | 211 | **211** |
| seções montadas | 37 | **37** |
| botões de seção | 37 | **37** |
| botões visíveis no universo agro | 31 | **31** |
| blocos de painel (ocultos) | 9 (6) | **9 (6)** |
| migração: gráficos antes → depois | 208 → 208 | **208 → 208** |
| órfãos no balde "Outros" | 0 | **0** |
| entradas no índice da busca | 157 | **160** |

A única diferença é o índice da busca, que **cresceu**: era o defeito nº 2.

---

## 1. As três regras

**Lar único.** Cada seção pertence a um grupo e só a um. Nenhuma seção aparece
em dois menus, nenhum componente foi copiado, nenhum cálculo foi duplicado.

**Ver também.** Onde um grupo precisa de algo que mora em outro, o menu traz um
atalho nomeado — abaixo de uma linha tracejada, dizendo **em que grupo** a
seção mora. Clicar leva até lá. O operador sai sabendo o endereço, que é o
contrário de encontrar a mesma tela duas vezes sem entender por quê.

**O grupo manda no universo.** Entrar em *Mercado Agropecuário* liga o universo
agro; entrar em *Mercados & Macro* liga o macro. O seletor de universo saiu da
barra: ele pedia a mesma decisão duas vezes, em dois lugares, com chance de
discordarem — e com "Mercado Agropecuário" aberto e o universo em macro a tela
ficava sem seção nenhuma e sem explicação. *Confinamento*, *Hedge e Risco* e
*Inteligência* também fixam o agro; *Visão Executiva* e *Relatórios* servem aos
dois e não mexem no que estiver ligado.

---

## 2. Onde cada funcionalidade está agora

### VISÃO EXECUTIVA

| Seção | Onde estava | Subgrupo agora | Cards |
|---|---|---|---|
| Visão Executiva <br><code>m3_0_1</code> | VISÃO EXECUTIVA | Panorama | 10 |
| Resumo do dia <br><code>m3_1_1</code> | MERCADO › Leitura rápida | Panorama | 13 |

### MERCADO AGROPECUÁRIO  ·  universo **agro** *(reorganizado na Etapa 5.1)*

| Seção | Onde estava | Subgrupo agora | Cards |
|---|---|---|---|
| Boi — mercado físico <br><code>m3_1_3</code> | MERCADO › Físico & demanda | Boi gordo | 6 |
| Regional <br><code>m3_1_4</code> | MERCADO › Físico & demanda | Boi gordo | 5 |
| Futuros <br><code>m3_1_8</code> | MERCADO › Curva | Futuros e relações de troca | 3 |
| Relações de troca & reposição <br><code>m3_2_8</code> | ESTUDO › Relações | Futuros e relações de troca | 7 |
| Demanda doméstica — atacado <br><code>m3_1_5</code> | MERCADO › Físico & demanda | Oferta e demanda — mercado interno | 16 |
| Oferta imediata × demanda <br><code>m3_1_7</code> | MERCADO › Físico & demanda | Oferta e demanda — mercado interno | 2 |
| Demanda externa — exportação (COMEX) <br><code>m3_1_6</code> | MERCADO › Físico & demanda | **Oferta e demanda — mercado externo** | 2 → 52 |
| Outros — mercado *(balde oculto)* <br><code>m3_1_9</code> | MERCADO › (oculta) | (sem subgrupo) | 0 |

`m3_2_8` saiu de debaixo do rótulo "Bezerro e boi magro": ela responde boi ×
bezerro, boi × boi magro **e** boi × milho, e anunciá-la só como reposição
escondia metade do que ela faz. Bezerro e boi magro continuam no menu, como
coluna de atalho — a seção é a mesma.

Os 2 cards de `m3_1_6` são os de partida; abrir a seção e passar pelos três
produtos leva o slot a **52 cards**, porque as sub-abas de carne, milho e soja
são montadas sob demanda. Nada ali foi removido, substituído ou recalculado.

**Três colunas de atalho**, montadas por `_m3MontaVerTambem`, dão endereço
direto no menu a quem procura por produto. São endereços para onde a análise
**já mora** — nenhuma série, indicador, cálculo ou componente foi duplicado:

| Coluna | Leva para | Com |
|---|---|---|
| **Milho** | Preço e momento (`m3_1_2`) | ativo `MILHO - CEPEA` |
| | Curva CCM e relação de troca (`m3_1_8`) | primeiro CCM vigente + `chartRatioBGICCM` |
| | Histórico e sazonalidade (`m3_2_3`) | `chartSHMilhoDaily` |
| | Exportações de milho (`m3_1_6`) | sub-aba `milho` |
| **Soja** | Preço e momento (`m3_1_2`) | ativo `SOJA - PARANAGUÁ` |
| | Curva de contratos SJC (`m3_1_8`) | primeiro SJC vigente |
| | Histórico e variação (`m3_2_3`) | `chartCurvaVarSJC` |
| | Exportações de soja (`m3_1_6`) | sub-aba `soja` |
| **Bezerro e boi magro** | Quantos bezerros paga um boi (`m3_2_8`) | `chartBezBoiTroca` |
| | Boi gordo × boi magro (`m3_2_8`) | `chartBoiMagroTroca` |
| | Histórico e sazonalidade (`m3_2_2`) | — |
| | Ciclo do bezerro (`m3_2_7`) | — |

O vencimento do CCM e do SJC **não está escrito na tabela**: é resolvido em
tempo de execução pelo primeiro vigente (`_veMotor.primeiroVigente`). Fixar um
contrato no código seria escrever uma data de validade nele.

### MERCADOS & MACRO  ·  universo **macro**

| Seção | Onde estava | Subgrupo agora | Cards |
|---|---|---|---|
| Macro e moeda <br><code>m3_2_9</code> | ESTUDO › Relações | Câmbio e juros | 7 |
| Açúcar <br><code>m3_2_4</code> | ESTUDO › Histórico | Energia e açúcar | 6 |
| Etanol <br><code>m3_2_5</code> | ESTUDO › Histórico | Energia e açúcar | 6 |

### CONFINAMENTO  ·  universo **agro**

| Seção | Onde estava | Subgrupo agora | Cards |
|---|---|---|---|
| Calculadora do Boi <br><code>m3_4_1</code> | **não existia** | Custo e margem | 0 |
| Compro boi magro? <br><code>m3_3_2</code> | DECISÃO › Compra / venda | Reposição e logística | 3 |
| Compro bezerro? <br><code>m3_3_3</code> | DECISÃO › Compra / venda | Decisões de compra | 1 |
| Compro milho? <br><code>m3_3_4</code> | DECISÃO › Compra / venda | Decisões de compra | 1 |

### HEDGE E RISCO  ·  universo **agro**

| Seção | Onde estava | Subgrupo agora | Cards |
|---|---|---|---|
| Tenho boi — vendo ou seguro? <br><code>m3_3_1</code> | DECISÃO › Compra / venda | Diagnóstico | 1 |
| Travar boi — diagnóstico <br><code>m3_3_5a</code> | DECISÃO › Hedge | Diagnóstico | 1 |
| Travar boi — escolha do vencimento <br><code>m3_3_5b</code> | DECISÃO › Hedge | Escolha e timing | 4 |
| Travar boi — timing <br><code>m3_3_5c</code> | DECISÃO › Hedge | Escolha e timing | 5 |
| Travar boi — a decisão econômica <br><code>m3_3_5d</code> | DECISÃO › Hedge | Escolha e timing | 1 |
| Travar boi — validação histórica <br><code>m3_3_5e</code> | DECISÃO › Hedge | Escolha e timing | 4 |
| Depois da trava <br><code>m3_3_5f</code> | DECISÃO › Hedge | Posição e instrumentos | 1 |
| Opções — cadeia e seguro de preço <br><code>m3_3_5g</code> | DECISÃO › Ferramentas | Posição e instrumentos | 1 |
| Simulador de hedge <br><code>m3_3_6</code> | DECISÃO › Ferramentas (com a Calculadora) | Posição e instrumentos | 4 |
| Outros — decisão *(balde oculto)* <br><code>m3_3_7</code> | DECISÃO › (oculta) | (sem subgrupo) | 0 |

### INTELIGÊNCIA E ESTUDOS  ·  universo **agro**

| Seção | Onde estava | Subgrupo agora | Cards |
|---|---|---|---|
| Preço e momento <br><code>m3_1_2</code> | MERCADO › Leitura rápida | Estatística e técnicos | 10 |
| Indicadores técnicos de trading <br><code>m3_1_2t</code> | MERCADO › Leitura rápida | Estatística e técnicos | 3 |
| Histórico e sazonalidade — boi <br><code>m3_2_1</code> | ESTUDO › Histórico | Séries históricas e sazonalidade | 9 |
| Histórico e sazonalidade — bezerro <br><code>m3_2_2</code> | ESTUDO › Histórico | Séries históricas e sazonalidade | 11 |
| Histórico e sazonalidade — grãos <br><code>m3_2_3</code> | ESTUDO › Histórico | Séries históricas e sazonalidade | 12 |
| Ciclo pecuário <br><code>m3_2_6</code> | ESTUDO › Ciclos | Ciclos e projeção | 7 |
| Ciclo do bezerro <br><code>m3_2_7</code> | ESTUDO › Ciclos | Ciclos e projeção | 2 |
| Estudo da cadeia <br><code>m3_2_10</code> | ESTUDO › Relações | Estrutura da cadeia | 3 |
| Outros — estudo *(balde oculto)* <br><code>m3_2_11</code> | ESTUDO › (oculta) | (sem subgrupo) | 0 |

### RELATÓRIOS E ARQUIVOS  ·  **só geração de arquivo**

| Seção | Onde estava | Subgrupo agora | Cards |
|---|---|---|---|
| Relatórios e arquivos <br><code>m3_7_1</code> | **não existia** | Saídas | 1 + a Apresentação |

**Exportação de arquivo não se confunde com exportação de commodity.** O
comércio exterior — carne, milho e soja vendidos ao exterior, com volumes,
valores, preços médios, países de destino, séries históricas, indicadores COMEX
e comparativos anuais e mensais — mora em *Mercado Agropecuário › Oferta e
demanda › Mercado externo* (`m3_1_6`) e **nunca passou por aqui**. Conferido:
`slot_m3_7_1` tem **zero** elementos `[id^="exp_"]`, e há teste (N15) que
reprova se algum aparecer.

Este grupo contém apenas o que já existia no painel:

| Saída | O que produz | Mora em | Botão |
|---|---|---|---|
| Apresentação de contratos futuros | slides · PPTX · PDF | aqui (`m3_7_1`) | `apresGerarBtn` · `apresPptxBtn` · `apresPrintBtn` |
| Alertas no período | imagem A4 | `m3_3_5c` | `btnAlertasPNG` |
| Top 5 — níveis de execução | imagem A4 | `m3_3_5c` | `btnTop10PNG` |
| Matriz de contratos | imagem A4 | `m3_3_5a` | `btnMBMatrixExport` |
| Calculadora do Boi — resultado | imagem 9×16 | `m3_4_1` | `bmsExportResultBtn` |
| Calculadora do Boi — DRE | imagem 9×16 | `m3_4_1` | `bmsExportDreBtn` |

O card "SAÍDAS DISPONÍVEIS" não gera arquivo: ele diz o que cada saída produz e
leva até o botão, e marca como indisponível o que não estiver na página na
sessão. O conteúdo exportado é sempre o da tela de origem, com os filtros que
estiverem valendo lá.

---

## 3. O que mudou de verdade

### Duas seções novas

| Seção | O que recebeu | Por quê |
|---|---|---|
| `m3_4_1` **Calculadora do Boi** | o painel `pagePaneMargem` | Dividia a antiga "Ferramentas" com o Simulador de Hedge. Custo de produção e dimensionamento de trava respondem a perguntas diferentes, e agora moram em grupos diferentes. |
| `m3_7_1` **Relatórios e arquivos** | o painel `pagePaneApresentacao` + o índice das saídas | A Apresentação **estava inalcançável** (ver abaixo). |

### Um recurso resgatado

O painel **Apresentação de Contratos Futuros** — Gerar Slides, Exportar PPTX,
PDF — estava no documento e **sem rota**. Ele ficou fora da migração da Etapa 3
por ser "um modo com comutador próprio", mas o único comutador que o abria era
a barra antiga, que a mesma etapa escondeu.

Medido antes da correção: percorrendo as 35 seções pela navegação, o painel
nunca aparecia; `apresPptxBtn` existia no documento e nunca ficava visível.

Corrigir o endereço não bastou — ele apareceu na seção e continuou invisível,
por um segundo defeito: `_m3LimpaOrfaos` escondia todo `.panel-block` sem
nenhum `section.card` visível. A regra nasceu para apagar cabeçalhos que
perderam os cards na migração, e para esses está certa; só que ela tratava
"zero card" como sinônimo de "vazio", e um painel de **controles** nunca teve
card nenhum. A outra chamada que faz a mesma pergunta já pulava blocos sem card
— as duas discordavam, e a certa é a que não confunde ausência de card com
ausência de conteúdo.

Medido depois: dos 9 `.panel-block` do painel, quatro não têm card. Um tem
controles — a Apresentação, que passa a aparecer. Os outros três são cabeçalhos
puros ("Relações de Preço & Diferenciais", "Base e Resultado da Trava",
"Painel Operacional") e continuam escondidos, pelo mesmo caminho de antes.

### Memória de ativo por universo

Trocar de universo troca a lista de ativos, e o seletor caía no primeiro da
lista nova. Quem estava em BGIZ26, passava pelo macro para ver o dólar e
voltava, era devolvido a BOI GORDO. Agora o painel guarda o último ativo de
cada universo e o devolve ao voltar — se ele ainda estiver disponível.

---

## 4. Agro e Macro: o universo do grupo é reserva, não ordem

*Corrigido na Etapa 5.1 — era o defeito nº 1.*

Na Etapa 5, entrar num grupo **trocava** o universo sempre que o grupo
declarasse um diferente do que estava ligado. Medido no painel: com `DOLX26`
selecionado, abrir *Indicadores técnicos* devolvia `BOI GORDO`. O mesmo com
`DI1F27` e com `ETHZ26`. E "Preço e momento" e "Indicadores técnicos" analisam
**o ativo que estiver selecionado**, qualquer que seja ele — trocar ali não era
filtrar, era descartar a escolha que o operador acabou de fazer.

A regra agora tem dois casos, e os dois estão em `_m3IrAmbiente(amb, secAlvo)`:

| Como você chegou | Quando o universo troca |
|---|---|
| **Com seção de destino** (`m3Ir`, `m3IrAlvo`, busca, roteiro, atalho) | só se **aquela seção** pertencer ao outro universo em `_M3_SEC_UNIV`. Quem decide é o destino pedido, não o grupo onde ele mora. |
| **Sem seção de destino** (clique no botão do grupo) | só se **nada do grupo** aparecer no universo ligado — que era o defeito original da Etapa 5: grupo aberto e tela vazia. |

E **quando a troca acontece, ela é anunciada**: uma linha abaixo da trilha
(`#m3AvisoUniv`) diz qual análise exige o outro universo, de que ativo para
qual o seletor foi, e que o anterior fica guardado. O aviso só aparece se o
ativo **realmente** mudou — quando a memória por universo devolve o mesmo
contrato, não houve perda a explicar. Ele some na navegação seguinte.

**Em nenhum caminho um contrato de dólar é substituído por boi gordo em
silêncio.** Há oito testes (N11) que reprovam isso, um por cenário.

Duas marcas de universo foram corrigidas junto, porque a regra de reserva
pergunta "alguma seção deste grupo serve o universo atual?" e a resposta tem de
ser verdadeira:

| Seção | Era | É | Por quê |
|---|---|---|---|
| `m3_1_8` Futuros | *(sem marca = serve aos dois)* | **agro** | desenha boi físico × BGI, relação BGI/CCM e carrego do BGI |
| `m3_3_5g` Opções | *(sem marca)* | **agro** | cadeia de opções de BGI |
| `m3_3_6` Ferramentas | *(sem marca)* | **agro** | o Simulador de Hedge dimensiona BGI, CCM e SOJA |

### Filtros ao navegar

| Situação | O que acontece |
|---|---|
| Trocar de grupo dentro do mesmo universo | contrato e janela **intactos** |
| Ir a uma análise que aceita o ativo ligado | contrato, vencimento e janela **intactos**, mesmo atravessando grupos de universo diferente |
| Ir a uma análise que **não** aceita o ativo | o universo troca, o ativo do universo de destino é devolvido e **a tela avisa** |
| Voltar ao grupo de origem | o contrato anterior é **devolvido** (`_M3_ULT_ATIVO`, memória por universo) |

A janela de datas acompanha o ativo quando o ativo muda, que é o comportamento
que o painel já tinha. Quando o ativo não muda, a janela não muda — conferido
nos oito cenários.

**Uma fonte de verdade só.** `m3IrAlvo` tinha a sua própria cópia da regra
("se a seção é do outro universo, troca") e `_m3IrAmbiente` tinha outra, mais
forte, que rodava depois e desfazia o resultado. A da `m3IrAlvo` saiu: decide
`_m3IrAmbiente`, que recebe a seção de destino.

---

## 5. Atalhos entre grupos

| Grupo | Leva para |
|---|---|
| Mercado Agropecuário | Histórico do boi, do bezerro e dos grãos · Preço e momento · Base do contrato |
| Mercados & Macro | Preço e momento · Indicadores técnicos |
| Confinamento | Travar boi — a decisão econômica · Relações de troca · Visão Executiva |
| Hedge e Risco | Calculadora do Boi · Futuros · Visão Executiva |
| Inteligência e Estudos | Boi — mercado físico · Futuros · Relações de troca |
| Relatórios e Arquivos | Resumo do dia · Calculadora do Boi · Diagnóstico · Timing |

**Duas naturezas de atalho, duas regras** (Etapa 5.1):

- **"Ver também"** (`.m3-men-ref`) leva para **fora** do grupo. Apontar para
  dentro dele seria repetição do menu logo acima, e há teste que reprova.
- **Colunas de contexto** (`.m3-men-ctx` — Milho, Soja, Bezerro e boi magro)
  existem justamente para apontar **para dentro**: a curva do CCM mora em
  *Futuros*, no mesmo grupo, e o que o atalho acrescenta é o **ativo** ou o
  **alvo** certo. A regra aqui é mais dura, não mais fraca: atalho interno sem
  ativo, sem alvo e sem produto é duplicata, e o teste reprova.

Atalho para seção inexistente reprova nos dois casos.

---

## 6. Como achar qualquer coisa

Três caminhos, nesta ordem de esforço:

1. **A busca da barra** (`Buscar análise…`) encontra qualquer card pelo nome,
   em qualquer grupo, e leva direto até ele.
2. **O menu do grupo**, com os subgrupos nomeados.
3. **Esta tabela**, na seção 2.

### O que a Etapa 5.1 corrigiu na busca *(defeito nº 2)*

O índice era montado **uma vez**, no arranque, e quem nascia depois ficava de
fora para sempre. Medido: 154 entradas, e buscar `saídas` ou `apresentação`
devolvia **zero resultado** — o card "SAÍDAS DISPONÍVEIS" de Relatórios é
montado quando a tela é aberta, e o painel da Apresentação não tem
`section.card` nenhum. A ferramenta de busca **não foi substituída**; ela
ganhou três coisas:

| Correção | O que resolve |
|---|---|
| **Impressão do índice** — conta cards e blocos de painel; se a conta mudou, remonta na próxima consulta | cards construídos em tempo de execução entram sozinhos |
| **Painel sem card** — indexa `.panel-block` com `.panel-title` que não contenha card | a Apresentação de Contratos Futuros passa a ser encontrável |
| **Piso por seção** — seção que não contribuiu com nenhum card entra pelo nome e pela dica | a Calculadora do Boi (`m3_4_1`) e a matriz de contratos (`m3_3_5a`) são painéis de marcação própria, com **zero** `section.card`: eram invisíveis à busca |

O piso é piso, não duplicata: assim que os cards de uma seção aparecem, a
impressão muda, o índice remonta e a entrada de seção sai de cena. Seções
ocultas (os três baldes "Outros") ficam fora — resultado que não abre nada é
pior que nenhum.

Três apelidos entraram na tabela `_M3_ALIAS`, que já existia:

- **`comex`**, `comércio exterior`, `país de destino`, `carne bovina` → os
  cards de exportação (`m3_1_6`). Nenhum título de card tem a palavra "COMEX";
  é como o operador chama o módulo.
- **`pdf`**, `pptx`, `powerpoint`, `imagem`, `slides` → o hub de saídas e a
  Apresentação (`m3_7_1`). **Nada aqui tem relação com comércio exterior**, e a
  separação é proposital: há teste (N14) que reprova se `pptx` cair em
  `m3_1_6`, ou se `comex` cair em `m3_7_1`.
- **`calculadora`**, `breakeven`, `break-even`, `dre` → a Calculadora do Boi.

Índice depois: **160 entradas** no arranque, **211** depois de percorrer o
painel (208 cards + 1 bloco de painel + 2 pisos de seção).

---

## 7. Testes

```bash
cd /home/claude/serve && (setsid python3 -m http.server 8777 --bind 127.0.0.1 &)
cd /home/claude/proj/testes
node navegacao-testes.js http://127.0.0.1:8777/local.html        # 78
node visao-executiva-testes.js http://127.0.0.1:8777/local.html  # 118
node financeiro-testes.js                                        # 210 + 48
node rodar.js                                                    # 15 (inclui pedágio)
node baseline-comparar.js                                        # retrato numérico
node pedagios-rotas.js ; node pedagios-detector.js
node regressao-identidade-pracas.js ; node regressao-dados-sp.js
```

### Resultado desta rodada — 13/10/2026

| Suíte | Verificações | Resultado |
|---|---|---|
| `navegacao-testes.js` | 78 | **todas passaram** (eram 47 na Etapa 5) |
| `visao-executiva-testes.js` | 118 | **todas passaram** |
| `financeiro-testes.js` | 210 + 48 | **todas passaram** |
| `rodar.js` | 15 | **todas passaram** — inclui pedágios por rota (40), detector (126) e pedágio na tela (40) |
| `baseline-comparar.js` | retrato DURO/MOLE | **"nada que não devia mudar mudou"** · 39 dados do dia se mexeram (esperado) |
| `pedagios-rotas.js` | 40 | **todas passaram** |
| `pedagios-detector.js` | 126 | **todas passaram** |
| `regressao-identidade-pracas.js` | 22 cenários | **todos OK** |
| `regressao-dados-sp.js` | 18 rotas + 18 dados | **todos passaram** |
| `tools/sint.js` | 29 blocos de script | **sintaxe ok** |
| `tools/intocadas.js` | 25 funções | **24 idênticas, 1 alterada com autorização** (`calcEngine`, Etapa 2) |

`cobertura-sp.js` continua respondendo "São Paulo completo? **NÃO**" — 6
corredores concessionados sem base, 16 com cobertura parcial, 74 registros SP
sem posição física. É o **mesmo estado de antes desta etapa**: é lacuna de base
de pedágio, declarada desde a Etapa 1, e nada na navegação a toca.

### Os 31 testes novos

A suíte da navegação passou de 47 para 78 verificações. Cada bloco novo nasceu
de uma falha **medida** no painel em execução, e está escrito para reprovar se
ela voltar:

| Bloco | O que prova |
|---|---|
| **N11** (8) | os oito cenários do pedido: ativo, vencimento, janela e seção sobrevivem à navegação, sem aviso |
| **N12** (3) | destino que não aceita o ativo troca o universo, **avisa dizendo as duas pontas**, e o aviso some na navegação seguinte |
| **N13** (1) | voltar ao grupo devolve o contrato que estava nele |
| **N14** (8) | a busca alcança o hub de saídas, a Apresentação e a Calculadora; `comex` chega ao comércio exterior e `pptx` **não**; todo resultado aponta para seção e elemento existentes; clicar abre |
| **N15** (3) | Mercado externo é subgrupo de Oferta e demanda, os indicadores COMEX desenham para os três produtos, e Relatórios **não** recebeu nenhum |
| **N16** (5) | um clique gera uma vez, cinco slides por contrato, todo contêiner de gráfico com altura e desenhado, nenhum `NaN` no texto |
| **N4/N5** (atualizados) | os subgrupos da Etapa 5.1 na ordem; atalho interno **sem contexto** reprova |

Duas verificações **mudaram de expectativa** porque a especificação mudou, não
porque falhavam: `N4` contava as colunas de Mercado Agropecuário (agora exige
os rótulos, na ordem) e `N5` proibia atalho para dentro do grupo (agora
distingue "Ver também" de coluna de contexto, e **exige** que a de contexto
carregue ativo, alvo ou produto). Nenhuma assertiva foi afrouxada.

### Prova das saídas — arquivo por arquivo

Botão que aparece não é recurso que funciona. Cada saída foi **executada** com
o `html2canvas` e o `pptxgenjs` de verdade (mesmas versões do index — 1.4.1 e
3.12.0 — servidas de `/vendor` porque o CDN não é alcançável de dentro do
contêiner; o harness padrão troca os dois por `noop.js`, e com `noop` todo
botão "funciona" porque não faz nada), e o arquivo gravado foi conferido byte a
byte:

| Arquivo | Conferência |
|---|---|
| `Apresentacao_Contratos_BGI.pptx` | 2 784 604 bytes · zip íntegro · 85 entradas · **10 slides** · `[Content_Types].xml` com `presentationml.presentation` · `sldSz 12188952×6858000` (13,33×7,5 in) · 10 PNG em `ppt/media`, 2748×1456 · texto do slide 1: `BGIH26 (Mar/26)`, `Resumo Analítico · 90 pregões` |
| `Apresentacao_impressa.pdf` | `%PDF-1.4` · 203 395 bytes · 3 páginas · `%%EOF` presente |
| `BMS_RADAR_DIARIO_ALERTAS_…_A4.png` | PNG 2382×1278 · 249 366 bytes · `IEND` |
| `BMS_RADAR_DIARIO_BOI_TOP5_…_A4_p1.png` | PNG 2382×1182 · 306 511 bytes · `IEND` |
| `BMS_PAINEL_MB_BOI_…_A4.png` | PNG 1588×23380 · 3 771 399 bytes · `IEND` |
| `Resultado_Boi_….png` | PNG 2160×3840 · 693 259 bytes · `IEND` |
| `DRE_Boi_….png` | PNG 2160×3840 · 573 729 bytes · `IEND` |

O PDF da Apresentação sai pelo `window.print()` do botão, que abre a caixa de
diálogo do navegador: o que está provado é que **o documento imprime**, pelo
mesmo `@media print`, não que a caixa de diálogo foi operada.

Ferramentas da prova: `tools/saidas51.js`, `tools/pptx51.js`,
`tools/harness2.py export`, `tools/inv51.js`, `tools/build_e5_ref.py`.

---

## 8. A Apresentação nunca tinha gerado um slide

*Corrigido na Etapa 5.1 — era o defeito nº 3, e só apareceu porque a Etapa 5
deu endereço ao painel. Código inalcançável não quebra.*

```
_apresGerar() → ReferenceError: _fmtDate is not defined
                em buildKpiHtml ← createContractSlides
resultado: 1 slide de 15, status parado em "Gerando slides…",
           _apresCharts vazio, e o PPTX respondendo
           "⚠ Gere os slides primeiro."
```

Três auxiliares que o módulo **chama** e que não existiam no escopo dele —
conferido com `typeof` no escopo global do painel:

| Nome | Situação | Correção |
|---|---|---|
| `_fmtDate` | existe, mas **fechada** dentro da IIFE do Top 10 (linhas 51704–52670). `typeof _fmtDate` → `undefined` | entrou como local do módulo, mesma semântica (dd/mm/aaaa) |
| `fmt2` | existe como local de outra função, em outro bloco | entrou como local, devolvendo `—` em vez de `NaN` |
| `_fixChartHeights` | **não existia em lugar nenhum** — só a chamada e o comentário dizendo o que ela deveria fazer | entrou como local: mede a altura que o navegador acabou de calcular e a fixa em pixel; contêiner que mede zero é deixado como está, para o defeito continuar visível se ainda houver |

As três são **locais do módulo**, não globais: nenhum outro bloco muda de
comportamento. Nenhuma toca em número financeiro — duas são formatação e a
terceira é layout.

**E cada botão disparava duas vezes.** Os três têm `onclick` na marcação **e**
ganhavam um `addEventListener('click', …)` em `_bindApresBtn`. Não era só
desperdício: com os 15 slides prontos, clicar em PPTX devolvia "⚠ Gere os
slides primeiro" e **nenhum arquivo**, porque a segunda geração começa com
`container.innerHTML=''; _apresCharts=[]` e o PPTX clicado nesse intervalo vê a
lista vazia — e em seguida o `setTimeout` da segunda geração reescreve "pronto"
por cima do aviso. O operador ficava com "pronto" na tela e nada na pasta.
Saíram os três `addEventListener` duplicados; ficou o `onclick`, que é o mais
completo (o de "Gerar" tem até a mensagem de "módulo ainda carregando").

Depois: **1 geração por clique · 5 slides por contrato · 7 de 7 contêineres de
gráfico com altura e com traços desenhados · PPTX de 10 slides válido.**

---

## 9. Limitações

1. **Milho e soja continuam sem seção de mercado própria.** O que existe sobre
   eles está em: `m3_1_2` (preço e momento do ativo selecionado), `m3_1_8`
   (curva CCM/SJC e relação de troca), `m3_2_3` (histórico, sazonalidade e
   variação dos grãos), `m3_2_8` (relação boi × milho) e `m3_1_6`
   (exportações). Desde a Etapa 5.1 os três primeiros têm **entrada própria no
   menu**, pelas colunas de contexto, com o ativo certo já selecionado. Uma
   seção "Grãos — mercado" teria de ser **construída**, não movida — e a Etapa
   5.1 proíbe desenvolver indicador novo.
2. **Os três baldes "Outros" continuam vazios e ocultos.** São rede de
   segurança da migração.
3. **O nome do grupo 7.** A lista original dizia "Relatórios e Exportação".
   Como "Exportação" no Radar é o comércio exterior, o grupo ficou
   **"Relatórios e Arquivos"**. A Etapa 5.1 confirmou a leitura.
4. **Três rotinas de exportação completas estão inalcançáveis.** Investigado a
   pedido, sem apagar nada:

   | id citado no código | Existe na marcação? | Função que ele liga | Outros usos dessa função |
   |---|---|---|---|
   | `hist7BtnExport` | **não** | `exportHist7PNG` (definida, 53702) | **nenhum** |
   | `btnExportPdf` | **não** | `exportarPdfPremium` (definida, 48804) | **nenhum** |
   | `btnExportDados` | **não** | `exportarDadosAnalise` (definida, 48961) | **nenhum** |

   Cada `addEventListener` é protegido por `if (btn)`, então a referência morta
   **não causa erro** — e é por isso que ninguém notou. Mas a conclusão é mais
   séria que "referência morta": **as três funções existem, estão completas na
   aparência e não têm nenhum outro chamador**. São três exportações presentes
   no código e sem controle na página (PNG do resumo de 7 dias, PDF premium e
   exportação de dados para Excel). Nada foi apagado — apagar exigiria provar
   que as funções também não servem a mais nada, e elas servem a si mesmas.
   **Dar botão a elas é interface nova e depende de autorização**; por isso o
   hub de saídas não as anuncia.
5. **A ordem das seções dentro do pane** segue a tabela, não o menu.
6. **`cobertura-sp.js` continua incompleto** (6 corredores sem base, 16
   parciais, 74 registros SP sem posição). Lacuna de base de pedágio declarada
   desde a Etapa 1, intocada por esta etapa.
7. **O PPTX inclui os gráficos como imagem**, não como gráfico editável do
   PowerPoint. É como o módulo foi escrito (`html2canvas` → `addImage`), não
   uma consequência desta etapa.
