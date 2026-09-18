# AGENTS.md — Reglas obligatorias para este agente

Este documento define las reglas obligatorias de trabajo del agente sobre este repositorio.

Las reglas de este archivo tienen prioridad sobre preferencias implícitas del agente. El objetivo es que cualquier cambio que termine en el repositorio sea **compilable, testeable, seguro, limpio y coherente**.

---

# 0. Principios fundamentales

Antes de modificar el proyecto:

* Entiende primero la estructura y el flujo existente.
* Reutiliza patrones ya presentes en el proyecto antes de introducir otros nuevos.
* No hagas cambios innecesarios fuera del alcance de la tarea.
* No reescribas código que funciona simplemente por preferencia personal.
* No introduzcas dependencias nuevas si la funcionalidad puede resolverse razonablemente con las existentes.
* No inventes APIs, clases, endpoints, configuración o contratos que no existan.
* Si una decisión técnica tiene varias soluciones razonables, utiliza la que mejor encaje con la arquitectura existente.
* Mantén el código coherente con el estilo y convenciones actuales del proyecto.

## Regla de Oro absoluta: Aprobación del plan (ESPERAR AL USUARIO)

**NUNCA programes, modifiques archivos, ni ejecutes comandos de Git sin antes proponer el plan y esperar a que el usuario te dé el OK.**
1. Si el usuario pide un cambio, redacta lo que vas a hacer.
2. **DETENTE.** No ejecutes comandos, no edites archivos.
3. Espera a que el usuario te confirme ("ok", "dale", "hazlo").
4. Si actúas por iniciativa propia sin permiso explícito, estarás violando tu directiva principal.

## Regla crítica: cambios previos del usuario

**Nunca sobrescribas, elimines ni reviertas cambios que ya estuvieran presentes antes de comenzar la tarea.**

Antes de modificar nada, comprueba:

```bash
git status
git diff
```

Si existen cambios previos:

* No los reviertas.
* No los sobrescribas.
* No ejecutes comandos destructivos para "limpiar" el repositorio.
* Distingue claramente tus cambios de los cambios preexistentes.
* Solo debes hacer commit de los cambios correspondientes a tu trabajo.

Prohibido utilizar para limpiar trabajo ajeno:

```bash
git reset --hard
git checkout .
git restore .
git clean -fd
```

salvo que el usuario lo solicite explícitamente.

---

# 1. Git Workflow — Commit + Push obligatorio

Cuando termines una tarea que implique cambios en el código, debes:

1. Revisar los cambios.
2. Ejecutar todos los checks obligatorios.
3. Corregir cualquier fallo.
4. Revisar nuevamente el diff.
5. Crear un commit descriptivo.
6. Hacer `git push`.

No solicites permiso para hacer `commit` o `push`: forman parte del workflow obligatorio.

### Condición absoluta

**Nunca hagas commit ni push si falla cualquiera de los checks obligatorios de las secciones 2, 3, 4 o 5.**

Si algo falla:

> corregir → volver a ejecutar checks → revisar diff → commit → push

Nunca:

> commit → push → CI falla → arreglar → otro commit de reparación

---

# 2. Antes de empezar una tarea

Ejecuta y revisa:

```bash
git status
git branch --show-current
git diff
```

Determina:

* Qué archivos están modificados.
* Qué cambios son preexistentes.
* Qué rama está activa.
* Qué sistema de build utiliza el proyecto.
* Si existe frontend.
* Si existe backend.
* Si existe Docker.
* Si existen tests.
* Si existen pipelines CI/CD.
* Si existen migraciones de base de datos.
* Qué comandos oficiales utiliza el proyecto para build/test/lint.

No asumas que los comandos estándar son correctos si el proyecto tiene scripts específicos.

Consulta cuando sea necesario:

* `README.md`
* `package.json`
* `pom.xml`
* `build.gradle`
* `Dockerfile`
* `docker-compose.yml`
* workflows de `.github/workflows`
* configuración de CI/CD
* documentación del proyecto

