
"""
buscar_dados.py

Busca gratuita de aeroportos e armazenamento de cotações de viagens.

Fonte dos aeroportos:
OurAirports - https://ourairports.com/data/

Estrutura esperada:
projeto/
├── dados/
│   ├── aeroportos.json
│   ├── dados.json
│   └── buscadados/
│       └── buscar_dados.py
"""

import csv
import io
import json
import urllib.error
import urllib.request

from datetime import datetime, timezone
from pathlib import Path


# ==========================================================
# CAMINHOS E CONFIGURAÇÕES
# ==========================================================

PASTA_PROJETO = Path(__file__).resolve().parents[2]
PASTA_DADOS = PASTA_PROJETO / "dados"

ARQUIVO_AEROPORTOS = PASTA_DADOS / "aeroportos.json"
ARQUIVO_DADOS = PASTA_DADOS / "dados.json"

URL_AEROPORTOS = (
    "https://davidmegginson.github.io/"
    "ourairports-data/airports.csv"
)

TIMEOUT = 30


# ==========================================================
# UTILITÁRIOS
# ==========================================================

def agora_iso():
    """Retorna a data e hora atuais em formato ISO 8601."""
    return datetime.now(timezone.utc).isoformat()


def ler_json(caminho, padrao):
    """Lê um JSON ou retorna o valor padrão se não existir."""
    if not caminho.exists():
        return padrao

    try:
        with caminho.open("r", encoding="utf-8") as arquivo:
            return json.load(arquivo)
    except (json.JSONDecodeError, OSError) as erro:
        raise RuntimeError(
            f"Não foi possível ler {caminho}: {erro}"
        ) from erro


def salvar_json(caminho, dados):
    """Salva JSON com indentação e caracteres acentuados."""
    caminho.parent.mkdir(parents=True, exist_ok=True)

    temporario = caminho.with_suffix(caminho.suffix + ".tmp")

    with temporario.open("w", encoding="utf-8") as arquivo:
        json.dump(
            dados,
            arquivo,
            ensure_ascii=False,
            indent=4
        )

    temporario.replace(caminho)


# ==========================================================
# BUSCA E ATUALIZAÇÃO DOS AEROPORTOS
# ==========================================================

def baixar_aeroportos():
    """
    Baixa o CSV público do OurAirports e converte os aeroportos
    relevantes para uma lista de dicionários.

    Não exige chave de API.
    """
    requisicao = urllib.request.Request(
        URL_AEROPORTOS,
        headers={"User-Agent": "BuscadorDeViagensAcademico/1.0"}
    )

    try:
        with urllib.request.urlopen(
            requisicao,
            timeout=TIMEOUT
        ) as resposta:
            conteudo = resposta.read().decode("utf-8-sig")

    except (urllib.error.URLError, TimeoutError, OSError) as erro:
        raise ConnectionError(
            f"Não foi possível baixar os aeroportos: {erro}"
        ) from erro

    leitor = csv.DictReader(io.StringIO(conteudo))
    aeroportos = []

    for linha in leitor:
        codigo_iata = (linha.get("iata_code") or "").strip().upper()
        nome = (linha.get("name") or "").strip()
        cidade = (linha.get("municipality") or "").strip()
        pais = (linha.get("iso_country") or "").strip().upper()
        tipo = (linha.get("type") or "").strip()
        servico = (linha.get("scheduled_service") or "").strip().lower()

        # Exige código IATA e evita instalações fechadas.
        if not codigo_iata or len(codigo_iata) != 3:
            continue

        if tipo == "closed" or not nome:
            continue

        aeroporto = {
            "iata": codigo_iata,
            "nome": nome,
            "cidade": cidade,
            "pais": pais,
            "tipo": tipo,
            "servico_regular": servico == "yes",
            "latitude": linha.get("latitude_deg", ""),
            "longitude": linha.get("longitude_deg", ""),
        }

        aeroportos.append(aeroporto)

    if not aeroportos:
        raise ValueError(
            "A fonte foi acessada, mas nenhum aeroporto válido foi encontrado."
        )

    # Ordena para facilitar a consulta e a apresentação.
    aeroportos.sort(
        key=lambda aeroporto: (
            aeroporto["pais"],
            aeroporto["cidade"],
            aeroporto["nome"]
        )
    )

    salvar_json(
        ARQUIVO_AEROPORTOS,
        {
            "fonte": "OurAirports",
            "url_fonte": URL_AEROPORTOS,
            "atualizado_em": agora_iso(),
            "total": len(aeroportos),
            "aeroportos": aeroportos,
        }
    )

    return aeroportos


