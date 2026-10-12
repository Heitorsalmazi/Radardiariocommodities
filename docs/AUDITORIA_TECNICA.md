# Auditoria técnica — Radar Diário de Commodities

**Etapa 1 · 12 de outubro de 2026**
**Objeto:** repositório `Heitorsalmazi/Radardiariocommodities`, commit `9aa8850`
(`auto: atualiza dados 11/10/2026 00:13 UTC`).
**Escopo:** inventário, segurança e proteção contra regressões.
**O que esta etapa NÃO faz:** nenhuma refatoração, nenhuma remoção, nenhuma
alteração de cálculo. Só medição, registro e as proteções que não interrompem
nada.

---

## 0 · Como ler este documento

Todo número aqui foi **medido**, com o comando ou o script registrado ao lado.
Onde não consegui medir, está escrito que não consegui e por quê — não há
estimativa disfarçada de medição.

Três avisos de método, porque mudam a confiança no resto:

1. **A cópia auditada é a que está no ar.** O `index.html` da minha área de
   trabalho e o do repositório têm o mesmo SHA-256
   (`2725aaeb7cfd4b98c7c820526f55fa87242c76e058f59a7aa1a9c0fb332cccc6`).
   Não estou auditando uma versão antiga.
2. **Três verificações externas não foram possíveis neste ambiente** e estão
   marcadas como pendentes de confirmação sua: o nível de compartilhamento da
   planilha no Google Drive, o download direto do `dados.xlsx` pela URL do
   Pages, e os termos de redistribuição de CEPEA e Scot. O proxy de saída
   deste ambiente bloqueia `docs.google.com` e `heitorsalmazi.github.io`, e eu
   não contorno bloqueio por outro caminho.
3. **Uma correção a mim mesmo.** Uma auditoria anterior deste projeto citou
   «3.928.776 bytes» e «1.292 funções». Os números certos, medidos agora no
   commit em produção, são **4.015.160 bytes** e **1.438 funções**. O arquivo
   anterior media um build intermediário.

---

## 1 · Inventário

### 1.1 O repositório

| | |
|---|---|
| Arquivos no commit atual | **31** |
| Commits | **716** |
| Visibilidade | **público** |
| Caminhos que já existiram em toda a história | **32** (os 31 atuais + `github/workflows/sync-dados.yml`, erro de digitação corrigido depois) — lista completa na seção 2.5 |
| Hospedagem | GitHub Pages, origem «GitHub Actions» |

Os cinco arquivos pesados concentram 97% do repositório:

| arquivo | bytes | papel |
|---|---:|---|
| `opcoes_radar.xlsx` | 7.799.980 | base de opções B3 |
| `dados.xlsx` | 6.858.358 | planilha viva, **160 abas** |
| `index.html` | 4.015.160 | o painel inteiro |
| `scripts_opcoes/dados_opcoes/opcoes_2026.parquet` | 1.037.783 | insumo do coletor |
| `data/municipios_brasil.json` | 238.100 | 5.571 municípios com IBGE e coordenada |

### 1.2 O `index.html` por dentro

| | |
|---|---|
| Tamanho | 4.015.160 bytes · 61.586 linhas |
| Tags `<script>` | 38 — **5** externas (CDN), **6** de JSON embutido, **27** com código inline |
| Funções declaradas | 1.438 |
| Contêineres de gráfico (`div id="chart…"`) | 208 |
| Gráficos que efetivamente desenham numa varredura completa | **125** |
| Seções de navegação (`_M3_ESTRUTURA`) | **34** — 10 em MERCADO, 11 em ESTUDO, 13 em DECISÃO |
| `try` / `catch` | 794 / 824 |
| `catch` **vazios** (`catch(e){}`) | **533** — 65% de todos |
| `catch` que escrevem no console | 140 |

Composição por peso:

| camada | MB | % |
|---|---:|---:|
| JavaScript | 2,35 | 63% |
| JSON embutido (6 blocos) | 0,60 | 16% |
| HTML | 0,54 | 14% |
| CSS | 0,25 | 7% |

**O ponto mais importante da arquitetura visual:** há **289** chamadas a
`renderPlot(...)` e apenas **5** a `Plotly.newPlot(...)`. Todo gráfico passa
por um funil central (`renderPlot` → `applyPlotlyTheme` → cadeia de traços →
`Plotly.newPlot`). É por isso que a padronização visual da etapa anterior
corrigiu os 122 cards então existentes mexendo num lugar só. Esse funil é o
maior ativo técnico do projeto e deve ser preservado como tal.

### 1.3 Os oito módulos e de que dependem

| módulo | onde vive | entrada | publica em |
|---|---|---|---|
| Preços e contratos | seções `m3_1_*` | abas `BGI/CCM/SJC/DOL/ETH/DI1` do `dados.xlsx` | `window.__3M_PONTOS`, `__3M_LAST_DATE` |
| Calculadora do Boi (custo da @ incremental) | `calcEngine` + `getState` | campos `bms*` digitados na tela + spot | `window.__3M_CAI`, `__3M_CAI_MEM` |
| Gestão de risco | cards de decisão | séries + `__3M_CAI` | `window.__3M_SINAIS` (10 chaves) |
| Simulador de hedge / backtest | `m3_3_5e` | série por contrato | `window.__3M_BACKTEST` |
| Opções | `m3_3_5g`, `_opcRender` | `opcoes_radar.xlsx` | gráficos `opc*` |
| Exportações | `m3_1_6` | abas `COMEX_HISTORICO`, `COMEX_SEMANAL` | `chartAtkExport` |
| Logística e reposição | `_pcrMotor` + `_m3RenderPrecoColocado` | `data/logistica_reposicao.json`, `data/municipios_brasil.json`, 4 bases de pedágio, OSRM | tabela de preço colocado |
| Atualização automática | 6 workflows | Google Sheets, ANTT, ARTESP/OSM, B3 | commits em `main` |

