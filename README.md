# Linhas Estatísticas — React + TypeScript

Migração do HTML original para uma aplicação React com Vite e TypeScript, mantendo o desenho visual e separando os blocos da página em componentes.

## Requisitos

- Node.js 20.19+ ou 22.12+ recomendado para versões recentes do Vite.
- npm.

## Executar localmente

```bash
npm install
npm run dev
```

Abra o endereço local exibido pelo Vite no terminal. Para validar a compilação de produção:

```bash
npm run build
npm run preview
```

## Organização do projeto

```text
src/
├── components/
│   ├── Header.tsx / Header.css
│   ├── Hero.tsx / Hero.css
│   ├── SearchCard.tsx / SearchCard.css
│   ├── SectionHeading.tsx / SectionHeading.css
│   ├── FlightComparison.tsx / FlightComparison.css
│   ├── StatsGrid.tsx / StatsGrid.css
│   ├── WeatherSection.tsx / WeatherSection.css
│   ├── LodgingFoodSection.tsx / LodgingFoodSection.css
│   ├── OverviewSection.tsx / OverviewSection.css
│   ├── CallToAction.tsx / CallToAction.css
│   └── Footer.tsx / Footer.css
├── data/mockData.ts
├── styles/global.css
├── types/travel.ts
├── App.tsx
└── main.tsx
```

Cada componente contém o JSX e a lógica TypeScript daquele bloco; o CSS visual correspondente fica em um arquivo separado. `index.html` é apenas a página-base que carrega o React.

## Interações implementadas no front-end

- Menu de navegação expansível em telas pequenas.
- Formulário de pesquisa controlado por `useState`, com validação básica dos campos obrigatórios.
- Ao enviar, a página mostra um resumo dos dados e informa que a consulta é demonstrativa.
- Botão da chamada final leva o usuário ao formulário.
- Links de navegação apontam para as seções da própria página.

**Limite importante:** o HTML de origem é uma página demonstrativa. Os preços, hotéis, temperaturas e gráficos continuam sendo dados estáticos de exemplo. Não existe integração com companhia aérea, API meteorológica, hospedagem ou backend. A mensagem de pesquisa não afirma que houve uma consulta real.

## Análise técnica do visual e dos efeitos

### Hierarquia e composição

- **Cabeçalho fixo (`Header`)**: `position: sticky` conserva os links visíveis durante a rolagem. O fundo azul-marinho mantém contraste com os links claros.
- **Hero (`Hero`)**: gradiente escuro, círculo decorativo com pseudo-elemento e ilustração vetorial criam a primeira área de destaque sem depender de imagem externa.
- **Cartão de busca (`SearchCard`)**: a margem negativa aproxima o cartão do hero e a sombra eleva visualmente o formulário. Em telas pequenas, a sobreposição é removida para evitar apertos.
- **Blocos comparativos**: CSS Grid organiza voos e clima em duas colunas; estatísticas formam uma faixa de quatro itens; hospedagem e alimentação usam duas colunas.
- **Gráficos SVG**: linhas climáticas e radar são vetores estáticos embutidos nos componentes. Eles ficam nítidos em diferentes resoluções, mas não são dados dinâmicos.
- **CTA e rodapé**: o CTA reutiliza o gradiente da identidade visual; o rodapé organiza links em colunas.

### Efeitos CSS existentes ou adaptados

- `position: sticky` no cabeçalho.
- `transition: opacity` nos links do menu e mudança de cor no botão principal ao passar o cursor.
- Gradientes no hero e CTA, círculo decorativo no hero e sombra no cartão de busca.
- Bordas, cores e espaçamentos para criar divisões entre cartões sem sombras excessivas.
- Breakpoints em `760px` para recolher a navegação e empilhar os grids.
- Respeito a `prefers-reduced-motion` para limitar animações futuras e suavizações não essenciais.

O HTML inicial **não** continha animações de entrada, efeitos de parallax, carrossel, gráfico animado ou busca funcional. Esses comportamentos não foram inventados. Os gráficos continuam estáticos e a consulta está identificada como demonstração.

### Onde cada responsabilidade fica

| Responsabilidade | Local |
| --- | --- |
| Reset, tokens de cor, tipografia e layout global | `src/styles/global.css` |
| Navegação sticky e menu mobile | `src/components/Header.tsx` + `Header.css` |
| Mensagem principal e arte vetorial | `Hero.tsx` + `Hero.css` |
| Estado/validação do formulário | `SearchCard.tsx` + `SearchCard.css` |
| Conteúdo de exemplo reutilizável | `src/data/mockData.ts` |
| Tipos compartilhados | `src/types/travel.ts` |
| Montagem das seções | `src/App.tsx` |

### Notas para a próxima etapa

1. Conectar o formulário a um endpoint quando existir contrato de API; manter a validação do formulário separada do serviço HTTP.
2. Substituir os dados fixos por respostas reais e exibir estados de carregamento, erro e ausência de resultados.
3. Se os gráficos precisarem representar dados variáveis, criar componentes de visualização com escala, legenda e descrição acessível.
4. Considerar testes de interação para o menu mobile e o envio do formulário.

## Observação sobre dados de exemplo

Os números e textos foram preservados como conteúdo demonstrativo do HTML de origem. Não devem ser interpretados como tarifas ou previsões atuais.
