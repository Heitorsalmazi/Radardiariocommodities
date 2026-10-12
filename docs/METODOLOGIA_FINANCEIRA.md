# Metodologia financeira — Radar Diário de Commodities

**Etapa 2 · 12 de outubro de 2026**
**Objeto:** todas as fórmulas financeiras e econômicas do painel.
**Régua:** `testes/formulas-referencia.js` — as definições em código, conferidas
por `testes/financeiro-testes.js` (94 verificações sem navegador + 13 contra o
motor que roda na tela).

---

## 0 · A distinção que organiza o documento inteiro

Dois números, duas perguntas, dois nomes. Trocar um pelo outro infla o
resultado — sempre para cima, enquanto houver lucro.

| | fórmula | a pergunta que responde |
|---|---|---|
| **Margem sobre receita** | (R − C) ÷ R | de cada real **vendido**, quanto sobra |
| **Retorno sobre custo** | (R − C) ÷ C | cada real **investido** rendeu quanto |
| **ROI (retorno sobre capital)** | lucro ÷ capital empregado | o dinheiro **parado** rendeu quanto |

Com receita de R$ 350/@ e custo de R$ 300/@:

```
resultado             = R$ 50,00/@
margem sobre receita  = 50 ÷ 350 = 14,2857%
retorno sobre custo   = 50 ÷ 300 = 16,6667%
```

Uma se converte na outra: `r = m/(1−m)` e `m = r/(1+r)`. São a mesma
informação em bases diferentes — o que não se pode é chamar as duas pelo mesmo
nome, que era exatamente o que acontecia em um dos cards.

Com **prejuízo a ordem se inverte**: a margem fica mais negativa que o retorno
(com R$ 280 de receita e R$ 300 de custo, margem −7,14% e retorno −6,67%).
O teste `A2` no arquivo de testes fixa isso.

---

## 1 · O que foi corrigido, e o que isso muda nos números

| # | onde | natureza | o número muda? |
|---|---|---|---|
| **E2.1** | `calcEngine` — break-even | **erro matemático** | **sim**, quando há dedução sobre a receita |
| **E2.2** | Matriz Operacional — «MB%» | nome errado | não — o número é o mesmo, com o nome certo |
| **E2.3** | Card de travas — moeda e unidade | rótulo errado | não |
| **E2.4** | Base regional — convergência | explicação incorreta | não |
| **E2.5** | Campos de juros | rótulo incompleto | não |
| **E2.6** | Comentário da @ do bezerro | comentário errado | não |
| **E2.7** | Fórmulas na tela + nomes dos percentuais | acréscimo | não |
| **E2.8** | Simulador de hedge — moeda da soja | rótulo errado | não |

### E2.1 · O break-even punha a dedução no lugar errado — único caso em que um número muda

**O defeito.** Deduções proporcionais à receita (Funrural e afins) entravam
**somadas ao custo**, no numerador. Como o valor da dedução era calculado a
partir do preço corrente, o break-even passava a **depender do preço que estava
sendo testado**. Medido no motor real, mesmo lote, mesma dedução de 1,5%:

```
break-even de margem bruta avaliado com venda a R$ 320/@ → R$ 254,83
break-even de margem bruta avaliado com venda a R$ 400/@ → R$ 256,03
```

Um ponto de equilíbrio que muda conforme o preço que você testa não é um ponto
de equilíbrio.

**A correção.** A dedução é proporcional ao preço, então pertence ao
denominador:

```
margem bruta zero   →  preço = CMV ÷ (@carcaça × (1−perdas) × (1−dedução))
lucro líquido zero  →  preço = (CMV + despesas + tributos)
                               ÷ (@carcaça × (1−perdas) × (1−dedução))
```

**O que muda na tela.** Nada, enquanto a dedução estiver em zero — e zero é o
valor padrão do campo. A partir daí:

| dedução | break-even LL antes | depois | diferença |
|---:|---:|---:|---:|
| 0,0% | R$ 276,24 | R$ 276,24 | — |
| 0,5% | R$ 276,24 | R$ 277,62 | +R$ 1,39 |
| 1,0% | R$ 276,24 | R$ 279,03 | +R$ 2,79 |
| **1,5%** | **R$ 276,24** | **R$ 280,44** | **+R$ 4,21** |
| 2,0% | R$ 276,24 | R$ 281,87 | +R$ 5,64 |
| 3,0% | R$ 276,24 | R$ 284,78 | +R$ 8,54 |

