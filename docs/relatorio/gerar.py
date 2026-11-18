"""Gera docs/relatorio/relatorio.html a partir de dados/dados.json e de scores.json.

scores.json vem do js/normalizar.js (a mesma conta do site):
    node docs/relatorio/scores.cjs
Depois:
    python docs/relatorio/gerar.py
e imprima o HTML em PDF (Microsoft Edge, modo headless):
    msedge --headless --print-to-pdf=docs/relatorio/relatorio.pdf docs/relatorio/relatorio.html
"""
import html
import json
import statistics
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
PASTA = Path(__file__).resolve().parent
D = json.loads((RAIZ / "dados" / "dados.json").read_text(encoding="utf-8"))
SC = json.loads((PASTA / "scores.json").read_text(encoding="utf-8"))
ROTAS = D["rotas"]
MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto",
         "setembro", "outubro", "novembro", "dezembro"]
ABREV = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]


def num(v, casas=2):
    if v is None:
        return "—"
    s = f"{v:,.{casas}f}"
    return s.replace(",", "X").replace(".", ",").replace("X", ".")


def moeda(v):
    return "—" if v is None else "R$ " + num(v)


def pct(v):
    return "—" if v is None else num(v * 100, 1) + "%"


def mes(abrev):
    return MESES[ABREV.index(abrev)] if abrev in ABREV else (abrev or "—")


def data(iso):
    a, m, d = iso.split("-")
    return f"{int(d)} de {MESES[int(m) - 1]} de {a}"


def e(t):
    return html.escape(str(t))


def tabela(cab, linhas, num_cols=None, legenda=""):
    num_cols = set(range(1, len(cab)) if num_cols is None else num_cols)
    th = "".join(f'<th{" class=n" if i in num_cols else ""}>{e(c)}</th>' for i, c in enumerate(cab))
    corpo = "".join("<tr>" + "".join(
        f'<{"th" if i == 0 else "td"}{" class=n" if i in num_cols else ""}>{c}</{"th" if i == 0 else "td"}>'
        for i, c in enumerate(l)) + "</tr>" for l in linhas)
    leg = f'<p class="legenda">{legenda}</p>' if legenda else ""
    return f"<table><thead><tr>{th}</tr></thead><tbody>{corpo}</tbody></table>{leg}"


def barras(itens, fmt, titulo, nota=""):
    """Gráfico de barras horizontais em HTML: itens = [(rótulo, valor)], já ordenados."""
    maior = max(v for _, v in itens)
    linhas = "".join(
        f'<div class="barra"><span class="rot">{e(r)}</span>'
        f'<span class="trilho"><span class="marca" style="width:{v / maior * 100:.1f}%"></span></span>'
        f'<span class="val">{fmt(v)}</span></div>' for r, v in itens)
    n = f'<p class="legenda">{nota}</p>' if nota else ""
    return f'<figure class="grafico"><figcaption>{e(titulo)}</figcaption>{linhas}{n}</figure>'


# ---------- números ----------
ordem = list(ROTAS)
nome = {k: ROTAS[k]["cidade"] for k in ordem}
pas = {k: ROTAS[k]["passagens"] for k in ordem}
hot = {k: ROTAS[k]["hotel"] for k in ordem}
ali = {k: ROTAS[k]["alimentacao"] for k in ordem}
cli = {k: ROTAS[k]["clima"] for k in ordem}
temp = {k: statistics.mean((a + b) / 2 for a, b in zip(cli[k]["temp_max"], cli[k]["temp_min"])) for k in ordem}
chuva = {k: sum(cli[k]["precipitacao"]) for k in ordem}
ini, fim = D["periodo_passagens"]["inicio"], D["periodo_passagens"]["fim"]
assentos = sum(p["estatisticas"]["n"] for p in pas.values())
iguais = SC["cenarios"]["iguais"]["score"]
rank = sorted(ordem, key=lambda k: -iguais[k])


