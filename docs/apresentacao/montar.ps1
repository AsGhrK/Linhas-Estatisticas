# Monta docs/apresentacao/linhas-estatisticas.pptx (e o PDF) a partir de slides.json, pelo PowerPoint.
# Uso: powershell -ExecutionPolicy Bypass -File docs/apresentacao/montar.ps1
$ErrorActionPreference = 'Stop'
$pasta = Split-Path -Parent $MyInvocation.MyCommand.Path
$slides = Get-Content (Join-Path $pasta 'slides.json') -Raw -Encoding UTF8 | ConvertFrom-Json

$INK = '#14212B'; $MUTE = '#4A5A63'; $RULE = '#C9D3CE'; $CAB = '#E2E9E5'; $AEROVIA = '#B0306E'; $FUNDO = '#FFFFFF'
$FONTE = 'Segoe UI'
function Cor([string]$hex) {
  $r = [Convert]::ToInt32($hex.Substring(1, 2), 16); $g = [Convert]::ToInt32($hex.Substring(3, 2), 16); $b = [Convert]::ToInt32($hex.Substring(5, 2), 16)
  return $r + 256 * $g + 65536 * $b
}

$app = New-Object -ComObject PowerPoint.Application
$pres = $app.Presentations.Add(0)
$pres.PageSetup.SlideWidth = 960
$pres.PageSetup.SlideHeight = 540

function Texto($slide, [string]$t, $x, $y, $w, $h, $tam, [string]$cor, [bool]$negrito) {
  $caixa = $slide.Shapes.AddTextbox(1, $x, $y, $w, $h)
  $tf = $caixa.TextFrame
  $tf.WordWrap = -1
  $tf.TextRange.Text = $t
  $tf.TextRange.Font.Name = $FONTE
  $tf.TextRange.Font.Size = $tam
  $tf.TextRange.Font.Color.RGB = (Cor $cor)
  $tf.TextRange.Font.Bold = [int]$negrito * -1
  return $caixa
}

function Titulo($slide, [string]$t) {
  [void](Texto $slide $t 56 36 848 64 36 $INK $true)
  $linha = $slide.Shapes.AddLine(56, 104, 136, 104)
  $linha.Line.ForeColor.RGB = (Cor $AEROVIA); $linha.Line.Weight = 3
}

$i = 0
foreach ($s in $slides) {
  $i++
  $slide = $pres.Slides.Add($i, 12)
  $slide.FollowMasterBackground = 0
  $slide.Background.Fill.ForeColor.RGB = (Cor $FUNDO)
  switch ($s.tipo) {
    'capa' {
      [void](Texto $slide $s.titulo 56 150 848 120 44 $INK $true)
      $linha = $slide.Shapes.AddLine(56, 284, 176, 284)
      $linha.Line.ForeColor.RGB = (Cor $AEROVIA); $linha.Line.Weight = 4
      [void](Texto $slide $s.sub 56 302 820 90 24 $MUTE $false)
      [void](Texto $slide $s.rodape 56 470 848 40 16 $MUTE $false)
    }
    'texto' {
      Titulo $slide $s.titulo
      $caixa = Texto $slide (($s.itens) -join "`r") 56 130 848 370 26 $INK $false
      $p = $caixa.TextFrame.TextRange.ParagraphFormat
      $p.Bullet.Visible = -1; $p.Bullet.Character = 8226; $p.SpaceAfter = 14
      $caixa.TextFrame.Ruler.Levels(1).FirstMargin = 0; $caixa.TextFrame.Ruler.Levels(1).LeftMargin = 28
    }
    'imagem' {
      Titulo $slide $s.titulo
      [void]$slide.Shapes.AddPicture((Join-Path $pasta $s.imagem), 0, -1, 56, 120, 620, 375)
      [void](Texto $slide $s.nota 700 140 220 340 18 $MUTE $false)
    }
    'tabela' {
      Titulo $slide $s.titulo
      $linhas = @($s.linhas)
      $nl = $linhas.Count + 1; $nc = @($s.cab).Count
      $alt = [Math]::Min(370, 34 * $nl)
      $tab = $slide.Shapes.AddTable($nl, $nc, 56, 130, 848, $alt).Table
      $tam = if ($nl -gt 8) { 16 } else { 20 }
      for ($r = 1; $r -le $nl; $r++) {
        for ($c = 1; $c -le $nc; $c++) {
          $cel = $tab.Cell($r, $c)
          $txt = if ($r -eq 1) { $s.cab[$c - 1] } else { $linhas[$r - 2][$c - 1] }
          $tr = $cel.Shape.TextFrame.TextRange
          $tr.Text = [string]$txt
          $tr.Font.Name = $FONTE; $tr.Font.Size = $tam; $tr.Font.Color.RGB = (Cor $INK)
          $tr.Font.Bold = if ($r -eq 1 -or $c -eq 1) { -1 } else { 0 }
          $amostra = [string]$linhas[0][$c - 1]
          if ($c -gt 1 -and $amostra -match '^(R\$|\d)') { $tr.ParagraphFormat.Alignment = 3 }
          $cel.Shape.Fill.ForeColor.RGB = if ($r -eq 1) { (Cor $CAB) } else { (Cor $FUNDO) }
          $cel.Shape.TextFrame.MarginTop = 3; $cel.Shape.TextFrame.MarginBottom = 3
          foreach ($b in 1, 2, 4) { $cel.Borders.Item($b).Weight = 0 }
          $cel.Borders.Item(3).ForeColor.RGB = (Cor $RULE); $cel.Borders.Item(3).Weight = 1
        }
      }
    }
  }
  $n = Texto $slide ([string]$i) 880 500 40 24 12 $MUTE $false
  $n.TextFrame.TextRange.ParagraphFormat.Alignment = 3
}

# Propriedades do arquivo: a coleção do Office só aceita InvokeMember a partir do PowerShell.
function Propriedade($nome, $valor) {
  $todas = $pres.BuiltInDocumentProperties
  $p = [System.__ComObject].InvokeMember('Item', [Reflection.BindingFlags]::GetProperty, $null, $todas, @($nome))
  [void][System.__ComObject].InvokeMember('Value', [Reflection.BindingFlags]::SetProperty, $null, $p, @($valor))
}
Propriedade 'Title' 'Linhas Estatísticas'
Propriedade 'Author' 'Davi Casari, Filipe Rioske, João Pegarare e Victor Solique'
Propriedade 'Subject' 'Projeto Final de Estatística — TADS, IFMS Nova Andradina'
$pptx = Join-Path $pasta 'linhas-estatisticas.pptx'
$pdf = Join-Path $pasta 'linhas-estatisticas.pdf'
$pres.SaveAs($pptx, 24)
$pres.SaveAs($pdf, 32)
$pres.Close()
$app.Quit()
[void][Runtime.InteropServices.Marshal]::ReleaseComObject($app)
Write-Output "gravado $pptx e $pdf ($i slides)"
