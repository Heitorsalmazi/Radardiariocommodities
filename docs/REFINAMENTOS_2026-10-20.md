# Refinamentos do Radar — 20/10/2026

- Visão Executiva separa resultados estimados e mercado observado.
- Origem das premissas, cobertura do boi e aviso de vencimento anterior ao abate recebem destaque.
- Fontes carregadas e fontes na referência são contadas separadamente; cada cotação informa defasagem.
- Cenários e simulação identificam margem bruta e lucro líquido por cabeça e por lote.
- Gráficos executivos têm títulos únicos, alinhamento uniforme e identificação das séries; exportação preserva o título.
- Escalas de abate preservam seus próprios eixos e datas de publicação.
- Sinais são agrupados por fundamento, sem pesos ou probabilidades novos.
- Explicações e metodologia são expansíveis; impressão reabre e restaura esses blocos.
- Layout responsivo reduz o cabeçalho e empilha cartões em telas estreitas.

## Validação

- `node testes/financeiro-testes.js --sem-navegador`: 210 verificações aprovadas.
- `node testes/refinamentos-testes.js`: 10 verificações de apresentação aprovadas, incluindo sintaxe de todos os scripts executáveis.
- Motor financeiro, adaptação de premissas e simulação preservados. Planilhas e bases não alteradas.
- Conferência visual prevista no endereço publicado após o deploy; a prévia em localhost não ficou acessível ao navegador desta sessão.
