"""Ponto de entrada do projeto."""
from Calcula_preco import calcular_orcamento, salvar_viagem
from buscadados.buscar_dados import carregar_dados


def mostrar_resumo() -> None:
    dados = carregar_dados()
    print(f"Pesquisas salvas: {len(dados['pesquisas'])}")
    print(f"Orçamentos salvos: {len(dados['viagens'])}")


def exemplo_orcamento() -> None:
    """Exemplo didático; os preços abaixo são fictícios."""
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
    salvar_viagem("Exemplo CGR-GRU-GIG-CGR", orcamento)
    print(f"Total ilustrativo: R$ {orcamento['total_viagem']:.2f}")
    print(f"Média por pessoa: R$ {orcamento['media_por_pessoa']:.2f}")


if __name__ == "__main__":
    print("1 - Mostrar resumo dos dados")
    print("2 - Criar orçamento de exemplo (valores fictícios)")
    opcao = input("Escolha: ").strip()
    if opcao == "1":
        mostrar_resumo()
    elif opcao == "2":
        exemplo_orcamento()
    else:
        print("Opção inválida.")
