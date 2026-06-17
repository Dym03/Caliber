<script lang="ts">
  import VariantModal from './VariantModal.svelte';

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
    comment?: string | null 
  }

  interface Props {
    results: Variant[]
    onrefresh: () => void
  }

  let { results, onrefresh }: Props = $props()

  let selectedVariant = $state<Variant | null>(null)

  const openModal = (variant: Variant) => {
    selectedVariant = variant
  }

  const closeModal = () => {
    selectedVariant = null
  }

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

  const categoryRepr = (value: number | null | undefined) => {
    if (value === null || value === undefined) return ''
    if (value === 0) return '0'
    if (value === 1) return '1'
    if (value === 1.5) return '1-2'
    if (value === 2) return '2'
    if (value === 2.5) return '2-3'
    if (value === 3) return '3'
    if (value === 3.5) return '3-4'
    if (value === 4) return '4'
    if (value === 4.5) return '4-5'
    if (value === 5) return '5'
    return String(value)
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
      <span>Detail</span>
    </div>
    {#if results.length === 0}
      <div class="row empty">
        <span class="muted">Žádná shoda</span>
      </div>
    {:else}
      {#each results as item}
        <div class="row">
          <span class="selectable">{item.patient_id}</span>
          
          <div>
            <span class="pill">{item.gene}</span>
          </div>
          
          <span class="selectable/mono">{item.variant || '—'}</span>
          <span class="selectable/mono">{item.dbsnp || '—'}</span>
          <span>{item.chromosome || '—'}</span>
          <span>{item.position ?? '—'}</span>
          <span>{formatDate(item.updated_at)}</span>
          
          <span class={categoryClass(item.category)}>{categoryRepr(item.category)}</span>
          {#if item.clinvar?.id}
            <a 
              class="{categoryClass(item.clinvar?.score)} clinvar-badge" 
              target="_blank" 
              rel="noreferrer" 
              href={clinvar_variant_url(item.clinvar?.id)}
            >
              {categoryRepr(item.clinvar?.score) || ''}
            </a>
          {:else}
            <span class={categoryClass(item.clinvar?.score)}>
              {categoryRepr(item.clinvar?.score)}
            </span>
          {/if}

          <div class="actions-cell">
            <button 
              type="button" 
              class="full-click-action-btn" 
              onclick={() => openModal(item)}
              title="Zobrazit detaily varianty"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

{#if selectedVariant}
  <VariantModal variant={selectedVariant} onclose={closeModal} />
{/if}
