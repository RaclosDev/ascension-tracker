# GEMINI.md — Reglas del proyecto Ascension Tracker

## 🛑 REGLA ESTRICTA: NUNCA saltar verificaciones (Linting, Tests, Git Hooks)

**Prohibido saltarse los controles de calidad del proyecto.** Si están configurados, es por una buena razón.

1. **Nunca uses `--no-verify` o `-n` en git commits.** Si el pre-commit hook falla (por mojibake, linter, tests o formato), **ARREGLA** el problema subyacente. No lo ignores.
2. **Respeta ESLint, Prettier y TypeScript.** Si al compilar o guardar salta un error de linter o tipado, arréglalo inmediatamente. No añadas `// @ts-ignore` o `// eslint-disable` a menos que sea una emergencia justificada y consultada con el usuario.
3. **Pasa los tests.** Si modificas código que rompe un test, actualiza el código o actualiza el test. No saltes (`.skip`) el test simplemente para que pase.

## ⚠️ REGLA CRÍTICA: Encoding UTF-8 — NUNCA corromper caracteres

Este proyecto ha sufrido corrupción **mojibake** repetida (caracteres como `Ã©`, `â€"`, `ðŸ¤"` en lugar de `é`, `—`, `🤔`).
Esto ocurre cuando un editor Windows lee UTF-8 como cp1252/Latin-1 y reescribe el archivo.

### Reglas de encoding que SIEMPRE debes seguir:

1. **Nunca uses `Get-Content` / `Set-Content` de PowerShell sin `-Encoding utf8`** para archivos de código fuente.
   - ❌ MAL: `Get-Content archivo.tsx | Set-Content nuevo.tsx`
   - ✅ BIEN: `Get-Content archivo.tsx -Encoding utf8 | Set-Content nuevo.tsx -Encoding utf8`

2. **En Python, SIEMPRE abre archivos de texto con `encoding='utf-8'`**:
   - ❌ MAL: `open('archivo.tsx', 'r')`
   - ✅ BIEN: `open('archivo.tsx', 'r', encoding='utf-8')`
   - ✅ BIEN: `open('archivo.tsx', 'wb')` + `.encode('utf-8')` para escritura binaria

3. **Nunca uses `python -c "..."` en PowerShell con strings que contengan caracteres no-ASCII**.
   Guarda el script en un archivo `.py` y ejecútalo con `python archivo.py`.

4. **Para escribir archivos fuente con `write_to_file`**, el contenido siempre debe ir en UTF-8.
   Usa escapes `\uXXXX` o `\UXXXXXXXX` en lugar de pegar emojis o acentos si hay riesgo de corrupción.

5. **Antes de hacer cualquier edición masiva de archivos**, verifica el encoding:
   ```python
   with open(fpath, 'rb') as f:
       raw = f.read()
   text = raw.decode('utf-8')  # Fallará si no es UTF-8 válido
   ```

6. **Después de editar archivos en lote**, ejecuta el script de verificación del proyecto:
   ```bash
   python scripts/check_encoding.py
   ```

### Cómo detectar mojibake:

Secuencias mojibake típicas en este proyecto (Windows cp1252 → UTF-8):

| Mojibake (MAL) | Correcto |
|---|---|
| `Ã©` | `é` |
| `Ã³` | `ó` |
| `Ã¡` | `á` |
| `Ãº` | `ú` |
| `Ã±` | `ñ` |
| `Ã–` | `Ú` |
| `Â¡` | `¡` |
| `â€"` | `—` |
| `â€œ` | `"` |
| `Ã—` | `×` |
| `ðŸ¤"` | `🤔` |
| `ðŸŒ…` | `🌅` |
| `â–¾` | `▾` |
| `âˆ'` | `−` |

### Si ves mojibake en el código:

Ejecuta inmediatamente:
```bash
python scripts/fix_mojibake.py
```
y verifica con:
```bash
python scripts/check_encoding.py
```
