<script lang="ts">
  import { onMount } from 'svelte';
  import { apiUrl } from '../lib/api';
  import type { DashboardStatsResponse } from '../types/stats';
  import { categoryClass, categoryRepr, clinvarVariantUrl } from '../lib/utils';

  interface Props {
    onunauthorized?: () => void;
  }

  let { onunauthorized }: Props = $props();

  let stats = $state<DashboardStatsResponse | null>(null);
  let isLoading = $state(true);
  let errorMessage = $state('');

  // Category filter state: maps string(category) -> boolean
  let selectedCategoryKeys = $state<Record<string, boolean>>({});
  let syncRecurrentWithSelection = $state(true);

  const catKey = (catVal: number | null | undefined): string => {
    return catVal === null || catVal === undefined ? 'null' : String(catVal);
  };

  const isCategorySelected = (catVal: number | null | undefined): boolean => {
    const k = catKey(catVal);
    return selectedCategoryKeys[k] !== false;
  };

  const toggleCategory = (catVal: number | null | undefined) => {
    const k = catKey(catVal);
    const curr = isCategorySelected(catVal);
    selectedCategoryKeys[k] = !curr;
  };

  const selectAllCategories = () => {
    if (!stats) return;
    const next: Record<string, boolean> = {};
    for (const cat of stats.categories_breakdown) {
      next[catKey(cat.category)] = true;
    }
    selectedCategoryKeys = next;
  };

  const deselectAllCategories = () => {
    if (!stats) return;
    const next: Record<string, boolean> = {};
    for (const cat of stats.categories_breakdown) {
      next[catKey(cat.category)] = false;
    }
    selectedCategoryKeys = next;
  };

  const selectWithoutUnclassified = () => {
    if (!stats) return;
    const next: Record<string, boolean> = {};
    for (const cat of stats.categories_breakdown) {
      if (cat.category === -1 || cat.category === null) {
        next[catKey(cat.category)] = false;
      } else {
        next[catKey(cat.category)] = true;
      }
    }
    selectedCategoryKeys = next;
  };

  const selectOnlyPathogenic = () => {
    if (!stats) return;
    const next: Record<string, boolean> = {};
    for (const cat of stats.categories_breakdown) {
      if (cat.category !== null && cat.category >= 4.0 && cat.category <= 5.0) {
        next[catKey(cat.category)] = true;
      } else {
        next[catKey(cat.category)] = false;
      }
    }
    selectedCategoryKeys = next;
  };

  const selectVusAndBenign = () => {
    if (!stats) return;
    const next: Record<string, boolean> = {};
    for (const cat of stats.categories_breakdown) {
      if (cat.category !== null && cat.category >= 1.0 && cat.category <= 3.5) {
        next[catKey(cat.category)] = true;
      } else {
        next[catKey(cat.category)] = false;
      }
    }
    selectedCategoryKeys = next;
  };

  const selectedCategoriesList = $derived(
    stats?.categories_breakdown.filter((cat) => isCategorySelected(cat.category)) ?? []
  );

  const totalSelectedCount = $derived(
    selectedCategoriesList.reduce((acc, cat) => acc + cat.count, 0)
  );

  const totalPossibleCount = $derived(
    stats?.summary.total_patient_variants ?? 0
  );

  const selectedCountPercentage = $derived(
    totalPossibleCount > 0 ? ((totalSelectedCount / totalPossibleCount) * 100).toFixed(1) : '0'
  );

  const isAllSelected = $derived(
    Boolean(
      stats &&
      stats.categories_breakdown.length > 0 &&
      stats.categories_breakdown.every((cat) => isCategorySelected(cat.category))
    )
  );

  const isNoneSelected = $derived(
    Boolean(
      stats &&
      stats.categories_breakdown.length > 0 &&
      stats.categories_breakdown.every((cat) => !isCategorySelected(cat.category))
    )
  );

  const isWithoutUnclassified = $derived(
    Boolean(
      stats &&
      stats.categories_breakdown.length > 0 &&
      !isAllSelected &&
      !isNoneSelected &&
      stats.categories_breakdown.every((cat) => {
        if (cat.category === -1 || cat.category === null) {
          return !isCategorySelected(cat.category);
        }
        return isCategorySelected(cat.category);
      })
    )
  );

  const isOnlyPathogenic = $derived(
    Boolean(
      stats &&
      stats.categories_breakdown.length > 0 &&
      !isAllSelected &&
      !isNoneSelected &&
      stats.categories_breakdown.every((cat) => {
        if (cat.category !== null && cat.category >= 4.0 && cat.category <= 5.0) {
          return isCategorySelected(cat.category);
        }
        return !isCategorySelected(cat.category);
      })
    )
  );

  const hasUnclassified = $derived(
    Boolean(stats?.categories_breakdown.some((cat) => cat.category === -1 || cat.category === null))
  );

  const getRelativePercentage = (count: number) => {
    if (totalSelectedCount === 0) return 0;
    return Number(((count / totalSelectedCount) * 100).toFixed(1));
  };

  const displayedRecurrentVariants = $derived(
    stats?.recurrent_variants.filter((item) => {
      if (!syncRecurrentWithSelection || isAllSelected) return true;
      return isCategorySelected(item.category);
    }) ?? []
  );

  const loadStats = async () => {
    isLoading = true;
    errorMessage = '';
    try {
      const response = await fetch(apiUrl('/api/stats/'));
      if (response.status === 401) {
        onunauthorized?.();
        return;
      }
      if (!response.ok) {
        throw new Error('Chyba při stahování statistik databáze.');
      }
      stats = (await response.json()) as DashboardStatsResponse;
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Nepodařilo se načíst data.';
    } finally {
      isLoading = false;
    }
  };

  onMount(() => {
    loadStats();
  });
