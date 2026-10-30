export type ClinVarData = {
  id: string
  score: number
  last_updated: string | null
} | null

export type EvaluationHistoryItem = {
  patient_variant_id: number
  patient_id?: string
  category: number | null
  zygosity: string
  comment: string | null
  report_id: number
  report_name: string
  report_variants_count?: number
  created_by: string
  updated_at: string
}

export type PatientObservation = {
  patient_variant_id: number
  patient_id: string
  category: number | null
  zygosity: string
  comment: string | null
  reported_hgvs_c?: string
  report_id: number
  report_name: string
  report_variants_count?: number
  created_by: string
  updated_at: string
  is_searched_patient?: boolean
  history: EvaluationHistoryItem[]
  history_count: number
  can_edit?: boolean
  can_delete?: boolean
}

export type Variant = {
  variant_id?: number
  source: 'clinic' | 'clinvar_catalog'
  gene: string
  all_genes?: string[]
  variant: string
  all_transcripts?: string[]
  dbsnp: string
  all_dbsnps?: string[]
  gnomAD?: string
  chromosome: string
  position: number | null
  clinvar: ClinVarData

  // Aggregated summary fields
  patients_count: number
  total_observations: number
  latest_category: number | null
  latest_updated_at: string | null
  has_conflicting_categories?: boolean
  categories_summary?: string | null

  // Nested unique patient records
  patients: PatientObservation[]

  // Compatibility fields for legacy consumers
  patient_id?: string
  patient_variant_id?: number
  report_id?: number
  report_name?: string
  report_variants_count?: number
  category?: number | string | null
  updated_at?: string | null
  created_by?: string
  comment?: string | null
  can_edit?: boolean
  can_delete?: boolean
}
