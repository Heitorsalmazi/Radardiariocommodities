# Visão Executiva — Etapas 4 e 6

*Radar Diário de Commodities · BMS AgroBrasil · 12/10/2026*

Uma área nova do painel que responde cinco perguntas numa tela: como está o
mercado, como estão as relações de troca, qual é a margem projetada, que riscos
merecem atenção e que análise precisa ser aberta.

Este documento diz **de onde vem cada número**. É o contrato da tela: se algo
aparecer aqui que não esteja na tela, ou na tela que não esteja aqui, um dos
dois está errado.

---

## 1. O princípio

A Visão Executiva **lê**. Ela não calcula margem, não dimensiona contrato e não
estima preço. Todo número vem de um destes três lugares:

| origem | o que entrega | auditada em |
|---|---|---|
| a planilha do Radar | preço, data, variação, relação de troca | Etapa 1 |
| `__3M_calcEngine` | custo, break-even, margem, arrobas | Etapas 2 e 2.1 |
| `_hsDimensiona` (`hsCalcEngine`) | contratos, cobertura, excedente | Etapa 2.1 |

Nenhuma fórmula financeira foi reescrita. Onde falta dado aparece **"Dados
insuficientes para análise"** — nunca um número de enchimento, nunca uma
estimativa sem fonte.

A referência de preço físico do boi continua sendo o **CEPEA**, em toda a tela.
A diferença contra o BGI é apresentada como o que é — a distância entre o
indicador físico CEPEA e o mercado futuro da B3 — sem afirmar convergência no
vencimento.

---

## 2. Onde ela mora

A tela entrou como **quarto ambiente**, à frente de MERCADO, ESTUDO e DECISÃO,
com uma seção própria (`m3_0_1`). Nenhuma seção antiga mudou de lugar, de
conteúdo ou de comportamento.

**Tela de entrada.** Na primeira carga depois desta atualização o painel abre na
Visão Executiva e grava `ve_apresentada_v1`; da segunda em diante volta a abrir
onde o operador parou. Para quem chega agora, ela é simplesmente a primeira
tela. Forçar sempre apagaria a memória de navegação; nunca abrir esconderia a
tela nova de quem mais vai usá-la.

---

## 3. O que cada bloco mostra

### A · Cabeçalho

| campo | como é obtido |
|---|---|
| Data de referência | a **mais recente** entre as últimas datas válidas das sete fontes |
| Última atualização válida | a mesma data, com a contagem de fontes que responderam |
| Diagnóstico das fontes | tabela: indicador, fonte, aba, último pregão, nº de pregões, situação |

A situação é "em dia" até 7 dias de distância do pregão mais recente, e passa a
mostrar a idade em dias depois disso. Datas repetidas na mesma aba são contadas
e exibidas — elas mudam a leitura de "variação contra o pregão anterior".

### B · Indicadores principais

Onze cards. Cada um traz **valor, unidade, variação contra o pregão anterior
(em moeda e em %), data da cotação e a aba de origem**, mais um atalho para a
análise detalhada.

| card | aba | unidade |
|---|---|---|
| Boi gordo — físico (CEPEA) | `BOI GORDO` | R$/@ |
| Boi gordo — futuro (BGI) | vencimento de referência | R$/@ |
| Milho — físico (CEPEA) | `MILHO - CEPEA` | R$/sc 60 kg |
| Milho — futuro (CCM) | 1º vencimento vigente | R$/sc 60 kg |
| Soja — físico (Paranaguá) | `SOJA - PARANAGUÁ` | **R$/sc 60 kg** (ver §7) |
| Soja — futuro (SJC) | 1º vencimento vigente | **US$/sc 60 kg** |
| Dólar — futuro (DOL) | 1º vencimento vigente | **R$/US$** (cotação ÷ 1.000) |
| Diferença CEPEA × BGI | as duas acima | R$/@ |
| Relação de troca BGI/CCM | BGI ÷ CCM | sacas de milho por @ |
| Break-even — margem bruta zero | motor de custo | R$/@ |
| Margem bruta sobre a receita | motor de custo | % |

A unidade é **função do símbolo**, não do seletor de ativo do topo da página:
a tela mostra sete instrumentos ao mesmo tempo, e cada card precisa saber a
própria unidade. Símbolo desconhecido não vira reais por suposição — fica sem
formatação, declarada.

