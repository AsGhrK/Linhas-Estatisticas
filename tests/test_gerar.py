import copy
import json
import tempfile
import unittest
from pathlib import Path

from pipeline.gerar_dados import gerar

CABECALHO = "ano;mes;empresa;origem;destino;tarifa;assentos\n"
LINHAS = [
    "2026;1;GLO;SBCG;SBRJ;400.0;20",
    "2026;1;GLO;SBCG;SBGL;500.0;15",
    "2026;3;GLO;SBCG;SBRJ;600.0;12",
    "2026;1;TAM;SBCG;SBSP;300.0;40",
    "2026;1;TAM;SBCG;SBGR;350.0;10",
]
CLIMA_BASE = {
    "estacao": "Estação X",
    "temp_max": [30, 31, 29, 28, 26, 25, 25, 26, 27, 28, 29, 30],
    "temp_min": [20, 21, 19, 18, 16, 15, 14, 15, 17, 18, 19, 20],
    "precipitacao": [100, 90, 80, 70, 60, 50, 40, 30, 60, 80, 90, 100],
}
MANUAL = {
    "clima.json": {
        "fonte": "INMET", "periodo": "1991-2020",
        "RIO": CLIMA_BASE,
        "SAO": {**CLIMA_BASE, "temp_max": [x - 4 for x in CLIMA_BASE["temp_max"]],
                "precipitacao": [x + 20 for x in CLIMA_BASE["precipitacao"]]},
    },
    "hoteis.json": {
        "fonte": "Accor", "coletado_em": "2026-11-10", "checkin": "2026-12-01", "noites": 5,
        "RIO": [{"nome": f"H{i}", "url": "u", "diaria": d}
                for i, d in enumerate([400, 500, 600])],
        "SAO": [{"nome": f"S{i}", "url": "u", "diaria": d}
                for i, d in enumerate([300, 350, 400])],
    },
    "alimentacao.json": {
        "fonte": "qcv", "coletado_em": "2026-11-10",
        "RIO": {"cafe": [20, 30], "almoco": [40, 60], "jantar": [50, 70],
                "tipicas": ["Feijoada"], "fonte_tipicas": "x"},
        "SAO": {"cafe": [18], "almoco": [35, 45, 55], "jantar": [45, 65],
                "tipicas": ["Pastel"], "fonte_tipicas": "x"},
    },
}


def escrever(pasta, manual):
    pasta.mkdir(exist_ok=True)
    for nome, conteudo in manual.items():
        (pasta / nome).write_text(json.dumps(conteudo), encoding="utf-8")


def chaves(obj):
    if isinstance(obj, dict):
        return {k: chaves(v) for k, v in obj.items() if not k.startswith("_")}
    if isinstance(obj, list) and obj and isinstance(obj[0], dict):
        return [chaves(obj[0])]
    return None


