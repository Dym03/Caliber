<script lang="ts">
  import type { Variant, PatientObservation } from '../types/variant'
  import { apiUrl, getCookie } from '../lib/api'
  import { categoryClass, categoryRepr, clinvarVariantUrl } from '../lib/utils'
  
  interface Props {
    variant: Variant;
    patient?: PatientObservation | null;
    onclose: () => void;
    ondeleted?: (detail: { type: 'variant' | 'report'; id: number; message: string }) => void;
  }

  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return {
      destroy() {
        node.remove();
      },
    };
  }

  let { variant, patient = null, onclose, ondeleted }: Props = $props();

  let confirmMode = $state<'variant' | 'report' | null>(null);
  let isDeleting = $state(false);
  let deleteError = $state('');

  const activePatientVariantId = $derived(
    patient?.patient_variant_id ?? variant.patient_variant_id
  );
  const activeReportId = $derived(
    patient?.report_id ?? variant.report_id
  );
  const activeReportName = $derived(
    patient?.report_name ?? variant.report_name ?? ''
  );
  const activePatientId = $derived(
    patient?.patient_id ?? variant.patient_id ?? '—'
  );
  const activeComment = $derived(
    patient?.comment ?? variant.comment ?? ''
  );
  const activeCategory = $derived(
    patient?.category !== undefined ? patient?.category : (variant.category ?? variant.latest_category)
  );
  const activeZygosity = $derived(
    patient?.zygosity ?? ''
  );
  const activeCreatedBy = $derived(
    patient?.created_by ?? variant.created_by ?? 'System'
  );
  const activeUpdatedAt = $derived(
    patient?.updated_at ?? variant.updated_at ?? variant.latest_updated_at
  );
  const activeHistory = $derived(
    patient?.history ?? []
  );

  const formatDate = (value: string | null | undefined) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear())
    return `${day}-${month}-${year}`
  }

  const handleDeleteVariant = async () => {
    if (!activePatientVariantId) return;
    isDeleting = true;
    deleteError = '';
    try {
      const response = await fetch(apiUrl(`/api/patient-variants/${activePatientVariantId}/`), {
        method: 'DELETE',
        headers: {
          'X-CSRFToken': getCookie('csrftoken'),
          Accept: 'application/json',
        },
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Smazání varianty se nezdařilo.');
      }

      ondeleted?.({
        type: 'variant',
        id: activePatientVariantId,
        message: data.message || 'Varianta byla úspěšně smazána.',
      });
      onclose();
    } catch (err) {
      deleteError = err instanceof Error ? err.message : 'Smazání varianty se nezdařilo.';
    } finally {
      isDeleting = false;
    }
  };

  const handleDeleteReport = async () => {
    if (!activeReportId) return;
    isDeleting = true;
    deleteError = '';
    try {
      const response = await fetch(apiUrl(`/api/reports/${activeReportId}/`), {
        method: 'DELETE',
        headers: {
          'X-CSRFToken': getCookie('csrftoken'),
          Accept: 'application/json',
        },
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Smazání reportu se nezdařilo.');
      }

      ondeleted?.({
        type: 'report',
        id: activeReportId,
        message: data.message || 'Report byl úspěšně smazán.',
      });
      onclose();
    } catch (err) {
      deleteError = err instanceof Error ? err.message : 'Smazání reportu se nezdařilo.';
    } finally {
      isDeleting = false;
    }
  };
</script>

<div
  class="modal-backdrop"
  use:portal
  onclick={onclose}
  onkeydown={(e) => {
    if (e.key === 'Escape') onclose();
  }}
  role="button"
  tabindex="0"
  aria-label="Zavřít modal"
>
  <div
    class="modal-content card"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
  >
    <div class="modal-header">
      <div>
        <h3>{variant.gene} · {variant.variant || 'Neznámá varianta'}</h3>
        <p class="muted modal-sub">
          {variant.chromosome}:{variant.position ?? '—'}
          {#if variant.dbsnp} · {variant.dbsnp}{/if}
        </p>
      </div>
      <button type="button" class="close-btn ghost" onclick={onclose}>✕</button>
    </div>

    <div class="modal-body">
      {#if variant.source === 'clinic'}
        <div class="patient-highlight-box">
          <div class="detail-row">
            <span class="muted">Pacient ID:</span>
            <b>{activePatientId}</b>
            {#if patient?.is_searched_patient}
              <span class="badge-searched">Hledaný pacient</span>
            {/if}
          </div>
          <div class="detail-row">
            <span class="muted">Aktuální hodnocení:</span>
            <span class={categoryClass(activeCategory)}>
              {categoryRepr(activeCategory)}
            </span>
            {#if activeZygosity}
              <span class="pill zyg-pill">{activeZygosity}</span>
            {/if}
          </div>
          <div class="detail-row">
            <span class="muted">Genetický report:</span>
            <span><b>{activeReportName || '—'}</b> ({formatDate(activeUpdatedAt)})</span>
          </div>
          <div class="detail-row">
            <span class="muted">Komentář:</span>
            <p class="modal-comment-text">{activeComment || 'Bez komentáře'}</p>
          </div>
          <div class="detail-row">
            <span class="muted">Vytvořil / nahrál:</span>
            <span>{activeCreatedBy}</span>
          </div>
        </div>

        <!-- History of former evaluations (reclassifications) for this patient -->
        {#if activeHistory.length > 0}
          <div class="history-section">
            <div class="history-title">
              <h4>Historie předchozích hodnocení ({activeHistory.length})</h4>
              <span class="muted text-xs">Dřívější reporty téže varianty u tohoto pacienta</span>
            </div>
            <div class="history-timeline">
              {#each activeHistory as histItem}
                <div class="history-timeline-item">
                  <div class="hist-badge-wrap">
                    <span class={categoryClass(histItem.category)}>
                      {categoryRepr(histItem.category)}
                    </span>
                  </div>
                  <div class="hist-content">
                    <div class="hist-meta">
                      <b>{formatDate(histItem.updated_at)}</b>
                      <span class="muted">· {histItem.report_name}</span>
                      {#if histItem.zygosity}
                        <span class="pill zyg-pill-sm">{histItem.zygosity}</span>
                      {/if}
                    </div>
                    {#if histItem.comment}
                      <p class="hist-comment">{histItem.comment}</p>
                    {/if}
                    <div class="hist-author muted">Autor: {histItem.created_by}</div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      {:else}
        <div class="catalog-note-box">
          <p>ℹ️ Tato varianta pochází z referenčního katalogu ClinVar a v interní databázi laboratoře zatím nemá záznam pacienta.</p>
        </div>
      {/if}

      <!-- ClinVar section -->
      <div class="detail-group clinvar-group">
        <span class="muted">ClinVar reference</span>
        {#if variant.clinvar?.id}
          <p>
            Hodnocení: <span class={categoryClass(variant.clinvar.score)}>{categoryRepr(variant.clinvar.score)}</span>
            <a 
              href={clinvarVariantUrl(variant.clinvar.id)} 
              target="_blank" 
              rel="noreferrer" 
              class="clinvar-link-out"
            >
              Otevřít záznam na NCBI ClinVar ↗
            </a>
          </p>
        {:else}
          <p class="muted">V ClinVaru nenalezeno.</p>
        {/if}
      </div>

      {#if variant.source === 'clinic' && activePatientVariantId}
        <hr class="modal-divider" />

        <div class="danger-zone">
          <div class="danger-zone-header">
            <h4>Správa záznamu</h4>
            <p class="muted">Smazání chybného záznamu nebo celého nahraného reportu.</p>
          </div>

          {#if deleteError}
            <div class="error delete-error">
              {deleteError}
            </div>
          {/if}

          {#if confirmMode === null}
            <div class="danger-actions">
              <button
                type="button"
                class="btn-danger-outline"
                onclick={() => {
                  confirmMode = 'variant';
                  deleteError = '';
                }}
              >
                Smazat tuto variantu
              </button>
              {#if activeReportId}
                <button
                  type="button"
                  class="btn-danger-outline"
                  onclick={() => {
                    confirmMode = 'report';
                    deleteError = '';
                  }}
                >
                  Smazat celý report
                </button>
              {/if}
            </div>
          {:else if confirmMode === 'variant'}
            <div class="confirm-box">
              <div class="confirm-box-title">⚠️ Potvrzení smazání varianty</div>
              <p class="confirm-box-text">
                Opravdu si přejete smazat variantu <b>{variant.gene} ({variant.variant || 'bez HGVS'})</b> pro pacienta <b>{activePatientId}</b>?
              </p>
              <div class="confirm-buttons">
                <button
                  type="button"
                  class="btn-danger"
                  disabled={isDeleting}
                  onclick={handleDeleteVariant}
                >
                  {isDeleting ? 'Mažu...' : 'Ano, smazat variantu'}
                </button>
                <button
                  type="button"
                  class="ghost"
                  disabled={isDeleting}
                  onclick={() => {
                    confirmMode = null;
                    deleteError = '';
                  }}
                >
                  Zrušit
                </button>
              </div>
            </div>
          {:else if confirmMode === 'report'}
            <div class="confirm-box">
              <div class="confirm-box-title">🚨 Potvrzení smazání celého reportu</div>
              <p class="confirm-box-text">
                Opravdu si přejete smazat celý report <b>{activeReportName}</b> pro pacienta <b>{activePatientId}</b>?
                <br />
                <span class="confirm-note">
                  Tato akce nenávratně smaže všechny varianty náležející k tomuto reportu. Použijte při chybném nahrání souboru.
                </span>
              </p>
              <div class="confirm-buttons">
                <button
                  type="button"
                  class="btn-danger"
                  disabled={isDeleting}
                  onclick={handleDeleteReport}
                >
                  {isDeleting ? 'Mažu...' : 'Ano, smazat celý report'}
                </button>
                <button
                  type="button"
                  class="ghost"
                  disabled={isDeleting}
                  onclick={() => {
                    confirmMode = null;
                    deleteError = '';
                  }}
                >
                  Zrušit
                </button>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>