**O sentido do erro importa mais que o tamanho.** O break-even estava
**baixo demais**: o painel dizia que o empate acontecia num preço menor do que
o real. Um preço de venda entre os dois valores aparecia como lucro e era
prejuízo. E `bLL` não fica no card: é publicado em `__3M_SINAIS.cai` e vira o
«custo da @ vendida» no card *BOI × cAI* e no veredito de *Travar agora paga?*.

**Quem usa dedução diferente de zero precisa reconferir** qualquer análise
guardada: o break-even dela subiu.

### E2.2 · «MB%» era retorno sobre custo com nome de margem

Na Matriz Operacional o indicador era calculado assim:

```js
mb = (preço ÷ breakeven) − 1
```

Isso é `(R − C)/C` — **retorno sobre custo**. Estava rotulado «MB%» e «MB
atual», e as metas apareciam como «Preço p/ MB 10%».

**O número não foi alterado.** Trocar a conta mudaria todo relatório já
emitido, e a Etapa 2 é explícita quanto a isso. O que estava errado era o nome:

- a linha da tabela passa a ser **«RSC% (retorno sobre custo)»**;
- entra uma linha nova, **«Margem s/ receita»**, calculada da mesma base por
  `m = r/(1+r)` — mesma informação, a outra leitura, sem recalcular nada;
- o quadro passa a mostrar os dois: *Retorno s/ custo* e *Margem s/ receita*;
- as metas viram **«Preço p/ RSC x%»**, que é o que a conta `BE × (1+r)` faz.

Em números, com breakeven de R$ 300 e preço de R$ 350: o painel mostrava
«MB 16,67%» e passa a mostrar «RSC 16,67%» e «Margem 14,29%».

### E2.3 · O card de travas escrevia R$ em cima de valores em dólar

O módulo **já sabia** a moeda certa: `TRV_ATIVOS` traz `cifrao:'US$'` para o
SJC, com uma nota correta explicando que a soja da B3 é cotada em dólar por
saca. Os KPIs e a leitura respeitavam isso. A **tabela**, os **eixos** e os
**hovers** escreviam `R$` fixo — então uma trava de soja aparecia como
«R$ 25,40» e «+R$ 1.234,00», sendo os dois números em dólar.

Corrigido: tabela, eixo do ajuste acumulado e todos os hovers passam a usar
`_CFG.cifrao`. O rótulo do campo de preço e o cabeçalho de quantidade passam a
seguir o ativo: «Preço (R$/@)» e «@ totais» para o boi, «Preço (R$/sc)» e
«Sacas totais» para o milho, «Preço (US$/sc)» e «Sacas totais» para a soja.

No mesmo card, o rodapé do pior cenário dizia sempre «se o boi subir 25%».
Para uma posição **comprada** o pior cenário é a **queda**, e para milho e soja
o animal nem é boi. Agora o texto é lido do próprio vetor de cenários: diz a
direção e o percentual que de fato produziram o pior número.

### E2.4 · Convergência da base: o que converge, e para onde

O texto afirmava que «físico e futuro têm de se encontrar na liquidação» e que
a base de um contrato longo «tende a se corrigir sozinha até a entrega».

As duas frases valem para **um** físico: o da referência de liquidação.

O contrato BGI é liquidado pelo **Indicador do Boi DATAGRO**, praça de **São
Paulo**, a partir dos vencimentos de fevereiro de 2025 (Ofício Circular B3
135/2024-PRE). Até BGIF25 a referência era o Indicador CEPEA/B3, também de São
Paulo. O card usa a aba CEPEA como «físico» — mesma praça, **metodologia
diferente**, então nem ali o resíduo precisa ir a zero.

E, principalmente: **a diferença regional não desaparece no vencimento.** A
distância entre o preço de São Paulo e o preço na porteira de quem está em Mato
Grosso, Goiás ou Pará é frete, qualidade do lote e oferta local — estrutural,
não conjuntural. Ela encolhe até o patamar regional e **para ali**. O que se
corrige sozinho até a entrega é a parcela conjuntural da base, não a regional.

