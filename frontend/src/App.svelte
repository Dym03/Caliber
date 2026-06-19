<script lang="ts">
  import Topbar from './components/Topbar.svelte'
  import SearchForm from './components/SearchForm.svelte'
  import UploadPanel from './components/UploadPanel.svelte'
  import ResultsTable from './components/ResultsTable.svelte'

  import type { Variant } from './types/variant'
  import type { PaginationMeta } from './types/pagination'

  type SearchResponse = {
    results: Variant[]
    meta: PaginationMeta
  }

  let variantQuery = $state('')
  let geneQuery = $state('')
  let dbsnpQuery = $state('')
  let isSearching = $state(false)
  let errorMessage = $state('')
  
  // State variables for paginated results array and index trackers
  let results = $state<Variant[]>([])
  let meta = $state<PaginationMeta | null>(null)
  let currentPage = $state(1)

  // Accepts an optional page parameter argument, defaulting to page 1
  const runSearch = async (page: number = 1) => {
    errorMessage = ''
    currentPage = page // Anchor structural component tracking point

    const params = new URLSearchParams({
      variant: variantQuery.trim(),
      gene: geneQuery.trim(),
      dbsnp: dbsnpQuery.trim(),
      page: String(page),
      per_page: '50' // Fixed batch tracking limit parameters
    })

    // Validate that at least one search field has input values
    if (![params.get('variant'), params.get('gene'), params.get('dbsnp')].some((val) => val && val.length > 0)) {
      errorMessage = 'Vyplňte alespoň jedno vyhledávací pole.'
      results = []
      meta = null
      return
    }

    isSearching = true
    try {
      // Ensure the fetch call targets your correct routing path string (e.g., /api/search/ or /api/variants/search/)
      const response = await fetch(`/api/search/?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Search failed. Please try again.')
      }
      const data = (await response.json()) as SearchResponse
      results = data.results
      meta = data.meta // Assign the pagination metadata object block cleanly
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Search failed.'
      results = []
      meta = null
    } finally {
      isSearching = false
    }
  }

  // Triggered when clicking explicit Submit actions inside the search bar layout form
  const handleFormSubmit = () => {
    runSearch(1) // Always reset tracking context views back to page 1 for a new query
  }

  // Handle page button changes coming from footer controls inside ResultsTable
  const handlePageChange = (targetPage: number) => {
    runSearch(targetPage)
  }

  const clearSearch = () => {
    variantQuery = ''
    geneQuery = ''
    dbsnpQuery = ''
    errorMessage = ''
    results = []
    meta = null
    currentPage = 1
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
      onsubmit={handleFormSubmit}
      onclear={clearSearch}
    />
    <UploadPanel />
  </section>

  <section class="grid">
    <ResultsTable 
      {results} 
      {meta} 
      onrefresh={() => runSearch(currentPage)} 
      onpagechange={handlePageChange} 
    />
  </section>
</div>