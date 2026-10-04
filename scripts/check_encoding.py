#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/check_encoding.py
Escanea todos los archivos fuente en busca de secuencias mojibake (UTF-8 corrupto).
Ejecutar después de cualquier edición masiva de archivos.

Uso:
    python scripts/check_encoding.py
    python scripts/check_encoding.py --fix   # También intenta corregir (llama a fix_mojibake.py)
"""
import os
import sys
import re

SRC_DIRS = [
    os.path.join(os.path.dirname(__file__), '..', 'frontend', 'src'),
]
EXTENSIONS = {'.ts', '.tsx', '.js', '.jsx', '.html', '.css', '.md', '.json'}
EXCLUDE_DIRS = {'node_modules', '.git', 'dist', 'build'}

# Bytes que NUNCA deberían aparecer como secuencia en un archivo UTF-8 con español correcto
# Son la huella del mojibake cp1252/latin-1
MOJIBAKE_BYTE_SIGNATURES = [
    (bytes.fromhex('c3a2e282ac'), 'â€ (mojibake de em-dash/comillas)'),
    (bytes.fromhex('c3b0c5b8'),   'ðŸ (mojibake de emoji 4-byte)'),
    (bytes.fromhex('c382c2a1'),   'Â¡ (mojibake de ¡)'),
    (bytes.fromhex('c382c2bf'),   'Â¿ (mojibake de ¿)'),
    # Ã seguido de byte de continuacion latin-1 (no deberia existir si el texto es correcto UTF-8)
    # Nota: c3 83 puede aparecer en UTF-8 correcto solo si hay el caracter U+00C3 (Ã) seguido de algo,
    # pero en contexto español eso es siempre mojibake
    (bytes.fromhex('c383c2'),     'Ã + Â (mojibake de acento)'),
    (bytes.fromhex('c383e2'),     'Ã + â (mojibake de acento + simbolo)'),
]

def scan_file(fpath):
    """Retorna lista de (lineno, descripcion) con problemas encontrados."""
    issues = []
    try:
        with open(fpath, 'rb') as f:
            raw = f.read()
    except Exception as e:
        return [(-1, f'Error leyendo archivo: {e}')]

    # Verificar que es UTF-8 válido
    try:
        text = raw.decode('utf-8')
    except UnicodeDecodeError as e:
        return [(-1, f'NO ES UTF-8 VÁLIDO: {e}')]

    # Buscar patrones mojibake por bytes
    for sig, description in MOJIBAKE_BYTE_SIGNATURES:
        if sig in raw:
            # Encontrar la línea exacta
            pos = 0
            while True:
                idx = raw.find(sig, pos)
                if idx == -1:
                    break
                lineno = raw[:idx].count(b'\n') + 1
                line_start = raw.rfind(b'\n', 0, idx) + 1
                line_end = raw.find(b'\n', idx)
                if line_end == -1:
                    line_end = len(raw)
                line_preview = raw[line_start:min(line_start+80, line_end)].decode('utf-8', errors='replace').strip()
                issues.append((lineno, f'{description}: {line_preview}'))
                pos = idx + len(sig)

    return issues

def main():
    # Forzar UTF-8 en stdout (necesario en Windows con cp1252 por defecto)
    if sys.stdout.encoding and sys.stdout.encoding.lower() not in ('utf-8', 'utf8'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')

    fix_mode = '--fix' in sys.argv
    total_issues = 0
    affected_files = []

    for src_dir in SRC_DIRS:
        src_dir = os.path.normpath(src_dir)
        if not os.path.exists(src_dir):
            print(f'WARN: Directorio no encontrado: {src_dir}')
            continue

        for root, dirs, files in os.walk(src_dir):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            for fname in files:
                ext = os.path.splitext(fname)[1].lower()
                if ext not in EXTENSIONS:
                    continue
                fpath = os.path.join(root, fname)
                issues = scan_file(fpath)
                if issues:
                    rel = os.path.relpath(fpath, src_dir)
                    affected_files.append(rel)
                    print(f'\n❌ {rel}:')
                    for lineno, desc in issues[:5]:  # max 5 por archivo
                        print(f'   línea {lineno}: {desc}')
                    if len(issues) > 5:
                        print(f'   ... y {len(issues)-5} más')
                    total_issues += len(issues)

    if total_issues == 0:
        print('✅ LIMPIO: No se encontró mojibake en los archivos fuente.')
        sys.exit(0)
    else:
        print(f'\n⚠️  TOTAL: {total_issues} problemas en {len(affected_files)} archivos.')
        if fix_mode:
            print('\nEjecutando fix_mojibake.py...')
            fix_script = os.path.join(os.path.dirname(__file__), 'fix_mojibake.py')
            os.system(f'python "{fix_script}"')
        else:
            print('Ejecuta: python scripts/check_encoding.py --fix  para corregir automáticamente.')
        sys.exit(1)

if __name__ == '__main__':
    main()