### C · Mercado e custos

Três gráficos compactos, cada um no seu card, com 210 dias:

1. **Boi gordo — físico e futuro**: CEPEA e o vencimento de referência, os dois em R$/@.
2. **Milho — físico e futuro**: CEPEA e CCM, os dois em R$/saca de 60 kg.
3. **Relação de troca**: físico (CEPEA boi ÷ CEPEA milho) e futuro (BGI ÷ CCM), em sacas/@.

As duas séries de cada gráfico compartilham eixo porque compartilham unidade.
A relação de troca só usa **dias em que as duas pontas negociaram** — dia sem
as duas não entra, e nada é interpolado.

Um gráfico só é criado se tiver série. Sem dado não nasce `div` de gráfico
vazio: nasce a ausência declarada.

### D · Oportunidades e riscos

**VENDA DO BOI** — uma linha por vencimento BGI vigente:

| coluna | conta |
|---|---|
| Preço | última cotação da aba do contrato |
| Data | data desse pregão |
| Break-even | `cmv ÷ (arC × (1 − perdas) × (1 − dedução))` — do motor |
| Distância | preço − break-even |
| Margem bruta (% da receita) | `mB ÷ rec` — do motor, **sobre a receita líquida** |
| Margem bruta (R$/cab) | `mB` — do motor |

O break-even é igual em todas as linhas porque não depende do preço de venda.
A margem é a **margem sobre a receita**; não confundir com retorno sobre o
custo, que divide a mesma diferença por outro denominador e dá número maior —
a distinção que a Etapa 2 estabeleceu.

Sem premissas, preço e data continuam aparecendo (são dados de mercado) e as
colunas de custo mostram a ausência declarada.

**COMPRA DE INSUMOS** — evolução do milho físico e futuro em 30, 180 e 365
dias, e o **impacto medido** no custo:

> o motor de custo roda **duas vezes**, com tudo igual exceto o preço do milho
> — a premissa salva contra o preço de hoje. A diferença entre os dois
> break-evens é o impacto.

Vale apenas quando a dieta das premissas é formada **pelo preço do milho**
(`dietaModo = ms`, com confinamento). Com dieta em custo por dia não há
sensibilidade a medir, e a tela diz isso em vez de inventar uma.

Um traço numa coluna de variação significa que **a série não alcança aquela
janela** — não que o preço ficou parado.

**PROTEÇÃO FINANCEIRA** — exposição informada, cobertura e riscos observados:

- *Exposição física do boi*: cabeças × arrobas vendáveis por cabeça. As
  arrobas vendáveis saem do motor (`recB ÷ preço` = `arC × (1 − perdas)`), não
  de um fator fixo.
- *Travado*: soma do registro de **Minhas Travas**, por produto e por lado
  (venda e compra separadas — somar as duas esconderia as duas pontas).
  Registro com contrato ou quantidade inválidos é descartado **e avisado**.
- *Cobertura efetiva*: travado ÷ exposição.
- *Dimensionamento*: as duas opções de arredondamento, sempre — quantos
  contratos para baixo e para cima, com o volume e o percentual de cada uma, e
  o aviso quando o alvo é menor que um contrato.
- *Riscos observados*: frases calculadas, com o número e a base de cada uma.
  **Não são recomendação de operação.**

### C2 · Margem do ciclo — vencimento de referência *(Etapa 6)*

O resultado econômico do lote ao preço do vencimento escolhido, em doze
leituras:

| Indicador | De onde vem |
|---|---|
| Preço de venda | planilha, contrato de referência |
| Peso projetado de abate | `calcEngine.pAb` |
| Arrobas comercializadas | `calcEngine.arC` |
| Custo total por cabeça | `calcEngine.cT` |
| Custo por arroba vendida | `cT ÷ arC` — a única divisão feita na tela, rotulada como tal |
| Break-even — margem bruta | `calcEngine.bMB` |
| Break-even — lucro líquido | `calcEngine.bLL` |
| Margem bruta por cabeça e % | `calcEngine.mB` e `mbP` |
| Lucro líquido por cabeça e % | `calcEngine.lL` e `llP` |
| ROI do ciclo | `calcEngine.roi` |
| Custo da arroba incremental | `calcEngine.cAI` |
| Cabeças e resultado do lote | `calcEngine.nC` e `lLote` |

