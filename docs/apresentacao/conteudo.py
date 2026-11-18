"""Gera docs/apresentacao/slides.json e os gráficos PNG a partir de dados/dados.json e docs/relatorio/scores.json.

Uso: python docs/apresentacao/conteudo.py   e depois   powershell -File docs/apresentacao/montar.ps1
"""
import json
import statistics
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

RAIZ = Path(__file__).resolve().parents[2]
PASTA = Path(__file__).resolve().parent
D = json.loads((RAIZ / "dados" / "dados.json").read_text(encoding="utf-8"))
SC = json.loads((RAIZ / "docs" / "relatorio" / "scores.json").read_text(encoding="utf-8"))
R = D["rotas"]
K = list(R)
NOME = {k: R[k]["cidade"] for k in K}
INK, MUTE, RULE, AZUL = "#14212B", "#4A5A63", "#C9D3CE", "#2A78D6"
MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]


def num(v, c=2):
    return f"{v:,.{c}f}".replace(",", "X").replace(".", ",").replace("X", ".")


def moeda(v):
    return "R$ " + num(v)


def barras(arquivo, itens, fmt, titulo):
    """Barras horizontais, uma cor, ordenadas; rótulo de valor no fim de cada barra."""
    plt.rcParams.update({"font.family": "Segoe UI", "font.size": 15})
    fig, ax = plt.subplots(figsize=(8.6, 5.2), dpi=160)
    nomes = [n for n, _ in itens][::-1]
    vals = [v for _, v in itens][::-1]
    ax.barh(nomes, vals, color=AZUL, height=0.62)
    for y, v in enumerate(vals):
        ax.text(v, y, "  " + fmt(v), va="center", color=INK, fontsize=13)
    ax.set_xlim(0, max(vals) * 1.22)
    ax.set_title(titulo, loc="left", color=INK, fontsize=16, fontweight="semibold", pad=12)
    for lado in ("top", "right", "bottom"):
        ax.spines[lado].set_visible(False)
    ax.spines["left"].set_color(RULE)
    ax.tick_params(axis="y", colors=INK, length=0)
    ax.set_xticks([])
    fig.tight_layout()
    fig.savefig(PASTA / arquivo, transparent=False, facecolor="white")
    plt.close(fig)


pas = {k: R[k]["passagens"]["estatisticas"] for k in K}
hot = {k: R[k]["hotel"] for k in K}
ali = {k: R[k]["alimentacao"] for k in K}
cli = {k: R[k]["clima"] for k in K}
temp = {k: statistics.mean((a + b) / 2 for a, b in zip(cli[k]["temp_max"], cli[k]["temp_min"])) for k in K}
chuva = {k: sum(cli[k]["precipitacao"]) for k in K}
iguais = SC["cenarios"]["iguais"]["score"]
assentos = sum(p["n"] for p in pas.values())
ini, fim = D["periodo_passagens"]["inicio"], D["periodo_passagens"]["fim"]
per = f"{MESES[int(ini[5:]) - 1]}–{MESES[int(fim[5:]) - 1]}/{ini[:4]}"

barras("passagens.png", [(NOME[k], pas[k]["media"]) for k in sorted(K, key=lambda k: pas[k]["media"])],
       moeda, "Tarifa média ponderada por assento (menor é melhor)")
barras("hoteis.png", [(f"{NOME[k]} (n={hot[k]['n']})", hot[k]["diaria_mediana"]) for k in sorted(K, key=lambda k: hot[k]["diaria_mediana"])],
       moeda, "Diária mediana, hotéis Accor (menor é melhor)")
barras("score.png", [(NOME[k], iguais[k]) for k in sorted(K, key=lambda k: -iguais[k])],
       lambda v: num(v), "Score composto com pesos iguais (maior é melhor)")


def top(c):
    s = SC["cenarios"][c]["score"]
    return ", ".join(NOME[k] for k in sorted(K, key=lambda k: -s[k])[:3])


