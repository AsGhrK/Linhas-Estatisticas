"""Gera dados/dados.json a partir do recorte da ANAC e dos arquivos manuais."""
import csv
import json
import statistics
from datetime import date
from pathlib import Path

from pipeline.estatistica import media_ponderada, resumo_ponderado

MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
MIN_ASSENTOS_MES = 30
ROTAS = {
    "RIO": {"cidade": "Rio de Janeiro", "aeroportos": ["SBRJ", "SBGL"]},
    "SAO": {"cidade": "São Paulo", "aeroportos": ["SBSP", "SBGR"]},
}
COMPANHIAS = [("GOL", "GLO"), ("LATAM", "TAM"), ("Azul", "AZU")]
REFEICOES = ("cafe", "almoco", "jantar")
# Com menos preços por refeição, o min-max transforma diferenças de poucos reais em 0 contra 1.
MIN_PRECOS_REFEICAO = 3


def _ler_recorte(recorte):
    with open(recorte, encoding="utf-8", newline="") as f:
        linhas = [
            {
                "ano": int(r["ano"]), "mes": int(r["mes"]), "empresa": r["empresa"],
                "destino": r["destino"], "tarifa": float(r["tarifa"]),
                "assentos": int(r["assentos"]),
            }
            for r in csv.DictReader(f, delimiter=";")
        ]
    anos = {l["ano"] for l in linhas}
    if len(anos) > 1:
        raise ValueError(f"recorte com mais de um ano: {sorted(anos)}")
    return linhas


def _periodo(linhas):
    if not linhas:
        return {"inicio": None, "fim": None}
    pares = sorted((l["ano"], l["mes"]) for l in linhas)
    (a0, m0), (a1, m1) = pares[0], pares[-1]
    return {"inicio": f"{a0}-{m0:02d}", "fim": f"{a1}-{m1:02d}"}


def _resumo(linhas):
    return resumo_ponderado(
        [l["tarifa"] for l in linhas], [l["assentos"] for l in linhas], len(linhas)
    )


def _companhia(nome, icao, linhas):
    precos, assentos = [], []
    for mes in range(1, 13):
        do_mes = [l for l in linhas if l["mes"] == mes]
        soma = sum(l["assentos"] for l in do_mes)
        assentos.append(soma)
        if soma < MIN_ASSENTOS_MES:
            precos.append(None)
        else:
            media = media_ponderada([l["tarifa"] for l in do_mes],
                                    [l["assentos"] for l in do_mes])
            precos.append(round(media, 2))
    return {"nome": nome, "icao": icao, "precos": precos, "assentos": assentos,
            "estatisticas": _resumo(linhas)}


def _mensal(linhas):
    """Média ponderada por assento de cada mês, juntando todas as companhias."""
    medias = []
    for mes in range(1, 13):
        do_mes = [l for l in linhas if l["mes"] == mes]
        if sum(l["assentos"] for l in do_mes) < MIN_ASSENTOS_MES:
            medias.append(None)
        else:
            medias.append(round(media_ponderada([l["tarifa"] for l in do_mes],
                                                [l["assentos"] for l in do_mes]), 2))
    return medias


def _extremo(mensal, escolher):
    validos = [(i, m) for i, m in enumerate(mensal) if m is not None]
    if not validos:
        return None
    i, media = escolher(validos, key=lambda par: par[1])
    return {"mes": MESES[i], "media": media}


def _passagens(linhas_rota):
    companhias = []
    for nome, icao in COMPANHIAS:
        do_icao = [l for l in linhas_rota if l["empresa"] == icao]
        if do_icao:
            companhias.append(_companhia(nome, icao, do_icao))
    mensal = _mensal(linhas_rota)
    return {"companhias": companhias, "estatisticas": _resumo(linhas_rota),
            "mensal": mensal, "mes_mais_caro": _extremo(mensal, max),
            "mes_mais_barato": _extremo(mensal, min)}


def _clima(manual, chave, pendencias):
    c = manual[chave]
    if c.get("estacao") is None:
        pendencias.append(f"clima.{chave}.estacao")
    for campo in ("temp_max", "temp_min", "precipitacao"):
        if any(v is None for v in c[campo]):
            pendencias.append(f"clima.{chave}.{campo}")
    return c


def _hotel(manual, chave, pendencias):
    itens = manual[chave]
    diarias = [i["diaria"] for i in itens if i["diaria"] is not None]
    pendente = not itens or len(diarias) != len(itens)
    if pendente:
        pendencias.append(f"hoteis.{chave}")
    hoteis = [] if pendente else [
        {"nome": i["nome"], "url": i["url"], "diaria": i["diaria"]} for i in itens]
    bloco = {"n": 0, "hoteis": hoteis, "diarias": diarias, "diaria_media": None, "diaria_mediana": None,
             "noites": manual.get("noites"), "custo_total": None,
             "fonte": manual.get("fonte"), "coletado_em": manual.get("coletado_em")}
    if not pendente:
        media = statistics.mean(diarias)
        bloco.update(n=len(diarias), diaria_media=round(media, 2),
                     diaria_mediana=round(statistics.median(diarias), 2))
        if bloco["noites"] is not None:
            bloco["custo_total"] = round(media * bloco["noites"], 2)
    return bloco


