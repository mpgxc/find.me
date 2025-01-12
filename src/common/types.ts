export type ProductItem = {
  name: string
  sku: string
  media_gallery_entries: MediaEntry[]
}

export type MediaEntry = {
  id: string
  position: number
  types: string[]
}

export type Product = {
  items: ProductItem[]
}
