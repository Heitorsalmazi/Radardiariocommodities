# Inteligência Operacional do Confinamento

*Radar Diário de Commodities · BMS AgroBrasil · 13/10/2026*

Cinco telas novas sobre os motores que já existiam. **Nenhum motor de cálculo
foi criado**: custo e margem vêm de `__3M_calcEngine` (Calculadora do Boi,
auditado nas Etapas 2 e 2.1), o dimensionamento de contrato vem de
`_hsDimensiona` (Simulador de Hedge), e base e volatilidade observada vêm das
séries da própria planilha, lidas pelas mesmas funções que os cards já usam.

| Seção | Onde mora | Responde |
|---|---|---|
| Simulação do lote <br>`m3_4_2` | Gestão do Confinamento | quanto custa e quanto sobra |
| Cenários <br>`m3_4_3` | Gestão do Confinamento | e se o preço, o custo ou o ganho mudarem |
| Vencimentos × período de abate <br>`m3_3_8` | Hedge e Gestão de Risco | qual contrato cobre o meu abate |
| Escada de proteção <br>`m3_3_9` | Hedge e Gestão de Risco | quanto travar, e o que isso exige de caixa |
| Risco de base <br>`m3_3_10` | Hedge e Gestão de Risco | quanto a minha praça difere do contrato |

**A Calculadora do Boi (`m3_4_1`), o Simulador de Hedge (`m3_3_6`) e a matriz
de contratos (`m3_3_5a`) continuam onde estavam, intactos.** Há teste que
reprova se algum deles ficar vazio.

---

## 1. Um conjunto de premissas, três leitores

As cinco telas, a Visão Executiva e a matriz de risco leem **o mesmo conjunto**
— `ve_premissas_v1`, resolvido por `_veMotor.premissasEfetivas()` na ordem
personalizado › Calculadora do Boi › cenário padrão de confinamento.

Editar um campo na Simulação muda a Visão Executiva, e vice-versa. Não existe
um segundo conjunto de premissas: ele divergiria do primeiro na primeira vez
que alguém mexesse num dos dois, e a divergência seria invisível.

O formulário da Simulação é montado a partir de `_veCAMPOS`, a **mesma tabela
de campos** da Visão Executiva. Duas listas de campos ficariam diferentes no
dia em que alguém acrescentasse um só de um lado.

### Peso final ou ganho médio diário — você escolhe qual é a entrada

O motor deriva o peso de abate de `peso de entrada + GMD × dias`. Quem planeja
um lote às vezes parte do outro lado: *"quero abater a 540 kg em 105 dias, que
ganho isso exige?"*. As duas leituras são a mesma equação.

| Modo | Entrada | Derivado |
|---|---|---|
| Calculado pelo GMD × dias | ganho médio diário | peso final |
| Informado por mim | peso final | ganho médio diário |

**Os dois nunca são entrada ao mesmo tempo.** Peso final e GMD informados
juntos se contradizem na primeira divergência, e a tela passaria a mostrar um
peso de abate que não corresponde ao ganho que ela mesma exibe. O derivado
aparece marcado como derivado.

---

## 2. Os dois custos por arroba

O pedido manda identificar o conceito, e com razão: os dois são confundidos o
tempo todo, e a confusão faz um confinamento parecer bem mais barato do que é.

| Conceito | Fórmula | De onde vem | O que responde |
|---|---|---|---|
| **Custo da @ produzida** | `(CMV − aquisição − financeiro da reposição) ÷ (@ carcaça − @ entrada)` | `cAI` do motor, **sem recálculo** | quanto custou PRODUZIR cada arroba nova — compara-se com a arroba do mercado para decidir se vale engordar |
| **Custo da @ comercializada** | `custo total ÷ @ de carcaça` | divisão de dois números do motor, rotulada | quanto cada arroba VENDIDA precisa pagar, incluindo a compra do animal — compara-se com o preço de venda |