**Todo número sai de `__3M_calcEngine`**, o motor auditado nas Etapas 2 e 2.1,
pela porta `_veMotor.custo`. Esta tela não tem fórmula financeira própria e não
deve ganhar uma — há teste (V19) que compara, número a número, o que está na
tela com o que o motor devolveu chamado direto.

Sem premissas suficientes, o bloco declara **o que falta, campo a campo**, e
não mostra margem nenhuma. Um número de enchimento aqui seria pior que a
ausência dele.

Duas observações automáticas, quando cabem:

- **Horizonte.** Se o ciclo é mais longo que a distância até o vencimento, a
  tela diz — e deixa claro que as premissas **não** foram ajustadas por isso.
- **Milho da dieta.** O preço do milho que entra no custo vem do cenário padrão
  (média da curva CCM na janela do cocho), não do contrato CCM mostrado nos
  cards. São duas perguntas diferentes, e a tela separa as duas.

---

### E · Navegação

Cada indicador e cada bloco tem um atalho que leva ao componente onde a análise
mora, por `m3IrAlvo(seção, gráfico)`. Nada é duplicado: o cálculo continua
existindo num lugar só.

---

## 4. Premissas da operação

Os nomes dos campos são os mesmos que `__3M_calcEngine` espera, para que o
objeto entre no motor sem tradutor no meio — tradutor é onde um campo se perde
em silêncio.

### Três fontes, nesta ordem *(Etapa 6)*

Até a Etapa 4 a tela abria vazia e exigia preencher 39 campos à mão antes de
mostrar qualquer margem. Agora ela abre com o cenário que o Radar já usa:

| Prioridade | Fonte | Como aparece no campo |
|---|---|---|
| 1 | O que o operador salvou **nesta tela** | `personalizado` |
| 2 | O que ele preencheu na **Calculadora do Boi** | `da Calculadora` |
| 3 | O **cenário padrão de confinamento** do card BGI × cAI | `padrão` |
| — | Sem fonte válida | `pendente`, e a margem não é calculada |

**Não existe um segundo conjunto de premissas padrão.** O cenário da camada 3
é lido do card BGI × cAI (`window._caiCenarioPadrao`), que já o monta a partir
de `_CAI_PADRAO`, do que estiver na Calculadora e da reposição. Se um dia
aquele cenário mudar, esta tela muda junto — por construção, não por
manutenção.

**Placeholder não é dado.** Os campos da Calculadora têm `placeholder`
("ex: 375") e nenhum `value`, então um campo intocado devolve string vazia e
não entra. Além disso, `getState()` devolve `"0"` por padrão em oito campos e
`'pasto'` em `sistema`: aceitar isso de uma Calculadora intocada trocaria o
sistema do cenário padrão de confinamento para pasto sem ninguém pedir. Por
isso **a camada da Calculadora só entra inteira, e só quando pelo menos um
campo que ela não preenche sozinha estiver preenchido**.

### Só o que você edita é salvo

Cada campo carrega a origem num atributo (`data-ve-origem`), e **editar um
campo é o que o torna seu**. "Salvar premissas" grava apenas os campos de
origem `personalizado`. Gravar o cenário padrão inteiro transformaria uma
suposição em cadastro no primeiro clique — e, no dia em que o padrão do Radar
mudasse, esta tela continuaria com o antigo sem ninguém saber.

| Botão | O que faz |
|---|---|
| **Salvar premissas** | grava os campos que você editou |
| **Copiar da Calculadora** | traz os valores de lá, numa direção só, e os marca como seus |
| **Restaurar premissas padrão** | apaga **suas edições** e mantém os vencimentos escolhidos |

**A Calculadora do Boi não foi alterada.** Ela continua lendo os próprios
campos ao vivo e continua sem persistência.

Campos próprios da Visão Executiva, que não vão para o motor de custo:
`veCabecasVender`, `veMilhoSacas`, `vePctTrava`, `veArredonda`, `veVencRef`,
`veVencCCM`, `veVencSJC`.

O que você salvar fica **neste navegador**, na chave `ve_premissas_v1`. Trocar
de máquina ou limpar os dados do site apaga as suas edições — o cenário padrão
volta sozinho, porque ele não é salvo em lugar nenhum.

---

## 5. Filtros e o casamento dos vencimentos

