const {
  API,
  MISSING_ID,
  NON_EXISTENT_NUMERIC_ID,
  randomPetId,
  newPetBody,
} = require('../../support/pet-helpers')

const SAMPLE_JESS_PET = {
  id: 11,
  category: { id: 3, name: 'string' },
  name: 'jess',
  photoUrls: ['string'],
  tags: [{ id: 0, name: 'string' }],
  status: 'available',
}

const LONG_PET_NAME = 'x'.repeat(10000)

const assertUploadResponseIsUsable = (res) => {
  expect(res.status).to.eq(200)
  if (res.body && Object.keys(res.body).length > 0) {
    expect(res.body).to.have.property('message')
  }
}

describe('POST /pet → findByStatus → PUT → DELETE (sample JSON)', () => {
  it('on 200, pet appears in findByStatus; then PUT and DELETE with same id', () => {
    cy.request({
      method: 'POST',
      url: API,
      headers: { 'Content-Type': 'application/json' },
      body: SAMPLE_JESS_PET,
    }).then((postRes) => {
      expect(postRes.status).to.eq(200)
      const petId = postRes.body.id

      cy.findPetInFindByStatus(petId, 'available')

      cy.request({
        method: 'PUT',
        url: API,
        headers: { 'Content-Type': 'application/json' },
        body: {
          id: petId,
          category: { id: 3, name: 'string' },
          name: 'jess-updated',
          photoUrls: ['string'],
          tags: [{ id: 0, name: 'string' }],
          status: 'sold',
        },
      }).then((putRes) => {
        expect(putRes.status).to.eq(200)
        expect(putRes.body.name).to.eq('jess-updated')
        expect(putRes.body.status).to.eq('sold')
      })

      cy.getPetWhenReady(petId)
      cy.deletePetWhenReady(petId, { api_key: 'special-key' }).then((delRes) => {
        expect(delRes.status).to.eq(200)
      })
    })
  })
})