Medido no painel, cenário padrão: **R$ 255,30** a produzida contra **R$ 349,12**
a comercializada. A diferença é o animal que entrou.

A @ produzida **já existia no motor** como `cAI` (custo da arroba incremental).
A camada nova não a recalculou — há teste que compara os dois valores e reprova
se divergirem.

### O que mais a simulação devolve

Tudo de `__3M_calcEngine`: custo total por cabeça (`cT`), resultado bruto e
líquido por cabeça (`mB`, `lL`), resultado do lote (`lLote` = líquido ×
cabeças), break-even de margem bruta e de lucro líquido (`bMB`, `bLL`), margem
operacional (`mbP`, `llP`), ROI (`roi`), peso de abate (`pAb`) e arrobas
(`arE`, `arC`).

> **Resultado por cabeça e resultado do lote não são o mesmo tipo de número.**
> O resultado por cabeça aparece nas duas versões, bruto e líquido; o do lote é
> o **líquido** multiplicado pelas cabeças. Com lote de uma cabeça, o total
> parecia menor que a unidade — os rótulos agora dizem qual é qual.

---

## 3. Cenários — sem probabilidade, de propósito

Três colunas configuráveis: **Conservador**, **Base**, **Otimista**. Em cada
uma, seis parâmetros podem ser sobrescritos: preço de venda, custo da @ de
entrada, GMD, milho na dieta, custo da dieta por dia e dias de cocho. Todo o
resto vem das premissas compartilhadas, para que a diferença entre as colunas
seja **só o que você mudou**.

**Campo vazio em Conservador ou Otimista significa "igual ao cenário base".**
O painel não preenche os extremos com ±10%: uma variação arbitrária é um número
inventado com cara de análise.

**Nenhum cenário recebe probabilidade.** Atribuir chance exigiria uma
distribuição estimada e validada, que este painel não tem — e o número
inventado faria a média dos três parecer um valor esperado, que é a leitura que
leva à decisão errada. Há teste que reprova se a palavra aparecer na tela.

---

## 4. Vencimentos × período de abate

Uma linha por contrato BGI vigente, com a distância em meses até o abate
projetado e o que cada vencimento deixaria de margem.

**Observado e estimado aparecem marcados em cada coluna**, porque misturá-los é
como uma projeção vira promessa:

| Observado — está na planilha | Estimado — depende das suas premissas |
|---|---|
| preço de ajuste do contrato | custo de referência (break-even) |
| data do pregão | distância do break-even |
| | resultado por cabeça e do lote |
| | margem |
| | **a própria data de abate** (hoje + dias de ciclo) |

A linha destacada é o contrato cujo mês coincide com o abate projetado. Vender
num vencimento anterior deixa um descasamento entre a liquidação do contrato e
a entrega do boi — é decisão sua, e o painel mostra a distância em vez de
escolher por você.

O custo de referência não muda entre as linhas: o break-even de margem bruta
não depende do preço de venda, e por isso é o mesmo para todos os vencimentos.

---

## 5. Escada de proteção — 0, 25, 50, 75 e 100%

Cada degrau é dimensionado por `_hsDimensiona`, o **mesmo motor do Simulador de
Hedge**, com o mesmo arredondamento de contrato (330 @ por contrato BGI).

| Coluna | O que é |
|---|---|
| Físico (@) | arrobas de carcaça × cabeças |
| Travado (@) | o que os contratos inteiros cobrem |
| Exposição residual (@) | físico − travado, nunca negativa |
| Receita física | volume físico × (preço do cenário + base) |
| Resultado do derivativo | (preço travado − preço de liquidação) × volume travado |
| Custo do hedge | contratos × custo por contrato que você informar |
| **Resultado econômico** | físico + derivativo − custo do hedge |
| Preço efetivo | resultado econômico ÷ volume físico |
| **Caixa do ajuste** | pior alta observada × volume travado |

### Resultado econômico e caixa do ajuste não são a mesma coisa

