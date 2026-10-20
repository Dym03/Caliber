export interface DashboardSummary {
  total_patients: number
  total_reports: number
  total_patient_variants: number
  total_unique_variants: number
  pathogenic_patients: number
  pathogenic_patients_percentage: number
  total_clinvar_variants: number
  clinvar_last_updated: string
}

export interface CategoryBreakdown {
  category: number | null
  label: string
  color_class: string
  count: number
  percentage: number
}

export interface ZygosityBreakdown {
  label: string
  count: number
  percentage: number
}

export interface TopGene {
  symbol: string
  patient_count: number
  variant_count: number
  percentage: number
}

export interface RecurrentVariant {
  variant_id: number
  gene: string
  hgvs_c: string
  dbsnp: string
  chromosome: string
  position: number
  variation_type: string
  patient_count: number
  observation_count: number
  category: number | null
  clinvar_id: string | null
  clinvar_classification: number | null
}

export interface RecentReport {
  id: number
  report_name: string
  patient_name: string
  created_at: string
  created_by: string
  variants_count: number
}

export interface DashboardStatsResponse {
  summary: DashboardSummary
  categories_breakdown: CategoryBreakdown[]
  zygosities_breakdown: ZygosityBreakdown[]
  top_genes: TopGene[]
  recurrent_variants: RecurrentVariant[]
  recent_reports: RecentReport[]
}

