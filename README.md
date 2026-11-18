# Linhas Estatísticas

Site comparativo de viagens de Campo Grande para dez destinos, construído como Projeto Final da disciplina de Estatística — TADS/ADS, IFMS Nova Andradina.

O sistema compara as rotas de **Campo Grande (SBCG)** para os dez destinos com mais assentos vendidos na ANAC em 2026: Rio de Janeiro (`RIO`: SBRJ + SBGL), São Paulo (`SAO`: SBSP + SBGR), Campinas (`CPQ`: SBKP), Brasília (`BSB`: SBBR), Recife (`REC`: SBRF), Belo Horizonte (`BHZ`: SBCF), Porto Alegre (`POA`: SBPA), Curitiba (`CWB`: SBCT), Salvador (`SSA`: SBSV) e Florianópolis (`FLN`: SBFL). A comparação usa cinco dimensões: preço de passagem, clima, hospedagem, alimentação e um score composto que resume as quatro anteriores num único gráfico de radar.

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

Um site estático de 8 telas, mais uma página de fontes, que apresenta uma análise comparativa entre dez rotas. Cada tela compara até três cidades de cada vez, escolhidas pelo visitante; a Visão Geral traz também o ranking das dez. As passagens vêm dos microdados de tarifas da ANAC, recortados e resumidos por um pipeline offline em Python. Clima, hospedagem e alimentação são digitados à mão a partir de fontes públicas. Tudo é consolidado num único `dados.json` e renderizado em tabelas e gráficos no navegador.

A entrega tem duas metades:

| Metade | Peso |
|---|---|
| **Interface** — landing page animada, navegação entre as telas, gráficos | Vitrine |
| **Análise** — dispersão de preços, normalização, score composto no radar | Nota |

O diferencial perante a banca não é o site. É a camada estatística. Um comparador bonito sem estatística é trabalho de Web, não de Estatística.

## O que não é

Não é metabuscador. Não consome API de companhia aérea em tempo real, não tem backend, não tem banco de dados, não tem autenticação.

As rotas são fixas e os dados são um recorte gerado antes da apresentação. O pipeline Python roda uma vez na máquina de quem coleta; nenhum servidor roda no dia. O formulário da página inicial é navegação com aparência de busca — ele leva da tela Principal para a tela de Dados da Busca, e nada mais.

Isso é decisão de escopo, não limitação acidental. Trocar dados manuais por API ao vivo triplicaria o trabalho de engenharia sem acrescentar nada à análise estatística, que é o que a disciplina avalia.

## Telas

| Tela | Conteúdo |
|---|---|
| **Principal** | Hero animado, formulário origem/destino, chamada para a comparação |
| **Dados da Busca** | Tabela de tarifas por companhia, uma por cidade escolhida |
| **Dados e Preços** | Gráficos de linha do preço mensal ao longo do ano, maior e menor preço marcados |
| **Detalhes da Viagem** | Três cards de entrada: hotéis, clima, restaurantes |
| **Clima da Viagem** | Dois gráficos separados, cada um com a sua escala: temperatura média mensal (linha) e precipitação (barras), com as cidades escolhidas em cada um |
| **Hotel** | Diárias por hotel, custo médio por rota, custo total estimado da hospedagem |
| **Alimentação** | Custo médio de refeição por cidade e comidas típicas |
| **Visão Geral** | Radar comparativo de cinco eixos normalizados, a conclusão e o ranking das dez cidades |

Protótipo de referência no Figma: `Projeto Final - Estatisticas`, arquivo `GJBL2SA3rTrlAsppViOEQU`.

## Stack

Sem build step, sem gerenciador de pacotes, sem framework.

