"""Estatísticas ponderadas. Peso = assentos vendidos; a unidade é o assento."""
import math


def media_ponderada(valores, pesos):
    total = sum(pesos)
    if not valores or total <= 0:
        return None
    return sum(v * w for v, w in zip(valores, pesos)) / total


def mediana_ponderada(valores, pesos):
    total = sum(pesos)
    if not valores or total <= 0:
        return None
    acumulado = 0
    for valor, peso in sorted(zip(valores, pesos), key=lambda par: par[0]):
        acumulado += peso
        if acumulado >= total / 2:
            return valor
    return None


def desvio_padrao_ponderado(valores, pesos):
    """Desvio amostral com pesos de frequência: divisor = soma dos pesos - 1."""
    total = sum(pesos)
    if not valores or total <= 1:
        return None
    media = media_ponderada(valores, pesos)
    soma = sum(w * (v - media) ** 2 for v, w in zip(valores, pesos))
    return math.sqrt(soma / (total - 1))


def _arredondar(x, casas):
    return None if x is None else round(x, casas)


def resumo_ponderado(valores, pesos, linhas):
    media = media_ponderada(valores, pesos)
    desvio = desvio_padrao_ponderado(valores, pesos)
    cv = None
    if media and desvio is not None:
        cv = desvio / media
    return {
        "n": sum(pesos),
        "linhas": linhas,
        "media": _arredondar(media, 2),
        "mediana": _arredondar(mediana_ponderada(valores, pesos), 2),
        "desvio_padrao": _arredondar(desvio, 2),
        "coef_variacao": _arredondar(cv, 4),
        "minimo": min(valores) if valores else None,
        "maximo": max(valores) if valores else None,
        "ponderado_por": "assentos",
    }
