"""Imprime docs/relatorio/relatorio.html em relatorio.pdf com o Microsoft Edge e grava os metadados da equipe.

Uso: python docs/relatorio/pdf.py   (depois de node docs/relatorio/scores.cjs e python docs/relatorio/gerar.py)
"""
import subprocess
from pathlib import Path

from pypdf import PdfReader, PdfWriter

PASTA = Path(__file__).resolve().parent
EDGE = Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe")
EQUIPE = "Davi Casari, Filipe Rioske, João Pegarare e Victor Solique"

pdf = PASTA / "relatorio.pdf"
subprocess.run([str(EDGE), "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
                "--virtual-time-budget=8000", f"--print-to-pdf={pdf}", (PASTA / "relatorio.html").as_uri()],
               check=True, capture_output=True)
w = PdfWriter(clone_from=PdfReader(pdf))
w.metadata = {"/Title": "Linhas Estatísticas — Relatório", "/Author": EQUIPE,
              "/Subject": "Projeto Final de Estatística — TADS, IFMS Nova Andradina",
              "/Creator": "Linhas Estatísticas", "/Producer": "Linhas Estatísticas"}
w.write(pdf)
print("gravado", pdf, len(PdfReader(pdf).pages), "páginas")
