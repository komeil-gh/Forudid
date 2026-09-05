import { describe, expect, it } from 'vitest'
import { publishedRealProducts } from './products'

describe('publishedRealProducts', () => {
  it('never exposes fixture products to the public map', () => {
    expect(publishedRealProducts([{ id: 'real', is_fixture: false }, { id: 'fixture', is_fixture: true }]))
      .toEqual([{ id: 'real', is_fixture: false }])
  })
})
