from __future__ import annotations

import calendar
import hashlib
from functools import lru_cache
import math
import os
import random
import re
import unicodedata
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

ROOT = Path(__file__).resolve().parents[1]
ANAC_DIR = Path(os.getenv("ANAC_DATA_DIR", ROOT / "dados_anac"))
CACHE_SECONDS = 60 * 60 * 12

app = FastAPI(
    title="Linhas Estatísticas API",
    description=(
        "Backend demonstrativo para clima, hospedagem e voos. "
        "As tarifas aéreas são estimativas calculadas com dados históricos da ANAC; "
        "os horários de voo e hotéis demonstrativos não representam disponibilidade real."
    ),
    version="1.0.0",
)

origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
origins = [item.strip() for item in origins_env.split(",") if item.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

AIRLINES = [
    {"codigo": "G3", "nome": "Gol Linhas Aéreas", "fator": 1.00},
    {"codigo": "LA", "nome": "LATAM Airlines", "fator": 1.08},
    {"codigo": "AD", "nome": "Azul Linhas Aéreas", "fator": 1.04},
]
AIRPORT_ALIASES = {
    "CGR": "SBCG", "CAMPO GRANDE": "SBCG", "SBCG": "SBCG",
    "GIG": "SBGL", "SDU": "SBRJ", "SBRJ": "SBRJ", "SBGL": "SBGL",
    "GRU": "SBGR", "SBGR": "SBGR", "CGH": "SBSP", "SBSP": "SBSP",
    "BSB": "SBBR", "SBBR": "SBBR", "VCP": "SBKP", "SBKP": "SBKP",
    "SSA": "SBSV", "SBSV": "SBSV", "REC": "SBRF", "SBRF": "SBRF",
    "POA": "SBPA", "SBPA": "SBPA", "FOR": "SBFZ", "SBFZ": "SBFZ",
    "BEL": "SBBE", "SBBE": "SBBE", "MAO": "SBEG", "SBEG": "SBEG",
}
DESTINATIONS = {
    "rio de janeiro": {"latitude": -22.9068, "longitude": -43.1729, "hotel_factor": 1.15,
                       "hotels": [("Hotel Atlântico", 290), ("Pousada Mar Azul", 210), ("Rio Centro Stay", 360)]},
    "são paulo": {"latitude": -23.5505, "longitude": -46.6333, "hotel_factor": 1.25,
                  "hotels": [("Hotel Paulista", 320), ("Centro Executivo SP", 270), ("Paulista Comfort", 410)]},
    "sao paulo": {"latitude": -23.5505, "longitude": -46.6333, "hotel_factor": 1.25,
                  "hotels": [("Hotel Paulista", 320), ("Centro Executivo SP", 270), ("Paulista Comfort", 410)]},
    "campo grande": {"latitude": -20.4697, "longitude": -54.6201, "hotel_factor": 0.85,
                     "hotels": [("Hotel Campo Grande", 220), ("Pantanal Suítes", 185), ("Centro Plaza", 260)]},
    "brasilia": {"latitude": -15.7939, "longitude": -47.8828, "hotel_factor": 1.0,
                 "hotels": [("Brasília Executive", 300), ("Hotel Planalto", 240), ("Capital Suítes", 350)]},
    "brasília": {"latitude": -15.7939, "longitude": -47.8828, "hotel_factor": 1.0,
                 "hotels": [("Brasília Executive", 300), ("Hotel Planalto", 240), ("Capital Suítes", 350)]},
}

def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", value.strip().lower())
    return "".join(ch for ch in value if not unicodedata.combining(ch))

def airport_code(value: str) -> str:
    raw = value.strip().upper()
    if raw in AIRPORT_ALIASES:
        return AIRPORT_ALIASES[raw]
    if re.fullmatch(r"[A-Z]{4}", raw):
        return raw
    raise HTTPException(
        status_code=422,
        detail=f"Aeroporto '{value}' não reconhecido. Informe código ICAO (ex.: SBCG, SBGR, SBGL) ou um alias cadastrado."
    )

def parse_date(value: str, field: str) -> date:
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError):
        raise HTTPException(status_code=422, detail=f"{field} deve estar no formato AAAA-MM-DD.")

