# Psicologic — API Specification

**Realidad operativa — octubre 2026.** 44 endpoints TypeScript en
`src/pages/api/`. Convenciones: ver 05-backend-architecture.md.

---

## 1. Índice de endpoints (existente)

### Agenda
| Endpoint | Métodos | Notas |
|---|---|---|
| `/api/agenda` | GET, POST | GET por rango de fechas del usuario logueado; token público opcional. POST: rate-limited |
| `/api/agenda/[id]` | GET/PUT/DELETE | Evento por id |
| `/api/agenda/myEvents` | GET | Eventos del usuario |
| `/api/agenda/signaling` | WS/POST | Señalización WebRTC |
| `/api/agenda/turn-credentials` | GET | Credenciales TURN efímeras (coturn) |

### Pagos
| Endpoint | Notas |
|---|---|
| `/api/bold/create-signature` | Firma para checkout Bold |
| `/api/bold/status` | Estado del pago |
| `/api/bold/validate` | Validación |
| `/api/bold/webhook` | Webhook — verificar firma SIEMPRE |
| `/api/payment/status/[userId]` | Estado de pago por usuario |

### Pacientes
| Endpoint | Notas |
|---|---|
| `/api/client/patients` (list, create, `[id]`, reactivate) | CRUD del profesional logueado; reactivate = soft-delete restore |
| `/api/patients` (patients, patient-create, save-entry, search-template-patients, template-default) | Historia clínica y plantillas |

### Dashboard / admin
| Endpoint | Notas |
|---|---|
| `/api/dashboard` (index, payment) | Stats y actividad (dashboard.js consume esto) |
| `/api/users` (approve, change-role, reject, suspend) | Admin only |
| `/api/get-user-role` | Rol del session |
| `/api/admin_notifications` vía dashboard | Notificaciones |

### Tickets / chat
| Endpoint | Notas |
|---|---|
| `/api/tickets` (create, `[ticketId]/{close, mark-read, messages, send}`) | Soporte con mensajes |

### Settings / misc
| Endpoint | Notas |
|---|---|
| `/api/settings` (api, agenda/api, games/{create,menu}, template/api) | Configuración |
| `/api/headers/api` | Header config (fetch "background") |
| `/api/feedback/feedback` | Feedback |
| `/api/games/api` | Estado de juegos |
| `/api/appointments/history` | Historial de citas |
| `/api/clinic_pdf/api` | PDFs clínicos (htmldocs/pdfkit) |
| `/api/webhooks/clerk` | Webhook Clerk (svix) + lógica de creación de usuario |

---

## 2. Contratos

- **Auth:** TODOS los endpoints privados usan `locals.auth()`; los públicos
  documentan explícitamente por qué (token de reunión, webhooks con firma).
- **Errores:** `{ error: string }` + status (400/401/404/429/500). Sin HTML.
- **Rate limit:** 429 con mensaje cuando corresponde (rate_limits por IP).
- **Listas:** siempre con límite explícito o rango acotado.

## 3. Reglas para cambios

1. Cambiar un contrato = coordinar TODOS los consumidores (islands React,
   vanilla JS de public/js, webhooks externos) en el mismo PR.
2. Endpoint nuevo entra al índice de arriba en el mismo commit.
3. Nunca relajar auth para "probar rápido" — se testea con usuario de prueba.