def carregar_aeroportos(atualizar=False):
    """
    Carrega os aeroportos do arquivo local.

    Se atualizar=True, tenta baixar a versão mais recente.
    Se a atualização falhar, utiliza o cache existente, se houver.
    """
    if atualizar:
        try:
            return baixar_aeroportos()
        except (ConnectionError, ValueError, RuntimeError) as erro:
            if ARQUIVO_AEROPORTOS.exists():
                print(f" Aviso: atualização falhou: {erro}")
                print(" Utilizando a base local de aeroportos.")
            else:
                raise

    dados = ler_json(ARQUIVO_AEROPORTOS, {})

    if isinstance(dados, dict):
        aeroportos = dados.get("aeroportos", [])
    elif isinstance(dados, list):
        # Compatibilidade com uma lista simples de aeroportos.
        aeroportos = dados
    else:
        aeroportos = []

    if aeroportos:
        return aeroportos

    # Primeira execução: baixa a base automaticamente.
    return baixar_aeroportos()


# ==========================================================
# PESQUISAS
# ==========================================================

def buscar_aeroportos(
    termo,
    pais=None,
    apenas_voos_regulares=True,
    limite=20,
    atualizar=False
):
    """
    Pesquisa aeroportos por código IATA, nome, cidade ou país.

    Exemplos:
        buscar_aeroportos("GRU")
        buscar_aeroportos("São Paulo")
        buscar_aeroportos("Rio de Janeiro", pais="BR")
        buscar_aeroportos("Brasil", pais="BR", limite=10)
    """
    if not isinstance(termo, str) or not termo.strip():
        return []

    termo = termo.strip().casefold()
    pais = pais.strip().upper() if pais else None

    aeroportos = carregar_aeroportos(atualizar=atualizar)
    resultados = []

    for aeroporto in aeroportos:
        codigo = str(aeroporto.get("iata", "")).upper()
        nome = str(aeroporto.get("nome", ""))
        cidade = str(aeroporto.get("cidade", ""))
        codigo_pais = str(aeroporto.get("pais", "")).upper()

        if pais and codigo_pais != pais:
            continue

        if apenas_voos_regulares:
            if not aeroporto.get("servico_regular", False):
                continue

        campos = (
            codigo,
            nome,
            cidade,
            codigo_pais,
        )

        if any(termo in campo.casefold() for campo in campos):
            resultados.append(aeroporto)

    # Código exato primeiro; depois nome e cidade.
    resultados.sort(
        key=lambda aeroporto: (
            aeroporto.get("iata", "").casefold() != termo,
            aeroporto.get("cidade", "").casefold(),
            aeroporto.get("nome", "").casefold()
        )
    )

    if limite is not None:
        resultados = resultados[:max(0, limite)]

    return resultados


def buscar_aeroporto_por_codigo(codigo, atualizar=False):
    """Retorna um aeroporto pelo código IATA exato ou None."""
    if not isinstance(codigo, str):
        return None

    codigo = codigo.strip().upper()

    if len(codigo) != 3:
        return None

    resultados = buscar_aeroportos(
        codigo,
        apenas_voos_regulares=False,
        limite=None,
        atualizar=atualizar
    )

    for aeroporto in resultados:
        if aeroporto.get("iata", "").upper() == codigo:
            return aeroporto

    return None


# ==========================================================
# HISTÓRICO DE COTAÇÕES
# ==========================================================

def listar_cotacoes():
    """Retorna o histórico de cotações armazenado localmente."""
    dados = ler_json(ARQUIVO_DADOS, {})

    if isinstance(dados, list):
        return dados

    if isinstance(dados, dict):
        cotacoes = dados.get("cotacoes", [])
        return cotacoes if isinstance(cotacoes, list) else []

    return []


