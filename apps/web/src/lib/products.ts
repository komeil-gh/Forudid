export function publishedRealProducts<T extends { is_fixture: boolean }>(products: T[]) {
  return products.filter(product => !product.is_fixture)
}
