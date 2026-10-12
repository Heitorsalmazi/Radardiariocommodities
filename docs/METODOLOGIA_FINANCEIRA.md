# Metodologia financeira — Radar Diário de Commodities

**Etapa 2 · 12 de outubro de 2026 — fechamento da Etapa 2.1 no mesmo dia**
**Objeto:** todas as fórmulas financeiras e econômicas do painel.
**Régua:** `testes/formulas-referencia.js` — as definições em código, conferidas
por `testes/financeiro-testes.js`: **210 verificações sem navegador + 48 contra
o motor que roda na tela**, todas executadas sobre o `index.html` da branch
`desenvolvimento` (a prova de identidade está na seção 7).

**Diretriz permanente do operador, de 12/10/2026:** o **CEPEA é a referência de
preço físico do boi gordo em todo o Radar**. Nenhuma série é substituída,
nenhuma série nova é criada, nenhuma base histórica muda, e toda comparação
físico × futuro continua sendo **CEPEA × BGI**. O índice que a B3 usa para
liquidar o BGI aparece neste documento e numa única nota de tela, como
explicação metodológica do resíduo da base — e em lugar nenhum mais.

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
| **E21.1** | Simulador de hedge — dimensionamento | faltava informação | não — acrescenta |
| **E21.2** | `normalizeBreakeven` — reescala silenciosa | **comportamento errado** | **sim**, só onde o dado já estava corrompido |
| **E21.3** | Retorno vazio (motor) e rodapé da ANTT | regra incompleta | não — o padrão e o interruptor seguem iguais |
| **E21.4** | Nota metodológica da base (diretriz CEPEA) | texto | não |
| **E21.5** | SJC — teórico em US$ × efetivo em R$ | rótulo incompleto | não |
| **E21.6** | Duas portas para o teste | testabilidade | não |

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

### E21.1 · Dimensionamento do hedge: contrato não se compra pela metade

Havia **um único ponto em todo o painel** que arredonda contratos —
`Math.ceil(qtdProt / tamanho)`, no simulador de hedge. Arredondar para cima sem
dizer transforma parte da operação em **posição vendida a descoberto**.

**A prova aritmética, com 500 @ e trava de 100%:**

```
alvo                 500 @
contrato             330 @
para cima   ⌈500/330⌉ = 2 contratos → 660 @ travadas
                        cobertura 132% do físico
                        excedente  160 @ sem boi atrás
para baixo  ⌊500/330⌋ = 1 contrato  → 330 @ travadas
                        cobertura  66% do físico
                        desprotegido 170 @
```

As 160 @ do excedente ganham se o mercado cair e perdem se subir, **sem nada no
pasto para compensar**. Isso é aposta direcional, não proteção — e o painel
fazia isso calado.

**O padrão não mudou** (continua para cima, para não alterar nenhum resultado
já emitido). O que mudou é que o painel agora **diz**:

- volume físico, volume que se quer travar e volume efetivamente travado;
- **cobertura em % do físico** e em % do alvo;
- **excedente a descoberto** ou **físico sem proteção**, conforme o caso;
- as duas opções lado a lado — quantos contratos e quantas arrobas em cada;
- um seletor para escolher o arredondamento;
- um **aviso explícito** quando a trava passa do físico, com o número do
  excedente e o que aconteceria arredondando para baixo;
- um aviso **vermelho** quando o volume não chega a um contrato: para baixo não
  há trava nenhuma, para cima a trava passa do físico, e não existe terceira
  opção na bolsa — volume abaixo de um contrato se resolve no balcão.

**Casos testados** (B10 e L6): 500 @, 200 @ (menos de um contrato), 1.000 @ (não
múltiplo de 330), 990 @ (múltiplo exato), trava parcial de 50%, 1.000 sacas de
soja em contratos de 450, tamanho de contrato zero e volume negativo.

### E21.2 · Breakeven: validar em vez de corrigir calado

