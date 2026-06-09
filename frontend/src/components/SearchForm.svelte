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
    </div>
  </form>
  {#if errorMessage}
    <p class="error">{errorMessage}</p>
  {/if}
</div>
