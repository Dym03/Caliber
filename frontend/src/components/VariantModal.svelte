<script lang="ts">
  import type { Variant, PatientObservation } from '../types/variant'
  import { apiUrl, getCookie } from '../lib/api'
  import { categoryClass, categoryRepr, clinvarVariantUrl, formatDate } from '../lib/utils'
  
  interface Props {
    variant: Variant;
    patient?: PatientObservation | null;
    currentUser?: {
      email?: string;
      username?: string;
      is_staff?: boolean;
      is_superuser?: boolean;
    } | null;
    onclose: () => void;
    onupdated?: (detail: { patientVariantId: number; category: number | null }) => void;
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

  let { variant, patient = null, currentUser = null, onclose, onupdated, ondeleted }: Props = $props();

  let confirmMode = $state<'variant' | 'report' | null>(null);
  let isDeleting = $state(false);
  let deleteError = $state('');

  let isEditingCategory = $state(false);
  let selectedCategoryVal = $state<number>(-1);
  let isSavingCategory = $state(false);
  let categorySaveSuccess = $state('');
  let categorySaveError = $state('');
  let localCategoryOverride = $state<number | null | undefined>(undefined);

  let modalCopiedKey = $state<string | null>(null);
  let modalCopyTimeout: ReturnType<typeof setTimeout> | null = null;

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
  const currentCategory = $derived(
    localCategoryOverride !== undefined ? localCategoryOverride : activeCategory
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

  const canEdit = $derived(
    patient?.can_edit !== undefined
      ? Boolean(patient.can_edit)
      : (variant.can_edit !== undefined
          ? Boolean(variant.can_edit)
          : Boolean(
              currentUser && (
                currentUser.is_staff ||
                currentUser.is_superuser ||
                (currentUser.username && currentUser.username === activeCreatedBy)
              )
            ))
  );

  const canDelete = $derived(
    patient?.can_delete !== undefined
      ? Boolean(patient.can_delete)
      : (variant.can_delete !== undefined
          ? Boolean(variant.can_delete)
          : Boolean(
              currentUser && (
                currentUser.is_staff ||
                currentUser.is_superuser ||
                (currentUser.username && currentUser.username === activeCreatedBy)
              )
            ))
  );

  const copyModalText = async (text: string, key: string) => {
    if (!text || text === '—') return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const el = document.createElement('textarea');
        el.value = text;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      modalCopiedKey = key;
      if (modalCopyTimeout) clearTimeout(modalCopyTimeout);
      modalCopyTimeout = setTimeout(() => {
        modalCopiedKey = null;
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveCategory = async () => {
    if (!activePatientVariantId) return;
    isSavingCategory = true;
    categorySaveError = '';
    categorySaveSuccess = '';
    try {
      const response = await fetch(apiUrl(`/api/patient-variants/${activePatientVariantId}/`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          Accept: 'application/json',
        },
        body: JSON.stringify({
          category: selectedCategoryVal,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Uložení hodnocení se nezdařilo.');
      }

      localCategoryOverride = data.category !== undefined ? data.category : selectedCategoryVal;
      isEditingCategory = false;
      categorySaveSuccess = 'Hodnocení bylo úspěšně změněno.';
      onupdated?.({
        patientVariantId: activePatientVariantId,
        category: localCategoryOverride,
      });
      setTimeout(() => {
        categorySaveSuccess = '';
      }, 4000);
    } catch (err) {
      categorySaveError = err instanceof Error ? err.message : 'Uložení hodnocení se nezdařilo.';
    } finally {
      isSavingCategory = false;
    }
  };

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
        <div class="modal-title-row">
          <h3>{variant.gene} · {variant.variant || 'Neznámá varianta'}</h3>
          {#if variant.variant}
            <button 
              type="button" 
              class="copy-pill-btn {modalCopiedKey === 'modal-var' ? 'copied' : ''}"
              onclick={() => copyModalText(variant.variant, 'modal-var')}
              title="Kopírovat HGVS kód"
              aria-label="Kopírovat HGVS kód"
            >
              {#if modalCopiedKey === 'modal-var'}
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              {:else}
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              {/if}
            </button>
          {/if}
        </div>
        <p class="muted modal-sub">
          {variant.chromosome}:{variant.position ?? '—'}
          {#if variant.dbsnp}
            · {variant.dbsnp}
            <button 
              type="button" 
              class="copy-pill-btn copy-btn-inline {modalCopiedKey === 'modal-dbsnp' ? 'copied' : ''}"
              onclick={() => copyModalText(variant.dbsnp, 'modal-dbsnp')}
              title="Kopírovat dbSNP kód"
              aria-label="Kopírovat dbSNP kód"
            >
              {#if modalCopiedKey === 'modal-dbsnp'}
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              {:else}
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              {/if}
            </button>
          {/if}
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

          <div class="detail-row edit-category-row">
            <span class="muted">Hodnocení:</span>
            <div class="category-edit-group">
              <span class={categoryClass(currentCategory)}>
                {categoryRepr(currentCategory)}
              </span>
              {#if activeZygosity}
                <span class="pill zyg-pill">{activeZygosity}</span>
              {/if}

              {#if isEditingCategory}
                <div class="category-dropdown-box">
                  <select bind:value={selectedCategoryVal} class="category-select">
                    <option value={5}>5 – Patogenní</option>
                    <option value={4.5}>4-5 – Patogenní / Pravděpodobně patogenní</option>
                    <option value={4}>4 – Pravděpodobně patogenní</option>
                    <option value={3.5}>3-4 – VUS / Pravděpodobně patogenní</option>
                    <option value={3}>3 – VUS (Nejasný význam)</option>
                    <option value={2.5}>2-3 – Pravděpodobně benigní / VUS</option>
                    <option value={2}>2 – Pravděpodobně benigní</option>
                    <option value={1.5}>1-2 – Benigní / Pravděpodobně benigní</option>
                    <option value={1}>1 – Benigní</option>
                    <option value={0}>0 – Artefakt</option>
                    <option value={6}>6 – Hypomorfní varianta</option>
                    <option value={7}>7 – Farmakogenetické riziko</option>
                    <option value={8}>8 – Somatická varianta</option>
                    <option value={-1}>-1 – Nezařazeno</option>
                  </select>
                  <button 
                    type="button" 
                    class="ghost btn-save-cat"
                    disabled={isSavingCategory}
                    onclick={handleSaveCategory}
                  >
                    {isSavingCategory ? 'Ukládám...' : 'Uložit'}
                  </button>
                  <button 
                    type="button" 
                    class="ghost btn-cancel-cat"
                    disabled={isSavingCategory}
                    onclick={() => { isEditingCategory = false; categorySaveError = ''; }}
                  >
                    ✕
                  </button>
                </div>
              {:else if activePatientVariantId && canEdit}
                <button 
                  type="button" 
                  class="ghost btn-edit-cat"
                  onclick={() => { 
                    selectedCategoryVal = typeof currentCategory === 'number' ? currentCategory : (currentCategory ? parseFloat(String(currentCategory)) : -1);
                    isEditingCategory = true;
                    categorySaveError = '';
                    categorySaveSuccess = '';
                  }}
                  title="Upravit hodnocení pacientské varianty"
                >
                  ✎ Změnit hodnocení
                </button>
              {/if}
            </div>
          </div>
          {#if categorySaveSuccess}
            <div class="category-success-note">
              ✓ {categorySaveSuccess}
            </div>
          {/if}
          {#if categorySaveError}
            <div class="category-error-note">
              {categorySaveError}
            </div>
          {/if}

          <div class="detail-row">
            <span class="muted">Genetický report:</span>
            <span><b>{activeReportName || '—'}</b> ({formatDate(activeUpdatedAt)})</span>
          </div>

          <div class="detail-row">
            <span class="muted">Komentář:</span>
            <div class="modal-comment-text">{activeComment || 'Bez komentáře'}</div>
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
          <p>
            ℹ️ Tato varianta pochází z referenčního katalogu ClinVar a v interní databázi laboratoře zatím nemá záznam pacienta.
          </p>
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

      {#if variant.source === 'clinic' && activePatientVariantId && canEdit}
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
              <div class="confirm-box-title">
                ⚠️ Potvrzení smazání varianty
              </div>
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
              <div class="confirm-box-title">
                🚨 Potvrzení smazání celého reportu
              </div>
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