`normalizeBreakeven` dividia o valor por 100 ou por 1.000 quando ele saía muito
acima do preço — **sem avisar ninguém**. A intenção era pegar vírgula trocada na
leitura do Excel. O método é o pior possível para um número que decide trava: um
breakeven legitimamente alto virava outro número, e o painel seguia calculando
retorno sobre um custo que ninguém cadastrou.

A função foi **substituída** por `validaBreakeven`, que **nunca altera o valor**:

| estado | quando | o que o painel faz |
|---|---|---|
| `ok` | entre 20% e 500% do último preço do contrato | usa |
| `sem_referencia` | não há preço para comparar | usa, e declara que não conferiu |
| `ausente` | não cadastrado | mostra «não cadastrado» |
| `invalido` | zero, negativo ou não numérico | sinaliza |
| `fora_escala` | fora da faixa | **não usa** — mostra o valor como veio, a razão, e a sugestão |

**O que muda na tela.** Um contrato cujo breakeven era silenciosamente
reescalado passa a exibir a pílula «BE inconsistente: 28.962 (seria 289,62?)» e
**RSC% e margem ficam em branco** para aquele contrato, com a explicação ao
lado. Vazio e explicado é melhor que preenchido e inventado. Um breakeven alto
porém legítimo — 1.200 contra preço de 350, que é 3,4x — **continua sendo
aceito**, porque está dentro da faixa.

A faixa de 20% a 500% é uma escolha declarada, não uma lei: ela cobre desde uma
operação excepcionalmente barata até uma catastroficamente cara. Alterá-la é
mexer numa constante nomeada, não caçar `if` espalhado.

### E21.3 · Retorno vazio: três hipóteses, e a distância que vale

A regra da ANTT, do FAQ oficial da própria agência: o retorno vazio vale **92%
do CCD** da composição multiplicado pela **distância de retorno fixada em
contrato** — que pode ser diferente da ida — e o pagamento é **obrigatório** no
transporte de contêineres e em veículos de frota específica, dedicada ou
fidelizada por razão sanitária ou por certificação que limite o tipo de produto
transportado. Não há tabela nem coeficiente separado para o retorno.

**O que entrou nesta etapa.** `calcularRetornoVazio` passa a aceitar as três
hipóteses e a distância contratada, mantendo compatibilidade total com o
chamador antigo:

```
calcularRetornoVazio(km, ccd, false)                         → 0      não aplicável
calcularRetornoVazio(km, ccd, true)                          → 92% × km da ida      (forma antiga)
calcularRetornoVazio(km, ccd, {modo:'obrigatorio'})          → 92% × km da ida
calcularRetornoVazio(km, ccd, {modo:'negociado', km:600})    → 92% × 600 km         (distância contratada)
calcularRetornoVazio(km, ccd, {modo:'nao'})                  → 0
```

Prova aritmética, com o CCD de 3 eixos da tabela carregada (5,0977):

```
1.000 km × 5,0977 × 0,92 = R$ 4.689,884      ← conferido em B11 e no retrato
  600 km × 5,0977 × 0,92 = R$ 2.813,9304     ← distância contratada manda
```

A conta é a mesma nas duas hipóteses. O que muda é o **fundamento**: no regime
obrigatório o valor é piso legal; no negociado é acordo, e pode ser outro.

**O que NÃO entrou, e por quê.** O controle de tela para escolher a hipótese
**não foi entregue**. Tentei duas formas de colocá-lo na barra de controles do
card — primeiro trocando o interruptor por um seletor de três opções, depois
acrescentando o seletor ao lado dele — e **as duas reprovaram a suíte de
pedágio**: 14 falhas em 40, sempre na perna de volta, com a rota de retorno
deixando de ser consultada. A bissecção isolou a causa na inserção de markup
naquela barra, mas eu não cheguei à raiz dentro desta etapa.