slides = [
    {"tipo": "capa", "titulo": "Para onde voar saindo de Campo Grande?",
     "sub": "Linhas Estatísticas — dez destinos comparados em passagem, hospedagem, alimentação e clima",
     "rodape": "Davi Casari · Filipe Rioske · João Pegarare · Victor Solique — Estatística, TADS, IFMS Nova Andradina"},
    {"tipo": "texto", "titulo": "A pergunta",
     "itens": ["A passagem sozinha esconde o resto da viagem: dormir, comer e o clima.",
               "Comparamos as dez rotas com mais assentos vendidos a partir de SBCG.",
               "O score junta as quatro partes com pesos que quem lê escolhe.",
               "Objetivo: mostrar como a resposta muda com a preferência, não eleger uma cidade."]},
    {"tipo": "tabela", "titulo": "Os dados",
     "cab": ["Dimensão", "Fonte", "Recorte"],
     "linhas": [["Passagens", "ANAC, microdados de tarifas", f"{per}, {num(assentos, 0)} assentos"],
                ["Clima", "INMET, normais 1961–1990", "estações de cada município"],
                ["Hospedagem", "Accor", f"check-in 12/01/2027, {hot['RIO']['noites']} noites"],
                ["Alimentação", "Quanto Custa Viajar e Numbeo", "3 a 5 preços por refeição"]]},
    {"tipo": "texto", "titulo": "Método: tarifa ponderada por assento",
     "itens": ["Cada linha da ANAC é uma tarifa vendida a vários assentos: o peso é o número de assentos.",
               "Média, mediana, desvio padrão e CV ponderados; n = soma de assentos.",
               "Desvio padrão com divisor Σ assentos − 1.",
               "Mês com menos de 30 assentos fica sem valor (nulo, nunca zero)."]},
    {"tipo": "texto", "titulo": "Método: radar e score",
     "itens": ["Cada eixo vai de 0 a 1 pelo mínimo e máximo das dez cidades.",
               "Passagem, hotel, alimentação e chuva: menor é melhor, então o eixo é invertido (1 − z).",
               "Conforto térmico: 1 em 24 °C, caindo até 0 a 12 °C de distância.",
               "Score = média ponderada dos eixos com os pesos escolhidos."]},
    {"tipo": "imagem", "titulo": "Passagens", "imagem": "passagens.png",
     "nota": f"Mediana abaixo da média em todas as rotas e CV acima de 50%: poucas tarifas altas puxam a média. Fonte: ANAC, {per}."},
    {"tipo": "tabela", "titulo": "Clima",
     "cab": ["Cidade", "Temp. média", "Chuva no ano"],
     "linhas": [[NOME[k], num(temp[k], 1) + " °C", num(chuva[k], 0) + " mm"] for k in sorted(K, key=lambda k: -temp[k])]},
    {"tipo": "imagem", "titulo": "Hospedagem", "imagem": "hoteis.png",
     "nota": "Campinas e Brasília têm só 2 hotéis Accor no município: a mediana dessas cidades é frágil."},
    {"tipo": "tabela", "titulo": "Alimentação por dia",
     "cab": ["Cidade", "Café", "Almoço", "Jantar", "Por dia"],
     "linhas": [[NOME[k], moeda(ali[k]["medias"]["cafe"]), moeda(ali[k]["medias"]["almoco"]),
                 moeda(ali[k]["medias"]["jantar"]), moeda(ali[k]["media_diaria"])]
                for k in sorted(K, key=lambda k: ali[k]["media_diaria"])]},
    {"tipo": "imagem", "titulo": "Score com pesos iguais", "imagem": "score.png",
     "nota": "25% para cada parte. A liderança de Campinas se apoia na diária mais baixa, com 2 hotéis."},
    {"tipo": "tabela", "titulo": "A resposta depende dos pesos",
     "cab": ["Cenário", "Três primeiras"],
     "linhas": [["Pesos iguais", top("iguais")], ["Só passagem", top("so_passagem")],
                ["Só custos", top("custo")], ["Só clima", top("so_clima")]]},
    {"tipo": "texto", "titulo": "Limitações",
     "itens": ["Amostra de conveniência: os resultados valem para estas dez rotas.",
               "Passagens de nove meses e sem taxa de embarque.",
               "Poucos hotéis em algumas cidades, todos de uma só rede.",
               "Alimentação por estimativas de fonte; clima de 1961–1990."]},
    {"tipo": "capa", "titulo": "Melhor viagem é função dos pesos",
     "sub": "Passagem favorece São Paulo, Campinas e BH; clima favorece o Rio; custos de estadia favorecem Campinas e BH.",
     "rodape": "Site: asghrk.github.io/Linhas-Estatisticas — cada número com fonte, período e n"},
]
(PASTA / "slides.json").write_text(json.dumps(slides, ensure_ascii=False, indent=1), encoding="utf-8")
print("gravado", len(slides), "slides")
