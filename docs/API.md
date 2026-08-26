# BrightBuy — API Contract

**Agreed at kickoff. These shapes are binding.**

The point of this file is that you can build against an endpoint before it exists. M3 can build
the cart page against a hardcoded product response while M2 is still writing the query. If you
need a field that isn't here, raise it in the group chat before adding it — a field one person
invents locally is a field nobody else sends.

Base URL: `http://localhost:4000/api` (the Vite dev server proxies `/api` there, so from React
just call `/api/...`).

Column names come from `SCHEMA.md`. **JSON uses camelCase; the database uses snake_case.** Your
repo layer does the translation — `SELECT product_name AS productName` or map it in the service.

---

## Conventions

**Success — single resource:** the object itself.
```json
{ "productId": 12, "productName": "Aurora 14 Laptop" }
```

**Success — list:** wrapped, with pagination.
```json
{ "data": [ ... ], "page": 1, "pageSize": 20, "total": 137 }
```

**Error — always this envelope** (produced by `middleware/errorHandler.js`, M1):
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email already registered",
    "fields": { "email": "already in use" }
  }
}
```
`fields` is optional and present only for form validation.

**Auth:** `Authorization: Bearer <jwt>`. The client attaches this automatically via
`api/client.js`.

**Status codes**

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Validation failed |
| 401 | Not authenticated |
| 403 | Authenticated but wrong role |
| 404 | Not found |
| 409 | Conflict — insufficient stock, duplicate SKU, invalid status transition |
| 500 | Server error |

**Error codes in use:** `VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`,
`DUPLICATE`, `INSUFFICIENT_STOCK`, `INVALID_TRANSITION`, `DB_RULE_VIOLATION`, `INTERNAL_ERROR`.

**Money** is a string in JSON — `"1299.00"`, not `1299`. Avoids float rounding on the way
through. Parse it in the UI for display only.

**Dates** are ISO 8601. Timestamps `"2026-09-14T10:23:00Z"`, plain dates `"2026-09-19"`.

---

# The three cross-slice shapes

These three are the ones multiple people consume. Everything else is local to one slice.

## 1. Variant

Owned by M2. Consumed by M3 (cart, checkout) and M4 (order items).

```json
{
  "variantId": 341,
  "productId": 12,
  "productName": "Aurora 14 Laptop",
  "sku": "AUR14-16-512-SLV",
  "price": "1299.00",
  "stockQuantity": 7,
  "inStock": true,
  "isActive": true,
  "attributes": [
    { "name": "Colour",  "value": "Silver" },
    { "name": "Memory",  "value": "16GB" },
    { "name": "Storage", "value": "512GB" }
  ]
}
```

- `inStock` is `stockQuantity > 0`, computed server-side so the UI never re-derives it.
- `productName` is denormalised into the variant so cart lines don't need a second request.
- `attributes` is always an array, empty for a product with no explicit variants.

## 2. Cart

Owned by M3. Consumed by M4 (checkout hands the cart to `sp_place_order`).

```json
{
  "cartId": 88,
  "customerId": 5,
  "sessionToken": null,
  "cartStatus": "active",
  "items": [
    {
      "itemId": 201,
      "quantity": 2,
      "lineTotal": "2598.00",
      "variant": { "variantId": 341, "...": "full Variant shape above" }
    }
  ],
  "itemCount": 2,
  "subtotal": "2598.00",
  "hasOutOfStockItems": false
}
```

- Exactly one of `customerId` / `sessionToken` is non-null (guest vs member cart).
- `lineTotal` = `quantity × variant.price`, computed server-side.
- `itemCount` is the sum of quantities, not the number of lines — it drives the navbar badge.
- `hasOutOfStockItems` powers the REQ-3.7 warning and feeds the delivery estimate.
- Each item embeds the **full** Variant object. Slightly verbose, but the cart page needs price,
  stock, and attributes, and this avoids a second round trip.

## 3. Order

Owned by M4. Consumed by M3 (confirmation page) and M5 (payments, reports).

```json
{
  "orderId": 1042,
  "customerId": 5,
  "orderDate": "2026-09-14T10:23:00Z",
  "orderStatus": "Placed",
  "totalAmount": "2598.00",
  "items": [
    {
      "orderItemId": 3301,
      "variantId": 341,
      "sku": "AUR14-16-512-SLV",
      "productName": "Aurora 14 Laptop",
      "quantity": 2,
      "unitPriceAtOrder": "1299.00",
      "lineTotal": "2598.00",
      "outOfStockFlag": false
    }
  ],
  "delivery": {
    "deliveryMode": "standard",
    "addressSnapshot": "42 Oak Street, Apt 3B, Houston",
    "cityName": "Houston",
    "isMainCity": true,
    "estimatedDeliveryDate": "2026-09-19",
    "deliveryStatus": "pending"
  },
  "payment": {
    "paymentMethod": "card",
    "paymentStatus": "Pending",
    "gatewayRef": null,
    "canRetry": false
  }
}
```

- `unitPriceAtOrder` — **never** read `variant.price` for a historical order (REQ-5.7).
- `addressSnapshot` — likewise never join to `address` (see DECISIONS #12).
- For `deliveryMode: "store_pickup"`, `addressSnapshot` is `null` but `cityName` is still set.
- `canRetry` is M5's: true when payment is `Failed` and within the 24h window (REQ-8.5).
- `orderStatus` and `paymentStatus` use the **exact** ENUM strings from `SCHEMA.md`.

---

# Endpoints

## Auth & profile — M1

| Method | Path | Auth | REQ |
|---|---|---|---|
| POST | `/auth/register` | — | 4.1, 4.2 |
| POST | `/auth/login` | — | 4.4 |
| GET | `/me` | customer | 4.6 |
| PUT | `/me` | customer | 4.6 |
| GET | `/me/addresses` | customer | 4.6 |
| POST | `/me/addresses` | customer | 4.6 |
| GET | `/cities` | — | 7.3 |
| GET/POST/PATCH | `/admin/cities` | staff | 7.3 |

**POST /auth/register**
```json
// request
{ "firstName": "Ann", "lastName": "Perera", "email": "ann@example.com",
  "password": "...", "phone": "0771234567",
  "address": { "houseNum": "42", "address1": "Oak Street", "cityId": 3 } }

