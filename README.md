# Linhas Estatísticas

Site comparativo de viagens entre duas rotas aéreas fixas, construído como Projeto Final da disciplina de Estatística — TADS/ADS, IFMS Nova Andradina.

O sistema compara **Campo Grande → Rio de Janeiro** (`SBCG → SBRJ`) e **Campo Grande → São Paulo** (`SBCG → SBSP`) sobre cinco dimensões: preço de passagem, clima, hospedagem, alimentação e um score composto que resume as quatro anteriores num único gráfico de radar.

---

## Sumário

- [O que é](#o-que-é)
- [O que não é](#o-que-não-é)
- [Telas](#telas)
- [Stack](#stack)
- [Estrutura de arquivos](#estrutura-de-arquivos)
- [Contrato de dados](#contrato-de-dados)
- [Camada estatística](#camada-estatística)
- [Como rodar](#como-rodar)
- [Equipe](#equipe)
- [Fontes dos dados](#fontes-dos-dados)
- [Limitações](#limitações)

---

## O que é

Um site estático de 7 páginas que apresenta uma análise comparativa entre duas rotas. Os dados são coletados manualmente de fontes públicas, consolidados num único `dados.json`, e renderizados em tabelas e gráficos no navegador.

A entrega tem duas metades:

| Metade | Peso |
|---|---|
| **Interface** — landing page animada, navegação entre as telas, gráficos | Vitrine |
| **Análise** — dispersão de preços, normalização, score composto no radar | Nota |

O diferencial perante a banca não é o site. É a camada estatística. Um comparador bonito sem estatística é trabalho de Web, não de Estatística.

## O que não é

Não é metabuscador. Não consome API de companhia aérea em tempo real, não tem backend, não tem banco de dados, não tem autenticação.

As rotas são fixas e os dados são um recorte coletado à mão. O formulário da página inicial é navegação com aparência de busca — ele leva da tela Principal para a tela de Dados da Busca, e nada mais.

Isso é decisão de escopo, não limitação acidental. Trocar dados manuais por API ao vivo triplicaria o trabalho de engenharia sem acrescentar nada à análise estatística, que é o que a disciplina avalia.

## Telas

| Tela | Conteúdo |
|---|---|
| **Principal** | Hero animado, formulário origem/destino, chamada para a comparação |
| **Dados da Busca** | Tabela de tarifas por companhia e classe, duas rotas lado a lado |
| **Dados e Preços** | Gráficos de linha do preço mensal ao longo do ano, maior e menor preço marcados |
| **Detalhes da Viagem** | Três cards de entrada: hotéis, clima, restaurantes |
| **Clima da Viagem** | Gráfico combinado por cidade — barras de precipitação, linha de temperatura |
| **Hotel** | Diárias por hotel, custo médio por rota, custo total estimado da hospedagem |
| **Alimentação** | Custo médio de refeição por cidade e comidas típicas |
| **Visão Geral** | Radar comparativo de cinco eixos normalizados e a conclusão do trabalho |

Protótipo de referência no Figma: `Projeto Final - Estatisticas`, arquivo `GJBL2SA3rTrlAsppViOEQU`.

## Stack

Sem build step, sem gerenciador de pacotes, sem framework.

| Camada | Escolha | Razão |
|---|---|---|
| Marcação | HTML5 estático | 7 páginas, nenhuma rota dinâmica |
| Estilo | CSS puro com variáveis | Tokens extraídos do Figma, um só arquivo de origem para cores e tipografia |
| Gráficos | Chart.js (UMD, versão fixada via CDN) | Linha, barra, combo e radar num só pacote |
| Animação | CSS + `IntersectionObserver` | Zero dependência |
| Dados | `dados.json` estático, lido com `fetch` | Separa coleta de apresentação |

**Por que não GSAP**: 70 KB e uma curva de aprendizado que a equipe não tem prazo para subir. `transition` em CSS com observador de rolagem entrega o mesmo efeito de entrada, roda em qualquer máquina do laboratório e é mais simples de defender na apresentação.

**Por que não React**: não há estado compartilhado entre telas. Cada página é um documento independente que lê o mesmo JSON. Adicionar um framework aqui seria complexidade sem contrapartida.

## Estrutura de arquivos

```
linhas-estatisticas/
├── index.html                 # Pág. Principal (landing animada)
├── dados-busca.html
├── dados-precos.html
├── detalhes.html
├── clima.html
├── hotel.html
├── alimentacao.html
├── visao-geral.html
│
├── css/
│   ├── tokens.css             # variáveis: cores, fontes, espaçamento
│   ├── base.css               # header, nav, footer, grid
│   └── animacoes.css          # transições e estados de revelação
│
├── js/
│   ├── reveal.js              # IntersectionObserver + API window.LE
│   ├── normalizar.js          # min-max e inversão de eixos
│   └── graficos.js            # instâncias Chart.js
│
├── dados/
│   ├── dados.json             # dados reais coletados
│   ├── dados-falsos.json      # números inventados, para desenvolver sem esperar a coleta
│   └── fontes.md              # URLs de origem com data de acesso
│
├── docs/
│   ├── relatorio.pdf
│   └── slides.pdf
│
├── plano-de-equipe.html       # divisão de trabalho entre os 4 integrantes
└── README.md
```

## Contrato de dados

Todo número exibido no site vem de `dados/dados.json`. **Nenhum valor é digitado direto no HTML.** Se um número aparece na tela e não está no JSON, é bug.

```json
{
  "coletado_em": "2026-09-20",
  "origem": { "icao": "SBCG", "cidade": "Campo Grande" },

  "rotas": {
    "SBRJ": {
      "cidade": "Rio de Janeiro",

      "passagens": {
        "meses": ["jan","fev","mar","abr","mai","jun",
                  "jul","ago","set","out","nov","dez"],
        "companhias": [
          {
            "nome": "GOL",
            "classe": "economica",
            "precos": [742.10, 698.00, null, 815.40, 779.90, 690.00,
                       905.30, 880.00, 712.50, 733.20, 851.00, 1120.40]
          }
        ],
        "estatisticas": {
          "n": 34,
          "media": 812.45,
          "mediana": 779.90,
          "desvio_padrao": 118.72,
          "coef_variacao": 0.146,
          "minimo": 690.00,
          "maximo": 1120.40
        }
      },

      "clima": {
        "temp_max":     [30.1, 30.4, 29.7, 28.2, 26.8, 25.6,
                         25.3, 25.9, 26.1, 27.0, 28.1, 29.3],
        "temp_min":     [23.2, 23.4, 23.0, 21.8, 20.4, 19.1,
                         18.6, 19.0, 19.7, 20.8, 21.7, 22.6],
        "precipitacao": [137, 130, 135, 95, 70, 55,
                         41, 44, 53, 86, 98, 134],
        "fonte": "ClimaTempo — climatologia"
      },

      "hotel": {
        "n": 6,
        "diaria_media": 620.66,
        "diaria_mediana": 574.00,
        "noites": 5,
        "custo_total": 3103.30
      },

      "alimentacao": {
        "cafe": 24.00,
        "almoco": 48.00,
        "jantar": 62.00,
        "media_diaria": 134.00,
        "tipicas": ["Feijoada", "Pão de queijo", "Açaí"]
      }
    },

    "SBSP": { "...": "mesma estrutura, São Paulo" }
  }
}
```

### Regras do JSON

**Mês sem operação é `null`, nunca `0`.**

```js
// ERRADO — zero entra na conta como se fosse passagem de graça
const media = precos.reduce((a, b) => a + b, 0) / precos.length;

// CERTO — ausência é removida antes do cálculo
const validos = precos.filter(p => p !== null);
const media = validos.reduce((a, b) => a + b, 0) / validos.length;
```

Zero é um preço. `null` é ausência de dado. Confundir os dois arrasta a média para baixo e inventa uma companhia barata que não existe. Chart.js também trata `null` corretamente — desenha um buraco na linha em vez de um mergulho até o eixo.

**Toda média carrega seu `n`.** Média de 3 hotéis e média de 30 hotéis não têm o mesmo peso. O campo `n` existe para que a tela possa mostrar o tamanho da amostra junto do valor.

**`coletado_em` é obrigatório.** Preço de passagem muda diariamente. Sem a data, o número não significa nada seis meses depois.

## Camada estatística

### Dispersão por companhia

Média sozinha esconde o que interessa. Duas companhias com média de R$ 800 são coisas diferentes se uma varia entre R$ 780 e R$ 820 e a outra entre R$ 400 e R$ 1.200.

O **coeficiente de variação** responde qual companhia tem preço mais imprevisível:

```
CV = desvio_padrão / média
```

Por ser adimensional, compara dispersões entre rotas de preço médio diferente — o que o desvio padrão bruto não faz.

### Normalização min-max

Preço em reais, temperatura em graus e distância em quilômetros não somam. Todos vão para a faixa 0–1 antes de entrar no radar:

```js
function normalizar(valor, minimo, maximo) {
  if (maximo === minimo) return 0.5;   // evita divisão por zero
  return (valor - minimo) / (maximo - minimo);
}
```

### Inversão dos eixos onde menor é melhor

Este é o ponto crítico do projeto.

Depois de normalizar, um valor alto significa "muito". Mas em preço, custo de hotel e custo de alimentação, "muito" é **ruim**. Sem inverter, o radar desenha a cidade mais cara como a melhor opção e o gráfico inteiro mente:

```js
const MENOR_E_MELHOR = ['preco_passagem', 'custo_hotel', 'custo_alimentacao'];

function pontuarEixo(eixo, valor, minimo, maximo) {
  const z = normalizar(valor, minimo, maximo);
  return MENOR_E_MELHOR.includes(eixo) ? 1 - z : z;
}
```

### Score composto

```
score = w₁·preço + w₂·clima + w₃·hotel + w₄·alimentação
```

Com os pesos somando 1. Deixar os pesos visíveis na interface é o que torna o resultado honesto: "melhor viagem" é função da preferência declarada de quem viaja, não fato objetivo. Quem prioriza preço e quem prioriza clima chegam a conclusões diferentes a partir dos mesmos dados — e o site mostra isso em vez de esconder.

## Como rodar

O site lê `dados/dados.json` via `fetch`, e o navegador bloqueia `fetch` sobre `file://`. Abrir o `index.html` com duplo clique carrega a página mas deixa todos os gráficos vazios.

Suba um servidor local:

```bash
python -m http.server 8000
```

Depois abra `http://localhost:8000`.

Alternativa sem Python:

```bash
npx serve .
```

Durante o desenvolvimento, antes da coleta terminar, aponte o `fetch` para `dados/dados-falsos.json` — mesma estrutura, números inventados. Isso permite construir os gráficos sem esperar a planilha ficar pronta.

## Equipe

Quatro integrantes, quatro frentes. A divisão detalhada, com tarefas numeradas e critérios de conclusão, está em [`plano-de-equipe.html`](plano-de-equipe.html).

| Posto | Responsabilidade | Entregável |
|---|---|---|
| **P1** | Coleta e cálculos estatísticos | `dados.json`, planilha fonte |
| **P2** | Tokens, layout base e landing animada | `tokens.css`, `reveal.js`, `index.html` |
| **P3** | Gráficos Chart.js e integração final | `graficos.js`, `normalizar.js` |
| **P4** | Telas de destino, relatório e slides | `hotel.html`, `alimentacao.html`, `relatorio.pdf` |

P1 está no caminho crítico: P3 e P4 dependem do `dados.json`. Por isso o schema é fechado no primeiro dia, antes de qualquer coleta, e P3 trabalha contra dados falsos enquanto a planilha é preenchida.

## Fontes dos dados

| Dimensão | Origem |
|---|---|
| Preços de passagem | Painel ANAC no Power BI |
| Climatologia | ClimaTempo — página de climatologia por cidade |
| Hospedagem | Accor (`all.accor.com`) |
| Alimentação | `quantocustaviajar.com` |
| Comidas típicas | Food To Save, Terra |

As URLs completas, com data de acesso, ficam em `dados/fontes.md` e são reproduzidas no relatório.

## Limitações

Declaradas aqui e no relatório. Reconhecer o limite do próprio método é o que separa análise estatística de tabela colorida.

- **Amostra de conveniência.** Os dados não foram sorteados. Foram os que estavam disponíveis publicamente nas fontes escolhidas, o que impede generalizar os resultados para além destas duas rotas.
- **Recorte temporal único.** Preços refletem uma janela de coleta de poucos dias. Uma coleta em outro período produziria outros números e possivelmente outra conclusão.
- **Viés de rede hoteleira.** As diárias vêm de uma só rede. O custo de hospedagem apurado representa aquele padrão de hotel, não o mercado da cidade.
- **Climatologia não é previsão.** As séries de temperatura e chuva são médias históricas mensais. Descrevem o comportamento típico do mês, não o tempo que fará numa data específica.
- **Sem validação cruzada de preço.** Os valores não foram conferidos contra uma segunda fonte independente.
