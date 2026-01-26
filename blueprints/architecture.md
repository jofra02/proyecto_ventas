# Arquitectura modular (plug-in) — Ventas, Stock, Rotación, Comprobantes, Pagos y Deuda

**Fecha:** 2026-01-25  
**Stack:** FastAPI (backend) + React + TypeScript (frontend)  
**DB:** PostgreSQL (recomendado)  
**Objetivo:** arquitectura modular (plug-in) para ventas, stock, rotación, comprobantes internos, ticket, pagos y deudas, con opción de incorporar **picking/barcode scanning**.

---

## 1) Objetivo y Alcance

### Objetivo
Construir un sistema profesional que cubra:
- Catálogo de productos
- Depósitos (1 por default, preparado para múltiples)
- Control de stock + rotación de mercadería:
  - **FEFO** si el producto tiene vencimiento
  - **FIFO** si no tiene vencimiento
- Ventas (carrito / venta rápida)
- Emisión de **comprobante interno no fiscal**
- **Ticket imprimible** para cliente (derivado del comprobante interno)
- Pagos + aplicación a comprobantes
- Clientes + cuenta corriente (deuda/saldo)

### Fuera de alcance inicial (pero preparado)
- Facturación fiscal (AFIP u otro)
- Integraciones con pasarelas (MercadoPago/Stripe), bancos, etc.
- Multi-tenant real
- ERP/MRP/producción

---

## 2) Principios y Consignas de Diseño

1. **Modularidad real:** cada feature en su módulo; habilitable/deshabilitable por config.
2. **Dominio primero:** reglas críticas (stock/rotación/deuda) en `domain` + `application`, no en controllers.
3. **Acoplamiento mínimo:**
   - No imports cruzados en `domain` entre módulos.
   - Integración por **eventos** o **interfaces (ports)**.
4. **Auditabilidad:** stock y cuenta corriente son trazables (ledger + auditoría).
5. **Consistencia fuerte:**
   - Stock transaccional sin carreras.
   - Pagos/imports con **Idempotency-Key**.
6. **Evolutivo:**
   - 1 depósito default, pero todo stock siempre con `warehouse_id`.
   - FEFO/FIFO desde el día 1.
7. **Observabilidad:** logs estructurados + `trace_id` por request + métricas básicas.

---

## 3) Arquitectura Global

### Backend
- FastAPI + PostgreSQL
- ORM (SQLAlchemy) + migrations (Alembic)
- Worker opcional (recomendado) para outbox/eventos/jobs
- Storage de archivos (local o S3 compatible) para PDFs/tickets/adjuntos

### Frontend
- React + TypeScript
- Router + TanStack Query
- UI modular por feature (módulos auto-registrables)
- Flujos “venta rápida” + impresión ticket
- Soporte para “barcode scanning” (teclado wedge o cámara)

---

## 4) Módulos (Core + Negocio)

### 4.1 `core` (transversal)
- config/env + feature flags + módulo registry
- auth JWT + RBAC (roles/permisos)
- DB session + Unit of Work
- error model uniforme
- paginación
- auditoría
- idempotencia (pagos/importaciones)
- event bus + outbox (si se implementa)

### 4.2 `catalog`
- productos, categorías, precios
- flags:
  - `track_expiry: bool` (si maneja vencimiento)
  - `is_batch_tracked: bool` (recomendado si `track_expiry=true`)
- regla:
  - si `track_expiry=true`, inventory opera con lotes y vencimientos

### 4.3 `inventory`
- warehouses (1 default)
- lotes/capas de stock
- movimientos de stock (ledger)
- stock_position (on_hand/reserved)
- reserve/release/commit
- picking FEFO/FIFO

### 4.4 `sales`
- venta/pedido (carrito)
- confirmación (reserva stock)
- estados: `DRAFT -> CONFIRMED -> INVOICED -> CLOSED/CANCELED`

### 4.5 `invoicing`
- comprobante interno no fiscal (documento)
- ticket imprimible como **render** del documento (no duplica contabilidad)
- templates versionadas (PDF ahora; ESC/POS futuro)
- estados: `DRAFT -> ISSUED -> VOID`

### 4.6 `payments`
- cobros (manual inicial)
- idempotencia (obligatoria)
- aplicación a documentos (allocations)

### 4.7 `customers`
- clientes, contactos, direcciones
- vistas de saldo/estado de cuenta

### 4.8 `accounts_receivable`
- cuenta corriente por cliente vía ledger
- saldo auditable y reconstruible
- consume eventos de documento emitido / pago aplicado

### 4.9 `files` (opcional temprano)
- adjuntos (comprobantes escaneados, etc.)