**Dependências entre componentes** — as que quebram em cadeia:

- `calcEngine` → `__3M_CAI` → cards de trava, break-even e decisão econômica.
  Um erro na calculadora não fica na calculadora.
- `_rgSerie` / `_rgPracas` → `calcularPraca` → preço colocado. O motor de
  reposição lê preço pela mesma função que o Radar regional usa.
- `apurarPedagios` → `calcularPraca`. O pedágio é calculado **fora** e entregue
  pronto; recalculá-lo dentro criaria uma segunda verdade e dobraria o valor no
  frete. Está documentado no próprio código e precisa continuar assim.
- `workbookLoaded` (16 ouvintes) é o gatilho de quase tudo. Quem não ouvir esse
  evento desenha vazio.

### 1.4 De onde vem cada número

**Rede, no boot** — 11 requisições, 15,32 MB:

| tipo | MB |
|---|---:|
| `fetch` (planilhas e JSON) | 6,35 |
| scripts externos | 4,29 |
| documento (`index.html`) | 3,83 |
| outros | 0,84 |

**Tempo, do clique ao painel pronto** (laboratório local, rede local):

| marco | ms |
|---|---:|
| DOM pronto | 2.288 |
| planilha disponível | 15.315 |
| painel inteiro desenhado | 23.220 |
| heap de JS no fim | 238 MB |

Dentro desses 15,3 s, **9.669 ms são o parse do `dados.xlsx`** — e a boa
notícia é **onde** ele acontece: `window._WK_ESTADO` registra
`{via:'worker', msParse:9669, msClone:0}`. A leitura da planilha roda **num Web
Worker**, fora da thread principal, e a devolução para a página custa zero. A
interface não congela durante os dez segundos. É uma decisão de arquitetura
acertada e que precisa ser preservada: qualquer mudança no carregamento deve
conferir que `_WK_ESTADO.via` continua `'worker'`.

**Seis arquivos JSON por caminho relativo** (regra 9 do estatuto, cumprida):
`./data/logistica_reposicao.json`, `./data/municipios_brasil.json`,
`./data/pedagios_brasil.json`, `./data/pedagios_coordenadas.json`,
`./data/pedagios_auditoria_antt.json`, `./data/pedagios_osm_pontos.json`.
Cada um tem **cópia embutida** no HTML como reserva — por isso o painel abre de
`file://` e sobrevive a um 404.
`data/pedagios_complemento_artesp.json` não é lido pelo painel: é insumo do
`scripts/build_pedagios.py`. Verifiquei antes de chamar de peso morto; não é.

**Cinco hospedeiros externos em tempo de execução:**

| origem | o que traz | tem espelho? |
|---|---|---|
| `cdn.plot.ly` | Plotly 2.30.0 + locale pt-BR | **sim** — jsdelivr e unpkg |
| `cdn.jsdelivr.net` | `xlsx` 0.18.5, `html2canvas` 1.4.1, `pptxgenjs` 3.12.0 | **não** |
| `fonts.googleapis.com` | Inter e Montserrat | não (degrada para fonte do sistema) |
| `api.bcb.gov.br` | séries SGS (SELIC etc.), com cache `m3_eco_bcb_v5` | não |
| `router.project-osrm.org` | distância rodoviária, 4º nível de uma cadeia de cache | não |

### 1.5 Variáveis globais e eventos compartilhados

- **254** atribuições distintas a `window.*`. Não há módulos, nem `import`, nem
  namespace: o arquivo inteiro compartilha um espaço de nomes só.
- **19** globais `window.__3M_*` são o contrato entre módulos (o «barramento»):
  `__3M_CAI`, `__3M_SINAIS`, `__3M_BACKTEST`, `__3M_PONTOS`, `__3M_ABATE_IBGE`,
  `__3M_AGIO_BEZERRO`, `__3M_SAZ_MES`, `__3M_SELIC_AA`, `__3M_Z_CALCULADO`,
  `__3M_Z_ORIGEM`, `__3M_STATUS_CLASS`, `__3M_TROCA_BOI_MILHO`, `__3M_ECO_CACHE`,
  `__3M_LAST_DATE`, `__3M_ALERTAS_MERCADO`, `__3M_CAI_MEM`, `__3M_calcEngine`,
  `__3M_getState`, `__3M_setTop10HasPage2`.
- **3 eventos próprios:** `workbookLoaded` (16 ouvintes), `m3PlotlyPronto` (2),
  `m3LiveMudou` (2).
- **`window._pcrMotor`** expõe as seis funções puras da reposição. Foi por essa
  porta — já aberta pelo próprio código — que o registro de regressão da seção 4
  conseguiu chamar as fórmulas sem eu precisar tocar no `index.html`.

### 1.6 Persistência no navegador

Dezesseis chaves de `localStorage`. Nenhuma guarda dado financeiro da BMS:

| chave | guarda |
|---|---|
| `bms_acesso_v1` | o hash da senha e a validade do desbloqueio |
| `m3_univ`, `m3_amb`, `m3_sec_<amb>`, `m3_janela` | onde você estava na navegação |
| `dash_active_page_tab` | aba ativa (legado) |
| `m3_modo_live` | modo ao vivo ligado/desligado |
| `m3_travas_v1` | as travas que você registrou |
| `m3_eco_bcb_v5` | cache das séries do Banco Central |
| `M3_MB_BREAKEVEN_MAP` | mapa de break-even da matriz |
| `MB_MATRIX_SELECTED_SHEETS_BOI_v1` | abas escolhidas na matriz |
| `MB_CONTRACTS_SELECTED_V1` | **legado**, nunca mais escrito nem limpo |
| `MB_CONTRACTS_SELECTED_V2_<mercado>` | contratos escolhidos |
| `pcr_rotas_v1`, `pcr_destino_v1`, `pcr_pedagio_manual_v1` | cache de rotas, destino e pedágio digitado |

Não há `sessionStorage`, nem cookie, nem IndexedDB.

### 1.7 Os seis workflows

| workflow | quando | escreve |
|---|---|---|
| `sync-dados.yml` | 4 horários/dia + carona em 3 outros | `dados.xlsx` |
| `update-antt.yml` | diário 07:40 UTC | `data/logistica_reposicao.json` (coeficientes) |
| `update-pedagios.yml` | diário 06:25 UTC | 4 bases de pedágio |
| `update-opcoes.yml` | dias úteis 23:00 UTC | `opcoes_radar.xlsx`, parquets |
| `update-logistica.yml` | dia 1 de cada mês | matriz logística |
| `deploy-pages.yml` | fim dos 5 acima + push + diário + manual | publica o site |

**Zero uso de `secrets.*` em todo o histórico.** Todos usam o `GITHUB_TOKEN`
padrão com `contents: write`. O `deploy-pages.yml` tem permissão mínima
(`contents: read`) e um job de verificação que compara o HEAD do `main` com o
SHA publicado, evitando republicar 72 vezes o mesmo conteúdo.

---

## 2 · Segurança

### 2.1 O que procurei e não encontrei

Varri **toda a história** dos arquivos de texto (`*.yml`, `*.py`, `*.txt`,
`.gitignore`, `README.md` — 716 commits, 302 KB de diff) atrás de:
`ghp_`, `github_pat_`, `gho_`, `ghs_`, `AKIA…`, `AIza…`, `sk-…`, `xox[baprs]-`,
`BEGIN … PRIVATE KEY`, `BEGIN OPENSSH`.

**Nenhuma ocorrência.** Nenhuma menção a `secrets.`, `password`, `api_key`,
`client_secret`, `Authorization:` ou `Bearer` em código. A lista de 32 caminhos
que já existiram no repositório não contém `.env`, `credentials.json`, chave
`.pem`, `.p12` nem arquivo de serviço.

E, no `index.html`: **zero** `POST`, `sendBeacon`, `FormData`, Google Analytics,
Mixpanel, Hotjar ou Sentry. **Nada que você digita no painel sai do navegador.**
A única exceção é a consulta de rota ao OSRM, que envia um par de coordenadas
municipais (origem da praça e município de destino) — não envia nome, cliente,
quantidade nem preço.

### 2.2 A tranca não é autenticação — e o próprio código já diz isso

O acesso é um overlay (`#bms-lock`) que compara `SHA-256(sal + senha)` com um
hash constante dentro do HTML. O comentário do código é honesto ao ponto de
dispensar auditoria:

> «Isto é uma TRANCA, não um cofre. O navegador baixa o arquivo inteiro antes de
> conferir a senha… a planilha `dados.xlsx` fica ao lado, no mesmo repositório, e
> é baixável direto pela URL sem nunca passar por aqui.»

Três agravantes técnicos que vale registrar:

1. **SHA-256 de uma rodada, sem KDF.** O sal está no arquivo. Um ataque de
   dicionário offline contra esse hash roda em segundos num laptop. Não é PBKDF2,
   bcrypt, scrypt nem Argon2 — e nem poderia ser, do lado do navegador, com
   proveito real.
2. **O conteúdo chega antes da senha.** Os 4 MB do painel e os 15 MB de dados já
   estão no navegador quando a caixa de senha aparece.
3. **O `deploy-pages.yml` publica `path: .`** — o repositório inteiro. Logo, pela
   URL do Pages ficam servidos também `dados.xlsx`, `opcoes_radar.xlsx` (7,8 MB),
   os parquets e os scripts Python, nenhum deles atrás da tranca.

O ponto 3 é **inferência da configuração**, não teste: não consegui baixar a URL
do Pages daqui (bloqueio de saída). É uma conclusão sólida — é o que `path: .`
faz — mas quem fecha a verificação é você, abrindo
`…/Radardiariocommodities/dados.xlsx` numa aba anônima.

### 2.3 A planilha-fonte no Google Sheets

O `sync-dados.yml` baixa, **sem nenhuma credencial**:

```
https://docs.google.com/spreadsheets/d/1PeSi0A7m8YfUsoSkovA5iS79SkQAIip9/export?format=xlsx
```

Que funcione sem token significa que a planilha está compartilhada por link.
O ID está num arquivo público, em repositório público.

- Se o compartilhamento for **«qualquer pessoa com o link pode ver»**, o risco
  adicional é pequeno: o `dados.xlsx` exportado já é público de qualquer forma.
  Expõe a mais o histórico de revisões, comentários e eventuais abas que o
  Radar não usa.