def _alimentacao(manual, chave, pendencias):
    a = manual[chave]
    for campo in REFEICOES + ("tipicas",):
        if not a[campo]:
            pendencias.append(f"alimentacao.{chave}.{campo}")
    completa = all(a[r] for r in REFEICOES)
    return {
        "cafe": a["cafe"], "almoco": a["almoco"], "jantar": a["jantar"],
        "medias": {r: round(statistics.mean(a[r]), 2) if a[r] else None for r in REFEICOES},
        "n": min(len(a[r]) for r in REFEICOES),
        "media_diaria": round(sum(statistics.mean(a[r]) for r in REFEICOES), 2) if completa else None,
        "tipicas": a["tipicas"], "fonte": manual.get("fonte"),
        "coletado_em": manual.get("coletado_em"),
    }


def _faixa(valores):
    return {"min": min(valores), "max": max(valores)} if valores else None


def _faixas(rotas):
    precos = [p for r in rotas.values() for c in r["passagens"]["companhias"]
              for p in c["precos"] if p is not None]
    clima = [r["clima"] for r in rotas.values()]
    hoteis = [r["hotel"] for r in rotas.values()]
    refeicoes = [r["alimentacao"] for r in rotas.values()]

    def clima_ok(*campos):
        return all(v is not None for c in clima for campo in campos for v in c[campo])

    hotel_ok = all(h["n"] > 0 for h in hoteis)
    comida_ok = all(a["n"] >= MIN_PRECOS_REFEICAO for a in refeicoes)
    temp = precip = None
    if clima_ok("temp_max", "temp_min"):
        temp = _faixa([(mx + mn) / 2 for c in clima
                       for mx, mn in zip(c["temp_max"], c["temp_min"])])
    if clima_ok("precipitacao"):
        precip = _faixa([v for c in clima for v in c["precipitacao"]])
    return {
        "preco_passagem": _faixa(precos),
        "custo_hotel": _faixa([d for h in hoteis for d in h["diarias"]]) if hotel_ok else None,
        "custo_alimentacao": {
            "min": min(sum(min(a[r]) for r in REFEICOES) for a in refeicoes),
            "max": max(sum(max(a[r]) for r in REFEICOES) for a in refeicoes),
        } if comida_ok else None,
        "temperatura_media": temp,
        "precipitacao": precip,
    }


def _ler_json(caminho):
    return json.loads(Path(caminho).read_text(encoding="utf-8"))


def gerar(recorte: Path, pasta_manual: Path, coletado_em: str) -> dict:
    linhas = _ler_recorte(recorte)
    pasta = Path(pasta_manual)
    clima = _ler_json(pasta / "clima.json")
    hoteis = _ler_json(pasta / "hoteis.json")
    comida = _ler_json(pasta / "alimentacao.json")

    pendencias = []
    rotas = {}
    for chave, info in ROTAS.items():
        da_rota = [l for l in linhas if l["destino"] in info["aeroportos"]]
        c = _clima(clima, chave, pendencias)
        rotas[chave] = {
            "cidade": info["cidade"],
            "aeroportos": info["aeroportos"],
            "passagens": _passagens(da_rota),
            "clima": {
                "temp_max": c["temp_max"], "temp_min": c["temp_min"],
                "precipitacao": c["precipitacao"], "estacao": c["estacao"],
                "periodo": clima.get("periodo"), "fonte": clima.get("fonte"),
            },
            "hotel": _hotel(hoteis, chave, pendencias),
            "alimentacao": _alimentacao(comida, chave, pendencias),
        }
    for campo in ("coletado_em", "checkin"):
        if hoteis.get(campo) is None:
            pendencias.append(f"hoteis.{campo}")
    if comida.get("coletado_em") is None:
        pendencias.append("alimentacao.coletado_em")

    return {
        "coletado_em": coletado_em,
        "periodo_passagens": _periodo(linhas),
        "origem": {"icao": "SBCG", "cidade": "Campo Grande"},
        "meses": MESES,
        "faixas": _faixas(rotas),
        "rotas": rotas,
        "pendencias": sorted(pendencias),
    }


def main():
    dados = gerar(Path("dados/anac/tarifas_sbcg.csv"), Path("dados/manual"),
                  date.today().isoformat())
    saida = Path("dados/dados.json")
    saida.write_text(json.dumps(dados, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"gravado {saida}")
    print("pendencias:")
    for p in dados["pendencias"]:
        print(f"  {p}")


if __name__ == "__main__":
    main()