---

# 3. Nunca subir código roto

Antes de cualquier commit o push deben pasar todos los checks aplicables.

### REGLA DE CONFIANZA CERO EN LAS HERRAMIENTAS
Incluso si el cambio fue trivial (ej. borrar un bloque de CSS), las herramientas de edición pueden fallar y romper la sintaxis (como comerse una llave de cierre `}`). 
Por tanto, **ESTÁ ABSOLUTAMENTE PROHIBIDO** hacer `git commit` sin antes haber ejecutado localmente el comando de build o lint correspondiente (`npm run build`, `./mvnw package`, etc.) para verificar que el código no está roto.

## Backend Java/Maven

Como mínimo:

```bash
cd backend
./mvnw clean package -DskipTests
```

o el equivalente definido por el proyecto.

Si el proyecto utiliza Maven Wrapper, **preferir `./mvnw` frente a `mvn`**.

Si los tests forman parte del build normal, deben ejecutarse también.

Cuando sea razonable:

```bash
./mvnw clean verify
```

## Frontend

Si existe frontend:

```bash
npm run build
```

o el script equivalente definido en `package.json`.

Si existen scripts obligatorios de lint/typecheck:

```bash
npm run lint
npm run typecheck
```

Ejecutarlos también.

## Docker

Si el proyecto utiliza Docker, comprobar que la imagen pueda construirse:

```bash
docker build .
```

o utilizar el procedimiento definido por el proyecto.

No debe quedar ningún `Dockerfile` apuntando a:

* clases eliminadas;
* rutas inexistentes;
* artefactos que ya no se generan;
* archivos eliminados;
* variables obligatorias sin documentación/configuración adecuada.

## Regla

Si cualquiera de estos checks falla:

**NO COMMIT.
NO PUSH.**

Primero se corrige.

---

# 4. Tests

Los tests forman parte de la definición de "terminado".

## Obligatorio

Cuando se modifique lógica existente:

* Ejecuta los tests afectados.
* Ejecuta los tests relacionados con la funcionalidad.
* Si el proyecto tiene una suite razonable, ejecuta la suite completa antes del commit.

Cuando se modifica lógica no trivial, debe existir o actualizarse al menos un test apropiado.

Ejemplos:

* parsing → test de parsing;
* cálculos → test de casos normales y límites;
* servicios → test del comportamiento;
* integraciones → test/mock apropiado;
* validaciones → test de entradas válidas e inválidas;
* controladores → test de contrato/respuesta cuando corresponda.

## No tests falsos

Prohibido:

* añadir infraestructura de testing que ningún test utilice;
* crear tests que solamente comprueben que una clase se puede instanciar;
* mockear absolutamente todo hasta que el test deje de comprobar comportamiento real;
* desactivar tests para conseguir un build verde;
* añadir `@Disabled` sin una razón documentada;
* cambiar assertions para que pasen sin corregir el comportamiento.

Si se introduce Testcontainers, fixtures, mocks complejos o infraestructura equivalente:

**debe existir al menos un test real que la utilice.**

---

# 5. Checklist de seguridad antes de commit

## Secretos

Nunca commits:

* API keys;
* passwords;
* tokens;
* JWT secrets;
* client secrets;
* private keys;
* certificados privados;
* credenciales de bases de datos;
* cookies de autenticación;
* `.env` reales;
* credenciales de servicios externos.

### Configuración

Nunca hagas esto:

```yaml
jwt:
  secret: ${JWT_SECRET:mi-secreto-real}
```

Los secretos deben:

* no tener default;
* o utilizar un placeholder inequívocamente falso.

Ejemplo:

```yaml
jwt:
  secret: ${JWT_SECRET:CHANGE_ME}
```

En producción, los secretos deben venir de variables de entorno o del mecanismo de secrets correspondiente.

## Revisión automática

Antes de commit:

```bash
git diff --cached | grep -iE "(api[_-]?key|secret|password|token|client[_-]?secret).{0,5}[:=][\"']?[A-Za-z0-9+/=_-]{16,}"
```

