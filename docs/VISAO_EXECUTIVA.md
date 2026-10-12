# Visão Executiva — Etapa 4

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

### E · Navegação

Cada indicador e cada bloco tem um atalho que leva ao componente onde a análise
mora, por `m3IrAlvo(seção, gráfico)`. Nada é duplicado: o cálculo continua
existindo num lugar só.

---

## 4. Premissas da operação

Ficam salvas **neste navegador**, na chave `ve_premissas_v1`. Os nomes dos
campos são os mesmos que `__3M_calcEngine` espera, para que o objeto entre no
motor sem tradutor no meio — tradutor é onde um campo se perde em silêncio.

**A Calculadora do Boi não foi alterada.** Ela continua lendo os próprios
campos ao vivo e continua sem persistência. O botão *Copiar da Calculadora do
Boi* leva os valores de lá para cá, numa direção só.

Campos próprios da Visão Executiva, que não vão para o motor de custo:
`veCabecasVender`, `veMilhoSacas`, `vePctTrava`, `veArredonda`, `veVencRef`.

Trocar de máquina ou limpar os dados do site apaga estas premissas.

---

## 5. Filtros

Um só: o **vencimento BGI de referência**. Vale para o card do futuro, para o
gráfico do boi e para o destaque da tabela de venda; os demais contratos
continuam listados. Fica salvo junto das premissas.

A tela é de painel, não de ativo: trocar o contrato ou o universo no topo da
página não a esconde nem a esvazia — e há teste para isso.

---

## 6. Como rodar os testes

```bash
cd /home/claude/serve && python3 -m http.server 8777 &     # laboratório no ar
cd /home/claude/proj/testes
node visao-executiva-testes.js      # 118 verificações
node financeiro-testes.js           # 258 (Etapas 2 e 2.1)
node rodar.js                       # 15 (regressão de tela)
node baseline-comparar.js           # retrato numérico
```

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

---

## 9. Arquivos

| arquivo | o que mudou |
|---|---|
| `index.html` | quatro pontos de contato na navegação, duas correções no autoteste, estilo e dois blocos de código novos |
| `testes/visao-executiva-testes.js` | **novo** — 118 verificações |
| `testes/baseline.json` | retrato readotado (ver `BASELINE-LEIA-ME.md`) |
| `testes/BASELINE-LEIA-ME.md` | registro da readoção |
| `docs/VISAO_EXECUTIVA.md` | **novo** — este documento |
