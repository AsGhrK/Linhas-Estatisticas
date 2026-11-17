import unittest

from pipeline.estatistica import (
    desvio_padrao_ponderado,
    media_ponderada,
    mediana_ponderada,
    resumo_ponderado,
)


class TestEstatistica(unittest.TestCase):
    def test_media_ponderada(self):
        self.assertAlmostEqual(media_ponderada([100, 200], [1, 3]), 175.0)

    def test_mediana_ponderada_pega_o_primeiro_que_passa_da_metade(self):
        self.assertEqual(mediana_ponderada([300, 100, 200], [2, 1, 1]), 200)

    def test_desvio_padrao_divisor_soma_menos_um(self):
        self.assertAlmostEqual(desvio_padrao_ponderado([100, 200], [1, 3]), 50.0)

    def test_vazio_devolve_none(self):
        self.assertIsNone(media_ponderada([], []))
        self.assertIsNone(desvio_padrao_ponderado([100], [1]))  # soma dos pesos - 1 = 0

    def test_resumo(self):
        r = resumo_ponderado([100, 200], [1, 3], linhas=2)
        self.assertEqual(r["n"], 4)
        self.assertEqual(r["linhas"], 2)
        self.assertAlmostEqual(r["coef_variacao"], round(50 / 175, 4))
        self.assertEqual((r["minimo"], r["maximo"]), (100, 200))
        self.assertEqual(r["ponderado_por"], "assentos")

    def test_resumo_vazio(self):
        r = resumo_ponderado([], [], linhas=3)
        self.assertEqual(r["n"], 0)
        self.assertEqual(r["linhas"], 3)
        for chave in ("media", "mediana", "desvio_padrao", "coef_variacao", "minimo", "maximo"):
            self.assertIsNone(r[chave])
        self.assertEqual(r["ponderado_por"], "assentos")


if __name__ == "__main__":
    unittest.main()
