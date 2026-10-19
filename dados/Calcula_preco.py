"""Funções de orçamento usando ofertas já salvas em dados/dados.json."""
from __future__ import annotations

from buscadados.buscar_dados import carregar_dados, salvar_dados


def menor_preco_por_rota(origem: str, destino: str, moeda: str = "BRL") -> dict | None:
    """Retorna a oferta salva mais barata para uma rota e moeda."""
    origem, destino, moeda = origem.upper(), destino.upper(), moeda.upper()
    ofertas = []
    for pesquisa in carregar_dados()["pesquisas"]:
        for oferta in pesquisa.get("ofertas", []):
            if (
                oferta.get("origem") == origem
                and oferta.get("destino") == destino
                and oferta.get("moeda", "").upper() == moeda
            ):
                ofertas.append(oferta)
    return min(ofertas, key=lambda item: item["preco_total"]) if ofertas else None


def calcular_orcamento(
    trechos: list[dict],
    hospedagem: float = 0,
    alimentacao: float = 0,
    transporte_local: float = 0,
    passeios: float = 0,
    outros: float = 0,
    pessoas: int = 1,
) -> dict:
    
    if pessoas < 1:
        raise ValueError("O número de pessoas deve ser pelo menos 1.")

    despesas = {
        "passagens": sum(float(trecho["preco"]) for trecho in trechos),
        "hospedagem": float(hospedagem),
        "alimentacao": float(alimentacao),
        "transporte_local": float(transporte_local),
        "passeios": float(passeios),
        "outros": float(outros),
    }
    if any(valor < 0 for valor in despesas.values()):
        raise ValueError("Os valores do orçamento não podem ser negativos.")

    total = round(sum(despesas.values()), 2)
    return {
        "trechos": trechos,
        "despesas": despesas,
        "total_viagem": total,
        "pessoas": pessoas,
        "media_por_pessoa": round(total / pessoas, 2),
        "moeda": "BRL",
        "observacao": "Estimativa baseada nos valores informados; não inclui despesas não cadastradas.",
    }


def salvar_viagem(nome: str, orcamento: dict) -> None:
    """Guarda um orçamento no JSON, sem apagar viagens existentes."""
    dados = carregar_dados()
    dados["viagens"].append({"nome": nome, **orcamento})
    salvar_dados(dados)


if __name__ == "__main__":
    # Exemplo de cálculo manual (valores ilustrativos, não são cotações reais).
    trechos = [
        {"origem": "CGR", "destino": "GRU", "preco": 650.00},
        {"origem": "GRU", "destino": "GIG", "preco": 280.00},
        {"origem": "GIG", "destino": "CGR", "preco": 720.00},
    ]
    orcamento = calcular_orcamento(
        trechos,
        hospedagem=900,
        alimentacao=450,
        transporte_local=180,
        passeios=250,
        outros=100,
        pessoas=1,
    )
    salvar_viagem("Exemplo de viagem por várias cidades", orcamento)
    print("Orçamento ilustrativo salvo no JSON:")
    for categoria, valor in orcamento["despesas"].items():
        print(f"  {categoria}: R$ {valor:.2f}")
    print(f'Total: R$ {orcamento["total_viagem"]:.2f}')
