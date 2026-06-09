<script lang="ts">
  type Variant = {
    gene: string
    variant: string
    dbsnp: string
    chromosome: string
    position: number | null
    updated_at: string
    category: string
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

  const categoryClass = (value: string) => {
    const code = value.trim()
    if (code === '0') return 'category c0'
    if (code === '1') return 'category c1'
    if (code === '1-2') return 'category c1-2'
    if (code === '2') return 'category c2'
    if (code === '2-3') return 'category c2-3'
    if (code === '3') return 'category c3'
    if (code === '3-4') return 'category c3-4'
    if (code === '4') return 'category c4'
    if (code === '4-5') return 'category c4-5'
    if (code === '5') return 'category c5'
    return 'category'
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
      <span>Gen</span>
      <span>Varianta</span>
      <span>dbSNP</span>
      <span>Chromozom</span>
      <span>Pozice</span>
      <span>Aktualizováno</span>
      <span>Kategorie</span>
    </div>
    {#if results.length === 0}
      <div class="row empty">
        <span class="muted">Žádná shoda</span>
      </div>
    {:else}
      {#each results as item}
        <div class="row">
          <span class="pill">{item.gene}</span>
          <span>{item.variant || '—'}</span>
          <span>{item.dbsnp || '—'}</span>
          <span>{item.chromosome || '—'}</span>
          <span>{item.position ?? '—'}</span>
          <span>{formatDate(item.updated_at)}</span>
          <span class={categoryClass(item.category)}>{item.category || '—'}</span>
        </div>
      {/each}
    {/if}
  </div>
</div>
