<script lang="ts">
  // You might want to move these types to a separate `types.ts` file eventually!
  type ClinVarData = {
    id: string
    score: number
    last_updated: string | null
  } | null

  type Variant = {
    patient_id: string
    gene: string
    variant: string
    dbsnp: string
    chromosome: string
    position: number | null
    updated_at: string
    category: number | null
    clinvar: ClinVarData
    comment?: string | null 
  }

  interface Props {
    variant: Variant;
    onclose: () => void;
  }

  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return {
      destroy() {
        node.remove();
      }
    };
  }

  let { variant, onclose }: Props = $props();
</script>

<div 
  class="modal-backdrop" 
  use:portal 
  onclick={onclose} 
  onkeydown={(e) => { if (e.key === 'Escape') onclose(); }}
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
        <span class="muted">Pacient ID</span>
        <p>{variant.patient_id}</p>
      </div>
      
      <div class="detail-group">
        <span class="muted">Komentář k variantě</span>
        <p>{variant.comment || 'Žádný komentář není k dispozici.'}</p>
      </div>
    </div>
  </div>
</div>