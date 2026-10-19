# Psicologic — Database Design

**Realidad operativa — octubre 2026.** TursoDB (motor LibSQL/SQLite) vía
`@libsql/client`. Todo lo documentado acá fue verificado contra el código.

---

## 1. Conexión y configuración

- Credenciales: `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` (ver `.env.example`,
  definidas en el dashboard de Vercel).
- El patrón CANÓNICO de acceso es `src/lib/turso/` (helpers por dominio:
  `agenda/`, `Settings/`, `userControl.ts`, `Header/`, `rate-limit`).
- En el código de rutas se accede con `import.meta.env.*`.

### Deuda conocida (no la empeores)

| Problema | Evidencia | Acción |
|---|---|---|
| Clientes libsql dispersos | `src/middleware.ts` y `src/pages/api/bold/webhook.ts` crean su propio `createClient` | Migrar a `src/lib/turso/` |
| Env divergentes | `src/lib/turso/turso.js` usa `TURSO_URL`/`TURSO_KEY` — NO figuran en `.env.example` | Dead code probable: verificar y eliminar, o alinear nombres |

---

## 2. Tablas reales (censo desde el código)

| Tabla | Uso | Dominio |
|---|---|---|
| `usuarios` | Roles por `clerk_user_id`, aprobación, suspensión | Auth/roles |
| `agenda` | Citas con token público de reunión, rango de fechas | Agenda |
| `patients` / `patientsClient` | Pacientes por profesional | Pacientes |
| `clinical_entries` | Entradas de historia clínica | Pacientes |
| `template_history` | Historial de plantillas clínicas | Settings |
| `user_games` | Acceso a juegos por usuario | Juegos |
| `games` | Configuración de juegos | Settings |
| `payments` | Estado de pagos (`paymentId`, `nextPaymentDate`, `blockedPaymentDate`) | Pagos |
| `tickets` / `messages` | Soporte y conversaciones | Tickets |
| `rate_limits` | Rate limiting por IP | Infra |
| `access_logs` | Logs de acceso | Auditoría |
| `admin_notifications` | Notificaciones admin | Dashboard |
| `settings_agend_time` | Horarios de agenda | Settings |
| `header` | Config de header | Settings |

### Deuda de naming

Convenciones mixtas heredadas: `patientsClient` (camelCase), `Tickets`,
`Messages` (PascalCase), `usuarios` (snake_case). **Regla: tablas nuevas en
snake_case, minúsculas.** No renombrar tablas existentes sin una migración
explícita y backup.

---

## 3. Convenciones obligatorias

1. **SQL SIEMPRE parametrizado** — `client.execute({ sql, args })`. Nunca
   concatenar strings. (El código existente lo cumple — mantenerlo.)
2. **Timestamps en ISO 8601 UTC** (`new Date().toISOString()`).
3. **Soft-delete** donde exista el patrón (ej. `reactivate` de patients) —
   nunca DELETE físico de pacientes: son datos clínicos.
4. **Todo id foráneo de usuario = `clerk_user_id`** (o `userId` según tabla).
5. **Filtrar SIEMPRE por el usuario logueado** — las queries de agenda/pacientes
   reciben `userId` desde la ruta, jamás del cliente.

---

## 4. Gestión de esquema

- **Hoy:** no hay directorio de migraciones — los cambios de esquema se
  aplican manualmente contra Turso (plataforma compartida con producción).
- **Regla actual:** todo cambio de esquema se documenta en este archivo
  (sección 2) y se prueba primero contra una DB de desarrollo de Turso.
- **Mejora pendiente (recomendada):** adoptar `turso db shell` + archivos SQL
  versionados en `src/lib/turso/migrations/` aplicados en orden.

---

## 5. Datos sensibles

`clinical_entries`, `patients`, `agenda` contienen información clínica.
- Nunca loguear contenido de estas tablas.
- Nunca exponerlas en respuestas API de otros usuarios.
- Acceso mínimo necesario (Ley 1581 de 2012, Colombia).
