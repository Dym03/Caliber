<script lang="ts">
  import type { Variant } from '../types/variant';
  import { apiUrl, getCookie } from '../lib/api';

  interface Props {
    variant: Variant;
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

  let { variant, onclose, ondeleted }: Props = $props();

  let confirmMode = $state<'variant' | 'report' | null>(null);
  let isDeleting = $state(false);
  let deleteError = $state('');

  const handleDeleteVariant = async () => {
    if (!variant.patient_variant_id) return;
    isDeleting = true;
    deleteError = '';
    try {
      const response = await fetch(apiUrl(`/api/patient-variants/${variant.patient_variant_id}/`), {
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
        id: variant.patient_variant_id,
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
    if (!variant.report_id) return;
    isDeleting = true;
    deleteError = '';
    try {
      const response = await fetch(apiUrl(`/api/reports/${variant.report_id}/`), {
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
        id: variant.report_id,
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
      <h3>Detaily: {variant.gene} ({variant.variant || 'Neznámá varianta'})</h3>
      <button type="button" class="close-btn ghost" onclick={onclose}>✕</button>
    </div>

    <div class="modal-body">
      <div class="detail-group">
        <span class="muted">Varianta (HGVS)</span>
        <p class="selectable mono-full">{variant.variant || '—'}</p>
      </div>

      <div class="detail-group">
        <span class="muted">Pacient ID</span>
        <p class="selectable">{variant.patient_id}</p>
      </div>

      {#if variant.source === 'clinic' && variant.report_name}
        <div class="detail-group">
          <span class="muted">Genetický report</span>
          <p>
            <b>{variant.report_name}</b>
            {#if variant.report_variants_count}
              <span class="report-badge"
                >obsahuje {variant.report_variants_count}
                {variant.report_variants_count === 1
                  ? 'variantu'
                  : variant.report_variants_count >= 2 && variant.report_variants_count <= 4
                    ? 'varianty'
                    : 'variant'}</span
              >
            {/if}
          </p>
        </div>
      {/if}

      <div class="detail-group">
        <span class="muted">Komentář k variantě</span>
        <p>{variant.comment || 'Žádný komentář není k dispozici.'}</p>
      </div>

      <div class="detail-group">
        <span class="muted">Vytvořil</span>
        <p>{variant.created_by}</p>
      </div>

      {#if variant.source === 'clinic' && variant.patient_variant_id}
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
              {#if variant.report_id}
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
                Opravdu si přejete smazat variantu <b
                  >{variant.gene} ({variant.variant || 'bez HGVS'})</b
                >
                pro pacienta <b>{variant.patient_id}</b>?
                {#if variant.report_variants_count === 1}
                  <br /><span class="confirm-note"
                    >Jelikož jde o jedinou variantu v reportu, bude odstraněn i samotný report.</span
                  >
                {/if}
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
                Opravdu si přejete smazat celý report <b>{variant.report_name}</b> pro pacienta
                <b>{variant.patient_id}</b>?
                <br />
                <span class="confirm-note">
                  Tato akce nenávratně smaže <b>všech {variant.report_variants_count} variant</b> náležejících
                  k tomuto reportu. Použijte při chybném nahrání souboru.
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