Diante disso, a escolha foi: **não subir com a suíte vermelha e não afrouxar o
teste para o código passar.** O `harness-pedagio-ui.js` está byte a byte como
estava, e passa 40 de 40. O interruptor continua decidindo se há retorno a pagar,
exatamente como antes, e `contexto()` continua devolvendo o booleano — sem
controle de tela não há hipótese a transportar, e inventar um objeto que ninguém
preenche só criaria caminho morto.

**Fica como pendência explícita:** o controle de tela da hipótese e da distância
contratada, com a investigação do acoplamento entre aquela barra e o ciclo de
render do card. A capacidade está no motor e testada; falta a porta.

**Gado vivo e a hipótese de obrigatoriedade.** Carroceria boiadeira não carrega
carga geral na volta, e a restrição é sanitária. Isso **sugere** enquadramento
na hipótese obrigatória, mas é leitura jurídica, não cálculo — por isso o painel
oferece a escolha em vez de decidir por você.

**Os coeficientes da ANTT estão desatualizados.** Medido: o arquivo
`data/logistica_reposicao.json` traz a Resolução 6.084/2026 com leitura de
**03/09/2026**. O Anexo II foi reajustado pela **Portaria SUROC nº 22/2026**, em
vigor desde **30/09/2026**, com CCD subindo entre **2,09% e 3,29%** (os CC não
mudaram). O robô diário `update-antt.yml` não capturou esse reajuste — ele
acompanha a resolução, e a ANTT reajusta por portaria.

Consequência prática: o frete estimado do card sai **cerca de 2% a 3% abaixo**
do piso vigente. **Não corrigi os números à mão**, porque inventar coeficiente é
exatamente o que a regra 7 do estatuto proíbe — e eu não consegui ler a tabela
oficial deste ambiente. O que fiz foi tornar o problema visível:

- o rodapé do card **lia as chaves erradas** (`antt.resolucao` e `antt.vigencia`,
  que não existem no arquivo — ele guarda `antt.ato.*`), e por isso sempre dizia
  «coeficientes da ANTT pendentes» mesmo com os coeficientes carregados.
  Corrigido: agora mostra o ato, a data, a tabela e o tipo de carga;
- passa a **avisar quando a leitura tem mais de 30 dias**, dizendo quantos dias
  e que a ANTT reajusta por portaria.

Fica como pendência para você: conferir a tabela vigente e ajustar
`scripts/update_antt.py` para seguir portarias, não só resoluções.

### E21.4 · A nota metodológica da base, sob a diretriz CEPEA

A Etapa 2 havia recomendado avaliar a troca da série CEPEA. **A diretriz do
operador cancela essa recomendação**, e ela está cancelada aqui também: o CEPEA
é a referência física do Radar, ponto.

O texto do card foi reescrito para identificar a comparação pelo que ela é —
**indicador físico CEPEA × mercado futuro BGI** — e para dizer que a diferença
**não vai necessariamente a zero no vencimento**. Ela encolhe porque o futuro
perde prêmio de tempo; o que sobra é estrutural: frete, qualidade do lote,
oferta local e a diferença de metodologia entre o indicador físico e o índice de
liquidação do contrato.

Uma única frase da nota de rodapé registra que o índice de liquidação do BGI não
é o CEPEA — desde os vencimentos de fevereiro de 2025, é o Indicador do Boi
DATAGRO. Está ali para explicar **por que** o resíduo existe, e termina dizendo
o que importa: **o Radar não usa, não importa e não calcula nada com DATAGRO.**

### E21.5 · SJC: o resultado teórico e o efetivo são dois números

O ajuste do SJC acontece **em dólar**. A B3 liquida **em reais**, convertendo
**cada ajuste diário** pela taxa referencial **daquele pregão**. Converter o
acumulado por um câmbio único dá outro número — o caixa depende do **caminho**
do câmbio, não do nível de hoje.

O card já avisava disso em texto corrido. Agora o aviso é rótulo:

- o valor em US$ é o **resultado teórico** da posição, na moeda do contrato;
- o valor em reais aparece como **«estimativa ≈ R$ X (câmbio único de 5,4321,
  30/09/2026)»** — com a taxa e a data à vista, para poder ser conferido;