### 4.10 `picking` (opcional: barcode scanning + preparación)
**Objetivo:** integrar lectura de códigos de barras (scanner tipo “keyboard wedge”, móvil o pistola dedicada) para:
- alta/lookup de productos por barcode
- recepción de mercadería con lote/vencimiento
- preparación de pedidos (picking) y verificación de despacho

---

## 5) Reglas de Negocio Críticas

### 5.1 Depósitos
- el sistema arranca con 1 `warehouse` default
- todo stock/movimiento siempre con `warehouse_id`

### 5.2 Rotación FEFO/FIFO (salida de stock)
- si `product.track_expiry=true` ⇒ **FEFO**:
  - ordenar lotes por `expiry_date` asc (nulos al final), luego `received_at` asc
  - consumir cantidades por lotes hasta cubrir `qty`
- si `product.track_expiry=false` ⇒ **FIFO**:
  - ordenar por `received_at` asc (capas/lotes sin vencimiento)

### 5.3 Stock ledger
- toda modificación genera `stock_movement`
- tipos recomendados:
  - `IN, OUT, ADJUST, RESERVE, RELEASE, COMMIT, TRANSFER_OUT, TRANSFER_IN`
- `stock_position` puede materializarse para performance (derivable del ledger)

### 5.4 Venta → Documento → Stock
- confirmar venta ⇒ `inventory.reserve()` (aplica FEFO/FIFO)
- emitir documento ⇒ `inventory.commit_reservation()` (OUT real)
- cancelación:
  - si reservado ⇒ `release`
  - si commit ⇒ anulación y política de reversa/ajuste

### 5.5 Deuda (cuenta corriente)
- ledger por cliente:
  - documento emitido ⇒ `debit`
  - pago aplicado ⇒ `credit`
- saldo = sumatoria ledger (auditable)

### 5.6 Ticket (impresión)
- ticket = representación del documento interno
- se genera bajo demanda (PDF/plantilla)
- plantillas versionadas (para cambios sin migrar datos)

---

## 6) Contratos entre módulos (eventos / ports)

### Eventos mínimos
- `StockReserved(sale_id, warehouse_id, items[{product_id, lot_id, qty}])`
- `StockReleased(sale_id, ...)`
- `StockCommitted(document_id, ...)`
- `DocumentIssued(document_id, customer_id?, total, sale_id?)`
- `DocumentVoided(document_id, ...)`
- `PaymentCreated(payment_id, amount, ...)`
- `PaymentApplied(payment_id, document_id, amount)`
- `CustomerBalanceChanged(customer_id, new_balance)` (opcional)

### Política
- módulos consumen eventos por bus interno/outbox
- queries de lectura por endpoints/read-models, no por imports de dominio

---

## 7) Picking / Barcode Scanning (integración propuesta)

### 7.1 Casos de uso
1) **Lookup de producto en venta rápida**
- escanear `barcode` ⇒ obtener `product_id` ⇒ agregar línea en el carrito

2) **Recepción de mercadería (IN)**
- escanear `barcode` ⇒ elegir/confirmar producto
- si `track_expiry=true`: capturar `lot_code` + `expiry_date`
- registrar `inventory.receive_stock(...)`

3) **Picking de ventas confirmadas**
- generar “lista de picking” para `sale_id` (o para múltiples ventas)
- operador escanea ítems y confirma cantidades/lotes
- si el producto tiene vencimiento, el sistema debe sugerir/validar lotes FEFO

4) **Verificación pre-despacho**
- escanear y validar que lo preparado coincide con lo reservado/commit

### 7.2 Modelo de datos (conceptual)

Agregar en `catalog`:
- `product_barcode(id, product_id, barcode_value, type, active)`
  - permitir múltiples barcodes por producto (EAN-13, Code128, etc.)

Agregar en `picking`:
- `pick_task(id, sale_id?, warehouse_id, status, created_at, assigned_to?)`
- `pick_task_item(id, pick_task_id, product_id, qty_required, qty_picked)`
- `pick_scan_event(id, pick_task_id, ts, barcode_value, product_id?, lot_id?, qty, actor_id, device_id?)`

Vinculación con `inventory`:
- para productos con vencimiento, el scan puede mapear a:
  - `product_id` + selección de `lot_id` (si el barcode **no** codifica lote)
  - o directamente `lot_id` (si se decide soportar códigos con lote/expiry; opcional)

### 7.3 Estrategia de integración (sin romper modularidad)
- `picking` **no descuenta stock** por sí mismo.
- `picking` interactúa con `inventory` mediante:
  - `inventory.reserve()` / `inventory.commit_reservation()` ya existentes
  - o comandos explícitos: `inventory.allocate_from_scan(...)` (solo si hace falta)
