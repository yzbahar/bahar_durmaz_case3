const PET_BASE = '/v2/pet'

Cypress.Commands.add('getPetWhenReady', (petId, options = {}) => {
  const maxAttempts = options.maxAttempts ?? 30
  const delayMs = options.delayMs ?? 500

  const poll = (attempt) => {
    return cy.request({
      method: 'GET',
      url: `${PET_BASE}/${petId}`,
      failOnStatusCode: false,
    }).then((res) => {
      if (res.status === 200) {
        return cy.wrap(res, { log: attempt > 1 })
      }
      if (attempt >= maxAttempts) {
        expect(res.status, `GET ${PET_BASE}/${petId} response (demo read-after-write lag)`).to.eq(200)
        return
      }
      return cy.wait(delayMs).then(() => poll(attempt + 1))
    })
  }

  return poll(1)
})

Cypress.Commands.add('findPetInFindByStatus', (petId, status = 'available', options = {}) => {
  const maxAttempts = options.maxAttempts ?? 40
  const delayMs = options.delayMs ?? 500

  const poll = (attempt) => {
    return cy.request({
      method: 'GET',
      url: `${PET_BASE}/findByStatus`,
      qs: { status },
    }).then((res) => {
      expect(res.status).to.eq(200)
      const list = res.body
      const found =
        Array.isArray(list) && list.some((p) => p && Number(p.id) === Number(petId))
      if (found) {
        return cy.wrap({ petId, list }, { log: attempt > 1 })
      }
      if (attempt >= maxAttempts) {
        expect(
          found,
          `pet id=${petId} not found in findByStatus?status=${status} after ${maxAttempts} attempts`,
        ).to.be.true
        return
      }
      return cy.wait(delayMs).then(() => poll(attempt + 1))
    })
  }

  return poll(1)
})

Cypress.Commands.add('postPetFormWhenReady', (petId, formBody, options = {}) => {
  const maxAttempts = options.maxAttempts ?? 50
  const delayMs = options.delayMs ?? 500

  const poll = (attempt) => {
    return cy.request({
      method: 'POST',
      url: `${PET_BASE}/${petId}`,
      form: true,
      body: formBody,
      failOnStatusCode: false,
    }).then((res) => {
      if (res.status === 200) {
        return cy.wrap(res, { log: attempt > 1 })
      }
      if (attempt >= maxAttempts) {
        expect(res.status, `POST (form) ${PET_BASE}/${petId}`).to.eq(200)
        return
      }
      return cy.wait(delayMs).then(() => poll(attempt + 1))
    })
  }

  return poll(1)
})

Cypress.Commands.add('deletePetWhenReady', (petId, headers = {}, options = {}) => {
  const maxAttempts = options.maxAttempts ?? 50
  const delayMs = options.delayMs ?? 500

  const poll = (attempt) => {
    return cy.request({
      method: 'DELETE',
      url: `${PET_BASE}/${petId}`,
      headers,
      failOnStatusCode: false,
    }).then((res) => {
      if (res.status === 200) {
        return cy.wrap(res, { log: attempt > 1 })
      }
      if (attempt >= maxAttempts) {
        expect(res.status, `DELETE ${PET_BASE}/${petId}`).to.eq(200)
        return
      }
      return cy.wait(delayMs).then(() => poll(attempt + 1))
    })
  }

  return poll(1)
})

Cypress.Commands.add('getPetMissingWhenReady', (petId, options = {}) => {
  const maxAttempts = options.maxAttempts ?? 30
  const delayMs = options.delayMs ?? 500

  const poll = (attempt) => {
    return cy.request({
      method: 'GET',
      url: `${PET_BASE}/${petId}`,
      failOnStatusCode: false,
    }).then((res) => {
      if (res.status === 404) {
        return cy.wrap(res, { log: attempt > 1 })
      }
      if (attempt >= maxAttempts) {
        expect(res.status, `GET ${PET_BASE}/${petId} should be 404 after delete`).to.eq(404)
        return
      }
      return cy.wait(delayMs).then(() => poll(attempt + 1))
    })
  }

  return poll(1)
})
