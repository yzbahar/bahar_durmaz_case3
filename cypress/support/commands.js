const PET_BASE = '/v2/pet'

Cypress.Commands.add('getPetWhenReady', (petId, options = {}) => {
  const maxAttempts = options.maxAttempts ?? 30
  const delayMs = options.delayMs ?? 500

  const poll = (attempt) => {
    cy.request({
      method: 'GET',
      url: `${PET_BASE}/${petId}`,
      failOnStatusCode: false,
    }).then((res) => {
      if (res.status === 200) {
        cy.wrap(res, { log: attempt > 1 })
        return
      }
      if (attempt >= maxAttempts) {
        expect(res.status, `GET ${PET_BASE}/${petId} response (demo read-after-write lag)`).to.eq(200)
        return
      }
      cy.wait(delayMs)
      poll(attempt + 1)
    })
  }

  poll(1)
})

Cypress.Commands.add('findPetInFindByStatus', (petId, status = 'available', options = {}) => {
  const maxAttempts = options.maxAttempts ?? 40
  const delayMs = options.delayMs ?? 500

  const poll = (attempt) => {
    cy.request({
      method: 'GET',
      url: `${PET_BASE}/findByStatus`,
      qs: { status },
    }).then((res) => {
      expect(res.status).to.eq(200)
      const list = res.body
      const found =
        Array.isArray(list) && list.some((p) => p && Number(p.id) === Number(petId))
      if (found) {
        cy.wrap({ petId, list }, { log: attempt > 1 })
        return
      }
      if (attempt >= maxAttempts) {
        expect(
          found,
          `pet id=${petId} not found in findByStatus?status=${status} after ${maxAttempts} attempts`,
        ).to.be.true
        return
      }
      cy.wait(delayMs)
      poll(attempt + 1)
    })
  }

  poll(1)
})

Cypress.Commands.add('postPetFormWhenReady', (petId, formBody, options = {}) => {
  const maxAttempts = options.maxAttempts ?? 50
  const delayMs = options.delayMs ?? 500

  const poll = (attempt) => {
    cy.request({
      method: 'POST',
      url: `${PET_BASE}/${petId}`,
      form: true,
      body: formBody,
      failOnStatusCode: false,
    }).then((res) => {
      if (res.status === 200) {
        cy.wrap(res, { log: attempt > 1 })
        return
      }
      if (attempt >= maxAttempts) {
        expect(res.status, `POST (form) ${PET_BASE}/${petId}`).to.eq(200)
        return
      }
      cy.wait(delayMs)
      poll(attempt + 1)
    })
  }

  poll(1)
})

Cypress.Commands.add('deletePetWhenReady', (petId, headers = {}, options = {}) => {
  const maxAttempts = options.maxAttempts ?? 50
  const delayMs = options.delayMs ?? 500

  const poll = (attempt) => {
    cy.request({
      method: 'DELETE',
      url: `${PET_BASE}/${petId}`,
      headers,
      failOnStatusCode: false,
    }).then((res) => {
      if (res.status === 200) {
        cy.wrap(res, { log: attempt > 1 })
        return
      }
      if (attempt >= maxAttempts) {
        expect(res.status, `DELETE ${PET_BASE}/${petId}`).to.eq(200)
        return
      }
      cy.wait(delayMs)
      poll(attempt + 1)
    })
  }

  poll(1)
})
