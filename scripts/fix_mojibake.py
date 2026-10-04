#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/fix_mojibake.py
Corrige automáticamente todas las secuencias mojibake (UTF-8 corrupto por cp1252/Latin-1)
en los archivos fuente del proyecto.

Uso:
    python scripts/fix_mojibake.py           # Corrige en sitio
    python scripts/fix_mojibake.py --dry-run # Solo muestra qué cambiaría
"""
import os
import sys

SRC_DIRS = [
    os.path.join(os.path.dirname(__file__), '..', 'frontend', 'src'),
]
EXTENSIONS = {'.ts', '.tsx', '.js', '.jsx', '.html', '.css', '.md'}
EXCLUDE_DIRS = {'node_modules', '.git', 'dist', 'build'}

# Tabla completa de mapeo unicode -> byte original (cp1252 + latin-1 + bytes indefinidos)
UNICODE_TO_BYTE = {}

# cp1252 especiales (los que difieren de latin-1)
CP1252_SPECIAL = {
    '\u20ac': 0x80, '\u201a': 0x82, '\u0192': 0x83, '\u201e': 0x84,
    '\u2026': 0x85, '\u2020': 0x86, '\u2021': 0x87, '\u02c6': 0x88,
    '\u2030': 0x89, '\u0160': 0x8a, '\u2039': 0x8b, '\u0152': 0x8c,
    '\u017d': 0x8e, '\u2018': 0x91, '\u2019': 0x92, '\u201c': 0x93,
    '\u201d': 0x94, '\u2022': 0x95, '\u2013': 0x96, '\u2014': 0x97,
    '\u02dc': 0x98, '\u2122': 0x99, '\u0161': 0x9a, '\u203a': 0x9b,
    '\u0153': 0x9c, '\u017e': 0x9e, '\u0178': 0x9f,
}
UNICODE_TO_BYTE.update(CP1252_SPECIAL)

# Bytes indefinidos en cp1252 pero validos como bytes UTF-8 en emojis
# Los mapeamos directo a su valor de byte
UNDEFINED_CP1252_BYTES = {0x81, 0x8d, 0x8f, 0x90, 0x9d}
for b in UNDEFINED_CP1252_BYTES:
    # Estos chars aparecen como U+0081, U+008D etc en latin-1
    UNICODE_TO_BYTE[chr(b)] = b

# Latin-1 basico (0xA0-0xFF)
for i in range(0xa0, 0x100):
    if chr(i) not in UNICODE_TO_BYTE:
        UNICODE_TO_BYTE[chr(i)] = i

# Reemplazos de bytes directos (para casos especificos que el algoritmo general no cubre)
DIRECT_BYTE_FIXES = [
    # em dash en contextos especificos de comentarios
    (b'\xe2\x80\x9c handles', b'\xe2\x80\x94 handles'),
    (b'\xe2\x80\x9d fires', b'\xe2\x80\x94 fires'),
    (b'\xe2\x80\x9d open', b'\xe2\x80\x94 open'),
    (b'\xe2\x80\x9d claim', b'\xe2\x80\x94 claim'),
    (b'\xe2\x80\x9d skip', b'\xe2\x80\x94 skip'),
    (b'\xe2\x80\x9d not', b'\xe2\x80\x94 not'),
    (b'\xe2\x80\x9c not', b'\xe2\x80\x94 not'),
]


def char_to_byte(ch):
    """Convierte un char unicode al byte original según cp1252 extendido."""
    cp = ord(ch)
    if cp < 0x80:
        return cp
    if ch in UNICODE_TO_BYTE:
        return UNICODE_TO_BYTE[ch]
    if 0x80 <= cp <= 0xff:
        return cp
    return None


def fix_mojibake_text(text):
    """
    Recorre el texto buscando secuencias de chars cuyo valor cp1252/latin-1
    forma una secuencia UTF-8 válida de un caracter más corto.
    """
    result = []
    i = 0
    while i < len(text):
        fixed = False
        for length in [6, 5, 4, 3, 2]:
            if i + length > len(text):
                continue
            chunk = text[i:i + length]
            # Convertir cada char a su byte original
            raw_bytes = bytearray()
            ok = True
            for ch in chunk:
                b = char_to_byte(ch)
                if b is None:
                    ok = False
                    break
                raw_bytes.append(b)
            if not ok:
                continue
            # Intentar decodificar como UTF-8
            try:
                decoded = bytes(raw_bytes).decode('utf-8')
                if len(decoded) < len(chunk):
                    # Verificar que el resultado no tiene chars de control
                    all_ok = all(
                        ord(c) >= 0x20 or ord(c) in (0x09, 0x0a, 0x0d)
                        for c in decoded
                    )
                    if all_ok:
                        result.append(decoded)
                        i += length
                        fixed = True
                        break
            except UnicodeDecodeError:
                continue
        if not fixed:
            result.append(text[i])
            i += 1
    return ''.join(result)


def process_file(fpath, dry_run=False):
    """Procesa un archivo y retorna True si hubo cambios."""
    with open(fpath, 'rb') as f:
        original_bytes = f.read()

    # Paso 1: reemplazos de bytes directos
    fixed_bytes = original_bytes
    for bad, good in DIRECT_BYTE_FIXES:
        fixed_bytes = fixed_bytes.replace(bad, good)

    # Paso 2: fix algorítmico sobre texto
    text = fixed_bytes.decode('utf-8', errors='replace')
    fixed_text = fix_mojibake_text(text)
    final_bytes = fixed_text.encode('utf-8')

    if final_bytes != original_bytes:
        if not dry_run:
            with open(fpath, 'wb') as f:
                f.write(final_bytes)
        return True
    return False


def main():
    dry_run = '--dry-run' in sys.argv
    fixed_count = 0

    if dry_run:
        print('MODO DRY-RUN: No se escribirá nada.')

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
                try:
                    if process_file(fpath, dry_run=dry_run):
                        rel = os.path.relpath(fpath, src_dir)
                        action = 'DETECTADO' if dry_run else 'CORREGIDO'
                        print(f'{action}: {rel}')
                        fixed_count += 1
                except Exception as e:
                    rel = os.path.relpath(fpath, src_dir)
                    print(f'ERROR en {rel}: {e}')

    if fixed_count == 0:
        print('OK: No se encontró mojibake.')
    else:
        action = 'detectados' if dry_run else 'corregidos'
        print(f'\nTotal: {fixed_count} archivos {action}.')


if __name__ == '__main__':
    main()
