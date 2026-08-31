// Ni `Prenda` ni `VarianteProducto` tienen campo de imagen en el backend
// (decisión de alcance del Sprint 3: S3-T01 es solo frontend). Estas cards
// usan fotos de stock de ropa juvenil/casual (Unsplash, licencia libre),
// elegidas por categoría, como placeholder visual — no representan la
// prenda real importada. Cada URL fue verificada manualmente antes de
// incluirse aquí (no son IDs adivinados).
const FOTO_POR_CATEGORIA: Record<string, string> = {
  vestidos: 'photo-1515372039744-b8f02a3ae446', // vestido blanco
  vestido: 'photo-1515372039744-b8f02a3ae446',
  chaquetas: 'photo-1591047139829-d91aecb6caea', // chaqueta bomber en gancho
  chaqueta: 'photo-1591047139829-d91aecb6caea',
  abrigos: 'photo-1591047139829-d91aecb6caea',
  pantalones: 'photo-1541099649105-f69ad21f3246', // jean rasgado
  jeans: 'photo-1541099649105-f69ad21f3246',
  camisas: 'photo-1490481651871-ab68de25d43d', // blusas colgadas
  camisa: 'photo-1490481651871-ab68de25d43d',
  blusas: 'photo-1490481651871-ab68de25d43d',
  blusa: 'photo-1490481651871-ab68de25d43d',
  poleras: 'photo-1521572163474-6864f9cf17ab', // polera blanca
  playeras: 'photo-1521572163474-6864f9cf17ab',
  sudaderas: 'photo-1556821840-3a63f95609a7', // hoodie gris
  hoodies: 'photo-1556821840-3a63f95609a7',
  shorts: 'photo-1591195853828-11db59a44f6b', // short de jean
}

const FOTO_DEFAULT = 'photo-1523381210434-271e8be1f52b' // poleras en gancho (streetwear genérico)

/** URL determinística (misma categoría → misma imagen) de una foto de stock de ropa juvenil. */
export function getImagenPrenda(prenda: { categoria: string }): string {
  const clave = prenda.categoria.trim().toLowerCase()
  const foto = FOTO_POR_CATEGORIA[clave] ?? FOTO_DEFAULT
  return `https://images.unsplash.com/${foto}?w=480&h=600&fit=crop&q=70`
}