O texto do card e a leitura automática foram reescritos com essa distinção.

### E2.5 · Os campos de juros pedem taxa **efetiva**

O painel converte a taxa por composição em todos os pontos — `(1+i)^(d/365)−1`
na calculadora, `(1+i)^(1/12)−1` no carrego do milho, `(1+i)^(dias/365)` no
desconto de prazo. Isso é tratar o número digitado como **taxa efetiva anual**.

Os rótulos diziam só «Taxa de juros a.a. (%)». Quem digitasse uma taxa
**nominal** estaria declarando um custo menor do que tem: 12% a.a. nominais com
capitalização mensal valem **12,6825%** efetivos. Os dois campos passam a dizer
«efetiva», com a conversão explicada no tooltip.

### E2.6 · Um comentário que trocava as duas arrobas

`// arroba de carcaça = 30 kg vivo` — a arroba de carcaça são 15 kg **de
carcaça**; dividir peso vivo por 30 dá a arroba de **peso vivo**. Comentário
corrigido. Nenhuma linha de código mudou.

### E2.7 · As fórmulas na tela

A coluna de resultado da Calculadora do Boi ganhou um bloco **recolhido por
padrão**, «Como cada número é calculado», com as unidades, a cascata do
resultado, as três razões percentuais, os dois break-evens, o custo da arroba
incremental e a regra dos juros. Quem não abrir não vê diferença.

No mesmo quadro, dois rótulos ganharam o denominador no nome: «Margem» virou
**«Margem líq. s/ receita»** e «ROI» virou **«ROI s/ capital»** — porque o
primeiro divide por receita e o segundo por capital, e os dois estavam lado a
lado sem dizer qual era qual.

### E2.8 · O simulador de hedge também escrevia R$ na soja

`hdgFRS()` formatava tudo com `'R$ '` fixo, e o simulador oferece Boi, Milho e
**Soja**. Agora cada ativo traz o seu cifrão e o formatador lê o do ativo em
foco. Nenhum número muda.

---

## 2 · As fórmulas, por módulo

### 2.1 Unidades — a origem de metade das confusões

Duas arrobas convivem no mercado brasileiro e **não são a mesma coisa**:

```
@ de peso vivo = 30 kg vivos          → como a REPOSIÇÃO é cotada
@ de carcaça   = 15 kg de carcaça     → como o BOI GORDO é pago
```

Elas **coincidem exatamente a 50% de rendimento**. Acima disso, a @ de peso
vivo subestima a carcaça. É por isso que a confusão passa despercebida: o erro
só aparece quando o rendimento se afasta de 50%.

```
peso de carcaça = peso vivo × rendimento
@ de carcaça    = peso de carcaça ÷ 15
@ de peso vivo  = peso vivo ÷ 30
equivalência    = R$/kg de carcaça × 15 = R$/@
```

**Arrobas produzidas** (`arC − arE`) é uma medida **comercial**, não física:
são as arrobas pelas quais o produtor recebe e que não pagou na compra. Ela
mistura as duas convenções **de propósito**, porque é assim que a compra e a
venda são cotadas — é a prática do confinamento, não um descuido. A leitura
física do ganho é outra conta, e o arquivo de referência traz as duas separadas
(`arrobasProduzidasComercial` e `arrobasGanhasFisicas`). Num lote de 330 kg que
sai com 612 kg a 53%, a comercial dá 10,624 @ e a física 9,964 @.

**A premissa escondida:** usar `peso ÷ 30` na entrada equivale a assumir **50%
de rendimento na compra**, enquanto a saída usa o rendimento que o usuário
digitou. É defensável (o boi magro rende menos que o terminado) e é a
convenção do mercado, mas é uma premissa, não uma medida — e agora está escrita.

### 2.2 Calculadora do Boi (`calcEngine`) — a cascata