def periodo(p):
    a, m = p.split("-")
    return f"{ABREV[int(m) - 1]}/{a}"


def top(cen, n=3):
    s = SC["cenarios"][cen]["score"]
    return ", ".join(f"{nome[k]} ({num(s[k])})" for k in sorted(ordem, key=lambda k: -s[k])[:n])


sec = []

# ---------- 1. Introdução ----------
sec.append(f"""
<h2>1. Introdução</h2>
<p>Quem mora em Campo Grande (MS) e quer viajar de avião costuma comparar destinos pelo preço da passagem. Esse número sozinho esconde o resto da viagem: quanto custa dormir, quanto custa comer e como é o clima no mês da viagem. Este trabalho compara as dez rotas aéreas com mais assentos vendidos a partir de Campo Grande (SBCG) em {periodo(ini)}–{periodo(fim)} em quatro dimensões — passagem, hospedagem, alimentação e clima — e as reúne num score composto cujo peso de cada parte é escolhido por quem lê.</p>
<p>O objetivo não é eleger a melhor viagem em absoluto, e sim mostrar, com dados públicos e método explícito, como a resposta muda com a preferência declarada. Os resultados estão também no site do projeto, que repete cada número com a fonte, o período e o tamanho da amostra.</p>
""")

# ---------- 2. Dados ----------
fontes = [
    ["Passagens", "ANAC — microdados de tarifas aéreas comercializadas, voos domésticos",
     f"{periodo(ini)} a {periodo(fim)}; {num(assentos, 0)} assentos de SBCG para os dez destinos"],
    ["Clima", e(cli["RIO"]["fonte"]), "Média mês a mês das estações de cada município (8 no Rio, 2 em São Paulo, 1 nas demais)"],
    ["Hospedagem", "Accor (all.accor.com)", f"Check-in em {data(hot['RIO']['checkin'])}, {hot['RIO']['noites']} noites; coleta em {data(hot['RIO']['coletado_em'])}"],
    ["Alimentação", e(ali["RIO"]["fonte"]), f"Três faixas por refeição e valores de restaurante; coleta em {data(ali['RIO']['coletado_em'])}"],
]
sec.append("<h2>2. Dados e coleta</h2>" + tabela(["Dimensão", "Fonte", "Recorte"], fontes, num_cols=[]) + """
<p>As passagens vêm dos microdados públicos da ANAC, recortados por um script em Python (biblioteca padrão) que mantém só os voos de SBCG para os aeroportos de cada cidade e as três companhias com operação regular (GOL, LATAM e Azul). Rio de Janeiro junta Santos Dumont e Galeão; São Paulo junta Congonhas e Guarulhos; Campinas é Viracopos; Belo Horizonte é Confins. Os dados de clima, hotel e alimentação foram coletados à mão, com a data e a fonte registradas em cada arquivo, e o script junta tudo num único <code>dados.json</code> lido pelo site.</p>""")

