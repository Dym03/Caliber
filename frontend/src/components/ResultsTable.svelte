<script lang="ts">
  import VariantModal from './VariantModal.svelte';
  import type { Variant } from '../types/variant';
  import type { PaginationMeta } from '../types/pagination';
  import { categoryClass, clinvarVariantUrl, categoryRepr } from '../lib/utils';

  interface Props {
    results: Variant[];
    meta: PaginationMeta | null;
    onrefresh: () => void;
    onpagechange: (page: number) => void; // Callback to alert orchestrator of view changes
    ondeleted?: (detail: { type: 'variant' | 'report'; id: number; message: string }) => void;
  }

  let { results, meta, onrefresh, onpagechange, ondeleted }: Props = $props();

  let selectedVariant = $state<Variant | null>(null);

  const openModal = (variant: Variant) => {
    selectedVariant = variant;
  };

  const closeModal = () => {
    selectedVariant = null;
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
</script>

<div class="card list">
  <div class="list-head">
    <div>
      <h2>Výsledky hledání</h2>
      {#if meta?.is_fallback}
        <p class="muted warning-banner">
          ⚠️ Nenašli jsme shodu v klinických datech. Zobrazujeme referenční katalog ClinVar.
        </p>
      {:else}
        <p class="muted">Shodující se varianty z vašeho datasetu</p>
      {/if}
    </div>
    <button type="button" class="ghost" onclick={onrefresh}> Obnovit </button>
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
        <div class="row {item.source === 'clinvar_catalog' ? 'fallback-row' : ''}">
          <span class="selectable">{item.patient_id}</span>

          <div>
            <span class="pill">{item.gene}</span>
          </div>

          <span class="selectable mono" title={item.variant || ''}>{item.variant || '—'}</span>
          <span class="selectable mono" title={item.dbsnp || ''}>{item.dbsnp || '—'}</span>
          <span>{item.chromosome || '—'}</span>
          <span>{item.position ?? '—'}</span>
          <span>{formatDate(item.updated_at)}</span>

          <span class={categoryClass(item.category)}>{categoryRepr(item.category)}</span>

          {#if item.clinvar?.id}
            <a
              class="{categoryClass(item.clinvar?.score)} clinvar-badge"
              target="_blank"
              rel="noreferrer"
              href={clinvarVariantUrl(item.clinvar?.id)}
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"
                />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  {#if meta && meta.total_pages > 1}
    <div class="pagination-footer">
      <div class="info">
        Strana <b>{meta.current_page}</b> z {meta.total_pages} ({meta.total_count} celkem nalezených záznamů)
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
    onclose={closeModal}
    ondeleted={(detail) => {
      ondeleted?.(detail);
      onrefresh();
    }}
  />
{/if}
