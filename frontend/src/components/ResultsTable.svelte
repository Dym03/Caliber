<script lang="ts">
  import VariantModal from './VariantModal.svelte';
  import type { Variant, PatientObservation } from '../types/variant';
  import type { PaginationMeta } from '../types/pagination';
  import { categoryClass, clinvarVariantUrl, categoryRepr } from '../lib/utils';

  interface Props {
    results: Variant[]
    meta: PaginationMeta | null
    currentSort?: string
    onrefresh: () => void
    onpagechange: (page: number) => void
    onsortchange?: (sort: string) => void
    ondeleted?: (detail: { type: 'variant' | 'report'; id: number; message: string }) => void
  }

  let { 
    results, 
    meta, 
    currentSort = 'genomic',
    onrefresh, 
    onpagechange, 
    onsortchange, 
    ondeleted 
  }: Props = $props();

  let selectedVariant = $state<Variant | null>(null);
  let selectedPatient = $state<PatientObservation | null>(null);

  // Store user explicit toggles (true = opened by user, false = closed by user)
  let userToggles = $state<Record<string, boolean>>({});
  // Set of expanded patient history IDs
  let expandedHistories = $state<Record<number, boolean>>({});

  const getVariantKey = (v: Variant, index: number): string => {
    return v.variant_id ? String(v.variant_id) : `${v.chromosome}-${v.position}-${v.variant}-${index}`;
  };

  const isVariantExpanded = (item: Variant, key: string): boolean => {
    if (key in userToggles) {
      return userToggles[key];
    }
    // Auto-expand by default if this variant contains the searched patient
    return !!(item.patients && item.patients.some((p) => p.is_searched_patient));
  };

  const toggleExpand = (item: Variant, key: string) => {
    const currentState = isVariantExpanded(item, key);
    userToggles[key] = !currentState;
  };

  const toggleHistory = (pvId: number, e: MouseEvent) => {
    e.stopPropagation();
    expandedHistories[pvId] = !expandedHistories[pvId];
  };

  const openModal = (variant: Variant, patient: PatientObservation | null = null, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    selectedVariant = variant;
    selectedPatient = patient;
  };

  const closeModal = () => {
    selectedVariant = null;
    selectedPatient = null;
  };

  const formatDate = (value: string | null | undefined) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    return `${day}-${month}-${year}`;
  };

  const handleSortSelect = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    onsortchange?.(target.value);
  };
</script>