# ---------- 3. Método ----------
sec.append(r"""
<h2>3. Método estatístico</h2>
<h3>3.1 Tarifa ponderada por assento</h3>
<p>Cada linha dos microdados é uma tarifa vendida a um número de assentos. Tratar as linhas como observações iguais daria a uma tarifa vendida a 1 assento o mesmo peso de uma vendida a 300. Por isso, a média, a mediana, o desvio padrão e o coeficiente de variação de cada rota são ponderados por <i>w</i> = assentos:</p>
<p class="formula">x̄<sub>w</sub> = Σ w<sub>i</sub>x<sub>i</sub> / Σ w<sub>i</sub> &nbsp;&nbsp;&nbsp; s<sub>w</sub> = √[ Σ w<sub>i</sub>(x<sub>i</sub> − x̄<sub>w</sub>)² / (Σ w<sub>i</sub> − 1) ] &nbsp;&nbsp;&nbsp; CV = s<sub>w</sub> / x̄<sub>w</sub></p>
<p>O tamanho da amostra <i>n</i> é a soma de assentos. Um mês com menos de 30 assentos para uma companhia fica sem valor (nulo, nunca zero), e os meses ainda não publicados pela ANAC também.</p>
<h3>3.2 Normalização e inversão</h3>
<p>As dimensões têm unidades diferentes (reais, milímetros, graus). Cada eixo é levado a uma escala de 0 a 1 pelo mínimo e pelo máximo do conjunto das dez cidades: <span class="formula-inline">z = (x − mín) / (máx − mín)</span>. Em passagem, hospedagem, alimentação e chuva, menor é melhor, e o eixo é invertido (<span class="formula-inline">1 − z</span>), para que estar longe do centro do radar sempre signifique melhor para quem viaja. A hospedagem entra pela diária mediana, que um hotel muito caro não arrasta.</p>
<h3>3.3 Conforto térmico</h3>
<p>Temperatura não tem “melhor” extremo. O eixo de conforto térmico vale 1 numa temperatura média anual de 24 °C e cai linearmente até 0 a 12 °C de distância, para cima ou para baixo.</p>
<h3>3.4 Score composto</h3>
<p>O score é a média ponderada dos cinco eixos com os pesos escolhidos para passagem, hospedagem, alimentação e clima (o peso do clima se divide igualmente entre conforto térmico e tempo seco). Eixo sem dado sai da conta e o peso dele sai da soma. Como o mínimo e o máximo vêm das dez cidades, a nota de uma cidade não muda conforme as outras escolhidas para comparação.</p>
""")

# ---------- 4. Resultados ----------
lin = []
for k in sorted(ordem, key=lambda k: pas[k]["estatisticas"]["media"]):
    s = pas[k]["estatisticas"]
    lin.append([nome[k], moeda(s["media"]), moeda(s["mediana"]), pct(s["coef_variacao"]),
                moeda(s["minimo"]), moeda(s["maximo"]), num(s["n"], 0)])
mais_barata = min(ordem, key=lambda k: pas[k]["estatisticas"]["media"])
mais_cara = max(ordem, key=lambda k: pas[k]["estatisticas"]["media"])
sec.append(f"""
<h2>4. Resultados</h2>
<h3>4.1 Passagens</h3>
<p>A tarifa média ponderada vai de {moeda(pas[mais_barata]['estatisticas']['media'])} ({nome[mais_barata]}) a {moeda(pas[mais_cara]['estatisticas']['media'])} ({nome[mais_cara]}). A mediana fica abaixo da média em todas as rotas, sinal de distribuição assimétrica à direita: poucas tarifas muito altas puxam a média para cima. O coeficiente de variação passa de 50% em todas as rotas, o que mostra que o preço depende muito de quando e como a passagem é comprada.</p>
""" + tabela(["Cidade", "Média", "Mediana", "CV", "Mínimo", "Máximo", "Assentos (n)"], lin,
             legenda=f"Tarifas de SBCG, todas as companhias, {periodo(ini)} a {periodo(fim)}, ponderadas por assento. Fonte: ANAC.")
    + barras([(nome[k], pas[k]["estatisticas"]["media"]) for k in sorted(ordem, key=lambda k: pas[k]["estatisticas"]["media"])],
             moeda, "Tarifa média ponderada por cidade (menor é melhor)"))

meses_caro = [[nome[k], mes(pas[k]["mes_mais_caro"]["mes"]), moeda(pas[k]["mes_mais_caro"]["media"]),
               mes(pas[k]["mes_mais_barato"]["mes"]), moeda(pas[k]["mes_mais_barato"]["media"])] for k in ordem]
sec.append("<p>O mês mais caro e o mais barato variam de rota para rota, o que reforça que comparar destinos por um único mês pode inverter a conclusão.</p>"
           + tabela(["Cidade", "Mês mais caro", "Média", "Mês mais barato", "Média"], meses_caro, num_cols=[2, 4],
                    legenda="Média ponderada de todas as companhias em cada mês."))

