# 📖 COMPENDIO DE DIRECTRICES: Ascension Tracker

Este documento unificado contiene todas las reglas, configuraciones y contextos que consulto antes de operar en tu repositorio.

---

## 📄 [AGENTS.md](AGENTS.md)

# Ascension Tracker

**Stack:** Backend Java 17 + Spring Boot 3.x (JWT + Google Sign-in) · Frontend React 19 + TypeScript + Vite + Tailwind (PWA).

**INSTRUCCIÓN ACTIVA:**
Todo agente y subagente hereda esta configuración. 
Antes de modificar código, **DEBES** leer obligatoriamente `GEMINI.md` y todos los archivos en `.agents/rules/*.md`.
Si no lo haces, estarás operando a ciegas e incumpliendo tu directiva principal.

Los archivos pasivos a leer son:
- `.agents/rules/git.md`: ramas, commits, push.
- `.agents/rules/workflow.md`: flujo de diseño obligatorio para nuevas features (Discovery -> RFC -> Core TDD -> Persistencia -> UI).
- `.agents/rules/quality.md`: tipado, linter, build, tests.
- `.agents/rules/project.md`: arquitectura, base de datos, seguridad.
- `.agents/rules/encoding.md`: UTF-8 y mojibake.
- `.agents/rules/delegation.md`: impacto, contexto y plantilla de subagentes.
- `.agents/rules/reporting.md`: formato obligatorio de informe y gestión de bloqueos.

Reglas generales y skills: plugin global `~/.gemini/config/plugins/pro-engineering`.


---
**🛠️ CAPACIDADES DEL ENTORNO (IMPORTANTE):**
- **GitHub CLI (gh)**: Está instalado y AUTENTICADO con acceso total. NO estás ciego. Úsalo obligatoriamente para descargar logs de CI (gh run view --log), leer Pull Requests, o buscar código remoto.
- **CI/CD Logs**: Si el pipeline falla, lee .agents/rules/ci-cd-troubleshooting.md y usa gh para obtener la evidencia antes de tocar código.


---

## 📄 [GEMINI.md](GEMINI.md)

# Reglas Absolutas - EVIDENCE FIRST

**Lee `.agents/rules/00-evidence-gate.md` antes de afirmar nada. Sin el cierre, no respondas al usuario.**

Esta configuración es ACTIVA e inviolable para todos los agentes.

## EVIDENCE FIRST
Nunca presentes una acción como realizada si no existe evidencia de que fue realizada. Una intención no es evidencia. Una herramienta disponible no significa que haya sido utilizada. Un archivo existente no significa que haya sido leído.
Si no existe evidencia: NO VERIFICADO.

## FACT / INFERENCE / UNKNOWN
Toda conclusión debe clasificarse como:
- **FACT**: Hecho observado directamente mediante una herramienta, comando o test verificable.
- **INFERENCE**: Conclusión razonable derivada de uno o varios hechos.
- **UNKNOWN**: No existe evidencia suficiente para determinarlo.
Nunca escribas "He comprobado que..." si solamente has inferido algo.

## TOOL TRUTH
Solo puedes declarar USED / EXECUTED / VERIFIED cuando exista evidencia observable de la ejecución de una herramienta (script, MCP, maven, npm, etc). Graphify = discovery. Tests/código = verification.

## NUNCA
1. Push a `main`/`master` ni force push.
2. Usar `--no-verify`.
3. Relajar controles para conseguir verde (quitar tests, usar `-DskipTests` como verificación final, `@ts-ignore`, `any`).
4. Crear archivos temporales dentro del repo (usa `~/.gemini/antigravity/scratch/`).
5. `git add .` o `git reset --hard` destructivo.
6. Editar una migración Flyway ya aplicada.
7. Escribir en el informe algo no ejecutado o comprobado.

## SIEMPRE
1. Si algo no se puede cumplir (test que falla, ambigüedad): PARA y responde con "BLOQUEADO: <qué> / <por qué> / <qué necesito>". 
2. Un informe que dice "no pude" es un buen resultado. Uno que lo oculta es un fallo grave.
3. Editar con herramientas nativas (UTF-8).
4. Evidencia verificable (Ledger de comandos y salidas reales).
 
## NARRATIVA PASO A PASO
Nunca trabajes en silencio. Debes ir contándole al usuario qué archivos miras, qué deduces de ellos y qué vas a editar antes de hacerlo. Mantén al usuario involucrado en tu proceso deductivo.