Si existe `gitleaks` o `git-secrets`, utilizarlo preferentemente.

## `.env`

Los `.env.example` solo contienen placeholders:

```env
API_KEY=your_api_key_here
JWT_SECRET=CHANGE_ME
DATABASE_PASSWORD=your_password_here
```

Nunca valores reales, aunque sean de desarrollo o testing.

## Si un secreto ya fue commiteado

Eliminarlo del archivo **NO soluciona el problema**.

Un secreto expuesto en Git debe considerarse comprometido.

El proceso correcto es:

1. Identificar el secreto.
2. Informar explícitamente de que existe en el historial Git.
3. Rotar/regenerar la credencial en el proveedor correspondiente.
4. Eliminarlo del código/configuración actual.
5. Evaluar si es necesario limpiar el historial Git.

Nunca afirmar que un secreto está solucionado únicamente porque ya no aparece en el working tree.

---

# 6. Configuración segura por defecto

Cualquier configuración relacionada con seguridad debe fallar de forma segura.

Prohibido utilizar defaults como:

```yaml
cors:
  allowed-origins: "*"
```

o:

```yaml
security:
  enabled: false
```

si eso puede provocar un estado inseguro en producción.

Especialmente para:

* autenticación;
* autorización;
* JWT;
* CORS;
* CSRF;
* cookies;
* sesiones;
* endpoints administrativos;
* acceso a bases de datos;
* credenciales;
* feature flags relacionados con seguridad.

### Regla de oro

Pregunta siempre:

> "¿Qué ocurre si esta variable de entorno no está definida en producción?"

Si la respuesta es:

* autenticación deshabilitada;
* autorización bypassable;
* CORS abierto;
* acceso administrativo expuesto;
* credenciales inseguras;

entonces ese valor **no puede ser el default**.

Preferir fail-fast.

---

# 7. Eliminación de features

Cuando se elimina una feature completa —por ejemplo `Farm`, `Telegram`, `Forest`, etc.— no basta con borrar su clase principal.

Buscar todas sus referencias:

```bash
grep -R "NombreFeature" .
```

o utilizar el mecanismo equivalente del IDE.

Revisar:

* clases;
* imports;
* interfaces;
* implementaciones;
* `@Autowired`;
* constructores;
* beans;
* configuración Spring;
* controllers;
* services;
* repositories;
* DTOs;
* entities;
* tests;
* mocks;
* endpoints;
* frontend;
* rutas;
* componentes;
* hooks;
* servicios;
* migraciones;
* Docker;
* documentación;
* variables de entorno;
* feature flags.

Una feature eliminada debe desaparecer completamente de las rutas de ejecución del producto.

Después:

1. eliminar referencias;
2. actualizar tests;
3. revisar configuración;
4. compilar;
5. ejecutar tests;
6. revisar el diff.

---

# 8. Prohibido el ciclo "fix → push → fail → fix → push"

No hagas commits intermedios como:

```text
fix: missing import
fix: syntax error
fix: missing bean
fix: compilation error
fix: typo
```

cuando formen parte de la misma tarea.

El workflow correcto es:

```text
analizar
↓
implementar
↓
compilar
↓
testear
↓
corregir
↓
volver a compilar
↓
revisar seguridad
↓
revisar diff
↓
commit limpio
↓
push
```

Los commits deben representar cambios coherentes, no intentos fallidos.

---

# 9. Manejo de errores y logging

## Logging

Prohibido dejar:

```java
System.out.println(...)
System.err.println(...)
```

en código de producción.

En frontend:

```javascript
console.log(...)
```

de debug tampoco debe quedar en código de producción.

Utilizar el sistema de logging del proyecto.

Backend Java:

```java
log.debug(...)
log.info(...)
log.warn(...)
log.error(...)
```

Utiliza el nivel apropiado.

## Catch vacío

Prohibido:

```java
catch (Exception e) {
}
```

