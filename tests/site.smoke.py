# shortcut: não executado nesta máquina (Playwright não instalado); rodar com pip install -r tests/requirements.txt && python -m playwright install chromium
"""Teste de fumaça das 8 telas no navegador.

Sobe `python -m http.server` numa porta livre, abre cada tela no Chromium
(Playwright) e derruba o servidor no fim. Rodar: python tests/site.smoke.py
Precisa de internet: o Chart.js e as fontes vêm de CDN.
"""
import socket
import subprocess
import sys
import time
import unittest
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

RAIZ = Path(__file__).resolve().parent.parent
PAGINAS = [
    'index.html', 'dados-busca.html', 'dados-precos.html', 'detalhes.html',
    'clima.html', 'hotel.html', 'alimentacao.html', 'visao-geral.html',
]
CANVAS = {
    'dados-precos.html': ['grafico-precos-rio', 'grafico-precos-sao'],
    'clima.html': ['grafico-temperatura', 'grafico-precipitacao'],
    'visao-geral.html': ['grafico-radar'],
}
FALSOS = RAIZ / 'dados' / 'dados-falsos.json'


def porta_livre():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


class TestSite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        porta = porta_livre()
        cls.base = 'http://127.0.0.1:%d/' % porta
        cls.servidor = subprocess.Popen(
            [sys.executable, '-m', 'http.server', str(porta), '--bind', '127.0.0.1'],
            cwd=RAIZ, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(50):
            try:
                urllib.request.urlopen(cls.base, timeout=1)
                break
            except OSError:
                time.sleep(0.1)
        else:
            cls.servidor.terminate()
            raise RuntimeError('o servidor local não subiu em ' + cls.base)
        cls.pw = sync_playwright().start()
        cls.navegador = cls.pw.chromium.launch()

    @classmethod
    def tearDownClass(cls):
        cls.navegador.close()
        cls.pw.stop()
        cls.servidor.terminate()
        cls.servidor.wait()

    def abrir(self, falsos=False, **opcoes):
        pagina = self.navegador.new_page(**opcoes)
        self.addCleanup(pagina.close)
        erros = []
        pagina.on('console', lambda m: m.type == 'error' and erros.append(m.text))
        pagina.on('pageerror', lambda e: erros.append(str(e)))
        if falsos:
            # Troca o dados.json pelo falso sem mexer no data-fonte do HTML.
            pagina.route('**/dados/dados.json', lambda r: r.fulfill(path=FALSOS))
        return pagina, erros

    def test_todas_as_telas_carregam(self):
        pagina, erros = self.abrir()
        for nome in PAGINAS:
            with self.subTest(tela=nome):
                erros.clear()
                pagina.goto(self.base + nome, wait_until='networkidle')
                self.assertEqual(pagina.locator('nav.rota a').count(), 8)
                self.assertEqual(erros, [])

    def test_graficos_desenhados(self):
        # Dados falsos: o clima real ainda está pendente e mostra o aviso de vazio.
        # Movimento reduzido: o reveal.js monta os gráficos sem esperar a rolagem.
        pagina, _ = self.abrir(falsos=True, reduced_motion='reduce')
        for nome, ids in CANVAS.items():
            pagina.goto(self.base + nome, wait_until='networkidle')
            for id_ in ids:
                with self.subTest(canvas=id_):
                    pagina.wait_for_function(
                        'id => window.Chart && Chart.getChart(document.getElementById(id)) !== undefined',
                        arg=id_, timeout=5000)

    def test_file_protocol_mostra_aviso(self):
        pagina, _ = self.abrir()
        pagina.goto((RAIZ / 'dados-precos.html').as_uri())
        faixa = pagina.locator('.faixa-pendencias')
        faixa.wait_for()
        self.assertIn('servidor local', faixa.inner_text())

    def test_pesos_zerados(self):
        pagina, _ = self.abrir()
        pagina.goto(self.base + 'visao-geral.html', wait_until='networkidle')
        controles = pagina.locator('[data-pesos] input[type=range]')
        self.assertEqual(controles.count(), 4)
        for i in range(4):
            controles.nth(i).fill('0')
        pagina.get_by_text('Defina ao menos um peso maior que zero.').wait_for()

    def test_faixa_de_pendencias(self):
        pagina, _ = self.abrir(falsos=True)
        pagina.goto(self.base + 'dados-busca.html', wait_until='networkidle')
        self.assertTrue(pagina.locator('.faixa-pendencias').is_visible())

    def test_largura_projetor(self):
        pagina, _ = self.abrir(viewport={'width': 1280, 'height': 720})
        for nome in PAGINAS:
            with self.subTest(tela=nome):
                pagina.goto(self.base + nome, wait_until='networkidle')
                sobra = pagina.evaluate(
                    'document.documentElement.scrollWidth - document.documentElement.clientWidth')
                self.assertLessEqual(sobra, 0)


if __name__ == '__main__':
    unittest.main(verbosity=2)