## IMPACTO Y GRAFO OBLIGATORIO
Cualquier cambio que pueda afectar a terceros (filtros, DTOs compartidos, configuración) DEBE validarse previamente buscando el nodo en el grafo con scripts/check_impact.ps1 <Nodo>. Asumir que un cambio es seguro sin evidencia del grafo está prohibido.


---

## 📄 [.agents\rules\workflow.md](.agents\rules\workflow.md)

# Flujo de Desarrollo Arquitectónico (Epics & Features)

**REGLA CRÍTICA:** Nunca saltar directamente a crear bases de datos o pantallas para nuevas funcionalidades complejas. El diseño del dominio y del algoritmo manda.

Todo desarrollo de una nueva "Epic" o Feature compleja DEBE seguir estrictamente este orden:

1. **Discovery & Data Mining:**
   - Analizar cómo se almacenan y consumen los datos actualmente (`graph.json`, `grep`, historial del usuario).
   - Identificar dependencias con flujos críticos (ej. entrenamiento activo, borrado de cuenta).

2. **RFC (Request for Comments) - Aprobación Humana:**
   - Redactar un documento breve con el diseño del Dominio (modelos de estado, relaciones) y del Algoritmo Central.
   - Especificar cómo encaja en la literatura/lógica de negocio real, no solo en "cómo se guarda".
   - **BLOQUEO:** Cero código hasta que el usuario (CTO) valide el diseño.

3. **Core Backend (Lógica pura + TDD):**
   - Desarrollar la lógica pura y matemática primero (ej. algoritmos de progresión, cálculos).
   - Escribir tests unitarios exhaustivos para el comportamiento del algoritmo (casos límite, fallos). Cero persistencia aún.

4. **Infraestructura Backend & Persistencia:**
   - Migraciones Flyway y diseño relacional.
   - Entidades JPA, Repositories, integración de borrado (`AccountDeletionService`), Autorización (JWT ownership).
   - Tests de integración.

5. **Frontend Core:**
   - Definición estricta de tipos (`api.ts`).
   - Hooks de estado (React Query) y componentes de gestión (CRUD/Dashboards).

6. **Integración con Flujos Críticos (Frontend Flow):**
   - Inyección de la nueva feature en las pantallas de acción principales (ej. `active-workout.tsx`).
   - Validar que el flujo del usuario es coherente y responde a la lógica de negocio.

## Análisis de Impacto (GRAFO OBLIGATORIO)
Antes de modificar la arquitectura o tocar DTOs/Filtros/Core, DEBES ejecutar scripts/check_impact.ps1 <NombreClase> para descubrir quién más usa esa clase. NUNCA tomes decisiones de impacto sin consultar este grafo.


---

## 📄 [.agents\rules\project.md](.agents\rules\project.md)

# Arquitectura, BD y Seguridad

## Backend
- Entidades JPA en `backend/src/main/java/com/ascension/model/` con `@Getter` y `@Setter`. Prohibido `@Data`.
- DTOs con validaciones (`@Valid`). Nunca exponer entidades en API.

## Base de datos (Flyway)
- Migraciones en `backend/src/main/resources/db/migration/`. 
- Nunca editar una migración aplicada. Crear `V<n+1>__descripcion.sql`.
- Toda tabla con FK a `users` exige: 
  1. Decidir `ON DELETE` explícito.
  2. Revisar/Actualizar `AccountDeletionService`.
  3. Test que demuestre el borrado correcto.

## Security & Auth
- Identidad (`userId`) proviene **SIEMPRE** del JWT / `@AuthenticationPrincipal`. NUNCA del body, URL o query parameter.
- Authorization: Comprobar ownership en todas las operaciones sobre recursos del usuario.
- Secretos: NUNCA en el repositorio, ni logs.
- Refresh Tokens: Si modificas Auth, revisa rotación, expiración, almacenamiento y comportamiento ante uso concurrente.
La regla sobre la tabla users ha sido caducada. Si la regla y Flyway no coinciden, gana el schema.


---

## 📄 [.agents\rules\quality.md](.agents\rules\quality.md)

# Quality Gates y Tests

Los comandos de calidad deben corresponder al alcance real de la tarea. No omitas verificaciones relevantes.

## Quality Gates Oficiales
- **Backend**: `.\mvnw.cmd verify` CON tests. El uso de `-DskipTests` puede utilizarse **ÚNICAMENTE** como feedback intermedio, NUNCA puede producir un resultado de COMPLETADO final.
- **Frontend**: `npm run lint`, `npm run typecheck`, `npm run build` usando los scripts reales de package.json.