- quando **não há série de câmbio carregada**, nada é convertido: o card diz
  «sem série de câmbio para estimar em reais» em vez de inventar;
- uma linha nova separa explicitamente o teórico do **resultado financeiro
  efetivo**, e diz que esse último só existe no extrato da corretora.

### E21.6 · Duas portas para o teste

`validaBreakeven` e o motor de dimensionamento do hedge viviam dentro de
fechamentos e não eram alcançáveis de fora. Sem porta, o teste mede a **cópia**
da fórmula em vez da fórmula — que é exatamente o erro que a Etapa 1 pegou no
capturador de regressão. Duas linhas de exposição (`window._mbValidaBreakeven` e
`window._hsDimensiona`), nenhuma mudança de comportamento, e os testes B9 e B10
passam a conferir **o que roda na tela**, não uma reimplementação.

Os testes B9 e B10 incluem, de propósito, a comparação cruzada: para cada caso,
o veredito da tela tem de bater com o veredito de `formulas-referencia.js`.

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

**As duas medidas, lado a lado, com números.** Lote de 330 kg que sai com 612 kg
a 53% de rendimento:

| medida | conta | resultado |
|---|---|---|
| **@ produzidas (comercial)** | 21,624 @ de carcaça − 11 @ de peso vivo | **10,624 @** |
| **@ ganhas (físicas)** | (612 − 330) × 0,53 ÷ 15 | **9,964 @** |

A comercial é **6,6% maior**. Não é erro de nenhuma das duas: a comercial mede
*pelas quantas arrobas você recebe e não pagou*, e a física mede *quanta carcaça
o animal de fato ganhou*. O custo da @ incremental usa a **comercial**, porque é
a que casa com a receita. Quem quiser eficiência zootécnica — quilos de carcaça
por dia, por exemplo — precisa da **física**, e as duas estão separadas em
`formulas-referencia.js` (`arrobasProduzidasComercial` e `arrobasGanhasFisicas`)
exatamente para não serem confundidas.

**O incremento pode ser negativo**, e nesse caso o custo da @ incremental **não
existe** (o painel devolve nulo, não um número grande). Boi que entra pesado e
rende pouco pode sair com menos @ de carcaça do que as @ de peso vivo pelas quais
foi comprado — o teste `L3` fixa esse caso com 600 kg entrando, 620 kg saindo e
45% de rendimento.

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

### 2.2.1 O CMV deste painel é GERENCIAL, não contábil

Essa é a distinção que a Etapa 2.1 pede para documentar, e ela muda a leitura de
todos os percentuais.

O CMV do `calcEngine` **inclui coisas que um CMV contábil não incluiria**:

| componente | entra no CMV do painel? | entraria num CMV contábil? |
|---|---|---|
| Originação (compra do animal, frete, comissão) | sim | sim |
| Alimentação — suplemento e dieta | sim | sim |
| Sanidade e rastreabilidade | sim | sim |
| Terra / pastagem (`arrCabMes`) | sim | **não** — é custo de oportunidade, não desembolso |
| **Juros sobre o capital da reposição** | **sim** | **não** — é despesa financeira, abaixo da linha |
| **Juros sobre os desembolsos** | **sim** | **não** — idem |
| Despesas operacionais | não — ficam em `despesas` | sim, em despesas |
| Tributos | não — ficam em `tributos` | sim, em tributos |

Em outras palavras: **o painel empurra o custo financeiro e o custo de
oportunidade da terra para dentro do CMV.** Isso é deliberado e é a prática de
gestão em pecuária — quem imobiliza capital num boi por 340 dias está pagando
por esse dinheiro, tenha ou não tomado empréstimo. Mas significa que a «margem
bruta» deste painel **não é comparável** com a margem bruta de uma DRE contábil
da mesma operação: a do painel é sempre menor, porque carrega juros.

### 2.2.2 Três indicadores, três perguntas