</script>

<div class="dashboard-page">
  <!-- Header / Action bar -->
  <div class="dashboard-header card">
    <div class="header-info">
      <span class="eyebrow">Statistický přehled</span>
      <h2>Přehled klinického registru a kohorty</h2>
      <p class="muted">
        Telemetrie databáze, patogenita nálezů a nejčastější genetické alterace v populaci pacientů.
      </p>
    </div>
    <div class="header-actions">
      {#if stats?.summary.clinvar_last_updated}
        <div class="clinvar-sync-pill">
          <span class="pulse-dot"></span>
          <span
            >ClinVar: <strong>{(stats.summary.total_clinvar_variants / 1000000).toFixed(2)}M</strong
            >
            (Aktualizováno: {stats.summary.clinvar_last_updated})</span
          >
        </div>
      {/if}
      <button type="button" class="ghost refresh-btn" onclick={loadStats} disabled={isLoading}>
        {isLoading ? 'Načítání...' : 'Obnovit data'}
      </button>
    </div>
  </div>

  {#if errorMessage}
    <div class="error-banner">
      <p>{errorMessage}</p>
      <button type="button" class="ghost" onclick={loadStats}>Zkusit znovu</button>
    </div>
  {/if}

  {#if isLoading && !stats}
    <div class="card loading-card">
      <div class="spinner"></div>
      <p class="muted">Počítám statistiky registru a výskyt variant...</p>
    </div>
  {:else if stats}
    <!-- 1. Hero Summary KPIs -->
    <div class="metrics-grid">
      <div class="card metric-card">
        <span class="metric-label">Pacienti v registru</span>
        <h3 class="metric-value">{stats.summary.total_patients}</h3>
        <span class="metric-subtext">Unikátní vyšetřované osoby</span>
      </div>

      <div class="card metric-card">
        <span class="metric-label">Diagnostické reporty</span>
        <h3 class="metric-value">{stats.summary.total_reports}</h3>
        <span class="metric-subtext">Importované soubory výsledků</span>
      </div>

      <div class="card metric-card">
        <span class="metric-label">Zachycené varianty</span>
        <h3 class="metric-value">{stats.summary.total_patient_variants}</h3>
        <span class="metric-subtext">Všechna alelická pozorování</span>
      </div>

      <div class="card metric-card">
        <span class="metric-label">Unikátní varianty</span>
        <h3 class="metric-value">{stats.summary.total_unique_variants}</h3>
        <span class="metric-subtext">Různé mutační pozice</span>
      </div>

      <div class="card metric-card highlight">
        <span class="metric-label">Patogenní nálezy (Tř. 4–5)</span>
        <h3 class="metric-value">
          {stats.summary.pathogenic_patients}
          <small>({stats.summary.pathogenic_patients_percentage}%)</small>
        </h3>
        <span class="metric-subtext">Pacienti s klinickým záchytem</span>
      </div>
    </div>

    <!-- 2. Mid Section: Pathogenicity Breakdown + Top Genes -->
    <div class="analytics-grid">
      <!-- ACMG Pathogenicity Breakdown -->
      <div class="card analytics-panel">
        <div class="panel-head">
          <div>
            <h3>Klasifikace patogenity (ACMG)</h3>
            <p class="muted">Procentuální a početní zastoupení tříd patogenity v datech</p>
          </div>
          {#if stats.categories_breakdown.length > 0}
            <div class="selection-summary-badge" class:has-filter={!isAllSelected}>
              <span class="summary-count">
                Vybráno: <strong>{totalSelectedCount.toLocaleString()}</strong> z {totalPossibleCount.toLocaleString()} var.
              </span>
              <span class="summary-pct">({selectedCountPercentage}%)</span>
            </div>
          {/if}
        </div>

        {#if stats.categories_breakdown.length === 0}
          <p class="muted empty-note">V databázi zatím nejsou žádná klasifikovaná data.</p>
        {:else}
          <!-- Category selection quick filter toolbar -->
          <div class="category-filter-toolbar">
            <span class="filter-label">Rychlý výběr:</span>
            <div class="filter-chips-list">
              <button
                type="button"
                class="filter-chip-btn {isAllSelected ? 'active' : ''}"
                onclick={selectAllCategories}
                title="Zahrnout všechny kategorie"
              >
                Všechny ({stats.categories_breakdown.length})
              </button>

              {#if hasUnclassified}
                <button
                  type="button"
                  class="filter-chip-btn chip-action-exclude {isWithoutUnclassified ? 'active' : ''}"
                  onclick={selectWithoutUnclassified}
                  title="Vyřadit kategorii -1 (nezařazené) a ponechat klasifikované třídy"
                >
                  ✕ Bez -1
                </button>
              {/if}

              <button
                type="button"
                class="filter-chip-btn {isOnlyPathogenic ? 'active' : ''}"
                onclick={selectOnlyPathogenic}
                title="Pouze patogenní a pravděpodobně patogenní nálezy (třídy 4 a 5)"
              >
                Patogenní (4–5)
              </button>

              <button
                type="button"
                class="filter-chip-btn"
                onclick={selectVusAndBenign}
                title="Pouze VUS a benigní varianty (třídy 1 až 3)"
              >
                VUS & Benigní
              </button>

              <button
                type="button"
                class="filter-chip-btn text-btn {isNoneSelected ? 'active' : ''}"
                onclick={deselectAllCategories}
                title="Zrušit výběr všech kategorií"
              >
                Zrušit výběr
              </button>
            </div>
          </div>

          <!-- Segmented proportional bar -->
          {#if totalSelectedCount === 0}
            <div class="distribution-bar empty" title="Nevybrána žádná kategorie">
              <span class="empty-bar-text">Nevybrána žádná kategorie pro zobrazení distribuce</span>
            </div>
          {:else}
            <div class="distribution-bar" title="Distribuce vybraných klasifikací ({totalSelectedCount} variant)">
              {#each stats.categories_breakdown as cat}
                {#if isCategorySelected(cat.category)}
                  {@const relPct = getRelativePercentage(cat.count)}
                  {#if relPct > 0}
                    <div
                      class="distribution-segment {cat.color_class}"
                      style="width: {relPct}%"
                      title="{cat.label}: {cat.count.toLocaleString()} var. ({relPct}% z vybraných, celkově {cat.percentage}%)"
                    ></div>
                  {/if}
                {/if}
              {/each}
            </div>
          {/if}

          <!-- Category items breakdown list -->
          <div class="category-list">
            {#each stats.categories_breakdown as cat}
              {@const isSelected = isCategorySelected(cat.category)}
              {@const relPct = getRelativePercentage(cat.count)}
              <div
                class="category-item {isSelected ? 'selected' : 'deselected'}"
                onclick={() => toggleCategory(cat.category)}
                role="button"
                tabindex="0"
                onkeydown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleCategory(cat.category);
                  }
                }}
                title={isSelected ? 'Kliknutím vyřadíte tuto třídu z přehledu' : 'Kliknutím zahrnete tuto třídu do přehledu'}
              >
                <div class="category-badge-wrap">
                  <input
                    type="checkbox"
                    class="category-checkbox"
                    checked={isSelected}
                    onclick={(e) => e.stopPropagation()}
                    onchange={() => toggleCategory(cat.category)}
                    aria-label="Přepnout kategorii {cat.label}"
                  />
                  <span class="category {cat.color_class}">
                    {cat.category !== null ? categoryRepr(cat.category) : '—'}
                  </span>
                  <span class="category-title">{cat.label}</span>
                </div>
                <div class="category-stats">
                  <span class="category-count"><strong>{cat.count.toLocaleString()}</strong> var.</span>
                  <div class="category-pct-group">
                    {#if isSelected}
                      <span class="category-pct" title="Relativní podíl mezi vybranými kategoriemi">
                        {relPct}%
                      </span>
                      {#if !isAllSelected}
                        <span class="category-pct-global muted" title="Celkový podíl v databázi">
                          ({cat.percentage}%)
                        </span>
                      {/if}
                    {:else}
                      <span class="category-pct muted strike" title="Kategorie je vyřazena z výběru">
                        —
                      </span>
                      <span class="category-pct-global muted" title="Celkový podíl v databázi">
                        ({cat.percentage}%)
                      </span>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>

          <!-- Zygosity Pills -->
          <div class="zygosity-section">
            <span class="section-microtitle">Zastoupení zygosity:</span>
            <div class="zygosity-pills">
              {#each stats.zygosities_breakdown as zyg}
                <span class="pill zygosity-pill">
                  {zyg.label}: <strong>{zyg.count}</strong> ({zyg.percentage}%)
                </span>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Top Mutated Genes -->
      <div class="card analytics-panel">
        <div class="panel-head">
          <div>
            <h3>Nejčastěji mutované geny</h3>
            <p class="muted">Geny s nejvyšším počtem pacientů nesoucích variantu</p>
          </div>
        </div>

        {#if stats.top_genes.length === 0}
          <p class="muted empty-note">V databázi zatím nejsou zaznamenány žádné geny.</p>
        {:else}
          <div class="genes-list">
            {#each stats.top_genes as gene, index}
              <div class="gene-item">
                <div class="gene-rank">#{index + 1}</div>
                <div class="gene-info">
                  <div class="gene-row">
                    <span class="gene-symbol">{gene.symbol}</span>
                    <span class="gene-patients">
                      <strong>{gene.patient_count}</strong>
                      {gene.patient_count === 1
                        ? 'pacient'
                        : gene.patient_count < 5
                          ? 'pacienti'
                          : 'pacientů'}
                      <span class="muted">({gene.variant_count} var.)</span>
                    </span>
                  </div>
                  <div class="gene-bar-bg">
                    <div class="gene-bar-fill" style="width: {gene.percentage}%"></div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- 3. Recurrent Variants Table -->
    <div class="card table-card">
      <div class="panel-head">
        <div>
          <h3>Nejčastější rekurentní varianty v populaci</h3>
          <p class="muted">
            Varianty nalezené u více pacientů v kohortě (populační hotspoty a časté alely)
          </p>
        </div>
        {#if !isAllSelected && stats.recurrent_variants.length > 0}
          <div class="recurrent-filter-toggle">
            <label class="filter-switch-label" title="Filtrovat tabulku podle výběru kategorií výše">
              <input
                type="checkbox"
                bind:checked={syncRecurrentWithSelection}
              />
              <span>Filtrovat podle výběru nahoře ({displayedRecurrentVariants.length}/{stats.recurrent_variants.length})</span>
            </label>
          </div>
        {/if}
      </div>

      {#if stats.recurrent_variants.length === 0}
        <div class="empty-state">
          <p class="muted">
            Zatím nebyly zachyceny žádné rekurentní varianty sdílené mezi více pacienty.
          </p>
        </div>
      {:else if displayedRecurrentVariants.length === 0}
        <div class="empty-state">
          <p class="muted">
            Žádná rekurentní varianta neodpovídá aktuálně vybraným kategoriím.
          </p>
          <button type="button" class="ghost btn-sm" onclick={selectAllCategories}>
            Zobrazit všechny kategorie
          </button>
        </div>
      {:else}
        <div class="recurrent-table-wrap">
          <table class="recurrent-table">
            <thead>
              <tr>
                <th>Gen</th>
                <th>HGVS c.</th>
                <th>dbSNP</th>
                <th>Genomická pozice</th>
                <th>Počet pacientů</th>
                <th>Interní třída</th>
                <th>ClinVar</th>
              </tr>
            </thead>
            <tbody>
              {#each displayedRecurrentVariants as item}
                <tr>
                  <td>
                    <span class="gene-badge">{item.gene}</span>
                  </td>
                  <td>
                    <span class="mono-text">{item.hgvs_c || '—'}</span>
                  </td>
                  <td>
                    {#if item.dbsnp && item.dbsnp !== '—'}
                      <a
                        href="https://www.ncbi.nlm.nih.gov/snp/{item.dbsnp}"
                        target="_blank"
                        rel="noreferrer"
                        class="dbsnp-link mono-text"
                      >
                        {item.dbsnp}
                      </a>
                    {:else}
                      <span class="muted mono-text">—</span>
                    {/if}
                  </td>
                  <td>
                    <span class="mono-text coord-pill">{item.chromosome}:{item.position}</span>
                  </td>
                  <td>
                    <span class="patient-count-badge">
                      <strong>{item.patient_count}</strong>
                      {item.patient_count === 1
                        ? 'pacient'
                        : item.patient_count < 5
                          ? 'pacienti'
                          : 'pacientů'}
                    </span>
                  </td>
                  <td>
                    {#if item.category !== null && item.category !== undefined}
                      <span class={categoryClass(item.category)}>
                        {categoryRepr(item.category)}
                      </span>
                    {:else}
                      <span class="muted">—</span>
                    {/if}
                  </td>
                  <td>
                    {#if item.clinvar_id}
                      <a
                        href={clinvarVariantUrl(item.clinvar_id)}
                        target="_blank"
                        rel="noreferrer"
                        class="clinvar-badge {categoryClass(item.clinvar_classification)}"
                        title="Zobrazit v databázi NCBI ClinVar (ID {item.clinvar_id})"
                      >
                        ClinVar {item.clinvar_classification !== null
                          ? categoryRepr(item.clinvar_classification)
                          : 'VCV'}
                      </a>
                    {:else}
                      <span class="muted">—</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>

    <!-- 4. Recent Reports Section -->
    <div class="card recent-reports-card">
      <div class="panel-head">
        <div>
          <h3>Poslední importované reporty</h3>
          <p class="muted">Přehled nedávno zpracovaných souborů a pacientů</p>
        </div>
      </div>

      {#if stats.recent_reports.length === 0}
        <p class="muted empty-note">Žádné importy zatím neproběhly.</p>
      {:else}
        <div class="recent-reports-grid">
          {#each stats.recent_reports as report}
            <div class="report-box">
              <div class="report-box-header">
                <span class="report-icon">📄</span>
                <span class="report-filename" title={report.report_name}>{report.report_name}</span>
              </div>
              <div class="report-box-meta">
                <span>Pacient: <strong>{report.patient_name}</strong></span>
                <span>Varianty: <strong>{report.variants_count}</strong></span>
              </div>
              <div class="report-box-footer">
                <span class="muted date-text">{report.created_at}</span>
                <span class="uploader-chip">{report.created_by}</span>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .dashboard-page {
    display: flex;
    flex-direction: column;
    gap: 24px;
    animation: lift 0.5s ease both;
  }

  /* Header */
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 24px 28px;
    box-shadow: var(--shadow);
  }

  .header-info h2 {
    font-size: 1.75rem;
    margin-top: 4px;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }

  .clinvar-sync-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(63, 111, 116, 0.1);
    color: var(--teal);
    border: 1px solid rgba(63, 111, 116, 0.2);
    border-radius: 999px;
    padding: 8px 16px;
    font-size: 13px;
  }

  .pulse-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25);
  }

  .refresh-btn {
    padding: 10px 18px;
    font-size: 14px;
  }

  /* Hero KPI Metrics */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .metric-card {
    padding: 22px 24px;
    border-radius: 18px;
    background: var(--surface);
    border: 1px solid var(--line);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
  }

  .metric-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 28px -18px rgba(20, 18, 16, 0.25);
  }

  .metric-card.highlight {
    background: linear-gradient(135deg, rgba(201, 107, 60, 0.08) 0%, rgba(251, 247, 242, 1) 100%);
    border-color: rgba(201, 107, 60, 0.35);
  }

  .metric-label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--ink-soft);
    font-weight: 600;
  }

  .metric-value {
    font-size: 2.2rem;
    font-weight: 700;
    margin: 8px 0 4px;
    color: var(--ink);
    letter-spacing: -0.02em;
  }

  .metric-value small {
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--accent);
  }

  .metric-subtext {
    font-size: 12.5px;
    color: var(--ink-soft);
  }

  /* Mid Section Grid */
  .panel-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    flex-wrap: wrap;
  }

  .selection-summary-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(63, 111, 116, 0.08);
    border: 1px solid rgba(63, 111, 116, 0.25);
    border-radius: 999px;
    padding: 5px 12px;
    font-size: 12px;
    color: var(--teal);
  }

  .selection-summary-badge.has-filter {
    background: rgba(201, 107, 60, 0.12);
    border-color: rgba(201, 107, 60, 0.35);
    color: #b3411f;
  }

  .summary-count strong {
    font-weight: 700;
  }

  .summary-pct {
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 600;
  }

  /* Category Filter Toolbar */
  .category-filter-toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    background: rgba(0, 0, 0, 0.025);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 8px 12px;
  }

  .filter-label {
    font-size: 11.5px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-soft);
    font-weight: 600;
  }

  .filter-chips-list {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .filter-chip-btn {
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 999px;
    background: #fff;
    color: var(--ink);
    border: 1px solid var(--line);
    cursor: pointer;
    font-weight: 500;
    transition: all 0.15s ease;
  }

  .filter-chip-btn:hover {
    border-color: var(--teal);
    color: var(--teal);
  }

  .filter-chip-btn.active {
    background: var(--teal);
    color: #fff;
    border-color: var(--teal);
    font-weight: 600;
  }

  .filter-chip-btn.chip-action-exclude {
    background: #fff;
    border-color: rgba(201, 107, 60, 0.35);
    color: #b3411f;
    font-weight: 600;
  }

  .filter-chip-btn.chip-action-exclude:hover {
    background: rgba(201, 107, 60, 0.12);
  }

  .filter-chip-btn.chip-action-exclude.active {
    background: #b3411f;
    color: #fff;
    border-color: #b3411f;
  }

  .filter-chip-btn.text-btn {
    background: transparent;
    border-color: transparent;
    color: var(--ink-soft);
    font-size: 11.5px;
  }

  .filter-chip-btn.text-btn:hover {
    color: var(--ink);
    text-decoration: underline;
  }

  .analytics-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
    gap: 20px;
  }

  .analytics-panel {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  /* Proportional Distribution Bar */
  .distribution-bar {
    height: 16px;
    border-radius: 999px;
    overflow: hidden;
    display: flex;
    background: rgba(0, 0, 0, 0.06);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .distribution-bar.empty {
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.03);
    border: 1px dashed var(--line);
    box-shadow: none;
  }

  .empty-bar-text {
    font-size: 11.5px;
    color: var(--ink-soft);
    font-style: italic;
  }

  .distribution-segment {
    height: 100%;
    transition: width 0.4s ease;
  }

  /* Segment colors */
  .distribution-segment.c5 {
    background-color: #ef4444;
  }
  .distribution-segment.c4-5 {
    background-color: #f87171;
  }
  .distribution-segment.c4 {
    background-color: #f97316;
  }
  .distribution-segment.c3-4 {
    background-color: #fb923c;
  }
  .distribution-segment.c3 {
    background-color: #8b5cf6;
  }
  .distribution-segment.c2-3 {
    background-color: #a78bfa;
  }
  .distribution-segment.c2 {
    background-color: #34d399;
  }
  .distribution-segment.c1-2 {
    background-color: #6ee7b7;
  }
  .distribution-segment.c1 {
    background-color: #10b981;
  }
  .distribution-segment.c0 {
    background-color: #94a3b8;
  }
  .distribution-segment.c-1 {
    background-color: #78716c;
  }

  /* Category List */
  .category-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .category-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid var(--line);
    font-size: 13.5px;
    cursor: pointer;
    user-select: none;
    transition: all 0.15s ease;
  }

  .category-item:hover {
    background: #fff;
    border-color: rgba(63, 111, 116, 0.4);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .category-item.deselected {
    opacity: 0.42;
    background: rgba(0, 0, 0, 0.015);
    border-style: dashed;
  }

  .category-item.deselected:hover {
    opacity: 0.75;
  }

  .category-checkbox {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: var(--teal);
    border-radius: 4px;
    flex-shrink: 0;
  }

  .category-badge-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .category-title {
    font-weight: 500;
    color: var(--ink);
  }

  .category-stats {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .category-count {
    color: var(--ink);
    font-size: 13px;
  }

  .category-pct-group {
    display: flex;
    align-items: baseline;
    gap: 6px;
    min-width: 95px;
    justify-content: flex-end;
  }

  .category-pct {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--teal);
    text-align: right;
  }

  .category-pct.strike {
    color: var(--ink-soft);
    font-weight: normal;
  }

  .category-pct-global {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    color: var(--ink-soft);
  }

  /* Recurrent Table Filter Toggle */
  .recurrent-filter-toggle {
    display: inline-flex;
    align-items: center;
  }

  .filter-switch-label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 12.5px;
    color: var(--ink);
    cursor: pointer;
    background: rgba(63, 111, 116, 0.06);
    border: 1px solid rgba(63, 111, 116, 0.2);
    padding: 4px 10px;
    border-radius: 999px;
    transition: all 0.15s ease;
  }

  .filter-switch-label:hover {
    background: rgba(63, 111, 116, 0.12);
  }

  .filter-switch-label input {
    accent-color: var(--teal);
    cursor: pointer;
  }

  .zygosity-section {
    padding-top: 10px;
    border-top: 1px dashed var(--line);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .section-microtitle {
    font-size: 11.5px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--ink-soft);
    font-weight: 600;
  }

  .zygosity-pills {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .zygosity-pill {
    font-size: 12px;
    background: rgba(63, 111, 116, 0.08);
  }

  /* Genes list */
  .genes-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .gene-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 0;
  }

  .gene-rank {
    font-size: 12px;
    font-weight: 700;
    color: var(--ink-soft);
    width: 24px;
    text-align: center;
  }

  .gene-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .gene-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 13.5px;
  }

  .gene-symbol {
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 700;
    font-size: 14.5px;
    color: var(--teal);
  }

  .gene-patients {
    font-size: 13px;
  }

  .gene-bar-bg {
    height: 7px;
    background: rgba(0, 0, 0, 0.06);
    border-radius: 999px;
    overflow: hidden;
  }

  .gene-bar-fill {
    height: 100%;
    background: var(--teal);
    border-radius: 999px;
    transition: width 0.3s ease;
  }

  /* Table Card */
  .table-card {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .recurrent-table-wrap {
    overflow-x: auto;
  }

  .recurrent-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 8px;
    font-size: 13.5px;
  }

  .recurrent-table th {
    text-align: left;
    padding: 8px 12px;
    font-size: 11.5px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--ink-soft);
    font-weight: 600;
    border-bottom: 1px solid var(--line);
  }

  .recurrent-table td {
    padding: 12px 14px;
    background: #fff;
    vertical-align: middle;
  }

  .recurrent-table tr td:first-child {
    border-top-left-radius: 12px;
    border-bottom-left-radius: 12px;
  }

  .recurrent-table tr td:last-child {
    border-top-right-radius: 12px;
    border-bottom-right-radius: 12px;
  }

  .gene-badge {
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 700;
    color: var(--teal);
  }

  .mono-text {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
  }

  .dbsnp-link {
    color: var(--accent);
    text-decoration: none;
    font-weight: 500;
  }

  .dbsnp-link:hover {
    text-decoration: underline;
  }

  .coord-pill {
    padding: 4px 8px;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.04);
    font-size: 12px;
  }

  .patient-count-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(201, 107, 60, 0.12);
    color: var(--accent);
    font-size: 12.5px;
  }

  /* Recent Reports */
  .recent-reports-card {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .recent-reports-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 14px;
  }

  .report-box {
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .report-box-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .report-icon {
    font-size: 16px;
  }

  .report-filename {
    font-weight: 600;
    font-size: 13.5px;
    color: var(--ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .report-box-meta {
    display: flex;
    justify-content: space-between;
    font-size: 12.5px;
    color: var(--ink-soft);
  }

  .report-box-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 4px;
    padding-top: 6px;
    border-top: 1px dashed rgba(0, 0, 0, 0.08);
  }

  .date-text {
    font-size: 11.5px;
  }

  .uploader-chip {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(63, 111, 116, 0.08);
    color: var(--teal);
    font-weight: 500;
  }

  /* States */
  .loading-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    gap: 16px;
  }

  .spinner {
    width: 36px;
    height: 36px;
    border: 3px solid rgba(63, 111, 116, 0.2);
    border-top-color: var(--teal);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .empty-note {
    padding: 20px 0;
    font-style: italic;
  }

  .empty-state {
    padding: 30px 10px;
    text-align: center;
  }

  .error-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(201, 107, 60, 0.12);
    color: #b3411f;
    padding: 12px 18px;
    border-radius: 14px;
    border: 1px solid rgba(201, 107, 60, 0.3);
  }

  @media (max-width: 960px) {
    .analytics-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
