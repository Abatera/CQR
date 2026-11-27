<script lang="ts">
  import { t } from './lib/i18n';
  import JourneyCard from './journey/JourneyCard.svelte';
  import JourneyMap from './journey/JourneyMap.svelte';
  import { app } from './state/app.svelte';
  import { href } from './state/route';
  import Icon from './ui/Icon.svelte';
  import Mark from './ui/Mark.svelte';
  import Txt from './facts/Txt.svelte';
  import { countText } from './lib/i18n';

  const lang = $derived(app.lang);
  const dir = $derived(lang === 'ar' ? 'rtl' : 'ltr');
  /** The journey shown on the home page's map: Abraham's, if it exists, or the first one. */
  const featured = $derived(app.journeysById.get('life-of-abraham') ?? app.journeys[0]);
</script>

<div class="home" {lang} {dir}>
  <div class="inner">
    <section class="hero">
      <div class="text">
        <span class="kicker"><Mark size={16} />{t('homeKicker', lang)}</span>
        <h1>{t('homeTitle', lang)}</h1>
        <p class="lead">{t('homeLead', lang)}</p>
        <div class="ctas">
          <a class="cta primary" href={href({ view: 'explore' })}>{t('startExploring', lang)}<Icon name={dir === 'rtl' ? 'left' : 'arrow'} size={18} stroke={2} /></a>
          {#if app.journeys.length}
            <a class="cta" href={href({ view: 'journeys' })}><Icon name="compass" size={18} />{t('takeJourney', lang)}</a>
          {/if}
        </div>
        <p class="drafts"><Icon name="info" size={16} stroke={2} />{t('draftsShort', lang)}</p>
      </div>

      {#if featured}
        <figure class="hero-map">
          <JourneyMap journey={featured} interactive={false} coverBottom={90} />
          <figcaption>
            <span class="fc-icon"><Icon name="compass" size={20} /></span>
            <span class="fc-text"><strong><Txt m={featured.title} /></strong><span>{countText(featured.steps.length, 'step', lang)}</span></span>
            <a href={href({ view: 'journey', id: featured.id, step: 1 })}>{t('begin', lang)}</a>
          </figcaption>
        </figure>
      {/if}
    </section>

    {#if app.journeys.length}
      <section class="block">
        <div class="block-head">
          <h2>{t('beginJourney', lang)}</h2>
          <span class="muted">{t('journeysHint', lang)}</span>
        </div>
        <div class="cards">
          {#each app.journeys as j (j.id)}<JourneyCard journey={j} />{/each}
        </div>
      </section>
    {/if}

    <section class="block">
      <h2>{t('howToRead', lang)}</h2>
      <p class="muted narrow-p">{t('howToReadLead', lang)}</p>
      <ol class="layers">
        <li class="quran"><span class="lh"><Icon name="quran" size={20} />1 · {t('layerQuran', lang)}</span><p>{t('layerQuranAbout', lang)}</p></li>
        <li class="tafsir"><span class="lh"><Icon name="tafsir" size={20} />2 · {t('layerTafsir', lang)}</span><p>{t('layerTafsirAbout', lang)}</p></li>
        <li class="tradition"><span class="lh"><Icon name="tradition" size={20} />3 · {t('layerTradition', lang)}</span><p>{t('layerTraditionAbout', lang)}</p></li>
        <li class="history"><span class="lh"><Icon name="history" size={20} />4 · {t('layerHistory', lang)}</span><p>{t('layerHistoryAbout', lang)}</p></li>
        <li class="reflection"><span class="lh"><Icon name="reflection" size={20} />5 · {t('layerReflection', lang)}</span><p>{t('layerReflectionAbout', lang)}</p></li>
      </ol>
    </section>

    <footer>
      <a href={href({ view: 'about' })}>{t('about', lang)}</a>
      <span>·</span>
      <span>Code: MIT · Content: CC BY-SA 4.0 · Quran text: Tanzil (CC BY 3.0, verbatim)</span>
    </footer>
  </div>
</div>

<style>
  .home {
    height: 100%;
    overflow-y: auto;
    background: var(--paper);
  }
  .inner {
    max-width: 1240px;
    margin: 0 auto;
    padding: 0 32px 40px;
  }
  .hero {
    display: flex;
    flex-wrap: wrap;
    gap: 48px;
    align-items: center;
    padding-top: 40px;
  }
  .text {
    flex: 1 1 440px;
    min-width: 0;
  }
  .kicker {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 12.5px;
    color: #1f5a4b;
    background: var(--accent-tint);
    padding: 4px 11px;
    border-radius: 20px;
  }
  .home:lang(ar) .kicker {
    font-size: 14px;
  }
  h1 {
    margin: 18px 0 0;
    font-family: var(--font-read);
    font-size: clamp(38px, 5vw, 56px);
    line-height: 1.04;
    font-weight: 600;
    letter-spacing: -0.02em;
  }
  .home:lang(ar) h1 {
    font-family: var(--font-ar);
    line-height: 1.4;
    letter-spacing: 0;
  }
  .lead {
    margin: 18px 0 0;
    font-size: 18px;
    line-height: 1.55;
    color: var(--ink-2);
    max-width: 560px;
  }
  .home:lang(ar) .lead {
    line-height: 1.9;
  }
  .ctas {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 26px;
  }
  .cta {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 46px;
    padding: 0 18px;
    border-radius: 11px;
    border: 1px solid #d5cec1;
    background: var(--card);
    color: var(--ink);
    text-decoration: none;
    font-weight: 600;
  }
  .cta:hover {
    background: #f2eee6;
    color: var(--ink);
  }
  .cta.primary {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }
  .cta.primary:hover {
    background: var(--accent-dark);
    color: #fff;
  }
  .drafts {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: 22px 0 0;
    font-size: 13px;
    color: var(--muted);
    max-width: 520px;
  }
  .drafts :global(svg) {
    color: var(--l-tradition);
    margin-top: 2px;
  }
  .hero-map {
    flex: 1 1 420px;
    max-width: 580px;
    margin: 0;
    position: relative;
    height: 500px;
    border-radius: 22px;
    overflow: hidden;
    box-shadow:
      0 1px 0 var(--line),
      0 18px 40px rgb(40 30 10 / 0.1);
    isolation: isolate;
  }
  figcaption {
    position: absolute;
    z-index: 700;
    left: 16px;
    right: 16px;
    bottom: 26px;
    background: rgb(252 251 248 / 0.97);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 12px 14px;
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .fc-icon {
    flex: none;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: #7a5c2e;
    color: #fff;
    display: grid;
    place-items: center;
  }
  .fc-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    font-size: 12.5px;
    color: var(--muted);
  }
  .fc-text strong {
    font-size: 14px;
    color: var(--ink);
    font-weight: 600;
  }
  figcaption a {
    font-weight: 600;
    font-size: 13px;
  }
  .block {
    margin-top: 56px;
  }
  .block-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }
  h2 {
    margin: 0;
    font-family: var(--font-read);
    font-size: 28px;
    font-weight: 600;
  }
  .home:lang(ar) h2 {
    font-family: var(--font-ar);
    font-size: 26px;
  }
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
    margin-top: 18px;
  }
  .narrow-p {
    max-width: 780px;
    margin: 6px 0 0;
  }
  .layers {
    list-style: none;
    margin: 20px 0 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  }
  .layers li {
    border-radius: 14px;
    padding: 16px;
  }
  .layers p {
    margin: 8px 0 0;
    font-size: 13px;
    color: #2a322f;
  }
  .home:lang(ar) .layers p {
    font-size: 15px;
    line-height: 1.7;
  }
  .lh {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
  }
  .quran {
    background: var(--l-quran-tint);
    color: var(--l-quran-text);
  }
  .tafsir {
    background: var(--l-tafsir-tint);
    color: var(--l-tafsir-text);
  }
  .tradition {
    background: var(--l-tradition-tint);
    color: var(--l-tradition-text);
  }
  .history {
    background: var(--l-history-tint);
    color: var(--l-history-text);
  }
  .reflection {
    background: var(--l-reflection-tint);
    color: var(--l-reflection-text);
    outline: 1.5px dashed #b996b7;
    outline-offset: -1.5px;
  }
  footer {
    margin-top: 56px;
    padding-top: 18px;
    border-top: 1px solid var(--line);
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 12.5px;
    color: var(--muted);
  }
  @media (max-width: 760px) {
    .inner {
      padding: 0 18px 32px;
    }
    .hero {
      padding-top: 24px;
      gap: 28px;
    }
    .hero-map {
      height: 360px;
    }
  }
</style>
