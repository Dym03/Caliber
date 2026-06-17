export type ClinVarData = {
    id: string
    score: number
    last_updated: string | null
  } | null

export type Variant = {
    patient_id: string
    gene: string
    variant: string
    dbsnp: string
    chromosome: string
    position: number | null
    updated_at: string
    category: number | null
    clinvar: ClinVarData
    comment?: string | null 
  }