```
ganho de peso     = Σ (GMD × dias) por fase
peso ao abate     = peso de entrada + ganho
@ de carcaça      = peso ao abate × rendimento ÷ 15
@ de entrada      = peso de entrada ÷ 30

originação        = custo da @ de entrada × @ de entrada + frete/cab + comissão/cab
alimentação       = suplementação no pasto + dieta no cocho
CMV               = originação + alimentação + sanidade + rastreio + terra
                    + juros da reposição + juros dos desembolsos
despesas          = operacional no período + juros sobre ele
tributos          = GTA + outros, por cabeça

receita bruta     = @ de carcaça × preço × (1 − perdas)
receita líquida   = receita bruta × (1 − dedução %)
margem bruta      = receita líquida − CMV
result. operacional = margem bruta − despesas
lucro líquido     = resultado operacional − tributos
custo total       = CMV + despesas + tributos

margem bruta %    = margem bruta       ÷ receita líquida
operacional %     = result. operacional ÷ receita líquida
líquida %         = lucro líquido      ÷ receita líquida       ← todas SOBRE RECEITA
ROI               = lucro líquido      ÷ capital empregado     ← SOBRE CAPITAL
```

**Custo da @ incremental:**

```
cAI = (CMV − originação − juros da reposição) ÷ (@ carcaça − @ peso vivo entrada)
```

Os juros da reposição saem do numerador porque incidem sobre o capital da
**compra**, que não pertence ao custo de **produzir** arroba nova. Eles voltam
no custo da @ vendida, via CMV.

**Capital empregado** (denominador do ROI) é `originação + insumos + opex +
tributos` — o dinheiro parado. **Não** inclui os encargos financeiros, que já
estão subtraídos no lucro. Por isso ROI ≠ retorno sobre custo: os denominadores
são diferentes, e o teste `B6` fixa essa diferença.

### 2.3 Juros — efetiva, composta, base 365

```
fator do período      = (1 + i)^(dias ÷ 365) − 1
taxa mensal equiv.    = (1 + i)^(1/12) − 1
nominal → efetiva     = (1 + i/m)^m − 1
valor presente        = valor ÷ (1 + fator do período)
```

Todo o painel usa **composição**, nunca a regra linear `i × dias/365`. Vale
registrar o sentido da diferença, que costuma surpreender: **abaixo de um ano o
composto cobra MENOS que o simples**. A 14% a.a. por 340 dias, composto 12,98%
e simples 13,04%. Acima de um ano a ordem se inverte. Nos 365 dias exatos os
dois coincidem.

**O multiplicador de juros.** O campo `jurosMult` (padrão 1,0) multiplica o
encargo sobre os **desembolsos** — alimentação, sanidade, rastreio, terra e
operacional. Com ele em 1,0 o modelo cobra juros do período inteiro sobre
dinheiro que é gasto ao longo do ciclo, o que **superestima** o custo
financeiro: na média o insumo fica parado metade do período. Quem quiser a
exposição média usa 0,5. É premissa do operador, e o padrão é o conservador.

### 2.4 Comissão, dedução e tributo — três naturezas

```
comissão percentual  = preço de origem × (% ÷ 100)     ← escala com o preço
comissão por cabeça  = valor informado                  ← não escala
dedução sobre receita= receita bruta × (% ÷ 100)        ← escala com o preço
tributo por cabeça   = GTA + outros                     ← não escala
```

A distinção não é formal: **o que escala com o preço entra no denominador do
break-even; o que não escala entra no numerador.** Foi exatamente a confusão
entre as duas naturezas que produziu o erro E2.1.

### 2.5 Reposição e preço colocado

```
frete ANTT       = km × CCD + CC
retorno vazio    = km × CCD × 0,92   (quando ligado)
frete por cabeça = frete total ÷ cabeças
comissão         = preço de origem × (% ÷ 100)  ou  valor fixo por cabeça
preço colocado   = preço de origem + frete/cab + comissão/cab + outros/cab
```

CCD e CC vêm da tabela da ANTT, por número de eixos, atualizados por workflow.
O **pedágio é calculado fora** desta cadeia e entregue pronto: recalculá-lo
aqui criaria uma segunda verdade e dobraria o valor no frete.

**A ANTT não publica coeficiente para bovinos vivos.** O painel usa «Carga
Geral» como referência — premissa declarada no próprio arquivo de dados.

### 2.6 Base e resultado do hedge

```
base            = preço físico − preço futuro       (mesma data, mesma unidade)
base %          = (físico − futuro) ÷ futuro
preço realizado = preço travado + base no dia da venda
ajuste          = (preço travado − preço do dia) × quantidade × sinal
                  sinal: venda = +1, compra = −1
```

