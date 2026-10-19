
from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests

RAIZ = Path(__file__).resolve().parent
ARQUIVO_DADOS = RAIZ / "dados" / "dados.json"
BASE_URL = os.getenv("AMADEUS_BASE_URL", "https://test.api.amadeus.com").rstrip("/")


def carregar_dados() -> dict[str, Any]:
    """Carrega o JSON; cria uma estrutura inicial se o arquivo ainda não existir."""
    ARQUIVO_DADOS.parent.mkdir(parents=True, exist_ok=True)
    if not ARQUIVO_DADOS.exists():
        return {"versao": 1, "pesquisas": [], "viagens": []}
    try:
        with ARQUIVO_DADOS.open("r", encoding="utf-8") as arquivo:
            dados = json.load(arquivo)
    except json.JSONDecodeError as erro:
        raise ValueError(
            f"O arquivo {ARQUIVO_DADOS} contém JSON inválido. "
            "Faça uma cópia antes de corrigir o arquivo."
        ) from erro
    dados.setdefault("versao", 1)
    dados.setdefault("pesquisas", [])
    dados.setdefault("viagens", [])
    return dados


def salvar_dados(dados: dict[str, Any]) -> None:
    """Salva os dados em UTF-8, preservando pesquisas anteriores."""
    ARQUIVO_DADOS.parent.mkdir(parents=True, exist_ok=True)
    temporario = ARQUIVO_DADOS.with_suffix(".json.tmp")
    with temporario.open("w", encoding="utf-8") as arquivo:
        json.dump(dados, arquivo, ensure_ascii=False, indent=2)
    temporario.replace(ARQUIVO_DADOS)


def obter_token() -> str:
    """Obtém um token OAuth da Amadeus usando credenciais do ambiente."""
    client_id = os.getenv("AMADEUS_CLIENT_ID")
    client_secret = os.getenv("AMADEUS_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise RuntimeError(
            "Credenciais ausentes. Configure AMADEUS_CLIENT_ID e "
            "AMADEUS_CLIENT_SECRET nas variáveis de ambiente."
        )

    resposta = requests.post(
        f"{BASE_URL}/v1/security/oauth2/token",
        data={
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": client_secret,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=30,
    )
    resposta.raise_for_status()
    return resposta.json()["access_token"]


def pesquisar_voos(
    origem: str,
    destino: str,
    data_ida: str,
    data_volta: str | None = None,
    adultos: int = 1,
    somente_diretos: bool = False,
    moeda: str = "BRL",
    limite: int = 10,
) -> list[dict[str, Any]]:
    """Pesquisa ofertas reais. Origem/destino devem ser códigos IATA, como CGR e GRU.

    Datas no formato AAAA-MM-DD. Se data_volta for None, pesquisa só ida.
    """
    origem = origem.strip().upper()
    destino = destino.strip().upper()
    moeda = moeda.strip().upper()

    if len(origem) != 3 or len(destino) != 3 or not origem.isalpha() or not destino.isalpha():
        raise ValueError("Origem e destino devem ser códigos IATA de 3 letras.")
    datetime.strptime(data_ida, "%Y-%m-%d")
    if data_volta:
        datetime.strptime(data_volta, "%Y-%m-%d")
        if data_volta < data_ida:
            raise ValueError("A data de volta não pode ser anterior à data de ida.")
    if adultos < 1:
        raise ValueError("É necessário pelo menos 1 adulto.")
    if limite < 1 or limite > 250:
        raise ValueError("O limite deve estar entre 1 e 250.")

    token = obter_token()
    parametros = {
        "originLocationCode": origem,
        "destinationLocationCode": destino,
        "departureDate": data_ida,
        "adults": adultos,
        "currencyCode": moeda,
        "max": limite,
        "nonStop": str(somente_diretos).lower(),
    }
    if data_volta:
        parametros["returnDate"] = data_volta

    resposta = requests.get(
        f"{BASE_URL}/v2/shopping/flight-offers",
        params=parametros,
        headers={"Authorization": f"Bearer {token}"},
        timeout=45,
    )
    resposta.raise_for_status()
    resultado = resposta.json()

    pesquisa_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    consultado_em = datetime.now(timezone.utc).isoformat()
    ofertas = []

    for oferta in resultado.get("data", []):
        itinerarios = []
        for itinerario in oferta.get("itineraries", []):
            segmentos = []
            for segmento in itinerario.get("segments", []):
                segmentos.append({
                    "companhia": segmento.get("carrierCode"),
                    "numero_voo": segmento.get("number"),
                    "origem": segmento.get("departure", {}).get("iataCode"),
                    "saida": segmento.get("departure", {}).get("at"),
                    "destino": segmento.get("arrival", {}).get("iataCode"),
                    "chegada": segmento.get("arrival", {}).get("at"),
                })
            itinerarios.append({
                "duracao": itinerario.get("duration"),
                "segmentos": segmentos,
            })

        preco = oferta.get("price", {})
        ofertas.append({
            "id_oferta": oferta.get("id"),
            "origem": origem,
            "destino": destino,
            "data_ida": data_ida,
            "data_volta": data_volta,
            "adultos": adultos,
            "preco_total": float(preco.get("grandTotal", preco.get("total", 0))),
            "moeda": preco.get("currency", moeda),
            "itinerarios": itinerarios,
            "consultado_em": consultado_em,
            "fonte": "Amadeus",
            "aviso": "Preço consultado; confirme disponibilidade e preço final antes da compra.",
        })

    dados = carregar_dados()
    dados["pesquisas"].append({
        "id": pesquisa_id,
        "consultado_em": consultado_em,
        "parametros": {
            "origem": origem,
            "destino": destino,
            "data_ida": data_ida,
            "data_volta": data_volta,
            "adultos": adultos,
            "moeda": moeda,
            "somente_diretos": somente_diretos,
        },
        "quantidade_resultados": len(ofertas),
        "ofertas": ofertas,
    })
    salvar_dados(dados)
    return ofertas


if __name__ == "__main__":
    print("Buscador de passagens aéreas")
    print("Use os códigos IATA de aeroportos/cidades, por exemplo CGR, GRU, GIG.")
    origem = input("Origem (IATA): ").strip().upper()
    destino = input("Destino (IATA): ").strip().upper()
    ida = input("Data de ida (AAAA-MM-DD): ").strip()
    volta = input("Data de volta (Enter para só ida): ").strip() or None
    try:
        ofertas = pesquisar_voos(origem, destino, ida, volta)
        if not ofertas:
            print("A API não retornou ofertas para esses critérios.")
        for indice, oferta in enumerate(ofertas, start=1):
            print(f'{indice}. {oferta["origem"]} -> {oferta["destino"]}: '
                  f'{oferta["moeda"]} {oferta["preco_total"]:.2f}')
        print(f"Pesquisa salva em: {ARQUIVO_DADOS}")
    except (ValueError, RuntimeError, requests.RequestException, KeyError) as erro:
        print(f"Não foi possível concluir a pesquisa: {erro}")