lin = [[nome[k], num(temp[k], 1) + " °C", num(min(cli[k]["temp_min"]), 1) + " °C", num(max(cli[k]["temp_max"]), 1) + " °C",
        num(chuva[k], 0) + " mm", str(cli[k]["n_estacoes"])] for k in sorted(ordem, key=lambda k: -temp[k])]
sec.append("""<h3>4.2 Clima</h3>
<p>A climatologia descreve o mês típico, não a previsão. As cidades do Nordeste e o Rio têm média anual mais perto do conforto de 24 °C; Curitiba e Porto Alegre ficam mais frias no inverno. Recife e Salvador concentram a chuva no outono e no inverno, ao contrário das cidades do Sudeste e do Centro-Oeste, que chovem no verão.</p>"""
           + tabela(["Cidade", "Temp. média anual", "Mínima mensal", "Máxima mensal", "Chuva no ano", "Estações"], lin,
                    legenda=f"{e(cli['RIO']['fonte'])}. Mínima e máxima: menor média mensal de mínimas e maior média mensal de máximas."))

lin = [[nome[k], str(hot[k]["n"]), moeda(hot[k]["diaria_mediana"]), moeda(hot[k]["diaria_media"]), moeda(hot[k]["custo_total"])]
       for k in sorted(ordem, key=lambda k: hot[k]["diaria_mediana"])]
sec.append("""<h3>4.3 Hospedagem</h3>
<p>As diárias são de hotéis econômicos e intermediários da rede Accor dentro de cada município, na mesma data. O número de hotéis varia muito: São Paulo e Rio têm dezenas; Campinas e Brasília, dois. Nessas cidades, a mediana depende de pouquíssimos valores e deve ser lida com cautela.</p>"""
           + tabela(["Cidade", "Hotéis (n)", "Diária mediana", "Diária média", "Custo da estadia"], lin,
                    legenda=f"Preço público com impostos dividido por {hot['RIO']['noites']} noites. Custo da estadia = diária média × noites. Fonte: Accor.")
           + barras([(nome[k], hot[k]["diaria_mediana"]) for k in sorted(ordem, key=lambda k: hot[k]["diaria_mediana"])],
                    moeda, "Diária mediana por cidade (menor é melhor)"))

lin = [[nome[k], moeda(ali[k]["medias"]["cafe"]), moeda(ali[k]["medias"]["almoco"]), moeda(ali[k]["medias"]["jantar"]),
        moeda(ali[k]["media_diaria"]), str(ali[k]["n"])] for k in sorted(ordem, key=lambda k: ali[k]["media_diaria"])]
sec.append("""<h3>4.4 Alimentação</h3>
<p>O gasto diário soma as médias de café, almoço e jantar. Cada preço é a estimativa de uma fonte (três faixas do Quanto Custa Viajar e dois valores do Numbeo), e não um cardápio sorteado. Brasília e Belo Horizonte aparecem mais baratas, mas as faixas dessas duas cidades na fonte parecem desatualizadas.</p>"""
           + tabela(["Cidade", "Café", "Almoço", "Jantar", "Por dia", "Preços (n)"], lin,
                    legenda="n = menor número de preços entre as três refeições."))

eixos = SC["eixos"]
lin = [[nome[k]] + [num(v) if v is not None else "—" for v in SC["cidades"][k]["perfil"]] + [f"<b>{num(iguais[k])}</b>"] for k in rank]
sec.append("""<h3>4.5 Score composto</h3>
<p>Com pesos iguais (25% para cada parte), o score de cada cidade é:</p>"""
           + tabela(["Cidade"] + eixos + ["Score"], lin,
                    legenda="Notas de 0 (pior valor do conjunto) a 1 (melhor). Pesos iguais; o clima se divide entre conforto térmico e tempo seco.")
           + barras([(nome[k], iguais[k]) for k in rank], lambda v: num(v), "Score composto com pesos iguais"))

