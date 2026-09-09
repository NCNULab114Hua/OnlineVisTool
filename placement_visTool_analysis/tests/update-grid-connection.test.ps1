$ErrorActionPreference = 'Stop'

$scriptPath = Join-Path $PSScriptRoot '..\panel\map_model_5050.js'
$source = Get-Content -LiteralPath $scriptPath -Raw

function Get-JavaScriptFunctionBody {
  param(
    [Parameter(Mandatory = $true)]
    [string] $Source,

    [Parameter(Mandatory = $true)]
    [string] $FunctionName
  )

  $signature = "function $FunctionName"
  $signatureIndex = $Source.IndexOf($signature)
  if ($signatureIndex -lt 0) {
    throw "Function '$FunctionName' was not found."
  }

  $openBraceIndex = $Source.IndexOf('{', $signatureIndex)
  if ($openBraceIndex -lt 0) {
    throw "Function '$FunctionName' has no opening brace."
  }

  $depth = 0
  for ($i = $openBraceIndex; $i -lt $Source.Length; $i++) {
    if ($Source[$i] -eq '{') {
      $depth++
    } elseif ($Source[$i] -eq '}') {
      $depth--
      if ($depth -eq 0) {
        return $Source.Substring($openBraceIndex + 1, $i - $openBraceIndex - 1)
      }
    }
  }

  throw "Function '$FunctionName' body was not closed."
}

$updateGridBody = Get-JavaScriptFunctionBody -Source $source -FunctionName 'updateGrid'

if ($updateGridBody -notmatch 'calculateDetectionProbability\(\s*gridSize\s*,\s*sensors\s*,\s*clickableBox\s*\)') {
  throw 'updateGrid must recalculate detection probabilities after changing generation sensors.'
}

if ($updateGridBody -notmatch 'if\s*\(\s*isConnectMode\s*\)\s*\{\s*connectSensors\(\)\s*;?\s*\}') {
  throw 'updateGrid must refresh connection lines when connection mode is enabled.'
}

Write-Host 'updateGrid refreshes connection lines while connection mode is enabled.'