class TestGerar(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        raiz = Path(self.tmp.name)
        self.recorte = raiz / "tarifas.csv"
        self.recorte.write_text(CABECALHO + "\n".join(LINHAS) + "\n", encoding="utf-8")
        self.manual_completo = raiz / "completo"
        escrever(self.manual_completo, MANUAL)
        incompleto = copy.deepcopy(MANUAL)
        incompleto["clima.json"]["RIO"]["estacao"] = None
        incompleto["clima.json"]["RIO"]["temp_max"][2] = None
        incompleto["hoteis.json"]["checkin"] = None
        incompleto["hoteis.json"]["SAO"] = []
        incompleto["alimentacao.json"]["RIO"]["cafe"] = []
        self.manual = raiz / "incompleto"
        escrever(self.manual, incompleto)

    def gol(self, d):
        return next(c for c in d["rotas"]["RIO"]["passagens"]["companhias"] if c["icao"] == "GLO")

    def test_rio_junta_santos_dumont_e_galeao(self):
        d = gerar(self.recorte, self.manual, "2026-11-17")
        self.assertEqual(self.gol(d)["assentos"][0], 35)
        self.assertAlmostEqual(self.gol(d)["precos"][0], round((400 * 20 + 500 * 15) / 35, 2))

    def test_mes_com_poucos_assentos_vira_null(self):
        d = gerar(self.recorte, self.manual, "2026-11-17")
        self.assertIsNone(self.gol(d)["precos"][2])
        self.assertEqual(self.gol(d)["assentos"][2], 12)

    def test_out_nov_dez_sempre_null(self):
        d = gerar(self.recorte, self.manual, "2026-11-17")
        for rota in d["rotas"].values():
            for c in rota["passagens"]["companhias"]:
                self.assertEqual(c["precos"][9:], [None, None, None])

    def test_estatisticas_ponderadas(self):
        d = gerar(self.recorte, self.manual, "2026-11-17")
        e = d["rotas"]["RIO"]["passagens"]["estatisticas"]
        self.assertEqual(e["ponderado_por"], "assentos")
        self.assertEqual(e["n"], 47)
        self.assertEqual(e["linhas"], 3)

    def test_estatisticas_por_companhia(self):
        d = gerar(self.recorte, self.manual, "2026-11-17")
        self.assertEqual(self.gol(d)["estatisticas"]["n"], 47)
        self.assertEqual(self.gol(d)["nome"], "GOL")

    def test_so_companhias_com_linhas(self):
        d = gerar(self.recorte, self.manual, "2026-11-17")
        self.assertEqual([c["icao"] for c in d["rotas"]["RIO"]["passagens"]["companhias"]], ["GLO"])
        self.assertEqual([c["icao"] for c in d["rotas"]["SAO"]["passagens"]["companhias"]], ["TAM"])

    def test_periodo_do_recorte(self):
        d = gerar(self.recorte, self.manual, "2026-11-17")
        self.assertEqual(d["periodo_passagens"], {"inicio": "2026-01", "fim": "2026-03"})

    def test_mais_de_um_ano_levanta_erro(self):
        self.recorte.write_text(CABECALHO + LINHAS[0] + "\n2025;1;GLO;SBCG;SBRJ;1.0;5\n",
                                encoding="utf-8")
        with self.assertRaises(ValueError):
            gerar(self.recorte, self.manual, "2026-11-17")

    def test_custo_total_hotel(self):
        d = gerar(self.recorte, self.manual_completo, "2026-11-17")
        h = d["rotas"]["RIO"]["hotel"]
        self.assertEqual(h["diaria_media"], 500.0)
        self.assertEqual(h["diaria_mediana"], 500)
        self.assertEqual(h["custo_total"], 2500.0)
        self.assertEqual(h["n"], 3)

    def test_alimentacao(self):
        d = gerar(self.recorte, self.manual_completo, "2026-11-17")
        a = d["rotas"]["RIO"]["alimentacao"]
        self.assertEqual(a["media_diaria"], 25 + 50 + 60)
        self.assertEqual(a["n"], 2)

    def test_faixas(self):
        d = gerar(self.recorte, self.manual_completo, "2026-11-17")
        f = d["faixas"]
        self.assertEqual(f["custo_hotel"], {"min": 300, "max": 600})
        self.assertEqual(f["preco_passagem"], {"min": 310.0, "max": 442.86})
        self.assertEqual(f["custo_alimentacao"], {"min": min(20 + 40 + 50, 18 + 35 + 45),
                                                  "max": max(30 + 60 + 70, 18 + 55 + 65)})
        self.assertEqual(f["temperatura_media"], {"min": 17.5, "max": 26})
        self.assertEqual(f["precipitacao"], {"min": 30, "max": 120})

    def test_pendencias(self):
        d = gerar(self.recorte, self.manual, "2026-11-17")
        p = d["pendencias"]
        self.assertEqual(p, sorted(p))
        for nome in ["clima.RIO.estacao", "clima.RIO.temp_max", "hoteis.checkin",
                     "hoteis.SAO", "alimentacao.RIO.cafe"]:
            self.assertIn(nome, p)
        self.assertNotIn("hoteis.RIO", p)
        self.assertNotIn("clima.SAO.estacao", p)

    def test_bloco_pendente_tem_null_nao_zero(self):
        d = gerar(self.recorte, self.manual, "2026-11-17")
        h = d["rotas"]["SAO"]["hotel"]
        self.assertEqual(h["n"], 0)
        self.assertIsNone(h["diaria_media"])
        self.assertIsNone(h["custo_total"])
        self.assertIsNone(d["rotas"]["RIO"]["alimentacao"]["media_diaria"])
        self.assertIsNone(d["faixas"]["custo_hotel"])
        self.assertIsNone(d["faixas"]["custo_alimentacao"])
        self.assertIsNone(d["faixas"]["temperatura_media"])

    def test_completo_sem_pendencias(self):
        d = gerar(self.recorte, self.manual_completo, "2026-11-17")
        self.assertEqual(d["pendencias"], [])

    def test_dados_falsos_tem_o_schema_novo(self):
        falso = json.loads(Path("dados/dados-falsos.json").read_text(encoding="utf-8"))
        d = gerar(self.recorte, self.manual_completo, "2026-11-17")
        self.assertEqual(chaves(d), chaves(falso))


if __name__ == "__main__":
    unittest.main()