| Camada | Escolha | Razão |
|---|---|---|
| Marcação | HTML5 estático | 8 páginas, nenhuma rota dinâmica |
| Estilo | CSS puro com variáveis | Tokens extraídos do Figma, um só arquivo de origem para cores e tipografia |
| Gráficos | Chart.js 4.4.1 (UMD, via cdnjs com `integrity`) | Linha, barra e radar num só pacote |
| Animação | CSS + `IntersectionObserver` | Zero dependência |
| Dados | `dados.json` estático, lido com `fetch` | Separa coleta de apresentação |
| Pipeline | Python, só biblioteca padrão (`csv`, `json`, `statistics`) | Roda offline, sem `pip install` |

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
├── fontes.html                # URL e data de acesso de cada fonte
│
├── css/
│   ├── tokens.css             # variáveis: cores, fontes, espaçamento
│   ├── base.css               # header, nav, footer, grid
│   └── animacoes.css          # transições e estados de revelação
│
├── js/
│   ├── normalizar.js          # LE.stats: min-max, inversão de eixos, conforto térmico, score
│   ├── selecao.js             # cidades em comparação (até 3, cor pela posição), na URL e no localStorage
│   ├── reveal.js              # IntersectionObserver + LE.aoRevelar
│   ├── graficos.js            # fetch do JSON, evento le:dados, instâncias Chart.js
│   ├── tabelas.js             # preenche data-campo, as listas e os modelos por cidade (data-por-cidade)
│   ├── busca.js               # destaca a rota escolhida na Principal (?destino=<sigla>)
│   └── pesos.js               # pesos ajustáveis do score composto
│
├── dados/
│   ├── dados.json             # gerado pelo pipeline; é o que o site lê
│   ├── dados-falsos.json      # números inventados, para desenvolver sem esperar a coleta
│   ├── anac/
│   │   ├── brutos/            # microdados da ANAC (fora do git)
│   │   └── tarifas_sbcg.csv   # recorte SBCG → os dez destinos (versionado)
│   └── manual/
│       ├── clima.json         # INMET, normais 1961–1990
│       ├── hoteis.json        # Accor, coleta manual
│       ├── alimentacao.json   # custo de refeição e comidas típicas
│       └── anac.json          # data de acesso aos microdados da ANAC
│
├── pipeline/
│   ├── extrair_anac.py        # brutos → tarifas_sbcg.csv
│   ├── estatistica.py         # média, mediana e desvio padrão ponderados
│   └── gerar_dados.py         # recorte + manuais → dados.json
│
├── tests/                     # unittest do pipeline, node --test do JS, fumaça com Playwright
│
├── docs/
│   ├── backlog.html
│   └── plano-de-equipe.html   # divisão de trabalho entre os 4 integrantes
└── README.md
```

O fluxo dos dados:

```
dados/anac/brutos/*.CSV
  └─ pipeline/extrair_anac.py ──► dados/anac/tarifas_sbcg.csv
dados/manual/{clima,hoteis,alimentacao,anac}.json
  └─ pipeline/gerar_dados.py ──► dados/dados.json ──fetch──► *.html + js/
```

## Contrato de dados

Todo número exibido no site vem de `dados/dados.json`. **Nenhum valor é digitado direto no HTML.** Se um número aparece na tela e não está no JSON, é bug.

O `dados.json` é gerado por `pipeline/gerar_dados.py`; não se edita à mão. Os números abaixo são ilustrativos.

```json
{
  "coletado_em": "2026-11-17",
  "fonte_passagens": {
    "acesso_em": "2026-11-17",
    "fonte": "ANAC, microdados de tarifas aéreas comercializadas"
  },
  "periodo_passagens": { "inicio": "2026-01", "fim": "2026-09" },
  "origem": { "icao": "SBCG", "cidade": "Campo Grande" },
  "meses": ["jan","fev","mar","abr","mai","jun",
            "jul","ago","set","out","nov","dez"],

  "rotas": {
    "RIO": {
      "cidade": "Rio de Janeiro",
      "aeroportos": ["SBRJ", "SBGL"],

      "passagens": {
        "companhias": [
          {
            "nome": "GOL",
            "icao": "GLO",
            "precos":   [742.10, 698.00, null, 815.40, 779.90, 690.00,
                         905.30, 880.00, 712.50, null, null, null],
            "assentos": [506, 522, 12, 258, 434, 905,
                         1019, 712, 574, 0, 0, 0],
            "estatisticas": { "...": "mesmos campos de baixo, só da GOL" }
          }
        ],
        "estatisticas": {
          "n": 20847,
          "linhas": 9527,
          "media": 732.32,
          "mediana": 607.90,
          "desvio_padrao": 442.44,
          "coef_variacao": 0.6042,
          "minimo": 123.70,
          "maximo": 4634.98,
          "ponderado_por": "assentos"
        },
        "mensal": [619.12, 690.71, 856.38, 795.32, 770.48, 654.11,
                   621.20, 797.91, 874.27, null, null, null],
        "mes_mais_caro":   { "mes": "set", "media": 874.27 },
        "mes_mais_barato": { "mes": "jan", "media": 619.12 }
      },

      "clima": {
        "temp_max":     [30.1, 30.4, 29.7, 28.2, 26.8, 25.6,
                         25.3, 25.9, 26.1, 27.0, 28.1, 29.3],
        "temp_min":     [23.2, 23.4, 23.0, 21.8, 20.4, 19.1,
                         18.6, 19.0, 19.7, 20.8, 21.7, 22.6],
        "precipitacao": [137, 130, 135, 95, 70, 55,
                         41, 44, 53, 86, 98, 134],
        "estacao": "média de 8 estações do INMET no município",
        "estacoes": ["Rio de Janeiro", "..."],
        "n_estacoes": 8,
        "periodo": "1961-1990",
        "fonte": "INMET — Normais Climatológicas 1961–1990"
      },

      "hotel": {
        "n": 6,
        "hoteis": [{ "nome": "...", "url": "...", "diaria": 574.00 }],
        "diarias": [574.00, "..."],
        "diaria_media": 620.66,
        "diaria_mediana": 574.00,
        "noites": 5,
        "custo_total": 3103.30,
        "fonte": "Accor (all.accor.com)",
        "coletado_em": "2026-11-17",
        "checkin": "2026-12-01"
      },

      "alimentacao": {
        "medias": { "cafe": 24.00, "almoco": 48.00, "jantar": 62.00 },
        "media_diaria": 134.00,
        "tipicas": ["Feijoada", "Pão de queijo", "Açaí"],
        "fonte": "quantocustaviajar.com",
        "coletado_em": "2026-11-17"
      }
    },

    "SAO": { "...": "mesma estrutura, São Paulo (SBSP + SBGR)" }
  },

  "faixas": {
    "preco_passagem": { "min": 431.79, "max": 944.58 },
    "...": "mínimo e máximo observados de cada eixo, calculados pelo pipeline"
  },

  "pendencias": ["clima.RIO.temp_max", "hoteis.RIO", "..."]
}
```

### Regras do JSON

**Mês sem dado é `null`, nunca `0`.** Out, nov e dez/2026 ainda não existem na ANAC e ficam `null` em todas as séries. Um mês com menos de 30 assentos vendidos para uma companhia também fica `null`.

```js
// ERRADO — o zero de outubro entra na conta como se fosse passagem de graça
const precos = [742.10, 698.00, 0, 0, 0];

// CERTO — mês sem dado fica de fora do cálculo e do gráfico
const precos = [742.10, 698.00, null, null, null];
const validos = precos.filter(p => p !== null);
```

Zero é um preço. `null` é ausência de dado. Confundir os dois arrasta a média para baixo e inventa uma companhia barata que não existe. Chart.js também trata `null` corretamente — desenha um buraco na linha em vez de um mergulho até o eixo.

**Toda média carrega seu `n`.** Média de 3 hotéis e média de 30 hotéis não têm o mesmo peso. O campo `n` existe para que a tela possa mostrar o tamanho da amostra junto do valor. Nas passagens, `n` é a soma de assentos vendidos e `linhas` é o número de linhas do CSV.

**`coletado_em` é obrigatório.** Preço de hotel muda diariamente. Sem a data, o número não significa nada seis meses depois. O `coletado_em` do topo do JSON é a data em que o pipeline rodou; a data de acesso aos microdados da ANAC fica em `fonte_passagens.acesso_em`, copiada de `dados/manual/anac.json`, e é ela que as telas de passagem mostram.

**Dado faltando vai para `pendencias`.** Quando um arquivo de `dados/manual/` ainda tem campos vazios, o pipeline lista o caminho em `pendencias`, e o site mostra uma faixa de aviso no topo de cada tela de dados. A Principal e a página de fontes não leem o JSON e não têm a faixa. Dado falso também nunca aparece sem essa faixa.

## Camada estatística

### Ponderação por assento

Cada linha dos microdados da ANAC é um valor de tarifa e o número de assentos vendidos a esse valor (`nr_assentos`). A unidade estatística é o **assento vendido**, não a linha. Uma tarifa vendida a 300 assentos pesa 300 vezes mais que uma vendida a 1:

```
média         = Σ(tarifa × assentos) / Σ assentos
mediana       = tarifa onde a soma acumulada de assentos, em ordem de preço, passa de metade do total
desvio padrão = √( Σ assentos × (tarifa − média)² / (Σ assentos − 1) )
n             = Σ assentos
```

A média por linha do CSV não é usada: ela trataria uma tarifa promocional vendida a um assento igual à tarifa de um voo lotado. Tarifa zero ou negativa é descartada e contada.

As rotas são por cidade: `RIO` junta `SBRJ` (Santos Dumont) e `SBGL` (Galeão); `SAO` junta `SBSP` (Congonhas) e `SBGR` (Guarulhos). A origem é só `SBCG`, só o sentido de ida. As companhias vêm do código ICAO: `GLO` = GOL, `TAM` = LATAM, `AZU` = Azul.

### Dispersão por companhia

Média sozinha esconde o que interessa. Duas companhias com média de R$ 800 são coisas diferentes se uma varia entre R$ 780 e R$ 820 e a outra entre R$ 400 e R$ 1.200.

O **coeficiente de variação** responde qual companhia tem preço mais imprevisível:

```
CV = desvio_padrão / média
```

Por ser adimensional, compara dispersões entre rotas de preço médio diferente — o que o desvio padrão bruto não faz. O JSON guarda o CV como fração (`0.6042`); a tela mostra em porcentagem.

### Normalização min-max

Preço em reais, temperatura em graus e distância em quilômetros não somam. Todos vão para a faixa 0–1 antes de entrar no radar:

```js
function normalizar(valor, minimo, maximo) {
  if (maximo === minimo) return 0.5;   // evita divisão por zero
  return (valor - minimo) / (maximo - minimo);
}
```

O mínimo e o máximo vêm de um conjunto que junta as dez cidades do estudo, e cada eixo tem o seu. Por isso a nota de uma cidade não muda conforme as outras escolhidas na tela:

| Eixo | Conjunto (mínimo e máximo) | Valor da cidade |
|---|---|---|
| Passagem | as tarifas médias de cada companhia em cada mês, nas dez rotas | média da rota, ponderada por assento |
| Hospedagem | as diárias de todos os hotéis pesquisados nas dez cidades | **mediana** das diárias da cidade |
| Alimentação | do dia mais barato possível (a refeição mais barata de cada tipo) ao mais caro (a mais cara de cada tipo) | média diária (soma das médias de café, almoço e jantar) |
| Tempo seco | os totais mensais de precipitação das dez cidades | média mensal do ano |

A hospedagem usa a mediana porque um hotel muito caro puxa a média para cima e mudaria a posição da cidade sozinho.

### Inversão dos eixos onde menor é melhor

Este é o ponto crítico do projeto.

Depois de normalizar, um valor alto significa "muito". Mas em preço, custo de hotel, custo de alimentação e precipitação, "muito" é **ruim**. Sem inverter, o radar desenha a cidade mais cara como a melhor opção e o gráfico inteiro mente:

```js
const MENOR_E_MELHOR = ['preco_passagem', 'custo_hotel', 'custo_alimentacao', 'precipitacao'];

function pontuarEixo(eixo, valor, minimo, maximo) {
  const z = normalizar(valor, minimo, maximo);
  return MENOR_E_MELHOR.includes(eixo) ? 1 - z : z;
}
```

Temperatura não é min-max, porque nem a mais alta nem a mais baixa é "melhor". O eixo é **conforto térmico**: 1 a 24 °C, caindo até 0 a 12 °C de distância para qualquer lado. O radar tem cinco eixos: passagem, hospedagem, alimentação, conforto térmico e tempo seco.

### Score composto

```
score = w₁·preço + w₂·clima + w₃·hotel + w₄·alimentação
```

Na tela, cada controle vai de 0 a 100. Os pesos são renormalizados sobre os eixos com dado: eixo sem nota numa das cidades sai da conta, e o peso dele sai da soma. O peso do clima se divide igualmente entre conforto térmico e tempo seco; se só um dos dois tiver dado, só a metade do peso do clima entra. A porcentagem ao lado de cada controle é esse peso efetivo, arredondada pelo maior resto para somar exatamente 100%; parte sem dado nas duas cidades aparece como "fora do cálculo". Deixar os pesos visíveis na interface é o que torna o resultado honesto: "melhor viagem" é função da preferência declarada de quem viaja, não fato objetivo. Quem prioriza preço e quem prioriza clima chegam a conclusões diferentes a partir dos mesmos dados — e o site mostra isso em vez de esconder.

## Como rodar

O site lê `dados/dados.json` via `fetch`, e o navegador bloqueia `fetch` sobre `file://`. Abrir o `index.html` com duplo clique carrega a página, mas as telas de dados mostram, no lugar dos gráficos e no topo da tela, a mensagem para abrir o site por um servidor local.

Suba um servidor local:

```bash
python -m http.server 8000
```

Depois abra `http://localhost:8000`.

Alternativa sem Python:

```bash
npx serve .
```

Durante o desenvolvimento, antes da coleta terminar, troque a fonte no `<html>` da página: `<html lang="pt-BR" data-fonte="dados/dados-falsos.json">`. Sem o atributo, o site lê `dados/dados.json`. O arquivo falso tem a mesma estrutura e números inventados, e o site mostra a faixa de aviso enquanto ele estiver em uso. Não faça commit com o `data-fonte` trocado.

### Gerar os dados

Os CSVs brutos da ANAC (~250 MB) não vêm no clone. Baixe os microdados de tarifas aéreas comercializadas, voos domésticos, de jan a set/2026, e coloque-os em `dados/anac/brutos/` (a pasta está no `.gitignore`). Os mesmos arquivos estão na branch `Dados-e-Estatística`, em `dados/dados_anac/`. Depois:

```bash
python -m pipeline.extrair_anac   # brutos → dados/anac/tarifas_sbcg.csv
python -m pipeline.gerar_dados    # recorte + dados/manual/*.json → dados/dados.json
```

O recorte `tarifas_sbcg.csv` é versionado, então só o segundo comando é necessário depois de editar um arquivo de `dados/manual/`. Nenhum dos dois precisa de `pip install`.

### Como preencher os dados manuais

Cada arquivo de `dados/manual/` é JSON. Número usa ponto como separador decimal (`24.5`, não `24,5`) e campo ainda não coletado fica `null`, nunca `0`. Datas no formato `aaaa-mm-dd`.

- `clima.json`: para cada cidade, uma lista `estacoes` do INMET, cada uma com `codigo`, `nome` e as séries `temp_max`, `temp_min` e `precipitacao`, com 12 valores cada, de janeiro a dezembro. O pipeline tira a média mês a mês das estações. Uma cidade com uma estação só pode usar `estacao` e as séries direto.
- `hoteis.json`: `coletado_em`, `checkin` e `noites` no topo; em cada cidade, uma entrada por hotel com `nome`, `url` e `diaria`. O arquivo vem com modelos de hotel todos em `null`: apague os que não usar. Modelo todo nulo é ignorado, mas um hotel com nome e sem diária deixa a cidade pendente.
- `alimentacao.json`: `coletado_em` no topo; em cada cidade, listas de preços de `cafe`, `almoco` e `jantar` e as comidas `tipicas`. Com menos de três preços por refeição, a alimentação aparece na tela, mas fica fora do radar e do score.
- `anac.json`: `acesso_em`, a data em que os microdados foram baixados, e a `fonte`.

Depois de editar, rode `python -m pipeline.gerar_dados`. Ele imprime a lista de `pendencias`; confira se sumiu o que você acabou de preencher.

### Testes

```bash
python -m unittest discover -s tests -t . -v   # pipeline
node --test tests/*.test.cjs                   # normalizar.js, pesos.js, tabelas.js e "sem números no HTML"
```

No Node 22, `node --test tests/` sem o padrão falha; use `tests/*.test.cjs`.

O teste de fumaça abre as 8 telas e a página de fontes num navegador de verdade. Ele precisa do Playwright, que é a única dependência externa do projeto e só existe nos testes:

```bash
pip install -r tests/requirements.txt
python -m playwright install chromium
python tests/site.smoke.py
```

## Relatório e apresentação

- Relatório: [`docs/relatorio/relatorio.pdf`](docs/relatorio/relatorio.pdf), gerado de `dados/dados.json` com as mesmas contas do site.
- Slides: [`docs/apresentacao/linhas-estatisticas.pptx`](docs/apresentacao/linhas-estatisticas.pptx) e a versão em PDF ao lado.

Para gerar de novo depois de mudar os dados (Windows, com Microsoft Edge e PowerPoint instalados):

```bash
node docs/relatorio/scores.cjs
python docs/relatorio/gerar.py
python docs/relatorio/pdf.py
python docs/apresentacao/conteudo.py
powershell -ExecutionPolicy Bypass -File docs/apresentacao/montar.ps1
```

`pdf.py` usa `pypdf` e `conteudo.py` usa `matplotlib`; nenhum dos dois faz parte do pipeline.

## Equipe

Quatro integrantes, quatro frentes. A divisão detalhada, com tarefas numeradas e critérios de conclusão, está em [`docs/plano-de-equipe.html`](docs/plano-de-equipe.html).

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
| Preços de passagem | ANAC — microdados de tarifas aéreas comercializadas, voos domésticos, jan–set/2026, SBCG para os dez destinos |
| Climatologia | INMET — Normais Climatológicas do Brasil 1961–1990: média mês a mês das estações de cada município (8 no Rio, 2 em São Paulo, 1 nas outras cidades). As normais mais novas não trazem a estação central do Rio completa. |
| Hospedagem | Accor (`all.accor.com`): de 2 hotéis (Campinas e Brasília) a 34 (São Paulo) por cidade, marcas econômicas e intermediárias, check-in 12/01/2027, 5 noites |
| Alimentação | Quanto Custa Viajar (três faixas por refeição) e Numbeo (restaurante barato e restaurante médio) |
| Comidas típicas | Quanto Custa Viajar |

A fonte, a estação e a data de coleta de cada dado manual ficam no próprio arquivo de `dados/manual/`, seguem para o `dados.json` e são reproduzidas no relatório. As URLs e as datas de acesso estão em [`fontes.html`](fontes.html).

## Limitações

Declaradas aqui e no relatório. Reconhecer o limite do próprio método é o que separa análise estatística de tabela colorida.

- **Amostra de conveniência.** Os dados não foram sorteados. Foram os que estavam disponíveis publicamente nas fontes escolhidas, o que impede generalizar os resultados para além destas dez rotas.
- **Período da ANAC de 9 meses.** As passagens cobrem jan–set/2026. Não existe série de dezembro, o mês tradicionalmente mais caro.
- **Rotas por cidade.** A média de cada rota junta aeroportos com perfis de preço diferentes: Santos Dumont e Galeão no Rio, Congonhas e Guarulhos em São Paulo.
- **Viracopos é Campinas.** `SBKP` entra como destino próprio, Campinas, e não na rota de São Paulo. A Azul tem pouco volume na rota de São Paulo porque concentra os voos em Viracopos.
- **Tarifa sem taxas.** O valor da ANAC é a tarifa comercializada, sem taxas de embarque. O passageiro paga mais do que o número mostrado.
- **Recorte temporal único na hospedagem e na alimentação.** Diárias e refeições refletem uma janela de coleta de poucos dias. Uma coleta em outro período produziria outros números e possivelmente outra conclusão.
- **Alimentação por fontes, não por restaurantes.** Cada preço de café, almoço e jantar é a estimativa de uma fonte: as três faixas do Quanto Custa Viajar e dois valores do Numbeo. São médias publicadas, não cardápios sorteados, e misturam faixas de preço; as fontes são as mesmas em todas as cidades. A ABBT e a VR foram consultadas e ficaram fora porque não cobrem todas as cidades. As faixas do Quanto Custa Viajar de Brasília e Belo Horizonte parecem mais antigas que as das outras cidades. Com menos de três preços por refeição, o eixo sairia do radar e do score (`MIN_PRECOS_REFEICAO` em `pipeline/gerar_dados.py`).
- **Poucos hotéis em algumas cidades.** A Accor tem 2 hotéis dentro do município em Campinas e em Brasília e 3 no Recife e em Florianópolis. Nessas cidades a mediana das diárias depende de dois ou três números.
- **Viés de rede hoteleira.** As diárias vêm de uma só rede. O custo de hospedagem apurado representa aquele padrão de hotel, não o mercado da cidade.
- **Climatologia não é previsão.** As séries de temperatura e chuva são as médias de 1961–1990, não o clima de 2026. É o único período em que o INMET publica temperatura e chuva da estação central do Rio; todas as cidades usam o mesmo período, mas o aquecimento desde então não aparece. O Rio tem 8 estações na média e São Paulo 2; as outras cidades, 1. Descrevem o comportamento típico do mês, não o tempo que fará numa data específica.
- **Sem validação cruzada de preço.** Os valores não foram conferidos contra uma segunda fonte independente.
