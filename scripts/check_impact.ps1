param (
    [Parameter(Mandatory=$true)]
    [string]$TargetNode
)

$GraphDirs = Get-ChildItem -Path "$env:USERPROFILE\.gemini\antigravity\scratch\graphify_data\ascension-tracker-*" -Directory | Sort-Object LastWriteTime -Descending
if ($GraphDirs.Count -eq 0) {
    Write-Host "No se encontró ningún grafo. Ejecutando run_graphify.ps1 primero..."
    & "$env:USERPROFILE\.gemini\config\scripts\run_graphify.ps1"
    $GraphDirs = Get-ChildItem -Path "$env:USERPROFILE\.gemini\antigravity\scratch\graphify_data\ascension-tracker-*" -Directory | Sort-Object LastWriteTime -Descending
}

$LatestGraph = "$($GraphDirs[0].FullName)\graph.json"
Write-Host "Usando grafo: $LatestGraph"

python -c "
import json, sys
target = sys.argv[1].lower()
with open(sys.argv[2], encoding='utf-8') as f:
    g = json.load(f)
target_ids = {n['id'] for n in g.get('nodes', []) if target in n.get('label', '').lower() or target in n.get('id', '').lower()}
if not target_ids:
    print(f'No se encontraron nodos para: {target}')
    sys.exit(0)

print(f'=== DEPENDENCIAS PARA {target} ===')
for e in g.get('edges', []):
    if e['target'] in target_ids or e['source'] in target_ids:
        src_label = next((n['label'] for n in g['nodes'] if n['id'] == e['source']), e['source'])
        tgt_label = next((n['label'] for n in g['nodes'] if n['id'] == e['target']), e['target'])
        print(f'{src_label} -> {tgt_label}')
" $TargetNode $LatestGraph
