<script lang="ts">
  import { app } from './state/app.svelte';
  import Icon from './ui/Icon.svelte';

  $effect(() => {
    void app.loadQuran();
  });
</script>

<div class="about">
  <div class="inner">
    <h1>About</h1>
    <p class="lead">
      <strong>Chronotope of Quranic Reality</strong> places events narrated in the Quran on a timeline and a map, next to what history
      and archaeology know about the same periods and places across civilizations: what else was happening in the world at the same
      time, and what followed. "Chronotope" is Mikhail Bakhtin's term for how a narrative binds time and space together. The mark, a
      circle of time crossed by a meridian with one moment on it, says the same: one moment, one place.
    </p>

    <h2>How to read an entry</h2>
    <p>Every entry keeps five layers apart, always in the same order and colors.</p>
    <ol class="layers">
      <li class="quran"><span class="lh"><Icon name="quran" size={18} />Quran</span>Verse references; the text is shown from a verified dataset and is never paraphrased as the text.</li>
      <li class="tafsir"><span class="lh"><Icon name="tafsir" size={18} />Tafsir</span>What classical commentators said, with the work and the place in it.</li>
      <li class="tradition">
        <span class="lh"><Icon name="tradition" size={18} />Tradition</span>Hadith, reports from the Companions and Successors, and the classical historians, with
        the work each is found in. Hadith carry their gradings (sound, good, weak…) and the scholar who gave each. These are reports, not
        facts. Reports of the People of the Book are labeled "neither affirmed nor denied".
      </li>
      <li class="history"><span class="lh"><Icon name="history" size={18} />History</span>Claims from history and archaeology, each marked <em>established</em> or <em>debated</em>, with sources.</li>
      <li class="reflection">
        <span class="lh"><Icon name="reflection" size={18} />Our reflection</span>The project's own reading of how the layers meet, always labeled as interpretation,
        with a confidence level set by the editor. It is not a proof.
      </li>
    </ol>

    <h2>How sure is a date</h2>
    <p>
      Dates are ranges with a stated certainty and basis, and the timeline draws each certainty differently: <em>documented</em> dates
      solid, <em>estimated</em> ones fading at the ends, <em>traditional</em> dates dashed, dates <em>reckoned from tradition</em>
      hatched, and <em>debated</em> or <em>unknown</em> ones dotted. For the prophets before Abraham, history cannot give a date at all:
      their years are a reckoning from intervals reported in hadith, and the entry shows the chain of that reckoning step by step.
    </p>
    <p>
      A location is shown on the map only when it is known. Disputed locations are drawn as dashed areas, one per opinion, lettered A,
      B, C; unknown ones are described, not pinned. The basemap shows terrain without modern borders or names, and the region names on
      it are the broad ones the sources use. Entries marked <em>draft</em> have not been reviewed.
    </p>
    <p>
      Honorifics: ﷺ (peace and blessings be upon him) follows the name of the Prophet Muhammad, and "peace be upon him" follows the
      other prophets at their first mention in each entry.
    </p>

    <h2>Licenses and credits</h2>
    <ul>
      <li>Code: MIT License.</li>
      <li>Written content (the <code>content/</code> folder): Creative Commons Attribution-ShareAlike 4.0.</li>
      <li>
        Quran text: <a href="https://tanzil.net" target="_blank" rel="noopener">Tanzil Project</a>, Hafs, Uthmani and Simple-clean
        scripts, copied verbatim. It keeps its own terms, reproduced below, and is not covered by the licenses above.
      </li>
      <li>
        Fonts, all under the SIL Open Font License 1.1: <a href="https://github.com/aliftype/amiri" target="_blank" rel="noopener">Amiri Quran</a>
        by the Amiri Project Authors, for the Quran text; <a href="https://github.com/notofonts/arabic" target="_blank" rel="noopener">Noto Naskh Arabic</a>
        by the Noto Project Authors, for all other Arabic text; <a href="https://github.com/productiontype/Newsreader" target="_blank" rel="noopener">Newsreader</a>
        by the Newsreader Project Authors, for titles and reading; and <a href="https://github.com/rsms/inter" target="_blank" rel="noopener">Inter</a>
        by the Inter Project Authors, for the interface.
      </li>
      <li>
        Maps: <a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>; terrain tiles &copy;
        <a href="https://stadiamaps.com/" target="_blank" rel="noopener">Stadia Maps</a>, &copy; <a href="https://stamen.com/" target="_blank" rel="noopener">Stamen Design</a>,
        &copy; <a href="https://openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a>; other basemaps &copy; OpenTopoMap (CC-BY-SA);
        map data &copy; OpenStreetMap contributors.
      </li>
    </ul>

    <h2>Tanzil terms of use</h2>
    {#if app.quran}
      <pre>{app.quran.notice}</pre>
    {:else}
      <p class="muted">Loading…</p>
    {/if}
  </div>
</div>

<style>
  .about {
    height: 100%;
    overflow-y: auto;
    background: var(--paper);
  }
  .inner {
    max-width: 780px;
    margin: 0 auto;
    padding: 28px 24px 56px;
  }
  h1 {
    font-family: var(--font-read);
    font-size: 40px;
    font-weight: 600;
    margin: 0 0 10px;
  }
  h2 {
    font-family: var(--font-read);
    font-size: 24px;
    font-weight: 600;
    margin: 32px 0 8px;
  }
  .lead {
    font-family: var(--font-read);
    font-size: 18px;
    line-height: 1.55;
  }
  .layers {
    list-style: none;
    padding: 0;
    margin: 12px 0 0;
    display: grid;
    gap: 8px;
  }
  .layers li {
    border-radius: 12px;
    padding: 12px 14px;
    color: #2a322f;
  }
  .lh {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .quran {
    background: var(--l-quran-tint);
  }
  .quran .lh {
    color: var(--l-quran-text);
  }
  .tafsir {
    background: var(--l-tafsir-tint);
  }
  .tafsir .lh {
    color: var(--l-tafsir-text);
  }
  .tradition {
    background: var(--l-tradition-tint);
  }
  .tradition .lh {
    color: var(--l-tradition-text);
  }
  .history {
    background: var(--l-history-tint);
  }
  .history .lh {
    color: var(--l-history-text);
  }
  .reflection {
    background: var(--l-reflection-tint);
    outline: 1.5px dashed #b996b7;
    outline-offset: -1.5px;
  }
  .reflection .lh {
    color: var(--l-reflection-text);
  }
  pre {
    white-space: pre-wrap;
    font-size: 12px;
    background: #f3f0e9;
    padding: 12px;
    border-radius: 10px;
  }
</style>
