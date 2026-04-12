const API = '/v2/pet'

function randomPetId() {
  return Math.floor(Math.random() * 900000000) + 100000000
}

function newPetBody(overrides = {}) {
  const id = overrides.id !== undefined ? overrides.id : randomPetId()
  return {
    id,
    category: { id: 1, name: 'Dog' },
    name: overrides.name !== undefined ? overrides.name : 'QAPet',
    photoUrls: ['https://example.com/p.jpg'],
    tags: overrides.tags !== undefined ? overrides.tags : [{ id: 1, name: 'qa' }],
    status: overrides.status !== undefined ? overrides.status : 'available',
    ...overrides,
  }
}

const MISSING_ID = '999999999999999999'

const NON_EXISTENT_NUMERIC_ID = 9007199254740990

module.exports = {
  API,
  MISSING_ID,
  NON_EXISTENT_NUMERIC_ID,
  randomPetId,
  newPetBody,
}
