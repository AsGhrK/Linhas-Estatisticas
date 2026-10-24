# Análise técnica do front-end — Linhas Estatísticas

## 1. Escopo da transformação

A fonte analisada foi um único arquivo HTML com CSS dentro de `<style>` e SVGs desenhados diretamente no documento. A conversão preserva a estrutura visual, os textos de exemplo, os dados estáticos e a identidade cromática principal. A arquitetura de destino é React + TypeScript + Vite, sem biblioteca de componentes ou de gráficos adicional.

O projeto representa somente o front-end. A fonte original não tinha API, backend nem busca funcional; por isso, preços, hospedagem, clima e gráficos continuam sendo conteúdo demonstrativo. O formulário React valida campos e apresenta um resumo local, sem fingir que consultou serviços externos.

## 2. Efeitos visuais encontrados na fonte

| Efeito/comportamento da origem | Como funciona | Onde ficou no projeto |
| --- | --- | --- |
| Cabeçalho persistente | `position: sticky`, `top: 0` e `z-index` mantêm o cabeçalho no topo durante a rolagem | `components/Header.css` |
| Realce de links | Opacidade muda no `:hover`, com `transition` curto | `components/Header.css` |
| Hero com gradiente | Gradiente azul escuro; o círculo translúcido vem de `::after` | `components/Hero.css` |
| Ilustração de rota | Vetor SVG com linha pontilhada, pontos e avião | `components/Hero.tsx` |
| Cartão de busca sobreposto | Margem superior negativa, posição relativa e sombra suave | `components/SearchCard.css` |
| Botão com hover | Mudança de cor do coral para um tom mais escuro | `components/SearchCard.css` |
| Cards comparativos | Bordas finas e grids com espaço de 1 px para criar divisórias | `FlightComparison.css`, `WeatherSection.css`, `StatsGrid.css` |
| Gráficos de clima | Polylines em SVG; são estáticos, sem escala, tooltip ou animação | `components/WeatherSection.tsx` |
| Gráfico radar | Polígonos SVG preenchidos com transparência | `components/OverviewSection.tsx` |
| CTA com gradiente | Bloco azul em gradiente com botão coral | `components/CallToAction.css` |
| Responsividade | Breakpoints originais em 760 px empilham grids e reorganizam colunas | CSS de cada componente e `styles/global.css` |

### Efeitos que não existiam

O HTML original não implementava animação de entrada, parallax, gráfico animado, carregamento dinâmico ou requisição de pesquisa. Os gráficos SVG são estáticos. Não foram adicionados efeitos de movimento novos para não mudar sem necessidade a proposta visual. Há suavização de rolagem para âncoras e suporte a `prefers-reduced-motion` no CSS global.

## 3. Mapeamento de responsabilidade

| Parte da página | Componente | Responsabilidade |
| --- | --- | --- |
| Cabeçalho e navegação | `Header.tsx` | Links de seção e abre/fecha menu móvel |
| Hero | `Hero.tsx` | Chamada principal, rota ilustrativa e arte SVG |
| Busca | `SearchCard.tsx` | Estado do formulário, campos obrigatórios e resumo do envio |
| Cabeçalhos de seção | `SectionHeading.tsx` | Reutiliza tag, título e descrição |
| Comparação de voos | `FlightComparison.tsx` | Rotas e linhas de companhia/preço |
| Indicadores numéricos | `StatsGrid.tsx` | Componente reutilizável para 3 ou 4 colunas |
| Clima | `WeatherSection.tsx` | Cards e gráficos ilustrativos em SVG |
| Hospedagem e alimentação | `LodgingFoodSection.tsx` | Lista de hotéis, tags de comidas e estimativas ilustrativas |
| Visão geral | `OverviewSection.tsx` | Checklist, legenda e radar de comparação |
| Chamada final | `CallToAction.tsx` | Link para retornar ao formulário de busca |
| Rodapé | `Footer.tsx` | Colunas de links e textos finais |
| Dados usados pelos componentes | `data/mockData.ts` | Arrays tipados com companhias, valores e hotéis de exemplo |
| Tipos de domínio da interface | `types/travel.ts` | Formato de voo, hotel, estatística e formulário |
| Tokens, reset e regras globais | `styles/global.css` | Paleta, tipografia, layout base, foco e acessibilidade de movimento |

Cada componente possui seu CSS ao lado do arquivo TSX. O HTML do aplicativo é escrito como JSX/TSX, que é a sintaxe declarativa do React; `index.html` permanece apenas como documento de entrada do Vite.

## 4. Hooks do React

### `Header.tsx` — `useState`

Controla se o menu móvel está aberto. O clique do botão alterna esse estado, que determina a classe CSS do menu e o valor de `aria-expanded`. Os links fecham o menu depois da navegação.

### `SearchCard.tsx` — `useState`

Mantém os valores atuais dos campos e o último envio demonstrativo. Isso faz o formulário ser controlado pelo React. Ao editar um campo, o resumo anterior é removido; ao enviar, o navegador impede campos obrigatórios vazios e a interface mostra o conteúdo que seria enviado a uma API.

Nenhum hook foi usado nos outros componentes, pois são blocos de apresentação que recebem ou importam dados e não precisam de estado próprio.

## 5. Responsividade e interação

- Em telas estreitas, os grids de comparação, clima e hospedagem viram uma coluna.
- A faixa de estatísticas de quatro colunas reduz para duas; a área de alimentação reduz para uma coluna em telas muito estreitas.
- O menu desktop vira um menu expansível em telas de até 760 px. Essa interação foi acrescentada porque, no HTML original, os links eram ocultados nesse breakpoint e não havia um botão correspondente no corpo do documento.
- Os campos agora têm `<label>` associado a `id`, foco visível e validação HTML básica.
- O botão do CTA é um link de âncora para o cartão de busca, não uma segunda ação de pesquisa sem dados.

## 6. Pontos técnicos a evoluir

1. **Datas:** o campo preserva o formato livre da origem. Se o produto definir a regra, trocar por campos `date` ou um seletor de intervalo e documentar o formato enviado à API.
2. **Consulta real:** criar um serviço TypeScript isolado para chamar a API, definir o formato de requisição/resposta e mostrar estados de carregamento, erro e resultado vazio.
3. **Dados de demonstração:** substituir os arrays estáticos de `mockData.ts` por respostas validadas de API antes de apresentar números como atuais.
4. **Gráficos:** os SVGs são ilustrações, não visualizações científicas prontas. Para dados reais, definir séries, eixos, escalas, legenda, fonte e período de referência.
5. **Navegação do menu:** se a aplicação crescer além de uma página, avaliar roteamento; para o protótipo de uma única página, âncoras bastam.
6. **Conteúdo:** alguns textos de origem são Lorem ipsum e os títulos do rodapé estão em inglês; foram mantidos para não substituir conteúdo sem orientação de produto.

## 7. Verificação

A estrutura do projeto foi montada e o ZIP inclui os arquivos de configuração, componentes, CSS, tipos, dados de exemplo e este relatório. A instalação das dependências não terminou neste ambiente, portanto a compilação integral com Vite ainda deve ser conferida localmente após `npm install`, usando `npm run build`.