// 201
{ "user": { "userId": 5, "firstName": "Ann", "userType": "customer" },
  "token": "eyJhbGci..." }
```

**POST /auth/login** — request `{ "email", "password" }`, response same shape as register.
On failure: 401 with a deliberately vague message. Never reveal which credential was wrong
(SRS §4.4.2).

## Catalogue — M2

| Method | Path | Auth | REQ |
|---|---|---|---|
| GET | `/products` | — | 1.1, 1.3, 1.4 |
| GET | `/products/:id` | — | 2.1, 2.2 |
| GET | `/categories` | — | 1.2, 10.2 |
| POST/PUT/DELETE | `/admin/products` | staff | 10.1 |
| POST/PUT/DELETE | `/admin/categories` | staff | 10.1, 10.2 |
| POST/PUT | `/admin/variants` | staff | 10.1, 10.3 |

**GET /products** — query params `q`, `categoryId`, `brand`, `minPrice`, `maxPrice`, `page`,
`pageSize`.
```json
{ "data": [
    { "productId": 12, "productName": "Aurora 14 Laptop", "brand": "Aurora",
      "imageUrl": "...", "priceFrom": "1299.00", "priceTo": "1899.00",
      "categories": [ { "categoryId": 3, "categoryName": "Laptops" } ] }
  ], "page": 1, "pageSize": 20, "total": 137 }