También está prohibido tragar silenciosamente una excepción:

```java
catch (Exception e) {
    return null;
}
```

sin una justificación explícita.

Si se captura una excepción, debe:

* manejarse;
* relanzarse;
* o registrarse adecuadamente.

Ejemplo:

```java
catch (SpecificException e) {
    log.error("Error procesando operación para {}", id, e);
    throw e;
}
```

## Excepciones genéricas

Evita:

```java
catch (Exception e)
```

salvo que sea realmente necesario, por ejemplo en un último nivel de frontera de la aplicación.

Captura la excepción más específica posible.

## Respuestas HTTP

Nunca devuelvas directamente:

```java
e.getMessage()
```

al cliente.

El cliente debe recibir un mensaje seguro y controlado.

El detalle técnico completo debe quedar en logs.

---

# 10. Serialización y APIs

Nunca construyas JSON manualmente:

```java
"{\"foo\": \"" + value + "\"}"
```

Utiliza:

* DTOs;
* `ObjectMapper`;
* serialización estándar de Spring;
* mecanismos equivalentes del framework.

Mantén los contratos de API existentes salvo que la tarea requiera modificarlos explícitamente.

Si modificas una API:

* revisa consumidores;
* frontend;
* tests;
* DTOs;
* documentación;
* compatibilidad hacia atrás cuando corresponda.

---

# 11. Base de datos y migraciones

Si una modificación requiere cambios de base de datos:

* utiliza el sistema de migraciones existente;
* no modifiques manualmente la BD como sustituto de una migración;
* revisa el orden de ejecución;
* revisa nombres/versiones;
* comprueba que la migración sea reproducible;
* comprueba que el código y el esquema esperado sean coherentes.

Nunca elimines una migración histórica ya aplicada simplemente para "arreglarla".

Si una migración ya forma parte del historial compartido, crea una nueva migración correctiva cuando corresponda.

Revisar también:

* entidades;
* repositories;
* DTOs;
* índices;
* constraints;
* relaciones;
* seeds/fixtures.

---

# 12. Dependencias

Antes de añadir una dependencia:

1. Comprueba si el proyecto ya tiene una dependencia equivalente.
2. Comprueba si la funcionalidad puede realizarse con las dependencias existentes.
3. Utiliza una versión compatible con el proyecto.
4. Evita dependencias abandonadas o innecesarias.
5. No añadas librerías únicamente para resolver unas pocas líneas de código.

Después de añadir una dependencia:

* revisa el `pom.xml` / `build.gradle` / `package.json`;
* revisa lockfiles;
* compila;
* ejecuta tests.

Nunca actualices masivamente dependencias sin que forme parte de la tarea.

---

# 13. Código temporal y archivos basura

El repositorio final debe contener únicamente artefactos necesarios para el producto.

Prohibido dejar:

```text
fix_algo.py
temp_*.*
debug_*.*
scratch.*
test_manual.*
experiment.*
```

ni:

* scripts de migración manual utilizados una sola vez;
* notebooks temporales;
* dumps;
* logs;
* archivos generados;
* archivos de debugging;
* backups;
* `.orig`;
* `.bak`;
* capturas utilizadas durante desarrollo;
* archivos temporales del IDE.

Si necesitas crear un script temporal para realizar una modificación masiva:

1. créalo;
2. úsalo;
3. verifica el resultado;
4. elimínalo antes del commit.

---

# 14. Archivos generados y cachés

Nunca deben commitearse artefactos generados salvo que el proyecto los requiera explícitamente.

Revisar especialmente:

```text
target/
dist/
build/
node_modules/
.next/
*.tsbuildinfo
coverage/
*.log
```

y equivalentes.

Si aparece un artefacto generado nuevo en `git status`:

* comprueba si debe estar ignorado;
* actualiza `.gitignore` si corresponde;
* no lo añadas accidentalmente al commit.

---

# 15. Calidad y tamaño de archivos

