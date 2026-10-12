# Retrato de regressão — como usar

A suíte `rodar.js` prova que **a tela não quebrou**. Ela não prova que **a conta
continua certa**: a tela fica idêntica com a fórmula errada. Estes dois arquivos
fecham essa lacuna.

## Os três comandos

```bash
# 1. laboratório no ar (uma vez por sessão)
cd /home/claude/serve && python3 -m http.server 8777 &

# 2. gravar o retrato de referência (só quando o estado atual É o correto)
cd /home/claude/proj/testes
node --max-old-space-size=4096 baseline-captura.js

# 3. depois de qualquer alteração: comparar
node baseline-comparar.js            # recaptura e compara  (~3 min)
node baseline-comparar.js --atualizar # idem, e adota o novo retrato
node baseline-comparar.js --sem-recaptura  # compara um baseline-agora.json pronto
```

Sai com **0** quando nada DURO mudou e **1** quando mudou. Serve em CI.

## O que ele lê, e por quê

| bloco | o que grava |
|---|---|
| `contratos` | pregões, primeiro e último preço dos 80 contratos |
| **`contasFixas`** | **as fórmulas financeiras chamadas com argumentos fixos** |
| `cai` | saída da Calculadora do Boi (`__3M_CAI`) |
| `sinais` | o que os cards de risco publicam (`__3M_SINAIS`) |
| `backtest` | acerto, média, melhor antecipação |
| `opcoes` | séries dos 4 gráficos, 8 leituras de tela, linhas da cadeia |
| `exportacoes` | anos, ano atual, último mês e nº de destinos, por produto |
| `logistica` | praças, veículos ANTT, pedágio por eixo |
| `frescor` | data mais nova de cada uma das 136 abas com data |
| `graficos` | seção, nome, nº de pontos, primeiro e último de cada série (125 cards) |
| `carga` | parse em worker, origem do Plotly, presença das bibliotecas |

`contasFixas` é o coração: em vez de fotografar a tela, chama as fórmulas com
entrada congelada e guarda o resultado. Se alguém mexer na conta, estes números
mudam — mesmo que a tela continue igual.

## DURO × MOLE

- **DURO** — fórmula, estrutura, inventário. Não muda sozinho. Toda diferença é
  regressão até alguém explicar.
- **MOLE** — o dado do dia. Muda porque a planilha mudou. Só vira sinal quando
  **desaparece** ou **zera**, e aí é promovido a DURO automaticamente: dado que
  para de chegar não é «dado do dia», é cano entupido.

## Três armadilhas

1. **Rode sempre contra o laboratório local**, com a **mesma cópia congelada**
   do `dados.xlsx`. Contra o site vivo você compara código novo com dado novo e
   não conclui nada.
2. **`html2canvasPresente` e `pptxPresente` vêm `false` de propósito**: o
   laboratório troca essas duas bibliotecas por um `noop.js`. Isso descreve o
   laboratório, não o site.
3. **Só use `--atualizar` com justificativa escrita.** O retrato é a memória do
   que estava certo; atualizá-lo sem motivo apaga a memória.

## Por que a captura colhe seção por seção

A primeira versão fotografava tudo no fim, depois de percorrer as 34 seções, e
perdia de forma intermitente os quatro cards do Ciclo pecuário. Sondei o painel
— eles desenham sempre, até com 300 ms de espera, e sem aviso nenhum no console.
O defeito era do capturador. Agora ele colhe **com a seção aberta**, dá duas
voltas e une o resultado. Um retrato instável é pior que nenhum: treina quem lê
a ignorar o alarme.

## Retrato reavaliado — Etapa 4 · 12/10/2026

A Visão Executiva entrou como **primeira seção** do painel (`m3_0_1`). O
capturador percorre as seções na ordem de `_M3_ESTRUTURA` e, para cada gráfico,
anota a seção que estava aberta quando ele foi visto pela primeira vez. Com uma
seção nova na frente, treze gráficos que já nasciam desenhados passaram a ser
colhidos com `m3_0_1` aberta em vez de `m3_1_1`:

```
chartPreco · chartMM · chartTrend · chartPercentil · chartMediaStd
chartBoiVsBGIAll · chartRatioBGICCM · chartAbateIBGE · chartAbatePreco
chartAgio · chartBoiMagroTroca · chartBoiMagroAgio · chartBaseAtivo
```

**Nenhuma série mudou** — nem contagem de pontos, nem primeiro, nem último
valor; o comparador acusou zero diferença em `contasFixas`, `cai`, `sinais`,
`backtest`, `opcoes`, `exportacoes`, `logistica` e `frescor`, e zero "dado do
dia" mexido. O campo `secao` é metadado de captura, não propriedade do gráfico:
ele diz onde o retrato foi tirado, não de onde o número veio.

Três gráficos novos entraram no retrato — `chartVeBoi`, `chartVeMilho` e
`chartVeTroca`, os compactos da Visão Executiva.

O retrato foi readotado nesta data com `--atualizar`.