- Se for **«qualquer pessoa com o link pode editar»**, o risco é alto e de
  natureza diferente: qualquer pessoa altera a fonte, o robô publica em até
  4 horas e o painel passa a decidir trava e reposição com número envenenado.

**Não consegui verificar qual dos dois é o caso** — `docs.google.com` está
bloqueado neste ambiente. É a verificação mais barata e mais urgente desta
auditoria: abrir a planilha → Compartilhar → conferir se está em «Leitor».

### 2.4 Dado público de mercado × dado operacional privado

A etapa pedia essa separação explicitamente. Ela é mais limpa do que eu esperava:

**Público de mercado — as 160 abas, sem exceção.** CEPEA (boi gordo, bezerro,
milho, carne atacado, regional), B3 (BGI, CCM, SJC, DOL, ETH, DI1 — 148 abas de
contrato), IBGE (abate), COMEX (exportação), escalas de abate, IGP-M e
«REPOSIÇÃO SCOT». Não há aba de cliente, de margem da BMS, de custo interno, de
contrato comercial ou de posição própria.

**Privado operacional — os parâmetros que você digita na Calculadora do Boi:**
custo da arroba de entrada, GMD, custo de dieta, taxa de juros, frete, comissão.
Esses **nunca saem do navegador**: não há chave de `localStorage` para os campos
`bms*` (eles se perdem ao recarregar), não há `POST`, não há telemetria. O
resultado derivado (`__3M_CAI`) vive só em memória.

**Consequência prática:** hoje não existe dado privado da BMS exposto
publicamente. O que está exposto é dado de mercado — com uma ressalva que não é
de segurança e sim de contrato:

**CEPEA e Scot Consultoria.** Redistribuir cotações dessas fontes num site
público pode esbarrar nos termos de uso de cada uma (a Scot é assinatura paga).
Não auditei contrato — não tenho acesso a eles. Fica registrado como item a
verificar com quem cuida das assinaturas.

### 2.5 O histórico do Git

A etapa alertava, com razão, que arquivo já público permanece no histórico.
Levantei **todos os caminhos que algum dia existiram** nos 716 commits
(`git log --all --name-only`, sobre um clone com a história completa). São
**32**, e são estes:

```
.github/workflows/{deploy-pages,sync-dados,update-antt,
                   update-logistica,update-opcoes,update-pedagios}.yml
github/workflows/sync-dados.yml          ← erro de digitação, corrigido depois
.gitignore            README.md          index.html
dados.xlsx            opcoes_radar.xlsx
data/{logistica_reposicao,municipios_brasil,pedagios_auditoria_antt,
      pedagios_brasil,pedagios_complemento_artesp,pedagios_coordenadas,
      pedagios_osm_pontos}.json
scripts/{build_pedagios,pedagios_providers,update_antt,
         update_logistica_reposicao,update_municipios}.py
scripts_opcoes/{coleta_opcoes_b3,diag_opcoes_strike,radar_opcoes}.py
scripts_opcoes/collectors/{__init__,opcoes_b3}.py
scripts_opcoes/requirements.txt
scripts_opcoes/dados_opcoes/{futuros_2026,opcoes_2026}.parquet
```

Nenhum `.env`, nenhum `credentials.json`, nenhuma chave. **Nenhum arquivo
sensível foi commitado e depois removido. Não há nada a expurgar.**

O `dados.xlsx` e o `opcoes_radar.xlsx`, porém, estão em **todas** as suas
centenas de versões no histórico. Medido agora: a árvore de trabalho tem ~20 MB
e o clone **sem blobs** usado nesta auditoria ocupa 16 MB; um clone completo é
ordens de grandeza maior, porque guarda cada versão de dois arquivos de vários
megabytes que mudam todo dia. Isso é custo e lentidão de clone, não vazamento —
e não tem solução barata (reescrever histórico quebraria qualquer clone
existente).

### 2.6 Proposta de infraestrutura privada

Apresentada aqui como **proposta**, sem execução: a etapa manda não interromper
o site nem remover base sem aprovação, e qualquer uma destas muda hospedagem
(regra 12 do estatuto).

| opção | o que muda | custo | o que resolve | o que não resolve |
|---|---|---|---|---|
| **A — Repositório privado + Pages privado** | repo passa a privado; Pages exige login GitHub de membro convidado | GitHub Team, ~US$ 4/usuário/mês | autenticação de verdade; `dados.xlsx` deixa de ser baixável por estranho | cada pessoa precisa de conta GitHub; histórico já público permanece em clones de terceiros, se houver |
| **B — Cloudflare Pages/Access** | mesmo site, atrás de um portão com e-mail/OTP ou Google Workspace | plano gratuito atende até 50 usuários | autenticação real sem conta GitHub; log de acesso | exige mover o deploy do GitHub Pages para o Cloudflare |
| **C — Separar público e privado** | painel continua público; só as bases vão para bucket privado com URL assinada | baixo | tira o dado da frente | exige um backend mínimo para assinar URL — hoje não existe nenhum |
| **D — Não fazer nada** | continua como está | zero | — | o painel segue aberto a quem tiver o link |

**Recomendação:** **B**, se o objetivo for fechar o acesso de verdade sem mudar o
jeito de trabalhar. **D** é defensável e honesto **desde que** a planilha-fonte
esteja em «Leitor» (seção 2.3) — porque, nesse caso, tudo que está exposto é dado
de mercado, e o que é privado nunca sai do navegador.

**Nada disso será executado sem a sua autorização explícita.**

---

## 3 · Riscos por criticidade

### ALTA