Si un archivo o componente supera aproximadamente **400–500 líneas**, evalúa si está acumulando demasiadas responsabilidades.

No es un límite absoluto.

Antes de seguir aumentando su tamaño, considera:

* extraer componentes;
* extraer hooks;
* extraer servicios;
* extraer utilidades;
* dividir responsabilidades;
* aplicar SRP cuando tenga sentido.

No hagas una refactorización masiva únicamente por alcanzar este número si no aporta valor.

---

# 16. TypeScript

Evitar:

```typescript
any
```

y:

```typescript
as any
```

salvo que exista una razón técnica clara.

Preferir:

```typescript
unknown
```

junto con validación.

Si una API externa no tiene tipos adecuados:

* define un tipo mínimo;
* valida la entrada;
* utiliza `unknown` cuando corresponda.

No utilices `any` simplemente para silenciar errores del compilador.

---

# 17. Integraciones de terceros

No copies boilerplate de otro proyecto directamente al repositorio.

Antes de integrar código externo:

* entiende qué hace;
* elimina código innecesario;
* adapta nombres;
* adapta arquitectura;
* elimina configuración que no aplica;
* revisa dependencias;
* revisa seguridad;
* revisa licencias cuando corresponda.

No introduzcas:

* código muerto;
* configuraciones de servicios no utilizados;
* starters innecesarios;
* endpoints de ejemplo;
* usuarios/passwords de ejemplo;
* comentarios pertenecientes a otro proyecto.

Las integraciones experimentales deben mantenerse aisladas hasta que estén listas.

---

# 18. Frontend y backend

Cuando una modificación afecta a frontend y backend, revisa ambos extremos.

Por ejemplo:

```text
Backend DTO
    ↓
Controller
    ↓
API response
    ↓
Frontend API client
    ↓
Types
    ↓
Component
```

No consideres terminada una tarea simplemente porque compila uno de los dos lados.

Comprueba:

* nombres;
* tipos;
* nullability;
* códigos HTTP;
* payloads;
* validaciones;
* errores;
* loading states;
* estados vacíos;
* compatibilidad.

---

# 19. No romper funcionalidad existente

Una modificación debe resolver la tarea sin introducir regresiones evitables.

Antes de terminar:

* revisa las rutas afectadas;
* revisa los consumidores de las clases modificadas;
* revisa interfaces;
* revisa tests;
* revisa configuración;
* revisa endpoints;
* revisa imports;
* revisa referencias.

Si una modificación cambia una firma:

```java
miServicio.metodo(a, b, c)
```

comprueba todos sus usos antes de finalizar.

No soluciones un error de compilación simplemente eliminando código que parece estar "molestando" si ese código forma parte de otra funcionalidad.

---

# 20. Revisión final del diff

Antes de hacer commit:

```bash
git status
git diff
```

y, si corresponde:

```bash
git diff --cached
```

Revisa manualmente:

* ¿He cambiado únicamente lo necesario?
* ¿Hay archivos que no pertenecen a la tarea?
* ¿Hay código muerto?
* ¿Hay imports sin utilizar?
* ¿Hay logs de debug?
* ¿Hay secretos?
* ¿Hay passwords?
* ¿Hay `.env`?
* ¿Hay archivos temporales?
* ¿Hay artefactos generados?
* ¿Hay cambios accidentales de formato masivos?
* ¿Hay código comentado que ya no sirve?
* ¿Hay TODOs nuevos innecesarios?
* ¿He modificado algo que no debía?
* ¿Los tests realmente prueban el cambio?

**No hagas commit de cambios accidentales.**

---

# 21. Checklist obligatorio antes de commit

El commit solo está permitido si TODO lo aplicable está OK.

### Código

* [ ] La funcionalidad solicitada está implementada.
* [ ] No hay código muerto.
* [ ] No hay referencias a features eliminadas.
* [ ] No hay imports/clases huérfanas.
* [ ] No hay errores conocidos.

### Backend

