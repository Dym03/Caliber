<script lang="ts">
  type ClinVarData = {
    id: string
    score: number
    last_updated: string | null
  } | null

  type Variant = {
    patient_id: string
    gene: string
    variant: string
    dbsnp: string
    chromosome: string
    position: number | null
    updated_at: string
    category: number | null
    clinvar: ClinVarData
  }

  interface Props {
    results: Variant[]
    onrefresh: () => void
  }

  let { results, onrefresh }: Props = $props()

  const formatDate = (value: string) => {
    if (!value) {
      return '—'
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return '—'
    }
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear())
    return `${day}-${month}-${year}`
  }

  const categoryClass = (value: number | null | undefined) => {
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
    return 'category'
  }

  const clinvar_variant_url = (variant_id: string | undefined) => {
    if (!variant_id) return '#'
    return `https://www.ncbi.nlm.nih.gov/clinvar/variation/${variant_id}`
  }

</script>

<div class="card list">
  <div class="list-head">
    <div>
      <h2>Výsledky hledání</h2>
      <p class="muted">Shodující se varianty z vašeho datasetu</p>
    </div>
    <button type="button" class="ghost" onclick={onrefresh}>
      Obnovit
    </button>
  </div>
  <div class="table">
    <div class="row head">
      <span>Pacient</span>
      <span>Gen</span>
      <span>Varianta</span>
      <span>dbSNP</span>
      <span>Chromozom</span>
      <span>Pozice</span>
      <span>Aktualizováno</span>
      <span>Kategorie</span>
      <span>ClinVar</span>
    </div>
    {#if results.length === 0}
      <div class="row empty">
        <span class="muted">Žádná shoda</span>
      </div>
    {:else}
      {#each results as item}
        <div class="row">
          <span>{item.patient_id}</span>
          <span class="pill">{item.gene}</span>
          <span>{item.variant || '—'}</span>
          <span>{item.dbsnp || '—'}</span>
          <span>{item.chromosome || '—'}</span>
          <span>{item.position ?? '—'}</span>
          <span>{formatDate(item.updated_at)}</span>
          <span class={categoryClass(item.category)}>{item.category || '—'}</span>
          {#if item.clinvar?.id}
            <a 
              class="{categoryClass(item.clinvar?.score)} clinvar-badge" 
              target="_blank" 
              rel="noreferrer" 
              href={clinvar_variant_url(item.clinvar?.id)}
            >
              {item.clinvar?.score || ''}
            </a>
          {:else}
            <span class={categoryClass(item.clinvar?.score)}>
              {item.clinvar?.score || ''}
            </span>
          {/if}
        </div>
      {/each}
    {/if}
  </div>
</div>