| # | risco | evidência | efeito se acontecer |
|---|---|---|---|
| **A1** | A tranca não é autenticação e os dados ficam ao lado dela | seção 2.2 | qualquer pessoa com o link lê o painel e baixa as planilhas |
| **A2** | **533 `catch` vazios** de 824 (65%). Destes, **66 engolem a chamada de um card inteiro** (`try { updateRegional(); } catch(e){}`), em **33 funções distintas** — `updateSHMilhoFixed` (8 vezes), `updateSHBoiGordoFixed` (5), `updateSHBezerroFixed` (5), `updateBGIvsCAI` (3), `updateBacktestCondicional` (3), `updateTravas` (3), `redrawAll` (2)… | contagem no arquivo | um card calcula errado ou fica vazio sem rastro no console, na tela ou nos testes. **Já aconteceu**: em setembro, `__3M_SINAIS.curvaVariacao` saía vazio por um `ReferenceError` engolido, e o gráfico desenhava perfeitamente |
| **A3** | `xlsx`, `html2canvas` e `pptxgenjs` vêm do jsdelivr **sem espelho** | seção 1.4 | rede corporativa que bloqueie jsdelivr → a planilha não abre → painel vazio. O Plotly tem dois espelhos; a biblioteca que lê os dados não tem nenhum |
| **A4** | Planilha-fonte compartilhada por link, nível não verificado | seção 2.3 | se estiver em «Editor», um estranho envenena a fonte e o robô publica em até 4 h |

### MÉDIA

| # | risco | evidência | efeito |
|---|---|---|---|
| **M1** | 254 globais em `window`, sem módulos | seção 1.5 | colisão de nome é silenciosa; uma função nova pode sobrescrever outra sem erro |
| **M2** | Arquivo único de 4 MB | seção 1.2 | cada commit de `index.html` grava uma cópia inteira no histórico; somado às centenas de versões das duas planilhas, o clone completo fica pesado e lento |
| **M3** | Boot pesado: 15,3 MB, 23,2 s até o painel pronto, 238 MB de heap — dos quais **9,7 s só de parse** do `dados.xlsx` | medição | em 4G ou máquina modesta, o usuário espera meio minuto olhando tela de carga. Atenuado por o parse rodar em Web Worker: a tela não congela, mas espera |
| **M4** | **27 cards** com painel inferior abaixo de 100 px no celular (pior: 60 px em `chartAtkExport`, 63 px em `chartAtkFemeas`) | medição a 390 px | o painel de baixo vira um risco preto; a informação existe e não se lê |
| **M5** | Dupla fonte de verdade: 5 JSONs no `data/` e cópias embutidas no HTML | seção 1.4 | se o `fetch` falhar, usa-se a cópia embutida — que pode estar meses atrás — e o aviso é só um `console.info` |
| **M6** | `deploy-pages` publica `path: .` | seção 2.2 | scripts Python, parquets e a base de opções (7,8 MB) vão ao ar sem necessidade |
| **M7** | OSRM público (`router.project-osrm.org`) como provedor de distância | seção 1.4 | é o servidor de demonstração do projeto, sem SLA e com limite de taxa; é 4º nível de cache, mas um destino novo depende dele |
| **M8** | Redistribuição de cotações CEPEA e Scot em site público | seção 2.4 | questão contratual, não técnica — precisa de verificação |

### BAIXA

| # | risco | efeito |
|---|---|---|
| **B1** | Agendamentos do GitHub atrasam ~5 h (documentado no próprio `sync-dados.yml`, medido em 30 dias) | dado do dia chega mais tarde; a carona `workflow_run` já mitiga |
| **B2** | `MB_CONTRACTS_SELECTED_V1` legado nunca limpo | lixo em `localStorage`, sem efeito |
| **B3** | A suíte de testes existe mas **não roda no CI** | uma regressão só aparece quando alguém roda à mão |
| **B6** | **A pasta `testes/` não está no repositório.** O `.gitignore` ignora `testes/node_modules/`, o que mostra a intenção de versionar o resto — mas nenhum arquivo de `testes/` está no commit atual | a suíte de 15 verificações, os harnesses de pedágio e agora o retrato de regressão existem só na máquina do Heitor e na minha área de trabalho. Um disco que morre leva junto toda a proteção construída |
| **B5** | Exportação para PowerPoint e captura de imagem dos cards sem nenhum teste | o laboratório substitui `pptxgenjs` e `html2canvas` por um `noop`; uma quebra nessas duas funções só aparece para o usuário |
| **B4** | 208 contêineres de gráfico para 125 que desenham | 83 contêineres sem desenho observado; podem ser variantes de tela pequena ou resto. Precisa de varredura dedicada antes de qualquer remoção |

---

## 4 · Proteção contra regressões (entregue nesta etapa)

A suíte existente (`testes/rodar.js`, 15 verificações) prova que **a tela não
quebrou**. Ela não prova que **a conta continua certa** — a tela fica idêntica
com a fórmula errada. Essa lacuna é o que esta etapa fecha.

### 4.1 Branch de desenvolvimento

Criada a branch **`desenvolvimento`**, a partir de `main`, no commit `9aa8850`.

**Aviso operacional importante:** os cinco robôs de dados escrevem em `main`
todo dia, e o `deploy-pages.yml` publica **só** o `main`. Uma branch de longa
duração vai acumular conflito em `dados.xlsx` e nas bases de pedágio. A forma
correta de usá-la é recriá-la a partir do `main` no começo de cada etapa e
integrá-la no fim da mesma etapa — nunca mantê-la viva por semanas.