* [ ] `mvn clean package -DskipTests` o equivalente → OK.
* [ ] Tests relevantes → OK.
* [ ] Tests completos → OK cuando sea razonable.

### Frontend

* [ ] `npm run build` → OK.
* [ ] `npm run lint` → OK si existe.
* [ ] `npm run typecheck` → OK si existe.

### Docker

* [ ] Docker build → OK si aplica.
* [ ] No existen referencias a artefactos eliminados.

### Seguridad

* [ ] No hay secretos.
* [ ] No hay credenciales.
* [ ] No hay `.env` reales.
* [ ] No hay defaults peligrosos.
* [ ] No hay CORS/auth inseguros por defecto.
* [ ] No se han expuesto mensajes internos de excepciones.

### Limpieza

* [ ] No hay scripts temporales.
* [ ] No hay logs.
* [ ] No hay archivos debug.
* [ ] No hay notebooks temporales.
* [ ] No hay `target/`, `dist/`, `node_modules/`, etc.
* [ ] `.gitignore` está actualizado si es necesario.

### Git

* [ ] `git status` revisado.
* [ ] `git diff` revisado.
* [ ] No se incluyen cambios preexistentes del usuario.
* [ ] No hay cambios accidentales.
* [ ] El commit contiene únicamente el trabajo de esta tarea.
* [ ] El mensaje de commit es descriptivo.

---

# 22. Convención de commits

Utiliza Conventional Commits cuando sea apropiado:

```text
feat: add workout history
fix: prevent duplicate transactions
refactor: extract authentication service
test: add coverage for payment validation
docs: update API setup instructions
chore: update build configuration
```

El mensaje debe describir **el cambio realizado**, no el proceso seguido.

Evitar:

```text
changes
updates
fix
stuff
final
final2
test
working
```

---

# 23. Commit y push

Una vez superados TODOS los checks:

```bash
git add <archivos-correspondientes>
git diff --cached
git commit -m "tipo: descripción"
git push
```

Antes del commit, revisar nuevamente el contenido staged.

Nunca hagas:

```bash
git add .
```

a ciegas si existen cambios preexistentes o archivos que podrían no pertenecer a la tarea.

Es preferible hacer stage explícito de los archivos modificados o usar `git add -u` si solo hay modificaciones en archivos ya trackeados.

Después del push:

```bash
git status
```

Comprueba que el estado sea limpio o que únicamente queden cambios preexistentes que ya estaban antes de comenzar.

---

# 24. Si CI/CD falla después del push

Si GitHub Actions, Railway, Docker, u otro sistema CI/CD falla:

1. Lee el error completo.
2. Identifica la causa raíz.
3. Comprueba si el fallo procede de tus cambios.
4. Reproduce localmente cuando sea posible.
5. Corrige todas las causas relacionadas, no únicamente el primer error.
6. Ejecuta nuevamente los checks locales.
7. Revisa el diff.
8. Crea un nuevo commit coherente.
9. Haz push.

No hagas commits de reparación trivial si todavía existen otras causas conocidas pendientes.

---

# 25. Cuando la tarea no requiere cambios

Si la tarea es únicamente:

* explicar código;
* analizar un error;
* responder una pregunta;
* revisar una arquitectura;
* inspeccionar el repositorio sin modificarlo;

no hagas commit ni push.

El workflow Git se activa cuando realmente se han realizado cambios en el repositorio.

---

# 26. Definición de "terminado"

Una tarea solo está terminada cuando:

```text
Requisito entendido
        ↓
Implementación realizada
        ↓
Cambios revisados
        ↓
Tests ejecutados
        ↓
Build OK
        ↓
Seguridad revisada
        ↓
Repositorio limpio
        ↓
Diff revisado
        ↓
Commit
        ↓
Push
```

**"Compila en mi máquina" no es suficiente.**

El resultado final debe ser un cambio:

* funcional;
* compilable;
* testeado;
* seguro;
* limpio;
* coherente con la arquitectura existente;
* sin archivos temporales;
* sin secretos;
* y correctamente integrado en Git.