É o erro clássico de quem trava preço pela primeira vez, e por isso as duas
colunas são visualmente separadas.

O **resultado econômico** é o que sobra no fim: a alta do futuro que tirou
dinheiro do caixa volta como boi mais caro na praça.

O **caixa do ajuste** é quanto dinheiro precisa estar disponível ANTES disso,
no dia em que a bolsa chamar — e precisa existir mesmo que o resultado final
seja bom.

### De onde sai a variação adversa

**Da série do próprio contrato, medida.** O painel procura a maior alta já
registrada em janelas de 1, 5 e 21 pregões — alta porque, para quem vendeu
futuro, o movimento adverso é o de subida — e usa a de 21 pregões na coluna de
caixa, declarando a data em que aconteceu e quantas janelas foram examinadas.

Não há distribuição, não há volatilidade implícita, não há percentil de modelo.
É o que já aconteceu, que é a única coisa que uma série histórica pode dizer.

Medido em `BGIV26`: **+R$ 18,20/@ (5,2%)** entre 03/08 e 01/09/2026, em 145
janelas de 21 pregões examinadas. Numa posição de 100% sobre 300 cabeças
(5.940 @ travadas), isso são **R$ 108.108** de caixa.

### Sobreproteção é sinalizada

Contrato não se fraciona. Com 5.915 @ físicas e arredondamento para cima, 100%
trava 5.940 @ — 25 @ a descoberto. A linha fica marcada em vermelho, e o
arredondamento pode ser trocado para baixo no próprio filtro.

---

## 6. Risco de base — três pernas, nenhuma presumida

| Perna | O que mede |
|---|---|
| Praça − CEPEA | quanto a sua praça paga a mais ou a menos que o indicador físico |
| CEPEA − contrato | a base clássica físico × futuro |
| **Praça − contrato** | a soma das duas: a base que de fato importa para quem vende naquela praça e trava na B3 |

A praça sai da base regional que o Radar já carrega da planilha (28 praças
nesta), e a série vem de `_rgSerie` — a mesma função que os cards regionais
usam.

Todas as observações são **pareadas**: só entram as datas em que **as duas**
séries têm cotação, e **nada é interpolado**. Um dia sem pregão numa ponta não
vira observação inventada na outra. A janela é de 12 meses e o número de
pregões aparece na tabela, para você julgar se a amostra basta.

A mediana aparece antes da média, de propósito: a base tem meses atípicos, e a
média isolada esconde isso.

### Não presuma base zero no vencimento

É comum ouvir que o futuro converge para o físico e que a base desaparece. Para
o BGI, a convergência que existe é contra o **indicador de liquidação** — não
contra a praça onde o seu boi é vendido. O que sobra é a diferença entre a sua
praça e esse indicador, e ela não tem razão nenhuma para ir a zero.

A tela mostra a prova empírica: para cada contrato **já liquidado**, a base
média nos últimos 5 pregões dele. Medido nesta planilha, **7 contratos
vencidos, nenhum fechou em zero** — e um deles fechou a **−R$ 12,35/@**.

---

## 7. Reprodutibilidade

**Nenhuma das cinco telas guarda estado próprio de cálculo.** Com as mesmas
premissas e o mesmo preço, o resultado é o mesmo, porque quem calcula é sempre
o motor. O que cada tela guarda é escolha de interface — qual contrato, qual
praça, qual cenário, qual arredondamento —, no mesmo armazenamento das
premissas, em chaves próprias (`ioContrato`, `ioPraca`, `ioModoPeso`,
`ioFontePreco`, `ioArredonda`, `ioPrecoLiq`, `ioBaseManual`,
`ioCustoOpContrato`, `ioCen`).

Há teste que chama a simulação duas vezes com as mesmas entradas e exige
igualdade em sete indicadores.

---

## 8. Privacidade — nada operacional vai para o GitHub Pages