| indicador | fórmula | o que responde | onde aparece |
|---|---|---|---|
| **Margem bruta contábil** | (Receita líquida − CMV sem juros e sem terra) ÷ Receita líquida | quanto a operação produz antes de qualquer custo de capital | **não é calculada pelo painel** |
| **Margem econômica gerencial** | (Receita líquida − CMV gerencial) ÷ Receita líquida | quanto sobra depois de pagar inclusive o capital e a terra | é a **«Margem Bruta»** da Calculadora do Boi |
| **Retorno sobre custo** | (Receita − Custo) ÷ Custo | quanto cada real gasto rendeu | é o **RSC%** da Matriz Operacional |

A «Margem Bruta» que a Calculadora do Boi mostra é, portanto, **margem econômica
gerencial**. O nome curto ficou por ser o que a tela comporta e por já estar em
uso; a definição completa é esta, e agora está escrita. Para obter a margem
bruta contábil a partir dos números do painel, some de volta `fR + fD` (os dois
juros) e `terra` ao resultado — eles vêm separados na saída do motor
exatamente para isso.

### 2.2.3 ROI: o denominador e o que a anualização não promete

```
ROI do ciclo = lucro líquido ÷ capital empregado
capital empregado = originação + insumos + opex + tributos
```

**O que o denominador NÃO inclui:** os encargos financeiros (`fR`, `fD`, `fOp`).
Eles já foram subtraídos no numerador, como custo. Incluí-los embaixo seria
cobrá-los duas vezes.

**Por que ROI ≠ retorno sobre custo:** o custo total é `CMV + despesas +
tributos`, que inclui os juros; o capital empregado é o dinheiro **parado**, sem
os juros. São denominadores diferentes, e por isso os dois números diferem. O
teste `B6` existe só para impedir que alguém os reconcilie por engano.

**A anualização e seus limites.** `ROI ao ano = (1 + ROI do ciclo)^(365 ÷ dias) − 1`.
A conta é correta; a **interpretação** tem três limites que precisam estar ditos:

1. **Supõe repetição imediata e idêntica.** Anualizar um ciclo de 340 dias
   assume que, terminado ele, outro igual começa no dia seguinte, com o mesmo
   retorno. Na pecuária isso é falso: há janela de reposição, estação, vazio
   sanitário e disponibilidade de boi magro. O número é uma **taxa equivalente**,
   não uma previsão de doze meses.
2. **Exagera ciclos curtos.** Quanto menor o prazo, maior o expoente — um ciclo
   de 90 dias com 8% vira 37% ao ano. Nenhum erro de conta; só um número que
   soa muito maior do que a operação sustenta se repetida.
