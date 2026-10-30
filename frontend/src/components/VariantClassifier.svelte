<script lang="ts">
  import { apiUrl, getCookie } from '../lib/api';

  interface Props {
    onunauthorized?: () => void;
    isProcessing?: boolean;
  }

  let { onunauthorized, isProcessing = $bindable(false) }: Props = $props();

  type TabType = 'annotate' | 'colors';
  let activeTab = $state<TabType>('annotate');

  // ==========================================
  // TAB 1: Automatická anotace a klasifikace (s podporou více souborů)
  // ==========================================
  let isAnnotating = $state(false);
  let annotateError = $state('');
  let annotateSuccess = $state('');
  let annotateFiles = $state<File[]>([]);
  let isAnnotateDragActive = $state(false);
  let annotateProgress = $state<{ current: number; total: number; filename: string } | null>(null);
  let annotateFileInput: HTMLInputElement | undefined = $state();

  $effect(() => {
    isProcessing = isAnnotating || isConverting || isDetectingColors;
  });

  function handleAnnotateFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const valid = Array.from(target.files).filter(
        (f) => f.name.endsWith('.xlsx') || f.name.endsWith('.xls'),
      );
      if (valid.length === 0) {
        annotateError = 'Žádný z vybraných souborů nemá příponu .xlsx nebo .xls.';
        return;
      }
      annotateFiles = valid;
      annotateError = '';
      annotateSuccess = '';
    }
  }

  function handleAnnotateDrop(event: DragEvent) {
    event.preventDefault();
    isAnnotateDragActive = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const valid = Array.from(event.dataTransfer.files).filter(
        (f) => f.name.endsWith('.xlsx') || f.name.endsWith('.xls'),
      );
      if (valid.length === 0) {
        annotateError = 'Neplatný formát souboru. Nahrajte prosím soubory typu .xlsx nebo .xls.';
        return;
      }
      annotateFiles = valid;
      annotateError = '';
      annotateSuccess = '';
    }
  }

  function removeAnnotateFile(index: number) {
    annotateFiles = annotateFiles.filter((_, i) => i !== index);
  }

  function clearAnnotateFiles() {
    annotateFiles = [];
    annotateError = '';
    annotateSuccess = '';
    if (annotateFileInput) annotateFileInput.value = '';
  }

  async function handleAnnotateSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (annotateFiles.length === 0) return;

    isAnnotating = true;
    annotateError = '';
    annotateSuccess = '';
    annotateProgress = null;

    try {
      const csrfToken = getCookie('csrftoken');
      const total = annotateFiles.length;

      for (let i = 0; i < total; i++) {
        const file = annotateFiles[i];
        annotateProgress = { current: i + 1, total, filename: file.name };

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(apiUrl('/api/classify/'), {
          method: 'POST',
          body: formData,
          headers: {
            'X-CSRFToken': csrfToken,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            onunauthorized?.();
            return;
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Chyba u souboru ${file.name}: ${errorData.error || 'Zpracování souboru selhalo.'}`,
          );
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `klasifikace_${file.name}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        if (i < total - 1) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }

      annotateSuccess =
        total === 1
          ? 'Soubor byl úspěšně klasifikován a stažen.'
          : `Všech ${total} souborů bylo úspěšně klasifikováno a staženo.`;
      annotateFiles = [];
      if (annotateFileInput) annotateFileInput.value = '';
    } catch (error) {
      annotateError =
        error instanceof Error ? error.message : 'Nastala neočekávaná chyba při zpracování.';
    } finally {
      isAnnotating = false;
      annotateProgress = null;
    }
  }

  // ==========================================
  // TAB 2: Převod barev na kategorie (řetězcové hodnoty a podpora více souborů)
  // ==========================================
  type ColorRule = {
    id: string;
    hex: string;
    category: string | null;
    count?: number;
    example?: string;
  };

  let isConverting = $state(false);
  let isDetectingColors = $state(false);
  let colorError = $state('');
  let colorSuccess = $state('');
  let colorFiles = $state<File[]>([]);
  let isColorDragActive = $state(false);
  let convertProgress = $state<{ current: number; total: number; filename: string } | null>(null);
  let colorFileInput: HTMLInputElement | undefined = $state();

  let targetColumn = $state('HGVSc');
  let uncoloredCategory = $state<string | null>(null);
  let colorRules = $state<ColorRule[]>([]);
  let detectedInfo = $state<{
    sheets_count: number;
    total_variants: number;
    uncolored_count: number;
    target_column: string;
  } | null>(null);

  // Formulář pro manuální přidání barvy
  let newHexColor = $state('#FF0000');
  let newCategoryVal = $state<string | null>('5');

  function guessCategoryFromHex(hex: string): string | null {
    const clean = hex.replace('#', '').toUpperCase();
    if (clean.length !== 6) return null;
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);

    // Červená / tmavě červená -> Patogenní (5)
    if (r > 160 && g < 100 && b < 100) return '5';
    // Fialová / purpurová -> Pravděpodobně patogenní (4)
    if (r > 90 && b > 130 && g < 120) return '4';
    // Žlutá / oranžová / béžová -> VUS (3)
    if (r > 170 && g > 120 && b < 130) return '3';
    // Modrá / azurová -> Pravděpodobně benigní (2)
    if (b > 150 && r < 140) return '2';
    // Zelená -> Benigní (1)
    if (g > 150 && r < 130) return '1';

    return null;
  }

  async function handleColorFilesSelected(files: File[]) {
    const valid = files.filter((f) => f.name.endsWith('.xlsx') || f.name.endsWith('.xls'));
    if (valid.length === 0) {
      colorError = 'Neplatný formát souboru. Nahrajte prosím soubory typu .xlsx nebo .xls.';
      return;
    }
    colorFiles = valid;
    colorError = '';
    colorSuccess = '';
    detectedInfo = null;
    await detectColorsFromFiles(valid);
  }

  function handleColorFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      handleColorFilesSelected(Array.from(target.files));
    }
  }

  function handleColorDrop(event: DragEvent) {
    event.preventDefault();
    isColorDragActive = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      handleColorFilesSelected(Array.from(event.dataTransfer.files));
    }
  }

  function removeColorFile(index: number) {
    colorFiles = colorFiles.filter((_, i) => i !== index);
  }

  function clearColorFiles() {
    colorFiles = [];
    colorError = '';
    colorSuccess = '';
    detectedInfo = null;
    colorRules = [];
    uncoloredCategory = null;
    if (colorFileInput) colorFileInput.value = '';
  }

  async function detectColorsFromFiles(filesToDetect = colorFiles) {
    if (filesToDetect.length === 0) return;

    isDetectingColors = true;
    colorError = '';

    const primaryFile = filesToDetect[0];
    const formData = new FormData();
    formData.append('file', primaryFile);
    if (targetColumn.trim()) {
      formData.append('target_column', targetColumn.trim());
    }

    try {
      const response = await fetch(apiUrl('/api/detect-excel-colors/'), {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRFToken': getCookie('csrftoken'),
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          onunauthorized?.();
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Detekce barev ze souboru selhala.');
      }

      const data = await response.json();
      detectedInfo = {
        sheets_count: data.sheets_count,
        total_variants: data.total_variants,
        uncolored_count: data.uncolored_count,
        target_column: data.target_column,
      };

      if (data.target_column) {
        targetColumn = data.target_column;
      }

      // Vytvoříme pravidla z detekovaných barev
      colorRules = (data.colors || []).map(
        (c: { hex: string; count: number; example: string }, idx: number) => ({
          id: `det-${idx}-${c.hex}`,
          hex: c.hex,
          category: guessCategoryFromHex(c.hex),
          count: c.count,
          example: c.example,
        }),
      );
    } catch (err) {
      colorError = err instanceof Error ? err.message : 'Chyba při analýze stylů souboru.';
    } finally {
      isDetectingColors = false;
    }
  }

  function addManualColorRule() {
    const hex = newHexColor.toUpperCase().trim();
    if (!hex) return;
    const exists = colorRules.some((r) => r.hex.toUpperCase() === hex);
    if (exists) {
      colorError = `Barva ${hex} již v seznamu pravidel existuje.`;
      return;
    }
    colorRules = [
      ...colorRules,
      {
        id: `man-${Date.now()}`,
        hex: hex,
        category: newCategoryVal,
      },
    ];
    colorError = '';
  }

  function removeColorRule(id: string) {
    colorRules = colorRules.filter((r) => r.id !== id);
  }

  async function handleConvertSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (colorFiles.length === 0) return;

    isConverting = true;
    colorError = '';
    colorSuccess = '';
    convertProgress = null;

    const mappingObj: Record<string, string> = {};
    for (const rule of colorRules) {
      if (rule.category !== null && rule.category !== undefined) {
        mappingObj[rule.hex.toUpperCase()] = String(rule.category);
      }
    }

    try {
      const csrfToken = getCookie('csrftoken');
      const total = colorFiles.length;

      for (let i = 0; i < total; i++) {
        const file = colorFiles[i];
        convertProgress = { current: i + 1, total, filename: file.name };

        const formData = new FormData();
        formData.append('file', file);
        formData.append('mapping', JSON.stringify(mappingObj));
        if (targetColumn.trim()) {
          formData.append('target_column', targetColumn.trim());
        }
        if (uncoloredCategory !== null && uncoloredCategory !== undefined) {
          formData.append('uncolored_category', String(uncoloredCategory));
        }

        const response = await fetch(apiUrl('/api/convert-colors-to-categories/'), {
          method: 'POST',
          body: formData,
          headers: {
            'X-CSRFToken': csrfToken,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            onunauthorized?.();
            return;
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Chyba u souboru ${file.name}: ${errorData.error || 'Převod barev selhal.'}`,
          );
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kategorie_${file.name}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        if (i < total - 1) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }

      colorSuccess =
        total === 1
          ? 'Soubor byl úspěšně doplněn o sloupec Kategorie a stažen.'
          : `Všech ${total} souborů bylo úspěšně doplněno o sloupec Kategorie a staženo.`;

      // Reset state and rules so old configuration does not linger
      colorFiles = [];
      colorRules = [];
      detectedInfo = null;
      uncoloredCategory = null;
      if (colorFileInput) colorFileInput.value = '';
    } catch (err) {
      colorError = err instanceof Error ? err.message : 'Nastala chyba při převodu.';
    } finally {
      isConverting = false;
      convertProgress = null;
    }
  }
</script>

<div class="batch-layout">
  <div class="card layout-panel">
    <!-- Přepínací záložky / karty -->
    <div class="classifier-tabs">
      <button
        type="button"
        class="tab-btn {activeTab === 'annotate' ? 'active' : ''}"
        onclick={() => (activeTab = 'annotate')}
      >
        Automatická anotace a klasifikace
      </button>
      <button
        type="button"
        class="tab-btn {activeTab === 'colors' ? 'active' : ''}"
        onclick={() => (activeTab = 'colors')}
      >
        Převod barev na kategorie
      </button>
    </div>

    <!-- REŽIM 1: AUTOMATICKÁ ANOTACE -->
    {#if activeTab === 'annotate'}
      <div class="panel-head">
        <h2>Automatická anotace a klasifikace</h2>
        <p class="muted">
          Nahrajte jeden nebo více laboratorních Excel souborů se seznamy variant. Systém provede
          automatickou anotaci a klasifikaci variant za pomocí interní i ClinVar databáze a nabídne
          vám upravené soubory ke stažení.
        </p>
      </div>

      <form onsubmit={handleAnnotateSubmit} class="upload-panel">
        <div
          class="dropzone {isAnnotateDragActive ? 'drag-active' : ''}"
          ondragover={(e) => {
            e.preventDefault();
            isAnnotateDragActive = true;
          }}
          ondragleave={() => (isAnnotateDragActive = false)}
          ondrop={handleAnnotateDrop}
          role="button"
          tabindex="0"
        >
          <input
            type="file"
            id="batch-file-input"
            class="file-input"
            accept=".xlsx, .xls"
            multiple
            bind:this={annotateFileInput}
            onchange={handleAnnotateFileChange}
          />

          <div class="dropzone-content">
            <span class="dropzone-title">Přetáhněte jeden nebo více souborů sem nebo</span>
            <label for="batch-file-input" class="browse-button"> Vybrat soubory </label>
            <span class="dropzone-hint">Podporován je formát .xlsx, .xls (lze vybrat i více souborů najednou)</span>
          </div>
        </div>

        {#if annotateFiles.length > 0}
          <div class="files-meta-container">
            <div class="files-meta-header">
              <span class="files-count-badge">
                Vybráno {annotateFiles.length} {annotateFiles.length === 1 ? 'soubor' : annotateFiles.length < 5 ? 'soubory' : 'souborů'}
              </span>
              <button
                type="button"
                class="clear-file"
                onclick={clearAnnotateFiles}
                disabled={isAnnotating}
              >
                Odebrat vše
              </button>
            </div>
            <ul class="files-chips-list">
              {#each annotateFiles as file, idx}
                <li class="file-chip">
                  <span class="chip-name" title={file.name}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                  <button
                    type="button"
                    class="chip-remove"
                    title="Odebrat soubor"
                    onclick={() => removeAnnotateFile(idx)}
                    disabled={isAnnotating}
                  >
                    ✕
                  </button>
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        {#if annotateProgress}
          <div class="detecting-banner">
            <span class="spinner"></span> Zpracovávám soubor {annotateProgress.current} z {annotateProgress.total}: <strong>{annotateProgress.filename}</strong>
          </div>
        {/if}

        <div class="actions">
          <button type="submit" class="ghost run-btn" disabled={annotateFiles.length === 0 || isAnnotating}>
            {isAnnotating ? 'Zpracovávám a stahuji...' : annotateFiles.length > 1 ? `Spustit klasifikaci pro ${annotateFiles.length} souborů` : 'Spustit klasifikaci a stáhnout'}
          </button>
        </div>
      </form>

      {#if annotateError}
        <p class="error">{annotateError}</p>
      {/if}

      {#if annotateSuccess}
        <p class="success">{annotateSuccess}</p>
      {/if}

      <!-- REŽIM 2: PŘEVOD BAREV NA KATEGORIE -->
    {:else}
      <div class="panel-head">
        <h2>Převod barevného schématu na kategorie</h2>
        <p class="muted">
          Pokud máte varianty v Excelu označeny barvami (např. ve sloupci <code>HGVSc</code>), tento
          nástroj projde pacientské listy sešitu a vytvoří nový sloupec <code>Kategorie</code>, nebo doplní ten stávající,
          s odpovídající textovou hodnotou (např. <code>5</code>, <code>4-5</code>) podle vašeho barevného klíče. Původní databáze v Caliberu
          zůstane nedotčena.
        </p>
      </div>

      <form onsubmit={handleConvertSubmit} class="upload-panel">
        <div
          class="dropzone {isColorDragActive ? 'drag-active' : ''}"
          ondragover={(e) => {
            e.preventDefault();
            isColorDragActive = true;
          }}
          ondragleave={() => (isColorDragActive = false)}
          ondrop={handleColorDrop}
          role="button"
          tabindex="0"
        >
          <input
            type="file"
            id="color-file-input"
            class="file-input"
            accept=".xlsx"
            multiple
            bind:this={colorFileInput}
            onchange={handleColorFileChange}
          />

          <div class="dropzone-content">
            <span class="dropzone-title">Přetáhněte jeden nebo více Excel souborů sem nebo</span>
            <label for="color-file-input" class="browse-button"> Vybrat soubory </label>
            <span class="dropzone-hint">Podporován je formát .xlsx</span>
          </div>
        </div>

        {#if colorFiles.length > 0}
          <div class="files-meta-container">
            <div class="files-meta-header">
              <span class="files-count-badge">
                Vybráno {colorFiles.length} {colorFiles.length === 1 ? 'soubor' : colorFiles.length < 5 ? 'soubory' : 'souborů'}
              </span>
              <div class="file-meta-btns">
                <button
                  type="button"
                  class="ghost re-detect-btn"
                  onclick={() => detectColorsFromFiles()}
                  disabled={isDetectingColors || isConverting}
                >
                  {isDetectingColors ? 'Načítám...' : 'Znovu detekovat barvy'}
                </button>
                <button
                  type="button"
                  class="clear-file"
                  onclick={clearColorFiles}
                  disabled={isConverting}
                >
                  Odebrat vše
                </button>
              </div>
            </div>
            <ul class="files-chips-list">
              {#each colorFiles as file, idx}
                <li class="file-chip">
                  <span class="chip-name" title={file.name}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                  <button
                    type="button"
                    class="chip-remove"
                    title="Odebrat soubor"
                    onclick={() => removeColorFile(idx)}
                    disabled={isConverting}
                  >
                    ✕
                  </button>
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        {#if isDetectingColors}
          <div class="detecting-banner">
            <span class="spinner"></span> Procházím listy sešitu a detekuji použité barvy...
          </div>
        {/if}

        {#if convertProgress}
          <div class="detecting-banner">
            <span class="spinner"></span> Převádím soubor {convertProgress.current} z {convertProgress.total}: <strong>{convertProgress.filename}</strong>
          </div>
        {/if}

        {#if detectedInfo}
          <div class="detected-summary">
            <span>Listů s pacienty: <strong>{detectedInfo.sheets_count}</strong></span>
            <span>Variant celkem: <strong>{detectedInfo.total_variants}</strong></span>
            <span>Bez barvy: <strong>{detectedInfo.uncolored_count}</strong></span>
            <span>Sloupec: <code>{detectedInfo.target_column}</code></span>
          </div>
        {/if}

        <!-- Seznam pravidel mapování barev -->
        <div class="rules-section">
          <div class="rules-header">
            <h3>Přiřazení barev ke kategoriím</h3>
            <div class="rules-header-actions">
              <span class="rules-count"
                >{colorRules.length} {colorRules.length === 1 ? 'pravidlo' : 'pravidel'}</span
              >
              {#if colorRules.length > 0}
                <button
                  type="button"
                  class="ghost clear-rules-btn"
                  onclick={() => {
                    colorRules = [];
                    colorError = '';
                  }}
                >
                  Vymazat pravidla
                </button>
              {/if}
            </div>
          </div>

          {#if colorRules.length === 0 && !isDetectingColors}
            <div class="empty-rules">
              <p class="muted">
                Zatím nebyla detekována žádná barva. Nahrajte soubor nebo přidejte barvu ručně níže.
              </p>
            </div>
          {:else}
            <div class="rules-list">
              {#each colorRules as rule (rule.id)}
                <div class="rule-card">
                  <div class="rule-preview">
                    <span class="color-badge" style="background-color: {rule.hex};"></span>
                    <div class="rule-labels">
                      <span class="color-hex">{rule.hex}</span>
                      {#if rule.count !== undefined}
                        <span class="rule-meta">
                          {rule.count} {rule.count === 1 ? 'varianta' : 'variant'}
                          {#if rule.example}
                            <span class="rule-example">({rule.example})</span>
                          {/if}
                        </span>
                      {/if}
                    </div>
                  </div>

                  <div class="rule-action">
                    <label class="cat-label">
                      Kategorie:
                      <select bind:value={rule.category} class="category-select">
                        <option value={null}>-- Bez přiřazení (přeskočit) --</option>
                        <option value="5">5 (Patogenní)</option>
                        <option value="4-5">4-5 (Patogenní / Pravděpodobně patogenní)</option>
                        <option value="4">4 (Pravděpodobně patogenní)</option>
                        <option value="3-4">3-4 (VUS / Pravděpodobně patogenní)</option>
                        <option value="3">3 (VUS)</option>
                        <option value="2-3">2-3 (Pravděpodobně benigní / VUS)</option>
                        <option value="2">2 (Pravděpodobně benigní)</option>
                        <option value="1-2">1-2 (Benigní / Pravděpodobně benigní)</option>
                        <option value="1">1 (Benigní)</option>
                        <option value="6">6 (Hypomorfní varianta)</option>
                        <option value="7">7 (Farmakogenetický rizikový faktor)</option>
                        <option value="8">8 (Somatická varianta)</option>
                        <option value="0">0 (Artefakt / Nehodnoceno)</option>
                        <option value="-1">-1 (Bez hodnocení)</option>
                      </select>
                    </label>

                    <button
                      type="button"
                      class="remove-rule-btn"
                      title="Odebrat barvu"
                      onclick={() => removeColorRule(rule.id)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}

          <!-- Přidání vlastní barvy ručně -->
          <div class="add-rule-box">
            <h4>Přidat další barvu ručně</h4>
            <div class="add-rule-row">
              <label class="color-picker-label">
                <input type="color" bind:value={newHexColor} class="color-picker-input" />
                <span class="picker-preview" style="background-color: {newHexColor};"></span>
                <input
                  type="text"
                  bind:value={newHexColor}
                  placeholder="#RRGGBB"
                  class="hex-text-input"
                />
              </label>

              <label class="cat-label">
                Kategorie:
                <select bind:value={newCategoryVal} class="category-select">
                  <option value="5">5 (Patogenní)</option>
                  <option value="4-5">4-5 (Patogenní / Pravděpodobně patogenní)</option>
                  <option value="4">4 (Pravděpodobně patogenní)</option>
                  <option value="3-4">3-4 (VUS / Pravděpodobně patogenní)</option>
                  <option value="3">3 (VUS)</option>
                  <option value="2-3">2-3 (Pravděpodobně benigní / VUS)</option>
                  <option value="2">2 (Pravděpodobně benigní)</option>
                  <option value="1-2">1-2 (Benigní / Pravděpodobně benigní)</option>
                  <option value="1">1 (Benigní)</option>
                  <option value="6">6 (Hypomorfní varianta)</option>
                  <option value="7">7 (Farmakogenetický rizikový faktor)</option>
                  <option value="8">8 (Somatická varianta)</option>
                  <option value="0">0 (Artefakt / Nehodnoceno)</option>
                  <option value="-1">-1 (Bez hodnocení)</option>
                </select>
              </label>

              <button
                type="button"
                class="ghost add-rule-btn"
                onclick={addManualColorRule}
                disabled={!newHexColor}
              >
                + Přidat barvu
              </button>
            </div>
          </div>

          <!-- Pokročilá nastavení -->
          <div class="advanced-settings">
            <div class="setting-item">
              <label for="uncolored-select" class="setting-label">
                Neobarvené buňky v cílovém sloupci:
              </label>
              <select id="uncolored-select" bind:value={uncoloredCategory} class="category-select">
                <option value={null}>Ponechat prázdné (výchozí)</option>
                <option value="-1">Nastavit na -1 (Bez hodnocení)</option>
                <option value="0">Nastavit na 0 (Artefakt)</option>
                <option value="1">Nastavit na 1 (Benigní)</option>
                <option value="2">Nastavit na 2 (Pravděpodobně benigní)</option>
                <option value="3">Nastavit na 3 (VUS)</option>
              </select>
            </div>

            <div class="setting-item">
              <label for="target-col-input" class="setting-label">
                Cílový sloupec pro čtení barev:
              </label>
              <input
                id="target-col-input"
                type="text"
                bind:value={targetColumn}
                placeholder="HGVSc"
                class="target-input"
              />
            </div>
          </div>
        </div>

        <div class="actions">
          <button
            type="submit"
            class="ghost run-btn"
            disabled={colorFiles.length === 0 || isConverting || isDetectingColors || colorRules.length === 0}
          >
            {isConverting ? 'Zpracovávám sešity a doplňuji kategorie...' : colorFiles.length > 1 ? `Převést barvy na kategorie pro ${colorFiles.length} souborů` : 'Převést barvy na kategorie a stáhnout'}
          </button>
        </div>
      </form>

      {#if colorError}
        <p class="error">{colorError}</p>
      {/if}

      {#if colorSuccess}
        <p class="success">{colorSuccess}</p>
      {/if}
    {/if}
  </div>

  <!-- PRAVÝ PANEL: DOKUMENTACE A NÁPOVĚDA -->
  <div class="card documentation-panel">
    {#if activeTab === 'annotate'}
      <h3>Jak připravit vstupní soubory?</h3>
      <p class="muted">
        Systém podporuje nahrání jednoho i více laboratorních souborů naráz. Ujistěte se, že vaše
        tabulky splňují následující kritéria:
      </p>

      <ul class="doc-list">
        <li>
          <strong>Dávkové zpracování více souborů:</strong> Můžete vybrat nebo přetáhnout libovolný počet
          souborů do maximální velikosti 100 MB. Systém je postupně automaticky zpracuje a stáhne každý
          anotovaný soubor.
        </li>
        <li>
          <strong>Názvy sloupců:</strong> Na pořadí sloupců v tabulce nezáleží. Systém v prvním
          řádku hledá klíčová slova:
          <div class="chips-info">
            <code>Symbol</code> / <code>Gene</code>
            <code>HGVSc</code> / <code>Transcript + Nucleotide</code>
            <code>dbSNP</code> / <code>VEP dbSNP ID</code>
          </div>
        </li>
        <li>
          <strong>Identifikace podle dbSNP:</strong> Pokud je přítomen sloupec <code>dbSNP</code>
          (např. s hodnotou <code>rs13078881</code>), vyhledávání v ClinVar databázi je nejrychlejší
          a nejpřesnější.
        </li>
        <li>
          <strong>Identifikace podle HGVS:</strong> Pokud dbSNP chybí, systém se pokusí variantu
          spárovat kombinací názvu genu a HGVS zápisu (např. <code>c.1336G>C</code> nebo
          <code>p.Gly446Arg</code>).
        </li>
        <li>
          <strong>Výstupní data:</strong> Váš původní formát tabulky zůstane zcela nedotčen. Na
          konec pravé strany tabulky systém pouze připíjí nové sloupce:
          <code>System_Classification</code> (kategorie patogenity), <code>ClinVar_ID</code> a
          <code>Database_Match_Status</code>.
        </li>
      </ul>
    {:else}
      <h3>Jak funguje převod barev na kategorie?</h3>
      <p class="muted">
        Tento nástroj řeší situaci, kdy laboratorní pracovníci označují závažnost variant barevným
        zvýrazněním namísto čísla ve sloupci <code>Kategorie</code>.
      </p>

      <ul class="doc-list">
        <li>
          <strong>Dávkový převod více souborů:</strong> Můžete nahrát i více souborů se stejným barevným schématem. Systém nastaví jednotný barevný klíč a převede všechny soubory najednou.
        </li>
        <li>
          <strong>Podporované listy sešitu:</strong> Nástroj prochází všechny pacientské listy
          odpovídající formátu <code>[id_pacienta]-[rok][cokoliv]</code> (např. <code>12-26-Analýza</code>), stejně
          jako při importu do databáze Caliberu. Ostatní pomocné listy (např. <code>Info</code>,
          <code>Souhrn</code>) zůstanou nezměněny. Pouze pokud by list byl jediný, bude také zpracován.
        </li>
        <li>
          <strong>Detekce barev:</strong> Systém automaticky přečte barvu pozadí i písma buněk ve specifikovaném
          sloupci. Pokud je barva nejednoznačná (např. šedá), můžete ji ručně přiřadit kategorie v seznamu pravidel.
          Barvám přiřadíte kategorie, a následně můžete spustit převod. Systém doplní nový sloupec <code>Kategorie</code> s odpovídajícími hodnotami, nebo hodnoty přepíše ve stávajícím sloupci.
        </li>
        <li>
          <strong>Podporované kategorie:</strong> Do nového sloupce se zapisují standardní řetězcové hodnoty např.:
          <div class="chips-info">
            <code>5</code>
            <code>4-5</code>
          </div>
        </li>
        <li>
          <strong>Bezpečnost a zachování formátu:</strong> Data se neukládají do databáze. Všechny
          původní buňky, barvy, vzorce a šířky sloupců zůstávají zachovány.
        </li>
      </ul>
    {/if}
  </div>
</div>

<style>
  .batch-layout {
    display: grid;
    gap: 24px;
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  }

  .layout-panel {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* Přepínací záložky nahoře */
  .classifier-tabs {
    display: flex;
    gap: 8px;
    border-bottom: 2px solid rgba(20, 18, 16, 0.08);
    padding-bottom: 12px;
  }

  .tab-btn {
    border: none;
    background: transparent;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--ink);
    opacity: 0.65;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
  }

  .tab-btn:hover {
    opacity: 1;
    background: rgba(20, 18, 16, 0.05);
  }

  .tab-btn.active {
    opacity: 1;
    background: rgba(201, 107, 60, 0.12);
    color: var(--accent);
    font-weight: 600;
  }

  .panel-head h2 {
    margin-bottom: 8px;
  }

  /* Kontejner pro zobrazení vybraných souborů */
  .files-meta-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: rgba(20, 18, 16, 0.03);
    border-radius: 8px;
    padding: 10px 14px;
  }

  .files-meta-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .files-count-badge {
    font-size: 13px;
    font-weight: 600;
    color: var(--ink);
  }

  .files-chips-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    max-height: 120px;
    overflow-y: auto;
  }

  .file-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: white;
    border: 1px solid rgba(20, 18, 16, 0.1);
    border-radius: 6px;
    padding: 3px 8px;
    font-size: 12px;
  }

  .chip-name {
    max-width: 220px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chip-remove {
    border: none;
    background: transparent;
    color: #c0392b;
    cursor: pointer;
    padding: 0 2px;
    font-size: 12px;
  }

  .file-meta-btns {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .re-detect-btn {
    padding: 4px 10px;
    font-size: 12px;
    border-radius: 6px;
  }

  .detecting-banner {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: rgba(201, 107, 60, 0.08);
    border-radius: 8px;
    font-size: 13px;
    color: var(--accent);
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(201, 107, 60, 0.3);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    display: inline-block;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .detected-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    background: rgba(20, 18, 16, 0.03);
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 13px;
  }

  .detected-summary strong {
    color: var(--ink);
  }

  .detected-summary code {
    font-family: 'IBM Plex Mono', monospace;
    background: rgba(20, 18, 16, 0.06);
    padding: 2px 5px;
    border-radius: 4px;
  }

  /* Pravidla mapování */
  .rules-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 6px;
  }

  .rules-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .rules-header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .clear-rules-btn {
    font-size: 12px;
    padding: 3px 8px;
    border-radius: 6px;
    color: #c0392b;
  }

  .clear-rules-btn:hover {
    background: rgba(192, 57, 43, 0.08);
  }

  .rules-header h3 {
    margin: 0;
    font-size: 16px;
  }

  .rules-count {
    font-size: 12px;
    color: var(--muted);
  }

  .empty-rules {
    padding: 16px;
    background: rgba(20, 18, 16, 0.02);
    border-radius: 8px;
    text-align: center;
  }

  .rules-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .rule-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(20, 18, 16, 0.08);
    border-radius: 8px;
    padding: 10px 14px;
    gap: 14px;
  }

  .rule-preview {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .color-badge {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 1px solid rgba(0, 0, 0, 0.15);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    flex-shrink: 0;
  }

  .rule-labels {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .color-hex {
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 600;
    font-size: 13px;
  }

  .rule-meta {
    font-size: 11px;
    color: var(--muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .rule-example {
    font-family: 'IBM Plex Mono', monospace;
    color: rgba(20, 18, 16, 0.6);
  }

  .rule-action {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .cat-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
  }

  .category-select {
    padding: 6px 10px;
    border-radius: 6px;
    border: 1px solid rgba(20, 18, 16, 0.15);
    background: white;
    font-size: 13px;
  }

  .remove-rule-btn {
    border: none;
    background: transparent;
    color: #c0392b;
    padding: 6px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.15s;
  }

  .remove-rule-btn:hover {
    background: rgba(192, 57, 43, 0.1);
  }

  /* Box pro přidání další barvy ručně */
  .add-rule-box {
    background: rgba(20, 18, 16, 0.02);
    border: 1px dashed rgba(20, 18, 16, 0.15);
    border-radius: 8px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .add-rule-box h4 {
    margin: 0;
    font-size: 13px;
    color: var(--ink);
  }

  .add-rule-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }

  .color-picker-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  .color-picker-input {
    width: 0;
    height: 0;
    opacity: 0;
    position: absolute;
    pointer-events: none;
  }

  .picker-preview {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    display: inline-block;
  }

  .hex-text-input {
    width: 90px;
    padding: 6px 8px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    border: 1px solid rgba(20, 18, 16, 0.15);
    border-radius: 6px;
  }

  .add-rule-btn {
    padding: 6px 12px;
    font-size: 13px;
  }

  /* Pokročilá nastavení */
  .advanced-settings {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    background: rgba(20, 18, 16, 0.02);
    border-radius: 8px;
    padding: 12px 14px;
  }

  .setting-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .setting-label {
    font-size: 12px;
    color: var(--muted);
  }

  .target-input {
    padding: 6px 10px;
    border-radius: 6px;
    border: 1px solid rgba(20, 18, 16, 0.15);
    font-size: 13px;
  }

  .run-btn {
    background: var(--accent) !important;
    color: white !important;
    border: none !important;
    width: 100%;
    padding: 14px 20px;
    font-size: 15px;
  }

  .run-btn:hover:not(:disabled) {
    box-shadow: 0 12px 25px -18px rgba(201, 107, 60, 0.6);
  }

  /* Pravý panel nápovědy */
  .documentation-panel {
    background: rgba(255, 255, 255, 0.4);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .doc-list {
    margin: 0;
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    font-size: 14px;
    line-height: 1.5;
  }

  .doc-list li {
    color: var(--ink);
  }

  .chips-info {
    display: flex;
    gap: 6px;
    margin-top: 6px;
    flex-wrap: wrap;
  }

  .chips-info code {
    font-family: 'IBM Plex Mono', monospace;
    background: rgba(20, 18, 16, 0.06);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
  }

  @media (max-width: 960px) {
    .batch-layout {
      grid-template-columns: 1fr;
    }
    .advanced-settings {
      grid-template-columns: 1fr;
    }
    .rule-card {
      flex-direction: column;
      align-items: flex-start;
    }
    .rule-action {
      width: 100%;
      justify-content: space-between;
    }
  }
</style>