O ajuste sai na **moeda do contrato** — reais no BGI e no CCM, **dólares no
SJC**. Veja a seção 2.7.

Sobre convergência, a regra correta está em E2.4: **o futuro converge para o
seu indicador de liquidação**, não para o preço da sua porteira.

**Ajuste não é prejuízo.** Se o futuro subiu e saiu caixa, o boi no pasto
também valorizou. O resultado econômico só fecha quando o físico é vendido.

### 2.7 Unidades dos contratos — a moeda faz parte da unidade

| contrato | unidade | moeda | por contrato |
|---|---|---|---|
| **BGI** — Boi Gordo | arroba (15 kg de carcaça) | **R$** | 330 @ |
| **CCM** — Milho | saca de 60 kg | **R$** | 450 sacas |
| **SJC** — Soja | saca de 60 kg | **US$** | 450 sacas (27 t) |
| **DOL** — Dólar | pontos | **R$ por US$ 1.000** | — |
| **ETH** — Etanol | m³ | **R$** | 30 m³ |
| **DI1** — DI de 1 dia | % a.a. | — | é **taxa**, não preço |

**O SJC é o caso que mais engana.** Os preços na planilha ficam entre 23 e 27 —
não entre 130 e 160 — porque são **dólares por saca**. Rotular em reais produz
um número cinco a seis vezes menor que o valor em reais e sem significado
nenhum. Pior: a B3 liquida o ajuste **em reais, convertendo cada pregão pela
taxa referencial daquele dia**. Somar tudo em dólar e converter no fim dá outro
número, porque o caixa efetivo depende do **caminho** do câmbio, não do nível de
hoje. O painel mantém a conta em dólar e mostra a conversão em reais ao lado,
como ordem de grandeza — nunca como extrato de corretora.

**O DOL** é cotado em reais por **US$ 1.000**: um «preço» de 5.400 significa
R$ 5,40 por dólar. Dividir por mil é obrigatório antes de qualquer conta com
câmbio.

---

## 3 · O que foi conferido e está correto

Registrar o que passou importa tanto quanto registrar o que falhou — é o que
evita mexer de novo no que já está certo.

| item | situação |
|---|---|
| Margens do `calcEngine` (`mbP`, `loP`, `llP`) | **sobre receita**, como os nomes dizem · teste B1 |
| Receita líquida desconta a dedução | correto · teste B2 |
| Conversões peso → carcaça → @ | correto e consistente em todo o painel · teste B5 |
| Custo total = CMV + despesas + tributos | correto · teste B6 |
| ROI divide por capital, não por custo | correto e distinto · teste B6 |
| CMV e cAI não dependem do preço de venda | correto · teste B7 |
| Juros: composição em todos os pontos, base 365 | correto, sem mistura com juro simples |
| Anualização do ROI `(1+r)^(365/d)−1` | correta, com guarda para prejuízo maior que o capital |
| Carrego do milho: taxa mensal composta + meia janela | correto e documentado no código |
| Unidade de cada contrato (`_activePriceUnit`) | correta, incluindo US$/saca para SJC |
| `_pcrMotor`: frete ANTT, comissão, preço colocado | correto · âncoras no retrato de regressão |
| Simulador de hedge: custo máximo do hedge | correto e com a decomposição aberta na tela |
| Nenhum dado financeiro privado sai do navegador | confirmado na Etapa 1 |

---

## 4 · Premissas que mandam no resultado

Não são erros. São escolhas que mudam o número e que precisam estar visíveis.

| premissa | valor | efeito |
|---|---|---|
| @ de entrada = peso ÷ 30 | rendimento de 50% implícito na compra | a 53% de saída, infla as «@ produzidas» em ~6,6% |
| Equivalência de carcaça | 15 kg por @ | base de toda conversão R$/kg → R$/@ |
| Boi gordo de referência | 20 @ | usado nas relações de troca |
| Bezerro equivalente | 7 @ (ou peso da planilha ÷ 30) | manda na relação boi × bezerro |
| `jurosMult` | 1,0 | cobra juros do período cheio sobre desembolso gradual |
| Contratos do hedge | arredondados **para cima** | protege mais que o físico; o excedente vira posição aberta |
| ANTT para bovinos | tabela de «Carga Geral» | a ANTT não publica coeficiente para boi vivo |
| Armazenagem do milho | zero, salvo preenchimento | premissa explícita, não esquecimento |