- `picking` produce eventos:
  - `PickTaskStarted`, `PickTaskCompleted`, `PickMismatchDetected` (opcional)

### 7.4 UI/UX (frontend)
- modo “scanner input”:
  - soporte “keyboard wedge” (el scanner escribe el código como teclado + Enter)
  - campo hidden/focused permanente para capturar scans
- pantallas:
  - “Venta rápida (scan)”
  - “Recepción (scan + lote/vencimiento)”
  - “Picking de pedidos” (lista + escaneo + progreso)
- validaciones:
  - si scan no existe ⇒ opción rápida “asociar barcode a producto”
  - si producto con vencimiento ⇒ exigir lote/vencimiento (manual si no viene en el código)

---

## 8) Estructura de Repositorios

### Backend (FastAPI)

```text
/backend
  /app
    main.py
    module_registry.py
  /core
  /shared
  /modules
    /catalog
    /inventory
    /sales
    /invoicing
    /payments
    /customers
    /accounts_receivable
    /files
    /picking
  /migrations
  /tests
```

Convención por módulo:

```text
/modules/<module>
  manifest.py
  /api/v1        (router, schemas, deps)
  /domain        (entities, value_objects, events, repo interfaces)
  /application   (commands, queries, services)
  /infrastructure (orm, repos, adapters)
  /tests
```

### Frontend (React)

```text
/frontend
  /src
    /app       (router, module_registry, layout)
    /shared    (ui, lib, hooks, types)
    /api       (client, contracts opcional)
    /modules   (catalog, inventory, sales, invoicing, payments, customers, accounts_receivable, picking)
```

---

## 9) API Guidelines (consignas)
- versionado: `/api/v1`
- errores: `{code, message, details?, trace_id}`
- paginación consistente (cursor recomendado)
- acciones explícitas:
  - `POST /sales/{id}/confirm`
  - `POST /documents/{id}/issue`
  - `POST /documents/{id}/void`
  - `POST /payments/{id}/apply`
- idempotencia:
  - `Idempotency-Key` en pagos e imports
- picking (propuesto):
  - `POST /picking/tasks` (crear)
  - `POST /picking/tasks/{id}/scan` (registrar scan)
  - `POST /picking/tasks/{id}/complete` (cerrar)

---

## 10) Roadmap por etapas

### Etapa 0 — Foundation
- core: config, DB, auth/RBAC, error model, module registry
- catalog básico + customers básico
- barcodes base (`product_barcode`) si se va a usar scanning temprano

### Etapa 1 — Inventory base + rotación
- warehouses (1 default)
- stock ledger + stock_position
- receive/adjust
- picking FEFO/FIFO
- reserve/release

### Etapa 2 — Sales + Invoicing + Ticket
- venta DRAFT/CONFIRMED
- reserva en confirm
- documento interno + emisión
- commit de stock en emisión
- render ticket PDF (plantillas versionadas)

### Etapa 3 — Payments + Accounts Receivable
- pagos con idempotencia
- apply a documentos
- ledger de cuenta corriente + saldo
- reportes básicos

### Etapa 3.5 — Picking (si aplica temprano)
- pick_task + scan flow
- verificación de preparado vs reservado
- recepción por scan + lote/vencimiento

### Etapa 4 — Hardening
- auditoría completa
- anulaciones y reversas consistentes
- tests integración de flujos críticos
- observabilidad

---

## 11) Criterios de Done (calidad mínima)
- Flujos end-to-end:
  - ingreso de mercadería
  - venta + emisión + ticket
  - pago + aplicación + saldo
- Stock sin negativos por carrera (o error explícito)
- Rotación FEFO/FIFO verificada por tests
- Pagos idempotentes (reintentos no duplican)
- Auditoría: issue/void/adjust/apply
- Picking (si habilitado):
  - scans registrables y trazables
  - validación contra reservado/commit
  - soporte de productos con vencimiento (lote/vencimiento obligatorio)

---

## 12) Instrucciones para Agentes (cómo deben acompañar el desarrollo)
- Mantener invariantes:
  - `warehouse_id` siempre
  - FEFO si vencimiento, FIFO si no
  - stock por ledger (movimientos)
  - deuda por ledger (cuenta corriente)
- Evitar acoplamientos: integración por eventos/ports
- Proponer decisiones cuando falten datos y documentarlas
- Priorizar contratos/estados/reglas antes de endpoints/UI
- Sugerir tests por caso crítico antes de extender features
- Mantener el ticket como render del documento interno (sin duplicar contabilidad)