### 4.2 Registro verificável do comportamento atual

Dois arquivos novos em `testes/`:

**`baseline-captura.js`** — abre o painel num Chromium, percorre as 34 seções e
grava um retrato numérico em `testes/baseline.json` (122 KB). O retrato cobre os
oito módulos:

| bloco | o que grava | tamanho da amostra |
|---|---|---|
| `contratos` | pregões, primeiro e último preço | **80 contratos** |
| `contasFixas` | **as fórmulas financeiras chamadas com argumentos fixos** | 30 âncoras |
| `cai` | saída da Calculadora do Boi | `__3M_CAI` inteiro |
| `sinais` | o que os cards de risco publicam | 10 chaves |
| `backtest` | acerto, média, melhor antecipação | 4 campos |
| `opcoes` | séries dos 4 gráficos + 8 leituras de tela + linhas da cadeia | 57 linhas |
| `exportacoes` | anos, ano atual, último mês e nº de destinos, por produto | 30 anos · 211 países (boi) |
| `logistica` | praças, veículos, pedágio por eixo | 28 praças |
| `frescor` | data mais nova de cada aba | 136 abas com data |
| `graficos` | seção, nome, nº de pontos, primeiro e último de cada série | **125 gráficos** |
| `carga` | caminho de carga: parse em worker, origem do Plotly, presença das 3 bibliotecas | 6 campos |

O bloco `graficos` agora guarda também **em que seção** cada gráfico foi visto:
13 em «Resumo do dia», 15 em «Atacado», 12 em «Grãos», 11 em «Bezerro»… Um
gráfico que mude de seção passa a ser diferença DURA, porque é mudança de
navegação, não de dado.

Dez das 34 seções não produzem nenhum `div#chart*`: as três «Outros» (ocultas),
as páginas de decisão que são texto e tabela (`m3_3_1`, `m3_3_3`, `m3_3_4`,
`m3_3_5a`, `m3_3_5c`, `m3_3_6`) e Opções (`m3_3_5g`), cujos gráficos têm ids
`opc*` e entram no bloco próprio. Está correto; registro para que a ausência não
seja lida como falha.

O bloco `contasFixas` é o coração da coisa. Em vez de fotografar a tela, ele
**chama as fórmulas com entrada congelada** e guarda o resultado:

```
freteANTT_1000km_ccd3.5_cc500   = 4000
retornoVazio_1000km_ccd3.5_on   = 3220      (fator 0,92)
fretePorCabeca_9000_30cab       = 300
comissao_300a_2pct              = 6
comissao_300a_45porcabeca       = 45
precoColocado_300_10_5_2        = 317
escolherVeiculo_25 / 26 / 110 / 111 cab = 3e / 6e / 9e / null
calcEngine (ciclo fixo, spot 320): cAI 175,205086 · 340 dias · 11 @ → 21,624 @
                                   break-even LL 276,236433 · MB 250,025586
igpm_jan2003 = 4,277545 · igpm_jan2024 = 1,053521
carcacaArroba: 512 pontos, 01/08/2024 = 251,323512 → 31/08/2026 = 364,05
```

As cinco funções da reposição vivem dentro de um fechamento e **não existem no
escopo da página**. Cheguei nelas por `window._pcrMotor`, que o próprio código
já expunha (`index.html:58253`). **Nenhuma linha do `index.html` foi alterada
para este registro existir** — regra 1 da etapa cumprida.

**Um achado que veio de construir o registro.** A primeira versão do bloco de
exportações chamava `getComexHistorical('BOVINA')` e gravava no retrato o valor
`1`. A chave correta é `'boi'` (`CX_PRODUTOS`); com a errada, a função devolve
`{erro:'Não há linhas de BOVINA…'}` — um objeto de uma chave, que o meu código
contou como `1`. Nada estourou, nada avisou, e o retrato teria nascido com uma
âncora falsa num dos oito módulos. Corrigido: hoje o bloco registra 30 anos de
histórico, 211 destinos para carne bovina, 163 para milho e 128 para soja, e as
18 colunas do semanal.
É o mesmo padrão do risco **A2** visto de outro ângulo: a função devolve erro
como se fosse resultado, e quem chama só percebe se conferir. Vale registrar
como candidato a revisão futura — `getComexHistorical` poderia lançar em vez de
devolver `{erro}` quando o produto não existe.

**Observação sobre o módulo de Opções.** A tela diz hoje, textualmente,
«Histórico em formação. 5 de 20 pregões mínimos para comparação estatística».
A classificação de liquidez ainda não opera por falta de série — não é defeito,
é maturidade. O retrato grava esse estado; quando os 20 pregões chegarem, a
comparação vai acusar a mudança e isso será esperado.

**`baseline-comparar.js`** — recaptura e compara, separando duas naturezas:

- **DURO** — fórmula, estrutura, inventário. Não deve mudar sozinho; toda
  diferença é regressão até alguém explicar.
- **MOLE** — o dado do dia. Muda porque a planilha mudou. Só vira sinal quando
  **desaparece** ou **zera** — nesse caso é promovido a DURO automaticamente,
  porque dado que para de chegar não é «dado do dia», é cano entupido.

Sai com código **0** quando nada DURO mudou e **1** quando mudou.

### 4.3 O verificador foi verificado

Três provas, porque «zero diferenças» também é o que um comparador quebrado diz
— e porque a primeira tentativa falhou e o motivo vale mais que o resultado.