```
`priceFrom`/`priceTo` is the range across variants (REQ-1.4). Equal when there's one variant.

**GET /products/:id** — the product plus `"variants": [ Variant, ... ]`.

**GET /categories** — a tree; each node carries `"children": []`.

## Cart & checkout — M3

| Method | Path | Auth | REQ |
|---|---|---|---|
| GET | `/cart` | optional | 3.1, 3.2 |
| POST | `/cart/items` | optional | 3.1, 3.4 |
| PATCH | `/cart/items/:itemId` | optional | 3.3 |
| DELETE | `/cart/items/:itemId` | optional | 3.3 |
| GET | `/checkout/summary` | customer | 5.3, 7.x |
| POST | `/checkout/confirm` | customer | 5.5, 6.1 |

Guest requests carry `X-Cart-Session: <token>`; the client generates one on first add.

**POST /cart/items** — `{ "variantId": 341, "quantity": 2 }` → the full Cart shape.
Adding a variant already in the cart **sums** quantities (REQ-3.4).

**GET /checkout/summary** — params `deliveryMode`, `addressId` (omit for pickup).
```json
{ "cart": { "...": "Cart shape" },
  "deliveryMode": "standard",
  "cityName": "Houston", "isMainCity": true,
  "estimatedDeliveryDays": 5,
  "estimatedDeliveryDate": "2026-09-19",
  "hasOutOfStockItems": false,
  "total": "2598.00" }
```

**POST /checkout/confirm** — `{ "deliveryMode", "addressId", "paymentMethod" }` → 201 with the
Order shape. On insufficient stock, 409:
```json
{ "error": { "code": "INSUFFICIENT_STOCK",
             "message": "Some items are no longer available",
             "fields": { "341": "only 1 left, you requested 2" } } }
```

## Orders — M4

| Method | Path | Auth | REQ |
|---|---|---|---|
| GET | `/orders` | customer | 9.1, 9.2 |
| GET | `/orders/:id` | customer | 9.3 |
| POST | `/orders/:id/cancel` | customer | 9.4 |
| GET | `/admin/orders` | staff | 11.1 |
| PATCH | `/admin/orders/:id/status` | staff | 11.2 |
| POST | `/admin/stock-adjustments` | staff | 10.4 |

**GET /orders** — reverse chronological, own orders only. List of Order shapes.

**GET /admin/orders** — filters `status`, `paymentStatus`, `deliveryMode`, `from`, `to`.

**PATCH /admin/orders/:id/status** — `{ "orderStatus": "Processing" }`. Invalid transition → 409
`INVALID_TRANSITION`. Valid transitions are listed in `SCHEMA.md`.

## Payments & reports — M5

| Method | Path | Auth | REQ |
|---|---|---|---|
| POST | `/payments/card` | customer | 8.3, 8.4 |
| POST | `/payments/:id/retry` | customer | 8.5 |
| PATCH | `/admin/payments/:id` | staff | 11.3 |
| GET | `/reports/quarterly-sales?year=` | staff | 12.1 |
| GET | `/reports/top-products?from=&to=&limit=` | staff | 12.2 |
| GET | `/reports/category-orders` | staff | 12.3 |
| GET | `/reports/upcoming-deliveries` | staff | 12.4 |
| GET | `/reports/customer-summary?customerId=` | staff | 12.5 |

**POST /payments/card** — `{ "orderId": 1042, "mockOutcome": "success" }`. The mock adapter
accepts `"success"` or `"failure"` so both paths are demonstrable. A real gateway would replace
this without changing the response shape.

**PATCH /admin/payments/:id** — `{ "paymentStatus": "Paid" }`. Records `staff_id` and timestamp
from the JWT (REQ-11.3).

**Reports** all return `{ "data": [ ... ], "generatedAt": "..." }`. Row shapes:

```json
// quarterly-sales
{ "quarter": "Q1", "orderCount": 42, "totalRevenue": "54320.00" }

// top-products
{ "productId": 12, "productName": "Aurora 14 Laptop",
  "quantitySold": 88, "revenue": "114312.00" }

// category-orders
{ "categoryId": 3, "categoryName": "Laptops", "orderCount": 61 }

// upcoming-deliveries
{ "orderId": 1042, "cityName": "Houston", "hasOutOfStockItems": false,
  "estimatedDeliveryDate": "2026-09-19", "orderStatus": "Processing" }

// customer-summary
{ "customerId": 5, "customerName": "Ann Perera", "orderCount": 7,
  "totalSpent": "9184.00", "pendingPayments": 1 }
```

---

## Open items for the kickoff

- Pagination default: proposed `pageSize: 20`, max 100. Confirm.
- Does the staff order list need customer contact details inline, or is a drill-in enough?
- Report CSV export — not in the SRS. Out of scope unless someone wants it.