cen = [["Pesos iguais", "25 / 25 / 25 / 25", top("iguais")],
       ["Só passagem", "100 / 0 / 0 / 0", top("so_passagem")],
       ["Só custos", "34 / 33 / 33 / 0", top("custo")],
       ["Só clima", "0 / 0 / 0 / 100", top("so_clima")]]
sec.append(f"""<h3>4.6 Sensibilidade aos pesos</h3>
<p>A conclusão depende da preferência. Com pesos iguais, lidera {nome[rank[0]]}. Se só a passagem importa, São Paulo vai para o topo; se só o clima importa, o Rio passa à frente de todas as outras e São Paulo cai para as últimas posições.</p>"""
           + tabela(["Cenário", "Passagem / Hotel / Comida / Clima", "Três primeiras"], cen, num_cols=[]))

# ---------- 5. Discussão e limitações ----------
sec.append(f"""
<h2>5. Discussão</h2>
<p>O resultado mais forte vem das passagens: é a dimensão com a maior amostra ({num(assentos, 0)} assentos) e a única com dispersão medida. A liderança de {nome[rank[0]]} com pesos iguais se apoia na diária mais baixa, calculada com apenas {hot[rank[0]]['n']} hotéis, e numa alimentação estimada; por isso ela é frágil, e o próprio cenário “só passagem” muda a primeira posição. O Rio de Janeiro é o melhor destino para quem prioriza clima e o pior para quem prioriza custo, o que ilustra o ponto central do trabalho: “melhor viagem” é função dos pesos, não um fato.</p>
<h2>6. Limitações</h2>
<ul>
<li><b>Amostra de conveniência.</b> Os dados não foram sorteados; os resultados não se generalizam além destas dez rotas.</li>
<li><b>Período de nove meses.</b> As passagens cobrem {periodo(ini)} a {periodo(fim)}; dezembro, tradicionalmente caro, não entra.</li>
<li><b>Tarifa sem taxas.</b> A ANAC publica a tarifa comercializada, sem taxa de embarque.</li>
<li><b>Poucos hotéis em algumas cidades.</b> Campinas e Brasília têm dois hotéis; Recife e Florianópolis, três. Todas as diárias são de uma única rede.</li>
<li><b>Alimentação por fontes.</b> Os preços são estimativas publicadas, que misturam faixas; as de Brasília e Belo Horizonte parecem antigas.</li>
<li><b>Climatologia antiga.</b> As normais de 1961–1990 são as únicas em que o INMET publica temperatura e chuva da estação central do Rio; o aquecimento desde então não aparece.</li>
<li><b>Coleta única.</b> Diárias e refeições refletem uma janela de coleta; outra data daria outros números.</li>
</ul>
<h2>7. Conclusão</h2>
<p>Com dados públicos e método explícito, o trabalho mostra que a escolha entre dez destinos saindo de Campo Grande depende do que o viajante prioriza. A passagem, medida com amostra grande e ponderada por assento, favorece São Paulo, Campinas e Belo Horizonte; o clima favorece o Rio; os custos de estadia favorecem Campinas e Belo Horizonte. O site permite refazer a comparação com outros pesos e mostra, ao lado de cada número, a fonte, o período e o tamanho da amostra.</p>
<h2>Referências</h2>
<ul class="refs">
<li>AGÊNCIA NACIONAL DE AVIAÇÃO CIVIL (ANAC). Microdados de tarifas aéreas comercializadas. Disponível em: gov.br/anac. Acesso em: {data(D['fonte_passagens']['acesso_em'])}.</li>
<li>INSTITUTO NACIONAL DE METEOROLOGIA (INMET). Normais Climatológicas do Brasil 1961–1990. Disponível em: portal.inmet.gov.br/normais. Acesso em: {data(hot['RIO']['coletado_em'])}.</li>
<li>ACCOR. ALL — Accor Live Limitless. Disponível em: all.accor.com. Acesso em: {data(hot['RIO']['coletado_em'])}.</li>
<li>QUANTO CUSTA VIAJAR. Alimentação por destino. Disponível em: quantocustaviajar.com. Acesso em: {data(ali['RIO']['coletado_em'])}.</li>
<li>NUMBEO. Cost of living. Disponível em: numbeo.com. Acesso em: {data(ali['RIO']['coletado_em'])}.</li>
</ul>
""")

