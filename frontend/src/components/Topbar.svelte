<script lang="ts">
  interface Props {
    currentView: 'registry' | 'batch'
    onviewchange: (view: 'registry' | 'batch') => void
  }

  let { currentView, onviewchange }: Props = $props()
</script>

<header class="topbar">
  <div class="brand">
    <div class="mark" aria-hidden="true">
      <span></span>
      <span></span>
      <span></span>
    </div>
    <div>
      <p class="eyebrow">Caliber</p>
      <h1>Klinický registr variant</h1>
    </div>
  </div>

  <nav class="nav-links">
    <button 
      type="button" 
      class="ghost nav-btn {currentView === 'registry' ? 'active' : ''}"
      onclick={() => onviewchange('registry')}
    >
      Registr Variant
    </button>
    <button 
      type="button" 
      class="ghost nav-btn {currentView === 'batch' ? 'active' : ''}"
      onclick={() => onviewchange('batch')}
    >
      Klasifikace
    </button>
  </nav>

  <div class="status">
    <span class="dot"></span>
    Data sync: 21 May 2026
  </div>
</header>