O requisito é explícito, e a resposta é que **nada precisa ser construído**:

- As premissas e as escolhas de interface ficam em `localStorage`, **no
  navegador de quem usa**. Não são enviadas a lugar nenhum, não passam por
  servidor e não entram no repositório.
- O GitHub Pages serve **apenas** `index.html` e a planilha pública de preços.
  Nenhum dado de lote, custo, praça ou posição é commitado.
- O repositório é público; o `localStorage` de cada navegador não é.

**Não há persistência privada a projetar**, e por isso não há arquitetura de
segurança a apresentar. Se um dia for preciso compartilhar premissas entre
máquinas ou entre pessoas, aí sim entra um serviço com autenticação — e a
arquitetura vem antes do código, como você pediu.

A contrapartida honesta: trocar de máquina ou limpar os dados do site apaga as
premissas, e elas não acompanham o operador entre computadores.

---

## 9. Testes

```bash
cd /home/claude/serve && (setsid python3 -m http.server 8777 --bind 127.0.0.1 &)
cd /home/claude/proj/testes
node operacional-testes.js http://127.0.0.1:8777/local.html   # 44
node visao-executiva-testes.js http://127.0.0.1:8777/local.html # 151
node navegacao-testes.js http://127.0.0.1:8777/local.html     # 79
node financeiro-testes.js                                      # 210 + 48
node rodar.js                                                  # 15
node baseline-comparar.js
```

### O que a suíte nova prova

| Bloco | Verificações |
|---|---|
| **O1** | as cinco seções existem, têm botão visível e slot cheio; **os três simuladores antigos continuam de pé** |
| **O2** | peso ↔ GMD é a mesma equação nos dois sentidos; o GMD derivado não é absurdo (guarda contra erro de parser decimal) |
| **O3** | @ produzida **é** o `cAI` do motor; @ comercializada **é** custo total ÷ carcaça; break-even, margem, lote e ROI vêm do motor sem toque |
| **O4** | mesmas entradas → mesmos números, em sete indicadores |
| **O5** | cinco degraus; volume travado múltiplo do contrato; residual = físico − travado; derivativo, econômico, preço efetivo e caixa conferem com a aritmética declarada; sobreproteção sinalizada |
| **O6** | a pior variação aponta pregões que existem na série e bate com os preços dos dois dias |
| **O7** | base pareada; três pernas; **nenhum contrato vencido fechou com base zero** |
| **O8** | três cenários, nenhuma probabilidade atribuída |
| **O9** | observado e estimado marcados; no máximo um vencimento destacado |
| **O10** | sem premissas, as telas declaram a ausência e **não desenham resultado nenhum** — mas o preço observado continua visível, porque não depende de premissa |
| **O11** | nenhuma tela nova alarga a página |
| **O12** | console limpo |

---

## 10. Limitações

1. **O cenário padrão é um cenário, não a sua operação.** Abre com 1 cabeça e
   dedução zero. Informe cabeças, dedução e perdas antes de levar qualquer
   número a sério.
2. **A data de abate é projeção**: hoje mais os dias de ciclo. Não considera
   fila de frigorífico, chuva nem atraso de embarque.
3. **A base é medida numa janela de 12 meses.** Base tem sazonalidade; uma
   janela fixa não a captura. O número de pregões está na tela para você
   julgar.
4. **A pior variação observada não é previsão.** Ela diz o que já aconteceu na
   série daquele contrato — nada impede que o próximo movimento seja maior.
5. **O preço de liquidação é hipótese sua.** O padrão supõe o futuro parado, o
   que faz o derivativo render zero. Informe um preço para ver a escada
   trabalhar.
6. **Custos operacionais do hedge são informados, não cotados.** O painel não
   conhece a sua corretagem.
7. **Premissas são deste navegador** (ver §8).
8. **A escada usa venda de futuro.** Opções (put, call, collar) continuam no
   Simulador de Hedge, que não foi alterado.