CSS = """
@page { size: A4; margin: 22mm 20mm 20mm; }
* { box-sizing: border-box; }
body { font-family: "Atkinson Hyperlegible Next", "Atkinson Hyperlegible", Arial, sans-serif; color: #14212B; font-size: 10.5pt; line-height: 1.5; margin: 0; }
h1 { font-size: 26pt; line-height: 1.1; margin: 0 0 6mm; font-weight: 800; }
h2 { font-size: 15pt; margin: 9mm 0 3mm; font-weight: 800; break-after: avoid; }
h3 { font-size: 11.5pt; margin: 6mm 0 2mm; font-weight: 600; break-after: avoid; }
p { margin: 0 0 3mm; text-align: justify; hyphens: auto; }
ul { margin: 0 0 3mm; padding-left: 5mm; }
li { margin-bottom: 1.5mm; }
table { width: 100%; border-collapse: collapse; margin: 3mm 0 1mm; font-size: 9pt; break-inside: avoid; font-variant-numeric: tabular-nums; }
th, td { padding: 1.6mm 2mm; border-bottom: 0.3mm solid #C9D3CE; text-align: left; vertical-align: top; }
thead th { background: #E2E9E5; font-weight: 600; }
tbody th { font-weight: 600; }
.n { text-align: right; white-space: nowrap; }
.legenda { font-size: 8.5pt; color: #4A5A63; margin: 0 0 4mm; text-align: left; }
.formula { text-align: center; font-size: 11pt; margin: 3mm 0; }
.formula-inline { white-space: nowrap; }
code { font-size: 9pt; }
.grafico { margin: 4mm 0 5mm; break-inside: avoid; }
.grafico figcaption { font-weight: 600; font-size: 9.5pt; margin-bottom: 2mm; }
.barra { display: grid; grid-template-columns: 34mm 1fr 24mm; align-items: center; gap: 3mm; font-size: 9pt; margin: 1mm 0; }
.trilho { height: 4mm; }
.marca { display: block; height: 100%; background: #2A78D6; border-radius: 0 1mm 1mm 0; }
.val { text-align: right; font-variant-numeric: tabular-nums; }
.capa { height: 250mm; display: flex; flex-direction: column; justify-content: space-between; break-after: page; }
.capa .instituicao { font-size: 11pt; color: #4A5A63; }
.capa .sub { font-size: 13pt; color: #4A5A63; max-width: 140mm; }
.capa .rodape { font-size: 10.5pt; }
.capa .rodape p { margin: 0 0 1.5mm; text-align: left; }
.refs li { font-size: 9.5pt; }
"""

equipe = "Davi Casari, Filipe Rioske, João Pegarare e Victor Solique"
capa = f"""<section class="capa">
<div class="instituicao">Instituto Federal de Mato Grosso do Sul — Campus Nova Andradina<br>Tecnologia em Análise e Desenvolvimento de Sistemas<br>Estatística — Projeto Final</div>
<div><h1>Linhas Estatísticas</h1><p class="sub">Para onde voar saindo de Campo Grande? Uma comparação estatística de dez destinos em passagem, hospedagem, alimentação e clima.</p></div>
<div class="rodape"><p>Equipe: {equipe}</p><p>Nova Andradina (MS), {data(D['coletado_em'])}</p></div>
</section>"""

pagina = f"""<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>Linhas Estatísticas — Relatório</title>
<meta name="author" content="{equipe}">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;600;800&display=swap">
<style>{CSS}</style></head>
<body>{capa}{''.join(sec)}</body></html>"""
(PASTA / "relatorio.html").write_text(pagina, encoding="utf-8")
print("gravado", PASTA / "relatorio.html")