def parse_br_number(value: str) -> float:
    return float(value.strip().replace(".", "").replace(",", ".")) if "," in value else float(value.strip())

@lru_cache(maxsize=1)
def load_anac_rows() -> dict[tuple[str, str], dict[str, float]]:
    """Agrega CSVs mensais por rota para manter baixo o uso de memória."""
    import csv
    aggregate: dict[tuple[str, str], dict[str, float]] = {}
    if not ANAC_DIR.exists():
        return aggregate
    for path in sorted(ANAC_DIR.glob("*.CSV")) + sorted(ANAC_DIR.glob("*.csv")):
        if not re.search(r"\d{6}", path.stem):
            continue
        try:
            with path.open("r", encoding="latin-1", newline="") as stream:
                reader = csv.DictReader(stream, delimiter=";")
                for row in reader:
                    try:
                        price = parse_br_number(row.get("nr_tarifa", ""))
                        origin = (row.get("sg_icao_origem") or "").strip().upper()
                        dest = (row.get("sg_icao_destino") or "").strip().upper()
                        if price <= 0 or not origin or not dest:
                            continue
                        item = aggregate.setdefault((origin, dest), {"soma": 0.0, "quantidade": 0.0})
                        item["soma"] += price
                        item["quantidade"] += 1
                    except (ValueError, TypeError):
                        continue
        except OSError:
            continue
    return aggregate

def route_tariff(origin: str, destination: str, travel_date: date) -> tuple[float, str, int]:
    rows = load_anac_rows()
    selected = rows.get((origin, destination)) or rows.get((destination, origin))
    if selected:
        # Média histórica agregada por rota; não representa cotação futura.
        median = selected["soma"] / selected["quantidade"]
        source = "ANAC: média histórica da rota nos CSVs locais"
        count = int(selected["quantidade"])
    else:
        # Para demonstração, não inventar que existe tarifa ANAC para a rota:
        # usa uma base estimada por distância aproximada/fallback explícito.
        fallback = {
            ("SBCG", "SBGL"): 720, ("SBCG", "SBRJ"): 700, ("SBCG", "SBGR"): 620,
            ("SBCG", "SBSP"): 640, ("SBGR", "SBGL"): 420, ("SBGR", "SBRJ"): 400,
            ("SBSP", "SBGL"): 430, ("SBSP", "SBRJ"): 410,
        }
        median = fallback.get((origin, destination), fallback.get((destination, origin), 650.0))
        source = "Tarifa-base demonstrativa: rota sem dados ANAC encontrados"
        count = 0
    # Ajuste sazonal transparente: dezembro/janeiro/julho e feriados tendem a ser mais caros.
    seasonal = {1: 1.15, 2: 0.92, 3: 0.95, 4: 1.00, 5: 0.94, 6: 1.02,
                7: 1.18, 8: 0.95, 9: 0.92, 10: 0.98, 11: 1.02, 12: 1.22}
    return round(median * seasonal[travel_date.month], 2), source, count

def duration_minutes(origin: str, destination: str) -> int:
    # Apenas duração indicativa para cartões de apresentação.
    known = {frozenset(("SBCG", "SBGL")): 150, frozenset(("SBCG", "SBRJ")): 145,
             frozenset(("SBCG", "SBGR")): 105, frozenset(("SBCG", "SBSP")): 110,
             frozenset(("SBGR", "SBGL")): 60, frozenset(("SBSP", "SBGL")): 65}
    return known.get(frozenset((origin, destination)), 120)