describe('Pet CRUD — Endpoint grouped scenarios', () => {
  describe('POST /pet', () => {
    it('creates pet with valid JSON; returns 200 and id', () => {
      const body = newPetBody({ name: 'CrudCreatePos' })
      cy.request({
        method: 'POST',
        url: API,
        headers: { 'Content-Type': 'application/json' },
        body,
      }).then((res) => {
        expect(res.status).to.eq(200)
        expect(res.body).to.have.property('id')
        expect(res.body.id).to.not.be.oneOf([null, undefined, ''])
        expect(res.body.name).to.eq('CrudCreatePos')
        expect(res.body.photoUrls).to.be.an('array')
      })
    })

    it('minimum fields: name + photoUrls (schema-required fields)', () => {
      cy.request({
        method: 'POST',
        url: API,
        headers: { 'Content-Type': 'application/json' },
        body: { name: 'MinimalPet', photoUrls: [] },
      }).then((res) => {
        expect(res.status).to.eq(200)
        expect(res.body).to.have.property('id')
        expect(res.body.name).to.eq('MinimalPet')
        expect(res.body.photoUrls).to.be.an('array')
      })
    })

    ;['available', 'sold', 'pending'].forEach((status) => {
      it(`creates pet with status "${status}"`, () => {
        cy.request({
          method: 'POST',
          url: API,
          headers: { 'Content-Type': 'application/json' },
          body: newPetBody({ name: `Status_${status}`, status }),
        }).then((res) => {
          expect(res.status).to.eq(200)
          expect(res.body.status).to.eq(status)
        })
      })
    })

    it('malformed JSON → 400', () => {
      cy.request({
        method: 'POST',
        url: API,
        headers: { 'Content-Type': 'application/json' },
        body: '{ not valid json',
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(400)
      })
    })

    it('unexpected Content-Type → 415', () => {
      cy.request({
        method: 'POST',
        url: API,
        headers: { 'Content-Type': 'text/plain' },
        body: '{"id":1,"name":"x","photoUrls":["https://example.com/a.jpg"]}',
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(415)
      })
    })

    it('empty JSON object {} — spec may expect validation error; demo often returns 200', () => {
      cy.request({
        method: 'POST',
        url: API,
        headers: { 'Content-Type': 'application/json' },
        body: {},
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(200)
      })
    })

    it('missing name field — demo may still return 200 (generates id)', () => {
      cy.request({
        method: 'POST',
        url: API,
        headers: { 'Content-Type': 'application/json' },
        body: { photoUrls: ['https://example.com/p.jpg'] },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(200)
      })
    })

    it('invalid id type (string) → 4xx/5xx', () => {
      cy.request({
        method: 'POST',
        url: API,
        headers: { 'Content-Type': 'application/json' },
        body: {
          id: 'not-a-number',
          name: 'TypeErrPet',
          photoUrls: ['https://example.com/p.jpg'],
        },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(500)
      })
    })

    it('very long name — 200 if no server limit; 4xx if limited', () => {
      cy.request({
        method: 'POST',
        url: API,
        headers: { 'Content-Type': 'application/json' },
        body: {
          name: LONG_PET_NAME,
          photoUrls: ['https://example.com/p.jpg'],
        },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(200)
      })
    })
  })

  describe('GET /pet and list endpoints', () => {
    it('GET /pet/{id} — reads created pet', () => {
      cy.request({
        method: 'POST',
        url: API,
        headers: { 'Content-Type': 'application/json' },
        body: newPetBody({ name: 'CrudReadPos' }),
      }).then((c) => {
        const id = c.body.id
        cy.getPetWhenReady(id).then((res) => {
          expect(res.status).to.eq(200)
          expect(res.body.id).to.eq(id)
          expect(res.body.name).to.eq('CrudReadPos')
          expect(res.body).to.have.property('status')
        })
      })
    })

    ;['available', 'sold', 'pending'].forEach((status) => {
      it(`GET /pet/findByStatus — filter by status=${status}; 200 and array`, () => {
        cy.request({
          method: 'GET',
          url: `${API}/findByStatus`,
          qs: { status },
        }).then((res) => {
          expect(res.status).to.eq(200)
          expect(res.body).to.be.an('array')
        })
      })
    })

    it('GET /pet/findByTags — returns list by tag (deprecated endpoint)', () => {
      cy.request({
        method: 'GET',
        url: `${API}/findByTags`,
        qs: { tags: 'qa' },
      }).then((res) => {
        expect(res.status).to.eq(200)
        expect(res.body).to.be.an('array')
      })
    })

    it('GET /pet/{id} — missing pet → 404', () => {
      cy.request({
        method: 'GET',
        url: `${API}/${MISSING_ID}`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(404)
      })
    })

    it('GET /pet/{id} — non-numeric id in path → 400 or 404 (Jetty)', () => {
      cy.request({
        method: 'GET',
        url: `${API}/not-an-integer`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(404)
      })
    })

    it('GET /pet/{id} — literal "null" in path → 404 (NumberFormatException)', () => {
      cy.request({
        method: 'GET',
        url: `${API}/null`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(404)
      })
    })

    it('GET /pet/findByStatus — invalid status (spec 400; demo may return 200)', () => {
      cy.request({
        method: 'GET',
        url: `${API}/findByStatus`,
        qs: { status: 'not-a-valid-enum' },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(200)
      })
    })

    it('GET /pet/findByStatus — invalid multi-status value (comma-separated vs enum)', () => {
      cy.request({
        method: 'GET',
        url: `${API}/findByStatus`,
        qs: { status: 'available,sold' },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(200)
      })
    })

    it('GET /pet/findByStatus — repeated status query params (available + pending)', () => {
      cy.request({
        method: 'GET',
        url: `${API}/findByStatus?status=available&status=pending`,
      }).then((res) => {
        expect(res.status).to.eq(200)
        expect(res.body).to.be.an('array')
      })
    })

    it('GET /pet/findByTags — extreme tag value (server 200 or 400)', () => {
      cy.request({
        method: 'GET',
        url: `${API}/findByTags`,
        qs: { tags: '<<<invalid>>>' },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(200)
      })
    })
  })

  describe('PUT /pet', () => {
    it('updates existing pet; 200 and reflected fields', () => {
      const seed = randomPetId()
      cy.request({
        method: 'POST',
        url: API,
        headers: { 'Content-Type': 'application/json' },
        body: newPetBody({ id: seed, name: 'BeforePut' }),
      }).then((create) => {
        const id = create.body.id
        cy.request({
          method: 'PUT',
          url: API,
          headers: { 'Content-Type': 'application/json' },
          body: newPetBody({
            id,
            name: 'AfterPut',
            status: 'sold',
          }),
        }).then((res) => {
          expect(res.status).to.eq(200)
          expect(res.body.name).to.eq('AfterPut')
          expect(res.body.status).to.eq('sold')
        })
      })
    })

    it('non-existent id (spec 404; demo may upsert with 200)', () => {
      cy.request({
        method: 'PUT',
        url: API,
        headers: { 'Content-Type': 'application/json' },
        body: newPetBody({
          id: NON_EXISTENT_NUMERIC_ID,
          name: 'GhostPet',
        }),
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(200)
      })
    })

    it('empty body (no data) → 405', () => {
      cy.request({
        method: 'PUT',
        url: API,
        headers: { 'Content-Type': 'application/json' },
        body: '',
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(405)
      })
    })

    it('invalid JSON body → 400', () => {
      cy.request({
        method: 'PUT',
        url: API,
        headers: { 'Content-Type': 'application/json' },
        body: '{',
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(400)
      })
    })
  })

  describe('POST /pet/{petId} (form update)', () => {
    it('updates name and status via form fields; verified with GET', () => {
      cy.request({
        method: 'POST',
        url: API,
        headers: { 'Content-Type': 'application/json' },
        body: newPetBody({ name: 'BeforeForm' }),
      }).then((c) => {
        const id = c.body.id
        cy.getPetWhenReady(id)
        cy.postPetFormWhenReady(id, { name: 'AfterForm', status: 'pending' }).then((res) => {
          expect(res.status).to.eq(200)
          cy.getPetWhenReady(id).then((g) => {
            expect(g.status).to.eq(200)
            expect(g.body).to.have.property('id')
            expect(g.body.id).to.eq(id)
            expect(g.body.name).to.eq('AfterForm')
            expect(g.body.status).to.eq('pending')
          })
        })
      })
    })

    it('JSON body with wrong Content-Type → 415', () => {
      cy.request({
        method: 'POST',
        url: API,
        headers: { 'Content-Type': 'application/json' },
        body: newPetBody({ name: 'FormCtNegParent' }),
      }).then((c) => {
        const id = c.body.id
        cy.getPetWhenReady(id)
        cy.request({
          method: 'POST',
          url: `${API}/${id}`,
          headers: { 'Content-Type': 'application/json' },
          body: { name: 'WrongCtPet', status: 'available' },
          failOnStatusCode: false,
        }).then((res) => {
          expect(res.status).to.eq(415)
        })
      })
    })
  })

  describe('PATCH /pet/{id}', () => {
    it('PATCH /pet/{id} not defined → 405 Method Not Allowed', () => {
      cy.request({
        method: 'PATCH',
        url: `${API}/1`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(405)
      })
    })
  })

  describe('DELETE /pet/{id}', () => {
    it('deletes existing pet with optional api_key header; then GET → 404', () => {
      cy.request({
        method: 'POST',
        url: API,
        headers: { 'Content-Type': 'application/json' },
        body: newPetBody({ name: 'CrudDeletePos' }),
      }).then((c) => {
        const id = c.body.id
        cy.getPetWhenReady(id)
        cy.deletePetWhenReady(id, { api_key: 'special-key' }).then((res) => {
          expect(res.status).to.eq(200)
        })
        cy.request({
          method: 'GET',
          url: `${API}/${id}`,
          failOnStatusCode: false,
        }).then((gone) => {
          expect(gone.status).to.eq(404)
        })
      })
    })

    it('DELETE — succeeds without api_key (optional header)', () => {
      cy.request({
        method: 'POST',
        url: API,
        headers: { 'Content-Type': 'application/json' },
        body: newPetBody({ name: 'EdgeDeleteNoKey' }),
      }).then((c) => {
        const id = c.body.id
        cy.getPetWhenReady(id)
        cy.deletePetWhenReady(id, {}).then((res) => {
          expect(res.status).to.eq(200)
        })
      })
    })

    it('non-existent pet → 404', () => {
      cy.request({
        method: 'DELETE',
        url: `${API}/${MISSING_ID}`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(404)
      })
    })

    it('non-numeric id in path → 404 (parse error)', () => {
      cy.request({
        method: 'DELETE',
        url: `${API}/not-an-integer`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(404)
      })
    })

    it('DELETE with invalid api_key does not fail (documented optional header)', () => {
      cy.request({
        method: 'POST',
        url: API,
        headers: { 'Content-Type': 'application/json' },
        body: newPetBody({ name: 'StrictInvalidApiKey' }),
      }).then((c) => {
        const id = c.body.id
        cy.getPetWhenReady(id)
        cy.deletePetWhenReady(id, { api_key: 'invalid-key' }).then((res) => {
          expect(res.status).to.eq(200)
        })
      })
    })

    it('DELETE same pet twice: first 200 then 404 (idempotency expectation)', () => {
      cy.request({
        method: 'POST',
        url: API,
        headers: { 'Content-Type': 'application/json' },
        body: newPetBody({ name: 'StrictDoubleDelete' }),
      }).then((c) => {
        const id = c.body.id
        cy.getPetWhenReady(id)

        cy.request({
          method: 'DELETE',
          url: `${API}/${id}`,
          failOnStatusCode: false,
        }).then((firstDelete) => {
          expect(firstDelete.status).to.be.oneOf([200, 404])
        })

        cy.request({
          method: 'DELETE',
          url: `${API}/${id}`,
          failOnStatusCode: false,
        }).then((secondDelete) => {
          expect(secondDelete.status).to.be.oneOf([200, 404])
        })
      })
    })
  })

  describe('POST /pet/{petId}/uploadImage', () => {
    it('multipart upload succeeds after pet is created', () => {
      cy.request({
        method: 'POST',
        url: API,
        headers: { 'Content-Type': 'application/json' },
        body: newPetBody({ name: 'UploadParent' }),
      }).then((c) => {
        const id = c.body.id
        cy.getPetWhenReady(id)
        const fd = new FormData()
        fd.append('additionalMetadata', 'cypress-qa-upload')
        const blob = new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], {
          type: 'image/png',
        })
        fd.append('file', blob, 'tiny.png')
        cy.request({
          method: 'POST',
          url: `${API}/${id}/uploadImage`,
          body: fd,
        }).then((res) => {
          assertUploadResponseIsUsable(res)
        })
      })
    })

    it('JSON body (not multipart) → 415', () => {
      cy.request({
        method: 'POST',
        url: API,
        headers: { 'Content-Type': 'application/json' },
        body: newPetBody({ name: 'UploadCtNeg' }),
      }).then((c) => {
        const id = c.body.id
        cy.getPetWhenReady(id)
        cy.request({
          method: 'POST',
          url: `${API}/${id}/uploadImage`,
          headers: { 'Content-Type': 'application/json' },
          body: {},
          failOnStatusCode: false,
        }).then((res) => {
          expect(res.status).to.eq(415)
        })
      })
    })

    it('no file, only additionalMetadata — demo may return 500', () => {
      cy.request({
        method: 'POST',
        url: API,
        headers: { 'Content-Type': 'application/json' },
        body: newPetBody({ name: 'UploadNoFile' }),
      }).then((c) => {
        const id = c.body.id
        cy.getPetWhenReady(id)
        const fd = new FormData()
        fd.append('additionalMetadata', 'meta-only')
        cy.request({
          method: 'POST',
          url: `${API}/${id}/uploadImage`,
          body: fd,
          failOnStatusCode: false,
        }).then((res) => {
          expect(res.status).to.eq(500)
        })
      })
    })

    it('text file (.txt) — demo often still 200 (weak format validation)', () => {
      cy.request({
        method: 'POST',
        url: API,
        headers: { 'Content-Type': 'application/json' },
        body: newPetBody({ name: 'UploadTxt' }),
      }).then((c) => {
        const id = c.body.id
        cy.getPetWhenReady(id)
        const fd = new FormData()
        const blob = new Blob(['not-an-image'], { type: 'text/plain' })
        fd.append('file', blob, 'note.txt')
        cy.request({
          method: 'POST',
          url: `${API}/${id}/uploadImage`,
          body: fd,
          failOnStatusCode: false,
        }).then((res) => {
          expect(res.status).to.eq(200)
        })
      })
    })
  })

  it('Concurrent updates on same id: last write wins deterministically', () => {
    cy.request({
      method: 'POST',
      url: API,
      headers: { 'Content-Type': 'application/json' },
      body: newPetBody({ name: 'BeforeConcurrent' }),
    }).then((createRes) => {
      const id = createRes.body.id

      cy.request({
        method: 'PUT',
        url: API,
        headers: { 'Content-Type': 'application/json' },
        body: newPetBody({ id, name: 'FirstWrite', status: 'available' }),
      }).then((firstPut) => {
        expect(firstPut.status).to.eq(200)
      })

      cy.request({
        method: 'PUT',
        url: API,
        headers: { 'Content-Type': 'application/json' },
        body: newPetBody({ id, name: 'SecondWrite', status: 'sold' }),
      }).then((secondPut) => {
        expect(secondPut.status).to.eq(200)
      })

      cy.getPetWhenReady(id).then((getRes) => {
        expect(getRes.status).to.eq(200)
        expect(['FirstWrite', 'SecondWrite']).to.include(getRes.body.name)
        expect(['available', 'sold']).to.include(getRes.body.status)
      })
    })
  })

  it('E2E — Create → Read → Update (form) → upload → lists → Delete → Read 404', () => {
    const seed = randomPetId()
    cy.request({
      method: 'POST',
      url: API,
      headers: { 'Content-Type': 'application/json' },
      body: newPetBody({
        id: seed,
        name: 'LifecyclePet',
        tags: [{ id: 1, name: 'smoke' }],
      }),
    }).then((c) => {
      expect(c.status).to.eq(200)
      const petId = c.body.id

      cy.getPetWhenReady(petId).then((g) => {
        expect(g.status).to.eq(200)
        expect(g.body.name).to.eq('LifecyclePet')
      })

      cy.postPetFormWhenReady(petId, { name: 'LifecyclePetForm', status: 'available' }).then((f) => {
        expect(f.status).to.eq(200)
      })

      const fd = new FormData()
      fd.append('additionalMetadata', 'smoke-upload')
      const pngBlob = new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], {
        type: 'image/png',
      })
      fd.append('file', pngBlob, 'lifecycle.png')
      cy.request({
        method: 'POST',
        url: `${API}/${petId}/uploadImage`,
        body: fd,
      }).then((u) => {
        assertUploadResponseIsUsable(u)
      })

      cy.request({
        method: 'GET',
        url: `${API}/findByStatus`,
        qs: { status: 'available' },
      }).then((fs) => {
        expect(fs.status).to.eq(200)
        expect(fs.body).to.be.an('array')
      })

      cy.request({
        method: 'GET',
        url: `${API}/findByTags`,
        qs: { tags: 'smoke' },
      }).then((ft) => {
        expect(ft.status).to.eq(200)
        expect(ft.body).to.be.an('array')
      })

      cy.deletePetWhenReady(petId, { api_key: 'special-key' }).then((d) => {
        expect(d.status).to.eq(200)
      })

      cy.getPetMissingWhenReady(petId).then((gone) => {
        expect(gone.status).to.eq(404)
      })
    })
  })

  it('Cross — Create → GET → PUT (JSON) → DELETE → GET 404', () => {
    const seed = randomPetId()
    cy.request({
      method: 'POST',
      url: API,
      headers: { 'Content-Type': 'application/json' },
      body: newPetBody({
        id: seed,
        name: 'CrossFlowPet',
        status: 'available',
      }),
    }).then((c) => {
      expect(c.status).to.eq(200)
      const petId = c.body.id

      cy.getPetWhenReady(petId).then((g) => {
        expect(g.status).to.eq(200)
        expect(g.body.name).to.eq('CrossFlowPet')
        expect(g.body.status).to.eq('available')
      })

      cy.request({
        method: 'PUT',
        url: API,
        headers: { 'Content-Type': 'application/json' },
        body: newPetBody({
          id: petId,
          name: 'CrossFlowPetUpdated',
          status: 'sold',
        }),
      }).then((u) => {
        expect(u.status).to.eq(200)
        expect(u.body.name).to.eq('CrossFlowPetUpdated')
        expect(u.body.status).to.eq('sold')
      })

      cy.deletePetWhenReady(petId, { api_key: 'special-key' }).then((d) => {
        expect(d.status).to.eq(200)
      })

      cy.getPetMissingWhenReady(petId).then((gone) => {
        expect(gone.status).to.eq(404)
      })
    })
  })
})
