"""Recorte dos microdados de tarifas da ANAC: SBCG -> Rio e Sao Paulo.

Base da leitura dos CSVs: Filipe Rioske (branch Dados-e-Estatistica).
"""
import csv
import re
from pathlib import Path

ORIGEM = "SBCG"
DESTINOS = {"SBRJ", "SBGL", "SBSP", "SBGR"}
EMPRESAS = {"GLO", "TAM", "AZU"}
CABECALHO = ["ano", "mes", "empresa", "origem", "destino", "tarifa", "assentos"]


def ler_numero_br(texto: str) -> float:
    """'1.234,56' -> 1234.56; '720' -> 720.0; so ponto -> decimal ingles."""
    t = texto.strip()
    if not t:
        raise ValueError("numero vazio")
    if "," in t:
        t = t.replace(".", "").replace(",", ".")
    return float(t)


def extrair(pasta_brutos: Path, saida: Path) -> dict:
    pasta_brutos, saida = Path(pasta_brutos), Path(saida)
    c = {"arquivos": 0, "lidas": 0, "mantidas": 0,
         "descartadas_tarifa": 0, "descartadas_empresa": 0}
    arquivos = sorted(
        p for p in pasta_brutos.iterdir()
        if p.is_file() and re.match(r"\d{6}", p.name) and p.suffix.lower() == ".csv"
    )
    saida.parent.mkdir(parents=True, exist_ok=True)
    with saida.open("w", encoding="utf-8", newline="") as out:
        w = csv.writer(out, delimiter=";", lineterminator="\n")
        w.writerow(CABECALHO)
        for arq in arquivos:
            c["arquivos"] += 1
            with arq.open("r", encoding="latin-1", newline="") as f:
                for linha in csv.DictReader(f, delimiter=";"):
                    c["lidas"] += 1
                    origem = (linha.get("sg_icao_origem") or "").strip().upper()
                    destino = (linha.get("sg_icao_destino") or "").strip().upper()
                    if origem != ORIGEM or destino not in DESTINOS:
                        continue
                    empresa = (linha.get("sg_empresa_icao") or "").strip().upper()
                    if empresa not in EMPRESAS:
                        c["descartadas_empresa"] += 1
                        continue
                    try:
                        tarifa = ler_numero_br(linha.get("nr_tarifa") or "")
                    except ValueError:
                        c["descartadas_tarifa"] += 1
                        continue
                    if tarifa <= 0:
                        c["descartadas_tarifa"] += 1
                        continue
                    w.writerow([
                        (linha.get("nr_ano_referencia") or "").strip(),
                        (linha.get("nr_mes_referencia") or "").strip(),
                        empresa, origem, destino, str(tarifa),
                        (linha.get("nr_assentos") or "").strip(),
                    ])
                    c["mantidas"] += 1
    return c


if __name__ == "__main__":
    for chave, valor in extrair(Path("dados/anac/brutos"), Path("dados/anac/tarifas_sbcg.csv")).items():
        print(f"{chave}: {valor}")