def demo_schedule(origin: str, destination: str, travel_date: date, airline_index: int) -> dict[str, Any]:
    # Horários sintéticos e repetíveis para demonstração; nunca apresentados como grade real.
    seed = int(hashlib.sha256(f"{origin}|{destination}|{travel_date}|{airline_index}".encode()).hexdigest()[:8], 16)
    rng = random.Random(seed)
    departure_min = rng.choice([360, 420, 510, 600, 720, 840, 960, 1080]) + rng.choice([0, 15, 30, 45])
    duration = duration_minutes(origin, destination)
    arrival_min = departure_min + duration
    arrival_day = travel_date + timedelta(days=arrival_min // 1440)
    def stamp(day: date, mins: int) -> str:
        return datetime.combine(day, datetime.min.time()).replace(hour=(mins % 1440)//60, minute=mins % 60).isoformat(timespec="minutes")
    return {
        "saida": stamp(travel_date, departure_min),
        "chegada": stamp(arrival_day, arrival_min),
        "duracao_minutos": duration,
        "direto": True,
        "aviso_horario": "Horários sintéticos para apresentação; não correspondem a voos confirmados."
    }

class FlightSearch(BaseModel):
    origem: str = Field(..., min_length=3, max_length=40, examples=["SBCG"])
    destino: str = Field(..., min_length=3, max_length=40, examples=["SBGL"])
    data_ida: str = Field(..., examples=["2026-11-15"])
    data_volta: str | None = None
    passageiros: int = Field(1, ge=1, le=9)

    @field_validator("data_ida")
    @classmethod
    def validate_departure(cls, value: str) -> str:
        parse_date(value, "data_ida")
        return value

    @field_validator("data_volta")
    @classmethod
    def validate_return(cls, value: str | None) -> str | None:
        if value:
            parse_date(value, "data_volta")
        return value

@app.get("/")
def root():
    return {"nome": "Linhas Estatísticas API", "versao": "1.0.0", "docs": "/docs"}

@app.get("/api/health")
def health():
    csv_count = len(list(ANAC_DIR.glob("*.CSV"))) + len(list(ANAC_DIR.glob("*.csv")))
    return {"status": "ok", "csv_anac_detectados": csv_count}

@app.post("/api/voos/buscar")
def buscar_voos(pesquisa: FlightSearch):
    origin, destination = airport_code(pesquisa.origem), airport_code(pesquisa.destino)
    if origin == destination:
        raise HTTPException(status_code=422, detail="Origem e destino devem ser diferentes.")
    departure = parse_date(pesquisa.data_ida, "data_ida")
    return_date = parse_date(pesquisa.data_volta, "data_volta") if pesquisa.data_volta else None
    if return_date and return_date < departure:
        raise HTTPException(status_code=422, detail="A volta não pode ser anterior à ida.")
    base_price, source, sample_size = route_tariff(origin, destination, departure)
    flights = []
    for idx, airline in enumerate(AIRLINES):
        schedule = demo_schedule(origin, destination, departure, idx)
        # Tarifas por companhia, antecedência, passageiros e sazonalidade: cálculo demonstrativo.
        lead_days = (departure - date.today()).days
        advance_factor = 0.90 if lead_days >= 60 else 0.96 if lead_days >= 30 else 1.0 if lead_days >= 7 else 1.22
        price_one = round(base_price * airline["fator"] * advance_factor, 2)
        if return_date:
            return_base, _, _ = route_tariff(destination, origin, return_date)
            price_total = round((price_one + return_base * airline["fator"] * advance_factor) * pesquisa.passageiros, 2)
        else:
            price_total = round(price_one * pesquisa.passageiros, 2)
        flights.append({
            "companhia": airline["nome"],
            "codigo_companhia": airline["codigo"],
            "origem": origin,
            "destino": destination,
            "data_ida": departure.isoformat(),
            "data_volta": return_date.isoformat() if return_date else None,
            "passageiros": pesquisa.passageiros,
            **schedule,
            "preco_por_pessoa": price_one if not return_date else round(price_total / pesquisa.passageiros, 2),
            "preco_total": price_total,
            "moeda": "BRL",
            "fonte_tarifa": source,
            "registros_anac_utilizados": sample_size,
            "tipo": "estimativa_demonstrativa",
        })
    return {
        "origem": origin, "destino": destination, "data_ida": departure.isoformat(),
        "data_volta": return_date.isoformat() if return_date else None,
        "passageiros": pesquisa.passageiros, "resultados": flights,
        "aviso": "Não são ofertas reais. Preços calculados a partir de histórico ANAC quando disponível e regras demonstrativas; horários são sintéticos.",
    }

@app.get("/api/clima")
async def clima(
    cidade: str = Query(..., min_length=2, max_length=100),
    dias: int = Query(7, ge=1, le=16),
):
    key = normalize(cidade)
    known = DESTINATIONS.get(key)
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            if known:
                lat, lon = known["latitude"], known["longitude"]
                nome = cidade
            else:
                geo = await client.get(
                    "https://geocoding-api.open-meteo.com/v1/search",
                    params={"name": cidade, "count": 1, "language": "pt", "format": "json"},
                )
                geo.raise_for_status()
                results = geo.json().get("results", [])
                if not results:
                    raise HTTPException(status_code=404, detail=f"Cidade '{cidade}' não encontrada na API de geocodificação.")
                place = results[0]
                lat, lon, nome = place["latitude"], place["longitude"], place["name"]
            forecast = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": lat, "longitude": lon,
                    "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
                    "current": "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code",
                    "timezone": "auto", "forecast_days": min(dias, 16),
                },
            )
            forecast.raise_for_status()
            data = forecast.json()
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail=f"Não foi possível consultar a API de clima: {exc}") from exc
    daily = data.get("daily", {})
    days_out = []
    for i, day in enumerate(daily.get("time", [])):
        days_out.append({
            "data": day,
            "temperatura_maxima_c": daily.get("temperature_2m_max", [None])[i],
            "temperatura_minima_c": daily.get("temperature_2m_min", [None])[i],
            "precipitacao_mm": daily.get("precipitation_sum", [None])[i],
            "codigo_clima": daily.get("weather_code", [None])[i],
        })
    return {
        "cidade": nome, "latitude": lat, "longitude": lon,
        "consultado_em": datetime.now().astimezone().isoformat(timespec="seconds"),
        "atual": data.get("current"), "previsao_diaria": days_out,
        "fonte": "Open-Meteo", "aviso": "Previsão meteorológica, não garantia de condições futuras.",
    }

