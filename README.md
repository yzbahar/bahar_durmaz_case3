# Pet API Cypress Test Suite

This project contains API tests written with Cypress for Swagger Petstore `v2/pet` endpoints.

Test file:
- `cypress/e2e/pet/pet-api.cy.js`

Configuration:
- `cypress.config.js` (`baseUrl: https://petstore.swagger.io`)

## Scope

The test suite covers the following endpoint groups:
- `POST /pet`
- `GET /pet/{id}`
- `GET /pet/findByStatus`
- `GET /pet/findByTags`
- `PUT /pet`
- `POST /pet/{petId}` (form update)
- `PATCH /pet/{id}`
- `DELETE /pet/{id}`
- `POST /pet/{petId}/uploadImage`

## Test Scenarios

### 1) POST /pet

Positive:
- Create a pet with valid JSON (`200`, generated `id`)
- Create with minimum required fields (`name`, `photoUrls`)
- Create with different status values (`available`, `pending`, `sold`)

Negative / boundary:
- Malformed JSON (`400`)
- Invalid `Content-Type` (`415`)
- Edge-case behavior such as empty object, missing fields, type mismatch, and very long field values

### 2) GET /pet and list endpoints

Positive:
- Read the created pet with `GET /pet/{id}`
- List pets by status with `GET /pet/findByStatus` (`200 + array`)
- Call `GET /pet/findByStatus` with repeated query params

Negative / boundary:
- Non-existent id (`404`)
- Non-numeric id behavior
- Invalid status / multi-status format
- Boundary queries for `findByTags`

### 3) PUT /pet

Positive:
- Update an existing pet with full body payload
- Validate updated `name/status` fields in the response

Negative / boundary:
- Non-existent id behavior (demo backend may show upsert-like behavior)
- Empty body (`405`)
- Malformed JSON (`400`)

### 4) POST /pet/{petId} (form update)

Positive:
- Partial update with form-data (`name`, `status`)
- Validate fields afterward with `GET`

Negative:
- Request with invalid `Content-Type` (`415`)

### 5) PATCH /pet/{id}

- Validate `405 Method Not Allowed` because this endpoint is not supported

### 6) DELETE /pet/{id}

Positive:
- Successful delete, then verify `404` with a follow-up `GET`
- Scenarios with and without `api_key` header

Negative / boundary:
- Non-existent id (`404`)
- Non-numeric id (`404`)
- Behavior when deleting the same record twice

### 7) POST /pet/{petId}/uploadImage

Positive:
- Successful upload with multipart request

Negative / boundary:
- JSON body instead of multipart (`415`)
- Metadata-only request without file
- Behavior with invalid file type (`.txt`)

### 8) Flow (E2E / Cross) tests

- Create -> Read -> Update (form) -> Upload -> List -> Delete -> Read(404)
- Create -> Read -> PUT(JSON) -> Delete -> Read(404)
- Concurrent update scenario

## How to Run

## 1. Installation

```bash
npm install
```

## 2. Run all API tests in headless mode

```bash
npm test
```

or

```bash
npm run test:api
```

## 3. Run with Cypress UI

```bash
npm run cypress:open
```

## 4. Run all Cypress tests

```bash
npm run cypress:run
```