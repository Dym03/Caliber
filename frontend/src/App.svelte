<script lang="ts">
  import Topbar from './components/Topbar.svelte'
  import SearchForm from './components/SearchForm.svelte'
  import UploadPanel from './components/UploadPanel.svelte'
  import ResultsTable from './components/ResultsTable.svelte'

  type Variant = {
    gene: string
    variant: string
    dbsnp: string
    chromosome: string
    position: number | null
    updated_at: string
    category: string
  }

  type SearchResponse = {
    results: Variant[]
  }

  let variantQuery = $state('')
  let geneQuery = $state('')
  let dbsnpQuery = $state('')
  let isSearching = $state(false)
  let errorMessage = $state('')
  let results = $state<Variant[]>([])

  const runSearch = async () => {
    errorMessage = ''
    results = []
    const params = new URLSearchParams({
      variant: variantQuery.trim(),
      gene: geneQuery.trim(),
      dbsnp: dbsnpQuery.trim(),
    })

    if (![...params.values()].some((value) => value.length > 0)) {
      errorMessage = 'Vyplňte alespoň jedno vyhledávací pole.'
      return
    }

    isSearching = true
    try {
      const response = await fetch(`/api/search/?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Search failed. Please try again.')
      }
      const data = (await response.json()) as SearchResponse
      results = data.results
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Search failed.'
    } finally {
      isSearching = false
    }
  }

  const clearSearch = () => {
    variantQuery = ''
    geneQuery = ''
    dbsnpQuery = ''
    errorMessage = ''
    results = []
  }
</script>

<div class="page">
  <Topbar />

  <section class="search">
    <SearchForm
      bind:variantQuery
      bind:geneQuery
      bind:dbsnpQuery
      {isSearching}
      {errorMessage}
      onsubmit={runSearch}
      onclear={clearSearch}
    />
    <UploadPanel />
  </section>

  <section class="grid">
    <ResultsTable {results} onrefresh={runSearch} />
  </section>
</div>