O **vencimento BGI de referência** comanda a tela. Milho e soja **acompanham**
*(Etapa 6)*: até a Etapa 5 o BGI usava o vencimento escolhido e CCM e SJC
usavam sempre o primeiro vigente da própria curva — com o boi em janeiro e o
milho em novembro, a relação de troca comparava dois horizontes diferentes e
chamava isso de relação de troca.

### A regra

1. **Mesmo mês e ano** do BGI de referência;
2. senão, o **primeiro vencimento posterior**;
3. senão, **nada** — e a tela diz, com o motivo.

Nunca o primeiro da curva por omissão: voltar ao começo em silêncio era o
defeito. Nunca um contrato vencido: `vigentes()` já os descarta. E nunca um
pulo — se existe um contrato entre o BGI e o escolhido, a regra errou (há
teste).

A chave de comparação vem de `_contractMaturityKey`, que decodifica **mês e
ano do código** do contrato (`BGIF27` → janeiro de 2027). É a data real do
vencimento, não a ordem da aba: duas abas fora de ordem continuam casando
certo.

### A correspondência de hoje (13/10/2026)

| BGI | CCM | critério | SJC | critério |
|---|---|---|---|---|
| BGIV26 (Out/26) | CCMX26 | posterior (+1) | SJCX26 | posterior (+1) |
| BGIX26 (Nov/26) | CCMX26 | **mesmo mês** | SJCX26 | **mesmo mês** |
| BGIZ26 (Dez/26) | CCMF27 | posterior (+1) | SJCF27 | posterior (+1) |
| BGIF27 (Jan/27) | CCMF27 | **mesmo mês** | SJCF27 | **mesmo mês** |
| BGIG27 (Fev/27) | CCMH27 | posterior (+1) | SJCH27 | posterior (+1) |
| BGIH27 (Mar/27) | CCMH27 | **mesmo mês** | SJCH27 | **mesmo mês** |
| BGIJ27 (Abr/27) | CCMK27 | posterior (+1) | SJCK27 | posterior (+1) |
| BGIK27 (Mai/27) | CCMK27 | **mesmo mês** | SJCK27 | **mesmo mês** |
| BGIM27 (Jun/27) | CCMN27 | posterior (+1) | SJCN27 | posterior (+1) |
| BGIV27 (Out/27) | CCMX27 | posterior (+1) | — | **indisponível** |

Repare em BGIV26 e BGIX26: **os dois caem em CCMX26**. Não é erro — o milho
vive em janeiro, março, maio, julho, setembro e novembro, e o boi tem contrato
em quase todo mês. Dois vencimentos de boi seguidos podem legitimamente
corresponder ao mesmo contrato de grão, e a tela escreve o critério ao lado de
cada um para que isso se veja.

E repare em BGIV27: a curva da soja termina em SJCU27, antes dele. A tela
mostra **"sem contrato correspondente"** e o card da soja futura fica em `—`.
Não volta para SJCX26.

### Os três contratos ficam escritos

Ao lado dos seletores, a tela nomeia o que está efetivamente em uso:
*Vencimento de referência (BGI)*, *Milho futuro utilizado (CCM)* e *Soja futura
utilizada (SJC)*, cada um com o critério em duas palavras.

A explicação da regra **não** fica na tela: ela mora aqui, nesta seção. O que o
painel mostra é o critério de cada contrato e, quando falta correspondente, o
motivo da ausência — isso é informação, não explicação, e sem ela o operador
não saberia por que um card está vazio.

### Seleção manual

Milho e soja têm seletor próprio, em **"Automático — vinculado ao BGI"** por
padrão. Escolher um contrato à mão fixa aquela curva até o operador voltar ao
automático; o rótulo passa a dizer *"escolhido à mão"*. A escolha fica salva
junto das premissas.

### O que o vencimento muda e o que não muda

| Acompanha o vencimento | Não acompanha |
|---|---|
| preço do futuro BGI | preços físicos CEPEA (boi, milho, soja) |
| futuro CCM e futuro SJC casados | dias de cocho, GMD, peso de entrada |
| relação de troca BGI/CCM | custo da @ de entrada e demais custos |
| gráficos, séries e legendas | break-even (não depende do preço de venda) |
| margem, lucro e ROI do ciclo | peso de abate, arrobas, custo total |
| datas e diagnóstico das fontes | as suas personalizações |