@app.get("/api/hoteis")
def buscar_hoteis(
    cidade: str = Query(..., min_length=2, max_length=100),
    checkin: str = Query(..., description="AAAA-MM-DD"),
    checkout: str = Query(..., description="AAAA-MM-DD"),
    hospedes: int = Query(1, ge=1, le=20),
):
    entrada = parse_date(checkin, "checkin")
    saida = parse_date(checkout, "checkout")
    if saida <= entrada:
        raise HTTPException(status_code=422, detail="checkout deve ser posterior a checkin.")
    nights = (saida - entrada).days
    key = normalize(cidade)
    known = DESTINATIONS.get(key)
    # Não existe fonte gratuita aberta e universal que garanta disponibilidade de hotéis.
    # A lista e as tarifas abaixo são demonstrativas; uma API comercial pode substituir este provider.
    if known:
        hotels = known["hotels"]
        factor = known["hotel_factor"]
    else:
        seed = int(hashlib.sha256(key.encode()).hexdigest()[:8], 16)
        rng = random.Random(seed)
        factor = 1.0
        hotels = [(f"Hotel Demonstrativo {i}", rng.randrange(180, 401, 10)) for i in range(1, 4)]
    weekend_factor = 1.12 if any((entrada + timedelta(days=i)).weekday() >= 4 for i in range(nights)) else 1.0
    results = []
    for index, (name, nightly) in enumerate(hotels):
        per_night = round(nightly * factor * weekend_factor * (1 + max(0, hospedes - 2) * 0.12), 2)
        results.append({
            "nome": name, "cidade": cidade, "checkin": entrada.isoformat(),
            "checkout": saida.isoformat(), "noites": nights, "hospedes": hospedes,
            "preco_diaria_estimado": per_night,
            "preco_total_estimado": round(per_night * nights, 2),
            "moeda": "BRL", "categoria": ["Econômico", "Intermediário", "Conforto"][index % 3],
            "fonte": "catálogo demonstrativo local",
            "aviso": "Hotel e preço ilustrativos; não representam estabelecimento confirmado nem disponibilidade real.",
        })
    return {
        "cidade": cidade, "checkin": entrada.isoformat(), "checkout": saida.isoformat(),
        "noites": nights, "hospedes": hospedes, "resultados": results,
        "tipo": "demonstracao",
        "aviso": "Para hotéis reais, conecte um provedor com API de hospedagem e credenciais próprias.",
    }
