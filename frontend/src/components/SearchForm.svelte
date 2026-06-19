<script lang="ts">
  interface Props {
    variantQuery: string
    geneQuery: string
    dbsnpQuery: string
    isSearching: boolean
    errorMessage: string
    onsubmit: () => void
    onclear: () => void
  }

  let {
    variantQuery = $bindable(),
    geneQuery = $bindable(),
    dbsnpQuery = $bindable(),
    isSearching,
    errorMessage,
    onsubmit,
    onclear
  }: Props = $props()

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    onsubmit()
  }

  // Reactive URL constructor using Svelte 5 derived state
  let clinvarSearchUrl = $derived.by(() => {
    const base = "https://www.ncbi.nlm.nih.gov/clinvar/?"
    const terms: string[] = []

    const cleanVariant = variantQuery.trim()
    const cleanGene = geneQuery.trim()
    const cleanDbsnp = dbsnpQuery.trim()

    // Enforcement: Use dbSNP if provided, otherwise fall back to variant string
    if (cleanDbsnp) {
      terms.push(cleanDbsnp)
    } else if (cleanVariant) {
      terms.push(cleanVariant)
    }

    // Always append the gene tracking constraint if present
    if (cleanGene) {
      terms.push(`${cleanGene}[Gene]`)
    }

    if (terms.length === 0) return null

    // Construct valid NCBI query string
    const queryTerm = terms.join(" AND ")
    return `${base}term=${encodeURIComponent(queryTerm)}`
  })

  // Detect when the user triggers the ClinVar search constraint collision
  let hasQueryCollision = $derived(variantQuery.trim().length > 0 && dbsnpQuery.trim().length > 0)
</script>

<div>
  <p class="label">Vyhledat podle varianty, genu nebo dbSNP</p>
  <form class="search-form" onsubmit={handleSubmit}>
    <label class="field">
      <span>Varianta</span>
      <input
        type="text"
        placeholder="NM_004168.3:c.1396G>A nebo c.1396G>A"
        bind:value={variantQuery}
      />
    </label>
    <label class="field">
      <span>Gen</span>
      <input type="text" placeholder="BRCA1" bind:value={geneQuery} />
    </label>
    <label class="field">
      <span>dbSNP</span>
      <input type="text" placeholder="rs80357713" bind:value={dbsnpQuery} />
    </label>
    <div class="actions">
      <button type="submit" class="ghost" disabled={isSearching}>
        {isSearching ? 'Hledání...' : 'Vyhledat'}
      </button>
      <button type="button" class="ghost" onclick={onclear}>
        Vymazat hledání
      </button>
      
      {#if clinvarSearchUrl}
        <a 
          href={clinvarSearchUrl} 
          target="_blank" 
          rel="noreferrer" 
          class="clinvar-btn"
        >
          Hledat na ClinVar ↗
        </a>
      {/if}
    </div>
  </form>

  {#if hasQueryCollision}
    <p class="warning">
      ⚠️ ClinVar nepodporuje současné vyhledávání podle varianty i dbSNP. Odkaz výše upřednostňuje dbSNP.
    </p>
  {/if}

  {#if errorMessage}
    <p class="error">{errorMessage}</p>
  {/if}
</div>