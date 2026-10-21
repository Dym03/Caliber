export function categoryRepr(value: number | string | null | undefined) : string {
    if (value === null || value === undefined || value === '') return '—'
    if (value === 1.5 || value === '1.5') return '1-2'
    if (value === 2.5 || value === '2.5') return '2-3'
    if (value === 3.5 || value === '3.5') return '3-4'
    if (value === 4.5 || value === '4.5') return '4-5'
    if (value === 0 || value === '0' || value === 0.0 || value === '0.0') return '0'
    return String(value)
}
 
export function categoryClass(value: number | string | null | undefined) : string {
    if (value === null || value === undefined || value === '') return 'category'
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (num === 0) return 'category c0'
    if (num === 1) return 'category c1'
    if (num === 1.5) return 'category c1-2'
    if (num === 2) return 'category c2'
    if (num === 2.5) return 'category c2-3'
    if (num === 3) return 'category c3'
    if (num === 3.5) return 'category c3-4'
    if (num === 4) return 'category c4'
    if (num === 4.5) return 'category c4-5'
    if (num === 5) return 'category c5'
    if (num === 6) return 'category c6'
    if (num === 7) return 'category c7'
    if (num === 8) return 'category c8'
    if (num === -1) return 'category c-1'
    return 'category'
}
export function clinvarVariantUrl(variant_id: string | undefined) : string {
    if (!variant_id) return '#'
    return `https://www.ncbi.nlm.nih.gov/clinvar/variation/${variant_id}`
}