## Código
- TypeScript: Sin `any`. Usar `unknown` + narrowing.
- Java: Sin warnings nuevos. DTOs tipados. Sin catch vacíos.

## Tests
- Todo Controller o Service nuevo lleva tests. Sin tests, la tarea no está terminada.
- Nunca debilites un test para conseguir que pase (.skip, .only, borrar assertions).
- Si un test falla: determina por qué. Corrige el código o documenta y actualiza el test si el comportamiento cambió intencionadamente. Un test en verde no es excusa para ignorar un fallo.
- Si un comando oficial falla por causas externas (ej. Testcontainers no disponible), el resultado es ese fallo: reportar como BLOQUEADO. No sustituyas el comando por otro más permisivo.
Un fix de seguridad sin un test que falle al quitar el control es PARCIAL.


---

## 📄 [.agents\rules\git.md](.agents\rules\git.md)

# Git y Pre-flight

## Flujo
1. Actualizar: `git fetch`
2. Ramificar desde `main` actualizada: `git checkout -b feat/<tema>` o `fix/<tema>`.
3. Commits atómicos con Conventional Commits.
4. Push: `git push -u origin <rama>`. 

Nunca a `main`/`master`. Nunca force push. Nunca reescribir historia publicada. Nunca `git reset --hard` sobre trabajo del usuario.

## Antes de cada commit
1. `git status`: Revisa explícitamente qué archivos serán incluidos.
2. Añade por nombre/ruta (`git add archivo`). Nunca `git add .`.
3. Sin archivos temporales (fix_*, patch_*, etc).
4. Dejar correr los hooks nativos sin `--no-verify`.

## Pre-flight (obligatorio al empezar)
1. `git status` (debe estar limpio, o los cambios preexistentes NO DEBEN ser borrados/sobrescritos).
2. Comprobar que `HEAD` proviene de `origin/main` actualizado.


---

## 📄 [.agents\rules\delegation.md](.agents\rules\delegation.md)

# Descubrimiento, Impacto y Delegación

## Análisis de Impacto y Dependencias
Graphify = discovery, no es una prueba absoluta.
Si modificas entidades, tablas, relaciones, servicios, Auth o contratos:
1. Intenta usar Graphify vía MCP.
2. Si MCP no está, usa `graph.json` vía fallback script (`~/.gemini/antigravity/scratch/graphify_data/`) pero asume que puede ser un snapshot; confirma con el código. No afirmes usar el MCP si usas el fallback.
3. Si tampoco puedes, usa búsqueda textual/grep/inspección directa.
Debes revisar explícitamente `AccountDeletionService` cuando `users` esté implicado.

## Subagentes y Delegación
- Los subagentes no pueden operar bajo reglas reducidas. Todo subagente debe leer estas reglas de forma EXPLÍCITA en su prompt inicial.
- No delegues tareas triviales de un solo archivo.
- Subagentes paralelos: deben operar en ramas/worktrees separadas.

### Plantilla de Delegación
Todo prompt a un subagente debe contener:
- **ROL**, **RAMA**, y **OBJETIVO**.
- **CONTEXTO y DEPENDENCIAS**: Archivos relevantes y dependencias descubiertas (e.g., `AccountDeletionService`).
- **TAREA**: Pasos exactos incluyendo tests exigidos.
- **INSTRUCCIÓN ACTIVA**: "Lee GEMINI.md y .agents/rules/*.md antes de empezar"
- **VERIFICACIÓN**: Quality gates sin omitir tests.
- **CRITERIO TERMINACIÓN** y **FORMATO DE REPORTE** (reporting.md).
La regla sobre la tabla users ha sido caducada.


---

## 📄 [.agents\rules\reporting.md](.agents\rules\reporting.md)

# Informe y Bloqueos

El informe debe ser factual. No uses lenguaje como "perfecto" o "impecable" sin evidencia objetiva. El Agente Principal no puede alterar o reinterpretar la evidencia del subagente.

## Formato Obligatorio de Informe Final

RESULTADO:
COMPLETADO | PARCIAL | BLOQUEADO

OBJETIVO:
<qué se pidió>

CAMBIOS:
<archivos/cambios realizados>

EVIDENCIA:
[FACT] <hechos comprobados mediante comandos/código>
[INFERENCE] <inferencias relevantes>
[UNKNOWN] <aspectos no comprobados>