---

## 5 · Como conferir

```bash
cd testes
node financeiro-testes.js --sem-navegador   # 94 verificações, ~2 s
node financeiro-testes.js                   # + 13 contra o motor real, ~2 min
```

Sai com **0** quando tudo passa. A parte B abre o painel e compara
`__3M_calcEngine` com `formulas-referencia.js` — é o que impede a documentação
e a tela de divergirem sem ninguém perceber.

Os casos cobertos: o caso obrigatório da Etapa 2 (350/300), resultado negativo,
custo zero, receita zero, dado ausente, `NaN`, infinito, texto no lugar de
número, dedução de 0 a 100%, perda de cabeças, rendimento fora de faixa, taxa
nominal × efetiva, simples × composto em três prazos, anualização de prejuízo,
sinal de ajuste em venda e em compra, as seis unidades de contrato e
arredondamento (inclusive a prova de que arredondar no meio da conta desloca o
resultado).

O retrato de regressão (`testes/baseline.json`) ganhou duas âncoras novas com
dedução de 1,5% em dois preços de venda — exatamente o cenário onde o
break-even estava errado. Com dedução em zero o defeito era invisível, que é
por que durou tanto.

---

## 6 · Limitações desta etapa

- **Nenhuma premissa econômica foi julgada.** Este documento registra o que as
  fórmulas fazem e corrige o que estava matematicamente errado. Se 7 @ é o
  bezerro certo, se 20 @ é o boi certo, se o `jurosMult` deve ser 1,0 ou 0,5 —
  são decisões de mercado, suas, não minhas.
- **Um módulo inteiro de margem está morto e não foi removido.** O bloco
  «Margem Bruta (MB)» (`index.html`, 872 linhas a partir da seção
  `recalc()`) calcula CMV, margem e break-even e escreve em **77 elementos que
  não existem mais no HTML** — `$('mbMargemBrutaPct')`, `$('mbKpiLL')` e os
  demais retornam `null`. Ele roda a cada `DOMContentLoaded` e não produz nada.
  Dentro dele, `mb = receita/cmv − 1` também é retorno sobre custo com nome de
  margem bruta. **Não foi removido** porque a regra 2 do estatuto proíbe
  remover sem autorização. Fica registrado: remover é seguro e economiza
  trabalho de CPU em todo carregamento, mas depende do seu «pode».
- **O `normalizeBreakeven` reescala em silêncio.** Quando o breakeven lido da
  planilha é mais de dez vezes o preço, ele divide por 100 ou por 1.000 sem
  avisar. Na prática pega erro de separador decimal, mas um breakeven
  legitimamente alto seria corrompido sem nenhum aviso. Deveria avisar em vez
  de corrigir calado. Não foi alterado nesta etapa.
- **A mudança do indicador de liquidação do BGI não foi propagada aos dados.**
  O painel compara o futuro com a aba **CEPEA**, e desde fevereiro de 2025 o
  contrato liquida pelo **DATAGRO**. A explicação agora diz isso, mas a série
  usada continua sendo a do CEPEA. Trocar a fonte é decisão sua: exige uma aba
  nova na planilha e muda a base histórica inteira.

---

## Fontes

- [B3 — Ofício Circular 135/2024-PRE: alteração do índice de liquidação do contrato futuro de Boi Gordo](https://b3.com.br/data/files/F2/30/96/A0/72E629106EEC8429AC094EA8/OC%20135-2024%20PRE%20Alteracao%20do%20Indice%20de%20Liquidacao%20do%20contrato%20futuro%20de%20Boi%20Gordo%20(PT).pdf)
- [BeefPoint — B3 adota Indicador do Boi DATAGRO para liquidar contratos futuros de pecuária](https://beefpoint.com.br/b3-adota-indicador-do-boi-datagro-para-liquidar-contratos-futuros-de-pecuaria/)
- [CM Capital — Contrato futuro Soja SJC: cotação em dólares por saca, 450 sacas de 60 kg](https://ajuda.cmcapital.com.br/hc/pt-br/articles/28687094883735-Contrato-futuro-Soja-SJC)
