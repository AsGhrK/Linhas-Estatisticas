import tempfile
import unittest
from pathlib import Path

from pipeline.extrair_anac import extrair, ler_numero_br

CAB = "nr_ano_referencia;nr_mes_referencia;sg_empresa_icao;sg_icao_origem;sg_icao_destino;nr_tarifa;nr_assentos"

LINHAS_01 = [
    "2026;1;GLO;SBCG;SBRJ;446,28;3",
    "2026;1;AZU;SBCG;SBGL;1.234,56;1",
    "2026;1;AZU;SBCG;SBMO;500,00;4",
    "2026;1;GLO;SBGL;SBCG;500,00;4",
    "2026;1;PTB;SBCG;SBSP;500,00;4",
    "2026;1;GLO;SBCG;SBSP;0,00;4",
    "2026;1;GLO;SBCG;SBSP;abc;4",
    "2026;1;ÇÃO;SBSV;SDLO;100,00;1",
]
LINHAS_05 = ["2026;5;TAM;SBCG;SBGR;720;10"]


def gravar(caminho: Path, linhas):
    caminho.write_text("\n".join([CAB] + linhas) + "\n", encoding="latin-1", newline="")


class TestExtrairAnac(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self.pasta = Path(self._tmp.name)
        gravar(self.pasta / "202601.CSV", LINHAS_01)
        gravar(self.pasta / "202605 (1).CSV", LINHAS_05)
        gravar(self.pasta / "INTERNACIONAL_2025-07.CSV", ["2025;7;GLO;SBCG;SBRJ;100,00;1"])
        self.saida = self.pasta / "saida.csv"

    def test_contagens(self):
        c = extrair(self.pasta, self.saida)
        self.assertEqual(c["arquivos"], 2)
        self.assertEqual((c["mantidas"], c["descartadas_empresa"], c["descartadas_tarifa"]), (3, 1, 2))
        self.assertEqual(c["lidas"], 9)

    def test_saida(self):
        extrair(self.pasta, self.saida)
        linhas = self.saida.read_text(encoding="utf-8").splitlines()
        self.assertEqual(linhas[0], "ano;mes;empresa;origem;destino;tarifa;assentos")
        self.assertIn("2026;1;AZU;SBCG;SBGL;1234.56;1", linhas)
        self.assertIn("2026;5;TAM;SBCG;SBGR;720.0;10", linhas)
        self.assertEqual(len(linhas), 4)

    def test_ler_numero_br(self):
        self.assertEqual(ler_numero_br("446,28"), 446.28)
        self.assertEqual(ler_numero_br("1.234,56"), 1234.56)
        self.assertEqual(ler_numero_br("720"), 720.0)
        self.assertEqual(ler_numero_br("720.5"), 720.5)
        for ruim in ("abc", "", "  "):
            with self.assertRaises(ValueError):
                ler_numero_br(ruim)


if __name__ == "__main__":
    unittest.main()