**Prova 0 — a primeira versão era instável, e eu descobri porque a usei.**
A segunda captura devolveu 118 gráficos contra 122 da primeira, acusando como
«DESAPARECEU» os quatro cards do Ciclo pecuário (`chartCicloTempo`,
`chartProjCiclo`, `chartProjSenoide`, `chartProjAnual`). Antes de escrever isso
como defeito do painel, sondei o painel: abri a seção `m3_2_6` com 300 ms,
1 s, 3 s e 8 s de espera, quatro vezes seguidas, e chamei `updateCicloPecuario`
e `updateProjCiclo` diretamente. **Os quatro desenharam em todas as tentativas,
sem um aviso no console.** O defeito era do meu capturador, não do produto: ele
fotografava os gráficos **no fim**, depois de passar pelas 34 seções, e isso
depende de o card ainda estar montado.

Corrigido: a captura agora colhe **com a seção aberta**, dá duas voltas pelas
34 seções e une o resultado. É o que o usuário vê, e é estável. De quebra passou
a enxergar **125 gráficos** em vez de 122.

Registro isso por dois motivos. Primeiro, porque um retrato instável é pior que
nenhum: ele treina quem lê a ignorar o alarme. Segundo, porque se eu tivesse
publicado «quatro gráficos do ciclo quebram de forma intermitente», você teria
caçado por horas um defeito que não existe.

**Prova 1 — determinismo.** Duas capturas independentes do mesmo build, com a
mesma planilha: **0 diferenças**, veredito limpo, saída 0.

**Prova 2 — sabotagem deliberada.** Injetei três defeitos de naturezas
diferentes num retrato e rodei a comparação:

```
DESAPARECEU (1):          graficos.chartPercentil (era "[7 itens]")
DADO QUE PAROU (1):       contratos.BGIH26.ultimo: 355.01 → null
MUDOU O QUE NÃO DEVIA (1): contasFixas.freteANTT…: 4000 → 4000.5
DADO DO DIA que se mexeu: 1 (esperado; não é regressão)
VEREDITO: 3 diferença(s) que exigem explicação.          EXIT=1
```

Pegou os três, classificou a mudança de data como esperada e falhou com o código
certo.

**Duas leituras do bloco `carga` que exigem cuidado.** `parseVia:'worker'` e
`plotlyOrigem:'principal'` descrevem o produto e valem como âncora. Já
`html2canvasPresente:false` e `pptxPresente:false` descrevem o **laboratório**:
o harness local troca essas duas bibliotecas por um `noop.js`. Em produção elas
vêm do jsdelivr e estão presentes. A consequência prática é uma lacuna de
cobertura que vale registrar: **a exportação para PowerPoint e a captura de
imagem dos cards não são exercitadas por nenhum teste automatizado hoje.**

**Condição de uso que não pode ser esquecida:** a comparação deve rodar sempre
contra o laboratório local, com a **mesma cópia congelada** do `dados.xlsx`.
Rodar contra o site vivo compara código novo com dado novo e não conclui nada.
A diferença é concreta: a cópia congelada do laboratório tem **147 abas** e a do
repositório hoje tem **160** — 13 abas de contrato novas (`DI1U27`, `DOLU27`,
`ETHG28`, `ETHM27`, `SJCF28`, `SJCK28`…). O retrato existe para isolar a mudança
de **código**; misturar a mudança de **dado** nele o inutiliza.

### 4.4 Estado verificado no fechamento desta etapa

Rodado agora, nesta ordem, sobre o `index.html` que está em produção:

```
node tools/sint.js            → sintaxe ok — 26 blocos
node tools/intocadas.js       → ok — 25 funções intocáveis idênticas
cd testes && node rodar.js    → tudo passou · 15 verificações · EXIT=0
   ├ autoteste embutido       → tudo passou · 41 verificações · 3 avisos
   ├ pedágios por rota        → tudo passou · 40 verificações
   ├ detector de pedágio      → tudo passou · 126 verificações
   ├ pedágio na tela          → tudo passou · 40 verificações
   └ console limpo em todos os caminhos
node baseline-comparar.js     → nada que não devia mudar mudou · EXIT=0
```

Dois números de fontes independentes batem, o que é um bom sinal: o autoteste
embutido do painel relata «125 gráficos mapeados» e a captura de regressão,
escrita sem conhecer esse número, colheu **125**.

### 4.5 O que já existia e continua valendo

| ferramenta | o que prova |
|---|---|
| `testes/rodar.js` | 15 verificações de navegação, dados e UI · exige 15/15, saída 0, console limpo |
| `tools/sint.js` | sintaxe de todos os 38 blocos `<script>` |
| `tools/intocadas.js` | compara byte a byte 25 funções intocáveis entre a base congelada e a versão atual |
| `tools/inventario.js` | varre os gráficos e grava `inventario.json` |
| `tools/medir.js` | tempo até o painel pronto, peso de rede e heap (novo nesta etapa) |
| `tools/medir_movel.js` | o que o celular vê a 390 px, painel por painel (novo nesta etapa) |
| `tools/worker.js` | confirma que o parse da planilha roda em Web Worker (novo nesta etapa) |

---

## 5 · Plano de correção

Em ordem de «quanto compra por quanto custa». Nenhum item foi executado — a
etapa manda não refatorar.

