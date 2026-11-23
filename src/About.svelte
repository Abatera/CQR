<script lang="ts">
  import { app } from './state/app.svelte';

  $effect(() => {
    void app.loadQuran();
  });
</script>

<div class="about">
  <h2>About</h2>
  <p>
    <strong>Chronotope of Quranic Reality</strong> places events narrated in the Quran on a timeline and a map, next to what
    history and archaeology know about the same periods and places across civilizations: what else was happening in the world at
    the same time, and what followed. "Chronotope" is Mikhail Bakhtin's term for how a narrative binds time and space together.
  </p>

  <h3>How to read an entry</h3>
  <ul>
    <li><strong>Quran:</strong> verse references; the text is shown from a verified dataset and is never paraphrased as the text.</li>
    <li><strong>Tafsir:</strong> what classical commentators said, with the work and the place in it.</li>
    <li><strong>History and archaeology:</strong> claims from outside the Quran, each marked <em>established</em> or <em>debated</em>, with sources.</li>
    <li>
      <strong>Connection:</strong> the project's own reflection linking the layers, always labeled as interpretation, with a confidence
      level. It is not a proof.
    </li>
  </ul>
  <p>
    Dates are ranges with a stated certainty and basis. A location is shown on the map only when it is known; disputed locations are
    shaded, and unknown ones are described, not pinned. Entries marked <em>draft</em> have not been reviewed.
  </p>

  <h3>Licenses and credits</h3>
  <ul>
    <li>Code: MIT License.</li>
    <li>Written content (the <code>content/</code> folder): Creative Commons Attribution-ShareAlike 4.0.</li>
    <li>
      Quran text: <a href="https://tanzil.net" target="_blank" rel="noopener">Tanzil Project</a>, Hafs, Uthmani and Simple-clean
      scripts, copied verbatim. It keeps its own terms, reproduced below, and is not covered by the licenses above.
    </li>
    <li>
      Fonts: <a href="https://github.com/aliftype/amiri" target="_blank" rel="noopener">Amiri and Amiri Quran</a> by the Amiri Project
      Authors, SIL Open Font License 1.1.
    </li>
    <li>Maps: <a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>; map data &copy; OpenStreetMap contributors; terrain style &copy; OpenTopoMap (CC-BY-SA).</li>
  </ul>

  <h3>Tanzil terms of use</h3>
  {#if app.quran}
    <pre>{app.quran.notice}</pre>
  {:else}
    <p class="muted">Loading…</p>
  {/if}
</div>

<style>
  .about {
    max-width: 760px;
    margin: 0 auto;
    padding: 10px 24px 40px;
    overflow-y: auto;
    height: 100%;
  }
  pre {
    white-space: pre-wrap;
    font-size: 12px;
    background: #f5f5f2;
    padding: 10px;
    border-radius: 6px;
  }
</style>