**Trocar o vencimento não encurta o confinamento de ninguém.** Quando o
horizonte do contrato não comporta o ciclo, a tela escreve uma observação — não
ajusta as premissas zootécnicas por conta própria.

A tela é de painel, não de ativo: trocar o contrato ou o universo no topo da
página não a esconde nem a esvazia — e há teste para isso.

---

## 6. Como rodar os testes

```bash
cd /home/claude/serve && python3 -m http.server 8777 &     # laboratório no ar
cd /home/claude/proj/testes
node visao-executiva-testes.js http://127.0.0.1:8777/local.html   # 151
node navegacao-testes.js http://127.0.0.1:8777/local.html        # 78
node financeiro-testes.js           # 210 + 48 (Etapas 2 e 2.1)
node rodar.js                       # 15 (regressão de tela, inclui pedágio)
node baseline-comparar.js           # retrato numérico
```

### Resultado desta rodada — 13/10/2026

| Suíte | Verificações | Resultado |
|---|---|---|
| `visao-executiva-testes.js` | **151** (eram 118) | todas passaram |
| `navegacao-testes.js` | 78 | todas passaram |
| `financeiro-testes.js` | 210 + 48 | todas passaram |
| `rodar.js` | 15 | todas passaram (inclui pedágios 40 + 126 + 40) |
| `baseline-comparar.js` | retrato DURO/MOLE | **"nada que não devia mudar mudou"** · 36 dados do dia se mexeram (esperado) |
| `tools/intocadas.js` | 25 funções | 24 idênticas + `calcEngine` autorizada na Etapa 2 |

### Os 33 testes novos *(Etapa 6)*

| Bloco | O que prova |
|---|---|
| **V13** (5) | todo par casado é do mesmo mês ou do primeiro posterior, nunca anterior; nenhum vencimento intermediário foi pulado; nenhum vencido entra; o milho deixou de ser sempre o primeiro vigente; um mesmo CCM pode servir a dois BGI |
| **V14** (5) | a tela nomeia os três contratos, e os nomeados são os que o motor casou; quando não há par, ela diz — e não cai no primeiro da curva |
| **V15** (1) | os preços físicos CEPEA não mudam com o vencimento futuro |
| **V16** (5) | no primeiro acesso a tela abre com o cenário padrão, com premissas suficientes, custo de entrada vindo da reposição, **sem gravar nada**, e com a margem já calculada |
| **V17** (5) | trocar o vencimento muda preço e margem e **não** muda dias de cocho, GMD, custo de entrada, peso de abate, arrobas, custo total nem break-even |
| **V18** (5) | salvar grava só o campo editado; a edição sobrevive à troca de vencimento; a escolha manual do milho é respeitada e o automático volta; restaurar padrão apaga a edição e preserva o vencimento |
| **V19** (1) | a tela não recalcula: o que ela mostra é o que o `calcEngine` devolveu |
| **V20** (6) | derrubando o cenário padrão de propósito, a ausência volta a ser declarada, campo a campo, sem número de enchimento |

Três verificações de V6 **mudaram de expectativa** porque a especificação
mudou: elas exigiam "Dados insuficientes" na abertura, o que era correto
quando a tela abria vazia e passou a ser o defeito quando ela passa a abrir com
cenário. O teste da ausência não sumiu — foi para V20, mais exigente, que
derruba o cenário de propósito para cobrá-lo de volta. Nenhuma assertiva foi
afrouxada.

Uma falha dos próprios testes foi corrigida junto: V14, V15 e V17 guardavam a
referência do `<select>` antes do laço, e `renderFiltro` reescreve o filtro a
cada redesenho — as trocas seguintes aconteciam num nó solto do documento e o
teste media sempre o primeiro vencimento achando que media todos.

A suíte da Visão Executiva abre o painel **duas vezes**: sem premissas, para
provar que a ausência vira "Dados insuficientes para análise"; e com premissas
e travas, para conferir margem, impacto e cobertura contra os motores
auditados. Tudo roda contra `window._veMotor` e `window._veRender` — o código
que vai ao ar —, nunca contra uma cópia da fórmula.

---

## 7. Achado da etapa: a unidade da soja física