| ordem | item | risco | esforço | o que você passa a ter |
|---|---|---|---|---|
| 1 | Conferir o compartilhamento da planilha no Google | A4 | 2 min | certeza de que ninguém edita sua fonte |
| 2 | Trocar os **66 `catch` vazios que engolem chamada de card** por `catch(e){ console.warn('<card>:', e); }` (dois deles — `campo.focus`, `search.focus` — podem ficar como estão) | A2 | 1–2 h | card que quebra passa a avisar que quebrou, e o `rodar.js` passa a enxergar a falha |
| 3 | Espelho para `xlsx` (mesmo padrão já usado no Plotly) | A3 | 1 h | painel sobrevive a jsdelivr bloqueado |
| 4 | **Versionar a pasta `testes/`** (já contemplada no `.gitignore`, mas nunca commitada) | B6 | 15 min | a proteção deixa de depender de um disco só |
| 5 | Rodar `rodar.js` + `baseline-comparar.js` no CI a cada push | B3 | 2 h | regressão aparece no mesmo dia, não no mês seguinte |
| 6 | Altura responsiva nos 27 cards empilhados (mínimo ~140 px por painel no celular) | M4 | 3 h | o painel de baixo volta a ser legível no telefone |
| 7 | `.gitattributes` / exclusão de parquets e scripts do pacote do Pages | M6 | 1 h | deploy mais leve, menos superfície publicada |
| 8 | Carga sob demanda da planilha de opções (só ao abrir `m3_3_5g`) | M3 | 4 h | corta vários MB e alguns segundos do boot |
| 9 | Decisão de infraestrutura (seção 2.6) | A1 | depende | acesso de verdade, se for esse o objetivo |

Os itens 2, 3, 4, 6 e 7 **não mudam nenhum cálculo** — são exatamente o tipo de
alteração que o registro de regressão da seção 4 consegue provar inofensiva.

---

## 6 · Critérios de teste

Para **qualquer** alteração deste ponto em diante, a barra é:

1. **`node tools/sint.js`** — nenhum erro de sintaxe (hoje confere **26 blocos**; o conferidor casa blocos com `</script>` literal e por isso cobre 26 das 27 tags inline).
2. **`node tools/intocadas.js`** — as 25 funções intocáveis byte a byte idênticas
   à base congelada (`index_base.html`).
3. **`cd testes && node --max-old-space-size=4096 rodar.js`** — **15/15**, saída
   **0**, console **limpo**. ~10 minutos.
4. **`cd testes && node baseline-comparar.js`** — **saída 0**. Qualquer item em
   DURO, DESAPARECEU ou PAROU DE CHEGAR precisa de explicação escrita antes do
   commit. Se a mudança for intencional e justificada, o retrato é atualizado com
   `--atualizar` **e a justificativa entra na mensagem do commit**.
5. **Conferência visual no site publicado**, não em cópia local, depois de cada
   publicação — foi assim que as duas últimas entregas foram validadas.
6. **Cálculo alterado exige prova aritmética independente**: a nova fórmula
   calculada à mão ou em planilha, comparada com a saída do painel, no próprio
   texto da entrega.

---

## 7 · Decisões que dependem da sua autorização

1. **Infraestrutura (seção 2.6).** Qualquer uma das opções A, B ou C muda
   hospedagem — regra 12. Nada será executado sem o seu «pode ir».
2. **Compartilhamento da planilha-fonte.** Só você pode abrir e conferir.
3. **Termos de CEPEA e Scot.** Verificação contratual, não técnica.
4. **Rodar os testes no CI.** Gasta minutos de GitHub Actions do plano. Precisa
   do seu aval sobre o custo.
5. **Excluir parquets e scripts do pacote do Pages.** Reduz o deploy, mas muda o
   que fica servido na URL — mudança de comportamento público, ainda que de
   arquivos que o painel não usa.

---

## 8 · Limitações desta auditoria

- **Três verificações externas ficaram pendentes** por bloqueio de saída do
  ambiente: nível de compartilhamento da planilha, download direto pela URL do
  Pages e termos de uso das fontes. Nenhuma foi contornada por outro caminho.
- **Os 83 contêineres de gráfico sem desenho observado** não foram investigados um a um.
  Alguns são variantes de tela pequena, outros podem ser resto. Precisa de
  varredura dedicada antes de qualquer remoção — regra 2.
- **As medições de tempo e peso** vêm do laboratório local, que serve as
  planilhas pela rede local. Na internet real, o tempo é maior; a proporção
  entre as partes é a mesma.
- **Nenhuma fórmula foi auditada quanto à correção econômica.** Esta etapa
  registra o que elas respondem hoje; não afirma que o que respondem está certo.
  São coisas diferentes, e a segunda precisa da sua leitura de mercado, não da
  minha.

---

## 9 · Arquivos criados ou alterados nesta etapa

| arquivo | estado |
|---|---|
| `docs/AUDITORIA_TECNICA.md` | **novo** — este documento |
| `testes/baseline-captura.js` | **novo** — captura o retrato numérico |
| `testes/baseline-comparar.js` | **novo** — compara e classifica DURO × MOLE |
| `testes/baseline.json` | **novo** — o retrato de referência (111 KB) |
| `testes/baseline-agora.json` | gerado pela comparação; pode ser apagado à vontade |
| `tools/medir.js`, `tools/medir_movel.js`, `tools/worker.js` | **novos** — medição de carga, de celular e do caminho de parse |
| branch `desenvolvimento` | **criada** a partir de `main` em `9aa8850` |
| `index.html` | **não tocado** — SHA-256 idêntico ao de produção |

Nenhuma funcionalidade, indicador, contrato, filtro, gráfico, calculadora ou
relatório foi removido ou alterado.