<div class="card list">
  <div class="list-head">
    <div>
      <h2>Výsledky hledání variant</h2>
      {#if meta?.is_fallback}
        <p class="muted warning-banner">
          ⚠️ Nenašli jsme shodu v klinických záznamech. Zobrazujeme referenční katalog ClinVar.
        </p>
      {:else}
        <p class="muted">
          Shluknutý přehled variant. Kliknutím na řádek rozbalíte seznam pacientů a jejich hodnocení.
        </p>
      {/if}
    </div>
    
    <div class="list-actions">
      {#if onsortchange}
        <label class="sort-selector-wrap">
          <span class="sort-label">Řadit:</span>
          <select class="sort-select" value={currentSort} onchange={handleSortSelect}>
            <option value="genomic">Genomicky (Chr, Pozice)</option>
            <option value="patients">Nejvíce pacientů</option>
            <option value="latest">Nejnovější hodnocení</option>
          </select>
        </label>
      {/if}

      <button type="button" class="ghost" onclick={onrefresh}>
        Obnovit
      </button>
    </div>
  </div>
  
  <div class="variant-grouped-table">
    <div class="table-header-row">
      <span class="col-expand"></span>
      <span class="col-gene">Gen</span>
      <span class="col-variant">Varianta (HGVS)</span>
      <span class="col-dbsnp">dbSNP</span>
      <span class="col-coord">Chr:Pozice</span>
      <span class="col-patients">Pacienti</span>
      <span class="col-latest-eval">Poslední hodnocení</span>
      <span class="col-clinvar">ClinVar</span>
      <span class="col-actions">Akce</span>
    </div>

    {#if results.length === 0}
      <div class="row empty-row">
        <span class="muted">Žádná shoda pro zadaná vyhledávací kritéria</span>
      </div>
    {:else}
      {#each results as item, index}
        {@const vKey = getVariantKey(item, index)}
        {@const isExpanded = isVariantExpanded(item, vKey)}
        
        <div class="variant-item-card {isExpanded ? 'is-expanded' : ''} {item.source === 'clinvar_catalog' ? 'catalog-card' : ''}">
          <!-- Level 1: Variant Summary Row -->
          <div 
            class="variant-summary-row" 
            onclick={() => toggleExpand(item, vKey)}
            role="button"
            tabindex="0"
            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(item, vKey); } }}
          >
            <div class="col-expand">
              <span class="chevron-icon {isExpanded ? 'chevron-down' : ''}">▸</span>
            </div>

            <div class="col-gene">
              <span class="pill gene-pill">{item.gene}</span>
            </div>

            <div class="col-variant">
              <span class="selectable mono bold" title={item.variant || ''}>
                {item.variant || '—'}
              </span>
            </div>

            <div class="col-dbsnp">
              <span class="selectable mono muted" title={item.dbsnp || ''}>
                {item.dbsnp || '—'}
              </span>
            </div>

            <div class="col-coord">
              <span class="mono text-sm">{item.chromosome || '—'}:{item.position ?? '—'}</span>
            </div>

            <div class="col-patients">
              {#if item.source === 'clinic'}
                <span class="patient-count-badge" class:has-patients={item.patients_count > 0}>
                  👥 {item.patients_count} {item.patients_count === 1 ? 'pacient' : (item.patients_count >= 2 && item.patients_count <= 4 ? 'pacienti' : 'pacientů')}
                </span>
              {:else}
                <span class="patient-count-badge zero">
                  0 (pouze katalog)
                </span>
              {/if}
            </div>

            <div class="col-latest-eval">
              {#if item.latest_category !== null && item.latest_category !== undefined}
                <div class="latest-cat-wrap">
                  <span class={categoryClass(item.latest_category)}>
                    {categoryRepr(item.latest_category)}
                  </span>
                  {#if item.latest_updated_at}
                    <span class="muted text-xs">{formatDate(item.latest_updated_at)}</span>
                  {/if}
                  {#if item.has_conflicting_categories}
                    <span class="conflict-dot" title="Rozdílná hodnocení u pacientů: {item.categories_summary}">⚠️</span>
                  {/if}
                </div>
              {:else}
                <span class="muted">—</span>
              {/if}
            </div>

            <div class="col-clinvar">
              {#if item.clinvar?.id}
                <a 
                  class="{categoryClass(item.clinvar?.score)} clinvar-badge" 
                  target="_blank" 
                  rel="noreferrer" 
                  href={clinvarVariantUrl(item.clinvar?.id)}
                  onclick={(e) => e.stopPropagation()}
                >
                  {categoryRepr(item.clinvar?.score) || 'ClinVar'} ↗
                </a>
              {:else}
                <span class="muted text-xs">—</span>
              {/if}
            </div>

            <div class="col-actions">
              <button 
                type="button" 
                class="ghost btn-sm expand-btn"
                onclick={(e) => { e.stopPropagation(); toggleExpand(item, vKey); }}
                title={isExpanded ? 'Sbalit pacienty' : 'Rozbalit pacienty'}
              >
                {isExpanded ? 'Sbalit' : 'Pacienti'}
              </button>
            </div>
          </div>

          <!-- Level 2: Nested Patient Observations List -->
          {#if isExpanded}
            <div class="nested-patients-container">
              {#if item.source === 'clinic' && item.patients && item.patients.length > 0}
                <div class="nested-header">
                  <div class="nested-title">
                    <h4>Pacienti s touto variantou ({item.patients.length} unikátních)</h4>
                    {#if item.has_conflicting_categories}
                      <span class="conflict-badge">
                        ⚠️ Neshoda v hodnocení: rozpětí {item.categories_summary}
                      </span>
                    {/if}
                  </div>
                </div>

                <div class="patients-table">
                  <div class="patients-table-head">
                    <span class="p-col-id">Pacient ID</span>
                    <span class="p-col-cat">Hodnocení</span>
                    <span class="p-col-zyg">Zygosita</span>
                    <span class="p-col-report">Report a datum</span>
                    <span class="p-col-user">Vytvořil</span>
                    <span class="p-col-history">Historie</span>
                    <span class="p-col-actions">Detail</span>
                  </div>

                  {#each item.patients as p}
                    {@const isHistoryExpanded = !!expandedHistories[p.patient_variant_id]}
                    <div class="patient-entry-row {p.is_searched_patient ? 'is-searched-target' : ''}">
                      <div class="p-col-id">
                        <span class="selectable bold">{p.patient_id}</span>
                        {#if p.is_searched_patient}
                          <span class="searched-pill">Hledaný</span>
                        {/if}
                      </div>

                      <div class="p-col-cat">
                        <span class={categoryClass(p.category)}>
                          {categoryRepr(p.category)}
                        </span>
                      </div>

                      <div class="p-col-zyg">
                        <span class="mono text-xs">{p.zygosity || '—'}</span>
                      </div>

                      <div class="p-col-report">
                        <div class="report-cell">
                          <span class="report-name" title={p.report_name}>{p.report_name}</span>
                          <span class="muted text-xs">{formatDate(p.updated_at)}</span>
                        </div>
                      </div>

                      <div class="p-col-user">
                        <span class="muted text-xs">{p.created_by}</span>
                      </div>

                      <div class="p-col-history">
                        {#if p.history_count > 0}
                          <button 
                            type="button" 
                            class="history-pill-btn {isHistoryExpanded ? 'active' : ''}"
                            onclick={(e) => toggleHistory(p.patient_variant_id, e)}
                            title="Zobrazit historii starších hodnocení"
                          >
                            🕐 {p.history_count} {p.history_count === 1 ? 'starší' : 'starší'}
                          </button>
                        {:else}
                          <span class="muted text-xs">Původní</span>
                        {/if}
                      </div>

                      <div class="p-col-actions">
                        <button 
                          type="button" 
                          class="full-click-action-btn"
                          onclick={(e) => openModal(item, p, e)}
                          title="Zobrazit detail záznamu a možnosti správy"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <!-- Inline History Drawer for this patient -->
                    {#if isHistoryExpanded && p.history && p.history.length > 0}
                      <div class="patient-history-drawer">
                        <div class="history-drawer-header">
                          <span class="text-xs bold uppercase">Historie reklasifikací pro pacienta {p.patient_id}:</span>
                        </div>
                        <div class="history-drawer-list">
                          {#each p.history as h}
                            <div class="history-drawer-item">
                              <span class={categoryClass(h.category)}>{categoryRepr(h.category)}</span>
                              <span class="text-xs bold">{formatDate(h.updated_at)}</span>
                              <span class="muted text-xs">Report: {h.report_name}</span>
                              {#if h.zygosity}
                                <span class="pill zyg-pill-sm">{h.zygosity}</span>
                              {/if}
                              <span class="muted text-xs">({h.created_by})</span>
                            </div>
                          {/each}
                        </div>
                      </div>
                    {/if}
                  {/each}
                </div>
              {:else}
                <div class="catalog-empty-notice">
                  <p class="muted">
                    ℹ️ Tato varianta pochází z referenčního katalogu ClinVar a v interní databázi laboratoře zatím nemá záznam pacienta.
                  </p>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  </div>

  {#if meta && meta.total_pages > 1}
    <div class="pagination-footer">
      <div class="info">
        Strana <b>{meta.current_page}</b> z {meta.total_pages} ({meta.total_count} celkem nalezených variant)
      </div>
      <div class="actions">
        <button
          type="button"
          class="ghost"
          disabled={!meta.has_previous}
          onclick={() => onpagechange(meta.current_page - 1)}
        >
          Předchozí
        </button>
        <button
          type="button"
          class="ghost"
          disabled={!meta.has_next}
          onclick={() => onpagechange(meta.current_page + 1)}
        >
          Další
        </button>
      </div>
    </div>
  {/if}
</div>

{#if selectedVariant}
  <VariantModal
    variant={selectedVariant}
    patient={selectedPatient}
    onclose={closeModal}
    ondeleted={(detail) => {
      ondeleted?.(detail);
      onrefresh();
    }}
  />
{/if}
