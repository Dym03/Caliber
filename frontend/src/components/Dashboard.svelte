<script lang="ts">
  import { onMount } from 'svelte'
  import { apiUrl } from '../lib/api'
  import type { DashboardStatsResponse } from '../types/stats'
  import { categoryClass, clinvarVariantUrl } from '../lib/utils'

  interface Props {
    onunauthorized?: () => void
  }

  let { onunauthorized }: Props = $props()

  let stats = $state<DashboardStatsResponse | null>(null)
  let isLoading = $state(true)
  let errorMessage = $state('')

  const loadStats = async () => {
    isLoading = true
    errorMessage = ''
    try {
      const response = await fetch(apiUrl('/api/stats/'))
      if (response.status === 401) {
        onunauthorized?.()
        return
      }
      if (!response.ok) {
        throw new Error('Chyba při stahování statistik databáze.')
      }
      stats = (await response.json()) as DashboardStatsResponse
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Nepodařilo se načíst data.'
    } finally {
      isLoading = false
    }
  }

  onMount(() => {
    loadStats()
  })
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
          <span>ClinVar: <strong>{(stats.summary.total_clinvar_variants / 1000000).toFixed(2)}M</strong> (Aktualizováno: {stats.summary.clinvar_last_updated})</span>
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
        <h3 class="metric-value">{stats.summary.pathogenic_patients} <small>({stats.summary.pathogenic_patients_percentage}%)</small></h3>
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
        </div>

        {#if stats.categories_breakdown.length === 0}
          <p class="muted empty-note">V databázi zatím nejsou žádná klasifikovaná data.</p>
        {:else}
          <!-- Segmented proportional bar -->
          <div class="distribution-bar" title="Distribuce klasifikací">
            {#each stats.categories_breakdown as cat}
              {#if cat.percentage > 0}
                <div
                  class="distribution-segment {cat.color_class}"
                  style="width: {cat.percentage}%"
                  title="{cat.label}: {cat.count} ({cat.percentage}%)"
                ></div>
              {/if}
            {/each}
          </div>

          <!-- Category items breakdown list -->
          <div class="category-list">
            {#each stats.categories_breakdown as cat}
              <div class="category-item">
                <div class="category-badge-wrap">
                  <span class="category {cat.color_class}">
                    {cat.category !== null ? cat.category : '—'}
                  </span>
                  <span class="category-title">{cat.label}</span>
                </div>
                <div class="category-stats">
                  <span class="category-count"><strong>{cat.count}</strong> var.</span>
                  <span class="category-pct">{cat.percentage}%</span>
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
                      <strong>{gene.patient_count}</strong> {gene.patient_count === 1 ? 'pacient' : gene.patient_count < 5 ? 'pacienti' : 'pacientů'}
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
      </div>

      {#if stats.recurrent_variants.length === 0}
        <div class="empty-state">
          <p class="muted">Zatím nebyly zachyceny žádné rekurentní varianty sdílené mezi více pacienty.</p>
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
              {#each stats.recurrent_variants as item}
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
                      <strong>{item.patient_count}</strong> {item.patient_count === 1 ? 'pacient' : item.patient_count < 5 ? 'pacienti' : 'pacientů'}
                    </span>
                  </td>
                  <td>
                    {#if item.category !== null && item.category !== undefined}
                      <span class="{categoryClass(item.category)}">
                        {item.category}
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
                        ClinVar {item.clinvar_classification !== null ? item.clinvar_classification : 'VCV'}
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
    transition: transform 0.2s ease, box-shadow 0.2s ease;
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
    height: 14px;
    border-radius: 999px;
    overflow: hidden;
    display: flex;
    background: rgba(0, 0, 0, 0.06);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .distribution-segment {
    height: 100%;
    transition: width 0.4s ease;
  }

  /* Segment colors */
  .distribution-segment.c5 { background-color: #ef4444; }
  .distribution-segment.c4-5 { background-color: #f87171; }
  .distribution-segment.c4 { background-color: #f97316; }
  .distribution-segment.c3-4 { background-color: #fb923c; }
  .distribution-segment.c3 { background-color: #8b5cf6; }
  .distribution-segment.c2-3 { background-color: #a78bfa; }
  .distribution-segment.c2 { background-color: #34d399; }
  .distribution-segment.c1-2 { background-color: #6ee7b7; }
  .distribution-segment.c1 { background-color: #10b981; }
  .distribution-segment.c0 { background-color: #94a3b8; }
  .distribution-segment.c-1 { background-color: #78716c; }
  
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

  .category-pct {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12.5px;
    color: var(--ink-soft);
    min-width: 45px;
    text-align: right;
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
    to { transform: rotate(360deg); }
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