def registrar_cotacao(
    origem,
    destino,
    preco,
    moeda="BRL",
    fonte="",
    data_ida=None,
    data_volta=None,
    observacoes=""
):
    """
    Registra uma cotação obtida de uma fonte identificada.

    preco deve ser numérico e positivo.
    fonte deve identificar de onde o valor foi obtido.

    Esta função NÃO consulta preços automaticamente.
    Ela apenas registra uma cotação que já foi obtida.
    """
    origem = buscar_aeroporto_por_codigo(origem)
    destino = buscar_aeroporto_por_codigo(destino)

    if origem is None:
        raise ValueError("Código IATA de origem não encontrado.")

    if destino is None:
        raise ValueError("Código IATA de destino não encontrado.")

    if origem["iata"] == destino["iata"]:
        raise ValueError("Origem e destino não podem ser iguais.")

    try:
        preco = float(preco)
    except (TypeError, ValueError) as erro:
        raise ValueError("O preço precisa ser numérico.") from erro

    if preco <= 0:
        raise ValueError("O preço precisa ser maior que zero.")

    if not isinstance(fonte, str) or not fonte.strip():
        raise ValueError(
            "Informe a fonte da cotação para manter a rastreabilidade."
        )

    cotacao = {
        "origem": origem["iata"],
        "origem_nome": origem["cidade"] or origem["nome"],
        "destino": destino["iata"],
        "destino_nome": destino["cidade"] or destino["nome"],
        "preco": round(preco, 2),
        "moeda": moeda.upper(),
        "fonte": fonte.strip(),
        "data_consulta": agora_iso(),
        "data_ida": data_ida,
        "data_volta": data_volta,
        "observacoes": observacoes,
    }

    dados = ler_json(ARQUIVO_DADOS, {})

    # Preserva o conteúdo de um JSON já existente.
    if isinstance(dados, list):
        dados.append(cotacao)
        salvar_json(ARQUIVO_DADOS, dados)

    elif isinstance(dados, dict):
        cotacoes = dados.setdefault("cotacoes", [])

        if not isinstance(cotacoes, list):
            raise ValueError(
                "O campo 'cotacoes' de dados.json precisa ser uma lista."
            )

        cotacoes.append(cotacao)
        salvar_json(ARQUIVO_DADOS, dados)

    else:
        raise ValueError(
            "Formato inválido em dados.json. Verifique o arquivo antes de alterá-lo."
        )

    return cotacao


# ==========================================================
# TESTE PELO TERMINAL
# ==========================================================

def menu():
    """Menu simples para testar o módulo sem executar main.py."""
    while True:
        print("\n=== BUSCADOR GRATUITO DE AEROPORTOS ===")
        print("1. Pesquisar aeroporto")
        print("2. Atualizar base de aeroportos")
        print("3. Consultar histórico de cotações")
        print("0. Sair")

        opcao = input("Escolha: ").strip()

        try:
            if opcao == "1":
                termo = input("Código IATA, cidade ou nome: ").strip()
                pais = input(
                    "País ISO (BR para Brasil; Enter para todos): "
                ).strip() or None

                resultados = buscar_aeroportos(
                    termo,
                    pais=pais,
                    limite=20
                )

                if not resultados:
                    print("Nenhum aeroporto encontrado.")
                    continue

                for aeroporto in resultados:
                    print(
                        f'{aeroporto["iata"]} | '
                        f'{aeroporto["cidade"] or aeroporto["nome"]} | '
                        f'{aeroporto["nome"]} | '
                        f'{aeroporto["pais"]}'
                    )

            elif opcao == "2":
                aeroportos = baixar_aeroportos()
                print(f"Base atualizada: {len(aeroportos)} aeroportos.")

            elif opcao == "3":
                cotacoes = listar_cotacoes()

                if not cotacoes:
                    print("Ainda não há cotações registradas.")
                else:
                    for cotacao in cotacoes:
                        print(
                            f'{cotacao.get("origem")} -> '
                            f'{cotacao.get("destino")} | '
                            f'{cotacao.get("moeda", "BRL")} '
                            f'{cotacao.get("preco")} | '
                            f'Fonte: {cotacao.get("fonte", "não informada")}'
                        )

            elif opcao == "0":
                break

            else:
                print("Opção inválida.")

        except (ConnectionError, RuntimeError, ValueError) as erro:
            print(f"Erro: {erro}")


if __name__ == "__main__":
    menu()
