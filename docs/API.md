# API Contract

Agree this at kickoff, BEFORE writing code. It lets each member mock the
endpoints they depend on instead of waiting for them.

Base URL: `http://localhost:4000/api`

## Conventions

Success: the resource, or `{ "data": [...], "page": 1, "total": 120 }` for lists.

Error (shared envelope — owned by M1):
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Email already registered",
             "fields": { "email": "already in use" } } }
```

Auth: `Authorization: Bearer <jwt>`

Status codes: 200 ok · 201 created · 400 validation · 401 unauthenticated
· 403 wrong role · 404 not found · 409 conflict (e.g. insufficient stock) · 500 server

## Endpoints

| Owner | Method | Path | Auth | Notes |
|---|---|---|---|---|
| M1 | POST | /auth/register | — | REQ-4.1, REQ-4.2 |
| M1 | POST | /auth/login | — | REQ-4.4 |
| M1 | GET  | /me | customer | REQ-4.6 |
| M1 | GET  | /admin/cities | staff | REQ-7.3 |
| M2 | GET  | /products | — | q, category, brand, minPrice, maxPrice, page |
| M2 | GET  | /products/:id | — | includes variants + attributes, REQ-2.1 |
| M2 | GET  | /categories | — | tree, REQ-1.2 |
| M2 | POST | /admin/products | staff | REQ-10.1 |
| M3 | GET  | /cart | — | guest or customer |
| M3 | POST | /cart/items | — | merges duplicates, REQ-3.4 |
| M3 | GET  | /checkout/summary | customer | includes delivery estimate, REQ-5.3 |
| M3 | POST | /checkout/confirm | customer | calls sp_place_order, REQ-5.5 |
| M4 | GET  | /orders | customer | own orders only, REQ-9.1 |
| M4 | POST | /orders/:id/cancel | customer | only while Placed, REQ-9.4 |
| M4 | GET  | /admin/orders | staff | filters, REQ-11.1 |
| M4 | PATCH| /admin/orders/:id/status | staff | valid transitions only, REQ-11.2 |
| M5 | POST | /payments/card | customer | mock gateway, REQ-8.3 |
| M5 | PATCH| /admin/payments/:id | staff | mark COD paid, REQ-11.3 |
| M5 | GET  | /reports/quarterly-sales?year= | staff | REQ-12.1 |
| M5 | GET  | /reports/top-products?from=&to=&limit= | staff | REQ-12.2 |
| M5 | GET  | /reports/category-orders | staff | REQ-12.3 |
| M5 | GET  | /reports/upcoming-deliveries | staff | REQ-12.4 |
| M5 | GET  | /reports/customer-summary?customerId= | staff | REQ-12.5 |

Fill in request/response bodies below this table as you agree them.