3. **Não existe com prejuízo maior que o capital.** Quando `1 + ROI ≤ 0`, o
   painel devolve nulo em vez de um número. Prejuízo de 120% não tem equivalente
   anual — tem falência.

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
frete ANTT       = km da ida × CCD + CC
retorno vazio    = km de RETORNO × CCD × 0,92     (só nas hipóteses previstas)
frete por cabeça = frete total ÷ cabeças
comissão         = preço de origem × (% ÷ 100)  ou  valor fixo por cabeça
preço colocado   = preço de origem + frete/cab + comissão/cab + outros/cab
```

O **km de retorno** é o contratado quando informado; vazio, cai no km da ida. As
três hipóteses de retorno vazio estão em E21.3, e o padrão é «não aplicável».

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

Sobre convergência, a regra correta está em E2.4 e E21.4: esta é uma comparação
entre o **indicador físico CEPEA** e o **mercado futuro BGI**, e **a diferença
não vai necessariamente a zero no vencimento**. Ela encolhe porque o futuro perde
prêmio de tempo; o resíduo é estrutural.

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
| **Um único ponto arredonda contratos** em todo o painel | varredura completa: só `hsCalcEngine` · E21.1 |
| O ajuste de futuros respeita o sinal da operação | venda +1, compra −1 · testes A9 e L6 |
| O booleano antigo de retorno vazio continua funcionando | compatibilidade preservada · teste B11 |
| `calcularPraca` e as demais 23 funções intocáveis | byte a byte idênticas · `tools/intocadas.js` |

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
| Contratos do hedge | **para cima** por padrão, escolhível | protege mais que o físico; o excedente vira posição aberta — agora com aviso e com a opção «para baixo» ao lado |
| Faixa de aceite do breakeven | 20% a 500% do preço do contrato | fora dela o valor é sinalizado, não usado nem corrigido |
| Retorno vazio | «não aplicável» por padrão | 92% do CCD só nas hipóteses da ANTT, e sobre a distância contratada |
| Coeficientes da ANTT | Res. 6.084/2026, lidos em 03/09/2026 | **não refletem a Portaria SUROC 22/2026** (vigente desde 30/09/2026, CCD +2,09% a +3,29%) |
| ANTT para bovinos | tabela de «Carga Geral» | a ANTT não publica coeficiente para boi vivo |
| Armazenagem do milho | zero, salvo preenchimento | premissa explícita, não esquecimento |

---

## 5 · Como conferir

```bash
cd testes
node financeiro-testes.js --sem-navegador   # 210 verificações, ~2 s
node financeiro-testes.js                   # + 48 contra o motor real, ~2 min
```

Sai com **0** quando tudo passa. A parte B abre o painel e compara
`__3M_calcEngine` com `formulas-referencia.js` — é o que impede a documentação
e a tela de divergirem sem ninguém perceber.

Os casos cobertos pela Etapa 2: o caso obrigatório (350/300), resultado
negativo, custo zero, receita zero, dado ausente, `NaN`, infinito, texto no
lugar de número, perda de cabeças, rendimento fora de faixa, taxa nominal ×
efetiva, simples × composto em três prazos, anualização de prejuízo, sinal de
ajuste em venda e em compra, as seis unidades de contrato e arredondamento.

Os **testes de limite da Etapa 2.1** (blocos L1 a L8 e B8 a B11):

| bloco | o que fixa |
|---|---|
| **L1** | dedução de 0%, 1,5%, **99%** e **100%** — e a prova de que, em cada caso válido, o preço de break-even zera o resultado |
| **L2** | receita zero, volume zero, arrobas zero e negativas, perda total do lote |
| **L3** | arrobas incrementais zero e negativas — o cAI devolve nulo, não um número |
| **L4** | taxa nula, texto, `NaN`, dias negativos, taxa de −100% e abaixo disso |
| **L5** | prejuízo em todas as razões, anualização de prejuízo total e acima dele |
| **L6** | sobreproteção: 500 @, 200 @ (menos de um contrato), 1.000 @ (não múltiplo), 990 @ (múltiplo exato), trava parcial, soja em contratos de 450 |
| **L7** | breakeven alto válido, separador decimal trocado, ausente, zero, negativo, texto, vírgula decimal, sem referência, e as quatro bordas da faixa |
| **L8** | preço com unidade incompatível: soja em reais, dólar em reais por dólar, boi em centavos |
| **B8–B11** | os mesmos limites **contra o motor que roda na tela**, com comparação cruzada contra a referência em cada caso |

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
- **A referência física é o CEPEA, por diretriz, e assim fica.** A recomendação
  da Etapa 2 de avaliar outra fonte está **cancelada** pela diretriz de
  12/10/2026. Nenhuma série foi trocada, nenhuma série nova existe, nenhuma base
  histórica mudou. O índice de liquidação do BGI aparece numa única nota
  metodológica, para explicar por que o resíduo da base não zera.

- **Os coeficientes da ANTT estão um reajuste atrás.** Medido e registrado em
  E21.3: o arquivo traz leitura de 03/09/2026 e a Portaria SUROC 22/2026 passou
  a valer em 30/09/2026, com CCD entre 2,09% e 3,29% maior. O painel agora
  **avisa** quando a leitura passa de 30 dias, mas não corrige: eu não consegui
  ler a tabela oficial deste ambiente e não invento coeficiente. Pendência:
  conferir a tabela vigente e ensinar `scripts/update_antt.py` a seguir
  portarias, não só resoluções.

- **O controle de tela da hipótese de retorno vazio ficou de fora.** A capacidade
  está no motor e testada (B11), mas a barra de controles do card não aceitou os
  campos novos sem derrubar 14 das 40 verificações da suíte de pedágio. Preferi
  entregar sem o controle a entregar com a suíte vermelha. Detalhe completo em
  E21.3.

- **O enquadramento do retorno vazio para gado vivo é leitura jurídica.**
  Carroceria boiadeira não volta com carga geral e a restrição é sanitária, o
  que sugere a hipótese obrigatória — mas quem decide isso é o contrato e o
  advogado, não o painel. Por isso há três opções e o padrão é «não aplicável».

- **A faixa de aceite do breakeven (20% a 500%) é uma escolha, não uma lei.**
  Ela cobre de uma operação excepcionalmente barata a uma catastroficamente
  cara. Se o seu negócio tiver um breakeven legítimo fora dela, o painel vai
  sinalizar — e o ajuste é numa constante nomeada, não numa caçada a `if`.

- **`precoCompativel` não é usado pelo painel ainda.** A validação de magnitude
  por contrato existe em `formulas-referencia.js` e está testada (L8), mas
  nenhum card a chama. Ligá-la nos pontos de leitura de preço é trabalho de uma
  etapa própria, porque muda o que acontece quando a planilha vem torta.

---

---

## 7 · Prova de que os testes rodaram contra este código

A Etapa 2.1 pede comprovação de que os testes foram executados contra o código
atualizado da branch `desenvolvimento`. A prova é de identidade, não de palavra:

1. O `index.html` da área de trabalho é gerado por `work/patch_ui.py` a partir
   de `index_base.html`, com **87 âncoras conferidas por contagem** — uma âncora
   que mudou de lugar quebra o build em vez de produzir arquivo errado.
2. O laboratório local (`serve/local.html`) é gerado desse mesmo `index.html`
   por `tools/harness.py`, que troca **apenas** as cinco URLs de CDN por cópias
   locais. Nenhuma outra diferença.
3. Os testes rodam contra esse laboratório.
4. O arquivo publicado na branch é o mesmo `index.html` — conferido por SHA-256
   depois do envio, com os dois valores impressos lado a lado.

O par de hashes do fechamento desta etapa está no corpo da entrega, junto com a
saída de cada suíte.

---

## Fontes

- [B3 — Ofício Circular 135/2024-PRE: alteração do índice de liquidação do contrato futuro de Boi Gordo](https://b3.com.br/data/files/F2/30/96/A0/72E629106EEC8429AC094EA8/OC%20135-2024%20PRE%20Alteracao%20do%20Indice%20de%20Liquidacao%20do%20contrato%20futuro%20de%20Boi%20Gordo%20(PT).pdf)
- [BeefPoint — B3 adota Indicador do Boi DATAGRO para liquidar contratos futuros de pecuária](https://beefpoint.com.br/b3-adota-indicador-do-boi-datagro-para-liquidar-contratos-futuros-de-pecuaria/)
- [CM Capital — Contrato futuro Soja SJC: cotação em dólares por saca, 450 sacas de 60 kg](https://ajuda.cmcapital.com.br/hc/pt-br/articles/28687094883735-Contrato-futuro-Soja-SJC)
- [ANTT — Perguntas frequentes sobre o piso mínimo de frete (retorno vazio: 92% do CCD sobre a distância de retorno contratada; hipóteses de obrigatoriedade)](https://portal.antt.gov.br/en/perguntas-frequentes/-/categories/1862072)
- [Transp.net — Resolução ANTT 6.084/2026 e o reajuste do Anexo II pela Portaria SUROC 22/2026, vigente desde 30/09/2026](https://www.transp.net/blog/posts/tabela-frete-antt-2026-resolucao-6076/)