`_activePriceUnit` rotula a aba `SOJA - PARANAGUÁ` como **US$/saca**, no mesmo
ramo do contrato SJC. **Os dados dizem reais.**

Prova interna, 39 pregões em que a soja física, o SJC e o dólar negociaram no
mesmo dia:

| data | físico | SJCX26 | dólar | SJC em R$ | físico ÷ SJC em R$ |
|---|---|---|---|---|---|
| 26/08/2026 | 154,57 | US$ 27,9101 | 5,1928 | 144,93 | 1,067 |
| 27/08/2026 | 155,05 | US$ 27,9541 | 5,2003 | 145,37 | 1,067 |
| 28/08/2026 | 159,76 | US$ 28,3951 | 5,2438 | 148,90 | 1,073 |

Mediana da razão nos 39 pregões: **1,067** — um prêmio de porto de 7% sobre o
futuro convertido. Se a série estivesse em dólar, a razão seria o próprio
câmbio, perto de 5,2.

**O que foi feito:** a Visão Executiva mostra **R$/sc** e declara a divergência
no diagnóstico das fontes, com os números do dia. A tela antiga **não foi
alterada** — mudar o comportamento dela exige autorização. Corrigir
`_activePriceUnit` é item pendente.

---

## 8. Limitações

1. **`_activePriceUnit` segue rotulando a soja física em dólar.** Enquanto não
   for corrigida, as duas telas divergem — por isso a divergência é declarada
   na tela, e não emendada num canto só.
2. **Premissas são deste navegador.** Não acompanham o operador entre máquinas.
3. **O impacto do milho só existe com dieta formada pelo preço do milho.** Com
   custo de dieta por dia, a tela diz que não há o que medir.
4. **Travas são as registradas.** Posição não registrada não entra na conta —
   e a tela diz isso.
5. **Nada considera base regional, corretagem, emolumentos nem ajuste
   diário.** A margem é a do motor de custo, no preço de tela.
6. **Celular em uma coluna.** A regra global do painel
   (`[class*="grid"]{ grid-template-columns:1fr !important }` abaixo de 768 px)
   manda, e esta folha não a contraria.
7. **A página inteira transborda 20 px na horizontal em telas estreitas.**
   É anterior a esta etapa e igual em todas as seções — medido em seis delas.
8. **Dedução, perdas e juros vêm das premissas.** Premissa errada entra no
   motor como qualquer outra; a tela confere a presença dos campos, não a
   verdade deles.
9. **O cenário padrão é um cenário, não a sua operação** *(Etapa 6)*. Ele abre
   com 1 cabeça, dedução 0%, perdas 0% e arrendamento 0% — e por isso "custo
   por arroba vendida" e "break-even de lucro líquido" saem iguais, o que a
   própria tela explica. Informe dedução e perdas para que se separem, e o
   número de cabeças para que o resultado do lote faça sentido.
10. **O custo da @ de entrada do padrão é derivado, não cotado** *(Etapa 6)*.
   Vem da reposição que o card BGI × cAI já usa: boi físico CEPEA de hoje mais
   o ágio do card (8% por omissão). É o método que já existia no Radar, não um
   preço de compra inventado para fechar o cenário — mas também não é o preço
   que você pagou. Se você tem o seu, informe-o.
11. **O milho da dieta e o milho do card são números diferentes** *(Etapa 6)*.
   O da dieta é a média da curva CCM na janela do cocho; o do card é o contrato
   CCM casado com o BGI. A tela diz isso onde os dois aparecem juntos.
12. **O casamento usa mês e ano, não o dia do vencimento** *(Etapa 6)*. A
   planilha não traz a data exata de liquidação de cada contrato; traz o
   código, que carrega mês e ano. Para escolher entre contratos de meses
   diferentes isso basta e é exato. Para comparar dois contratos do mesmo mês
   não haveria o que decidir.

---

## 9. Arquivos

| arquivo | o que mudou |
|---|---|
| `index.html` | quatro pontos de contato na navegação, duas correções no autoteste, estilo e dois blocos de código novos |
| `testes/visao-executiva-testes.js` | 151 verificações (eram 118) |
| `testes/baseline.json` | retrato readotado (ver `BASELINE-LEIA-ME.md`) |
| `testes/BASELINE-LEIA-ME.md` | registro da readoção |
| `docs/VISAO_EXECUTIVA.md` | **novo** — este documento |