IMPACTO:
METHOD:
GRAPHIFY | FALLBACK | NONE
TOOL/COMMAND:
<ejecución literal o script exacto>
DEPENDENCIAS: 
<dependencias encontradas>

VERIFICACIÓN:
COMMAND: <comando literal>
EXIT CODE: <número>
OUTPUT: <salida relevante>
TESTS: <tests realmente ejecutados>

NO EJECUTADO:
<todo lo solicitado que no se ejecutó, con motivo>

DESVIACIONES:
<cualquier desviación>

GIT:
STATUS: <salida real>
DIFF: <git diff --stat>
COMMIT: <hash si existe>
PUSH: <rama si existe>

## Bloqueos
Usa `BLOQUEADO: <qué> / <por qué> / <qué necesito>` al inicio si una herramienta o test falla, pero NO lo uses como excusa para omitir validaciones que tengan un fallback razonable.
Prefiere "NO LO HE PODIDO VERIFICAR" o "NO EJECUTADO" a inventar resultados o decir "debería funcionar". Tu objetivo es producir evidencia verificable, no parecer competente.
"CI en verde" exige URL del run. "En main" exige que el hash está en main.
 
## Narrativa Paso a Paso
El agente DEBE narrar en voz alta (al usuario) su proceso de pensamiento antes y durante la ejecución de sus acciones. Debes decirle al usuario: qué estás mirando, qué has averiguado, qué vas a editar y por qué. Nunca realices una cadena larga de comandos en silencio para luego entregar solo el resultado final.


---

## 📄 [.agents\rules\encoding.md](.agents\rules\encoding.md)

# Encoding

El proyecto ha sufrido problemas de mojibake (lectura incorrecta de UTF-8 en Windows).

1. Trabajar SIEMPRE en UTF-8 puro sin BOM.
2. Preferir herramientas nativas de edición.
3. No utilizar PowerShell para transformar archivos de código sin controlar explícitamente el encoding.
4. Si creas scripts auxiliares en Python (siempre fuera del repo: `~/.gemini/antigravity/scratch/`), fuerza `open(..., encoding='utf-8')`.
5. Si un script Python/PowerShell inyecta mojibake, revierte y usa edición nativa. Nunca ocultes el problema de encoding.


---

## 📄 [.agents\rules\ci-cd-troubleshooting.md](.agents\rules\ci-cd-troubleshooting.md)

# Protocolo Obligatorio para Troubleshooting de CI/CD

**INSTRUCCIÓN ACTIVA:**
Cuando un pipeline de Integración Continua (GitHub Actions, etc.) falle, NINGÚN AGENTE tiene permitido empezar a modificar código, alterar tests o simular localmente sin antes haber cumplido estrictamente este protocolo.

## La Regla de Oro
**PROHIBIDO SIMULAR A CIEGAS.** La principal causa de pérdida de tokens y bugs en cascada es intentar adivinar por qué falla el CI reproduciendo el error localmente. 

## Flujo de Resolución (El Método ChatGPT)

1. **Ir directamente al CI de cada PR:**
   Identifica el PR, la rama, el commit y el workflow fallido. NO analices la arquitectura ni leas archivos al azar.
2. **Leer los logs del trabajo fallido:**
   Descarga y lee los logs exactos del servidor de CI. Si no tienes acceso a la API de GitHub o a la CLI (gh), **PÍDESELOS AL USUARIO**. No te quedes con el "CI failed". Busca excepciones concretas (LiteWebJarsResourceResolver, 	oomanyrequests, etc.).
3. **Clasificar la causa:**
   - Código (Error de compilación, TS, Lint).
   - Dependencias (Incompatibilidad de versiones, ej. Springdoc OpenAPI con Spring Boot).
   - Configuración (Rutas, variables de entorno).
   - Infraestructura Externa (Límites de descargas anónimas de Docker Hub).
4. **Comparar con la rama base:**
   Propón el cambio **mínimo y verificable** que resuelva la causa raíz. Prohibido hacer refactors masivos o tocar Docker, tests y dependencias a la vez.
5. **No silenciar el dolor:**
   Ejecutar las comprobaciones locales que correspondan, pero **PROHIBIDO desactivar tests, hacer hacks con ny, o usar --no-verify** para conseguir un verde artificial.
6. **Esperar al CI real:**
   Sube el parche y espera a revisar los nuevos logs. Si el fallo era de infraestructura externa (como el rate limit de Docker Hub), **solo relanza el job**, no toques el código.
7. **Cierre:**
   No afirmes que está arreglado mientras la ejecución no haya terminado correctamente en GitHub.


---
