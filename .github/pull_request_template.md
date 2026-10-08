## Checklist de Revisión Rigurosa

- [ ] `git log origin/main..HEAD` contiene únicamente commits relacionados con esta PR.
- [ ] La rama parte de un `main` actualizado y sin conflictos.
- [ ] El CI en GitHub Actions está completamente en VERDE (incluyendo todos los tests de integración).
- [ ] Todo nuevo endpoint extrae el usuario directamente del JWT (`@AuthenticationPrincipal`), nunca del cuerpo o URL.
- [ ] Todo nuevo DTO está correctamente validado y no expone entidades directamente.
- [ ] Si se han creado tablas con FK a `users`, se ha decidido explícitamente el `ON DELETE` y se ha actualizado `AccountDeletionService` para evitar registros huérfanos.
- [ ] Los tests del `AccountDeletionService` o del borrado de cuenta pasan sin excepciones.
- [ ] `git diff --stat` coincide exactamente con el alcance pedido (sin archivos temporales, scripts de agentes ni cambios furtivos de formato).
- [ ] El código fuente no contiene mojibake (`Ã©`, `Ã³`, etc).
- [ ] El Frontend no contiene nuevos `any` o `@ts-ignore` furtivos.
