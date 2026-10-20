export function categoryRepr(value: number | string | null | undefined) : string {
    if (value === null || value === undefined) return '—'
    if (value === 1.5) return '1-2'
    if (value === 2.5) return '2-3'
    if (value === 3.5) return '3-4'
    if (value === 4.5) return '4-5'
    return String(value)
  }
 
export function categoryClass(value: number | null | undefined) : string {
    if (value === null || value === undefined) return 'category'
    if (value === 0) return 'category c0'
    if (value === 1) return 'category c1'
    if (value === 1.5) return 'category c1-2'
    if (value === 2) return 'category c2'
    if (value === 2.5) return 'category c2-3'
    if (value === 3) return 'category c3'
    if (value === 3.5) return 'category c3-4'
    if (value === 4) return 'category c4'
    if (value === 4.5) return 'category c4-5'
    if (value === 5) return 'category c5'
    if (value === 6) return 'category c6'
    if (value === 7) return 'category c7'
    if (value === 8) return 'category c8'
    return 'category'
}
export function clinvarVariantUrl(variant_id: string | undefined) : string {
    if (!variant_id) return '#'
    return `https://www.ncbi.nlm.nih.gov/clinvar/variation/${variant_id}`
}