# Express CRUD Demo

REST API for hospital **m-biodata** built with Express 5 + MySQL (mysql2/promise).

## Setup

```bash
yarn add express mysql2 dotenv cors
```

Configure the connection in `.env` (`DB_HOSPITAL_*`), then run:

```bash
make start        # or: node server.js
```

Base URL: `http://localhost:3000`

## Endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET    | `/health` | Server + database connectivity check |
| GET    | `/v1/hello-world` | Hello world |
| GET    | `/v1/hello-world/path/:message` | Hello world from path param |
| GET    | `/v1/hello-world/query` | Hello world from `?message=` |
| POST   | `/v1/hello-world/payload` | Echo `message` (5-20 chars) |
| GET    | `/v1/hello-world/error/:type` | Simulate a 503/500 error |
| POST   | `/v1/hospital/m-biodata` | Create biodata |
| GET    | `/v1/hospital/m-biodata` | List biodata (`?search=`, `?limit=`, `?offset=`) |
| GET    | `/v1/hospital/m-biodata/:id` | Get one biodata |
| PUT    | `/v1/hospital/m-biodata/:id` | Full update (requires `fullname`) |
| PATCH  | `/v1/hospital/m-biodata/:id` | Partial update (only supplied fields) |
| DELETE | `/v1/hospital/m-biodata/:id` | Soft delete (`is_delete = 1`) |

Soft-deleted rows (`is_delete = 1`) are excluded from all read endpoints.

### Request fields

| Field | Required | Notes |
| ----- | -------- | ----- |
| `fullname` | create / PUT | max 255 chars |
| `mobile_phone` | optional | max 15 chars |
| `image_path` | optional | path or URL of the photo |
| `created_by` | create | numeric admin id |
| `modified_by` | PUT / PATCH | numeric admin id |
| `deleted_by` | DELETE | numeric admin id (body or `?deleted_by=`) |

### Examples

```bash
# Create
curl -X POST http://localhost:3000/v1/hospital/m-biodata \
  -H 'Content-Type: application/json' \
  -d '{"fullname":"Budi Santoso","mobile_phone":"081234567890","created_by":1}'

# List
curl 'http://localhost:3000/v1/hospital/m-biodata?limit=10&search=Budi'

# Partial update
curl -X PATCH http://localhost:3000/v1/hospital/m-biodata/1 \
  -H 'Content-Type: application/json' \
  -d '{"mobile_phone":"089999999999","modified_by":1}'

# Soft delete
curl -X DELETE 'http://localhost:3000/v1/hospital/m-biodata/1?deleted_by=1'
```

## Response format

```json
{ "message": "Biodata created successfully", "data": { "id": 1, "fullname": "..." } }
```

Errors are produced centrally and return `{ "error": "...", "code": "..." }`:

| Status | `code` | Meaning |
| ------ | ------ | ------- |
| 400 | `BAD_REQUEST` / `INVALID_JSON` / `DATA_TOO_LONG` | Validation or malformed payload |
| 404 | `NOT_FOUND` | Route or record not found |
| 409 | `DUPLICATE_ENTRY` / `RECORD_IN_USE` | Database conflict |
| 413 | `PAYLOAD_TOO_LARGE` | Body exceeds limit |
| 503 | `DATABASE_UNAVAILABLE` | Database unreachable |
| 500 | — | Unexpected error (details hidden, logged server-side) |

Every response carries an `X-Request-Id` header (incoming value is reused if valid), and 5xx
errors are logged with that id.

## Error handling

Express has no `@RestControllerAdvice`; the equivalent is a 4-argument error-handling
middleware mounted last:

- `errors/AppError.js` / `errors/http.js` — typed errors (`BadRequestError`, `NotFoundError`, ...)
- `middleware/errorHandler.js` — the central handler; maps MySQL/body-parser errors and hides internals
- `middleware/notFound.js` — 404 for unmatched routes
- `middleware/requestId.js` — request correlation id

Controllers just `throw` (Express 5 forwards rejected async promises automatically); they do not
format error responses.

