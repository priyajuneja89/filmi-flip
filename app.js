(() => {
  const ENGLISH_WORDS = /\b(?:a|an|the|and|of|or|to|in|on|for|with|from|is|my|name|love|girl|boy|woman|man|war|force|article|crew|fighter|dream|dreams|express|rockstar|half|girlfriend|vaccine|legacy|dragon|skater|billion|states|medium|entry|burning|train|hero|queen|animal|border|raid|sky|star|student|holiday|baby|welcome|race|housefull|bodyguard|kick|boss|action|ready|agent|game|time|life|story|heart|party|family|friend|friends|jungle|king|city|road|superstar|special|bad|good|happy|new|old|young|murder|murderer|mystery|secret|revenge|return|returns|again)\b/i;
  const state = { movies: [], filtered: [], deck: [], current: null, shown: 0, range: null };
  const $ = (id) => document.getElementById(id);
  const clue = $('movie-clue'), answer = $('movie-answer'), answerBox = $('answer-box');

  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function resetDeck() { state.deck = shuffle(state.filtered); state.shown = 0; }
  function rangeText() { return state.range ? `${state.range.from}–${state.range.to}` : 'All years'; }
  function updateMeta() {
    $('range-label').textContent = rangeText();
    $('progress-label').textContent = state.filtered.length ? `${state.shown} of ${state.filtered.length} this round` : 'No matching films';
  }
  function showMovie() {
    if (!state.filtered.length) {
      clue.textContent = 'No films in this range'; answerBox.hidden = true; $('reveal-button').hidden = true; $('next-button').disabled = true; $('random-button').disabled = true; updateMeta(); return;
    }
    if (!state.deck.length) resetDeck();
    state.current = state.deck.pop(); state.shown += 1;
    clue.textContent = state.current.display_question || state.current.english_clue;
    answer.textContent = state.current.display_answer || `${state.current.original_title} (${state.current.year})`;
    answerBox.hidden = true; $('reveal-button').hidden = false; $('reveal-button').textContent = 'Reveal answer'; $('next-button').disabled = false; $('random-button').disabled = false;
    updateMeta();
  }
  function isSequel(movie) { return /(?:\bpart\s+(?:2|two|ii)\b|\b(?:2|3|4|5|II|III|IV|V)\s*:|\s(?:2|3|4|5|II|III|IV|V)$)/i.test(movie.original_title); }
  function hasEnglishWords(movie) { return ENGLISH_WORDS.test(movie.original_title); }
  function titleWords(text) {
    return new Set((text.normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase().match(/[a-z0-9]+/g) || []).filter((word) => word.length >= 3));
  }
  function hasTitleLeak(movie) {
    const title = titleWords(movie.original_title);
    const clue = titleWords(movie.display_question || movie.english_title || '');
    return [...title].some((word) => clue.has(word));
  }
  function isPlayableTranslation(movie) {
    return (movie.translation_quality === 'literal_gloss' || Boolean(movie.translation_audit_status)) && !hasTitleLeak(movie);
  }
  function mergeAudits(movies, audits) {
    const auditsByMovie = new Map(audits.map((movie) => [`${movie.year}::${movie.original_title}`, movie]));
    const merged = movies.map((movie) => ({ ...movie, ...(auditsByMovie.get(`${movie.year}::${movie.original_title}`) || {}) }));
    const knownMovies = new Set(movies.map((movie) => `${movie.year}::${movie.original_title}`));
    return [...merged, ...audits.filter((movie) => !knownMovies.has(`${movie.year}::${movie.original_title}`))];
  }
  function mergeVerifiedTranslations(movies, verifiedTranslations) {
    const byMovie = new Map(movies.map((movie) => [`${movie.year}::${movie.original_title}`, movie]));
    verifiedTranslations.forEach((movie) => {
      const key = `${movie.year}::${movie.original_title}`;
      const existing = byMovie.get(key) || {};
      byMovie.set(key, { ...existing, ...movie, display_question: movie.english_title.toUpperCase(), display_answer: existing.display_answer || `${movie.original_title} (${movie.year})` });
    });
    return [...byMovie.values()];
  }
  function uniqueTitles(movies) {
    const seen = new Set();
    return movies.filter((movie) => {
      const title = movie.original_title.trim().toLocaleLowerCase();
      if (seen.has(title)) return false;
      seen.add(title);
      return true;
    });
  }
  function setFilter(from, to) {
    const lower = Number(from), upper = Number(to);
    if (!from && !to) state.range = null;
    else { const start = Number.isFinite(lower) && lower ? lower : 1976; const end = Number.isFinite(upper) && upper ? upper : 2026; state.range = { from: Math.min(start, end), to: Math.max(start, end) }; }
    const hideEnglish = $('hide-english-titles').checked;
    state.filtered = state.movies.filter((movie) => !isSequel(movie) && (!state.range || (movie.year >= state.range.from && movie.year <= state.range.to)) && (!hideEnglish || !hasEnglishWords(movie)));
    resetDeck(); showMovie();
  }
  function setupFilters() {
    $('filter-toggle').addEventListener('click', () => { const panel = $('filter-panel'); panel.hidden = !panel.hidden; $('filter-toggle').setAttribute('aria-expanded', String(!panel.hidden)); });
    $('apply-filter').addEventListener('click', () => setFilter($('year-from').value, $('year-to').value));
    $('hide-english-titles').addEventListener('change', () => setFilter($('year-from').value, $('year-to').value));
    $('clear-filter').addEventListener('click', () => { $('year-from').value = ''; $('year-to').value = ''; setFilter('', ''); });
    document.querySelectorAll('[data-range]').forEach((button) => button.addEventListener('click', () => { const [from, to] = button.dataset.range.split(','); $('year-from').value = from; $('year-to').value = to; setFilter(from, to); }));
  }
  $('reveal-button').addEventListener('click', () => { answerBox.hidden = !answerBox.hidden; $('reveal-button').textContent = answerBox.hidden ? 'Reveal answer' : 'Hide answer'; });
  $('next-button').addEventListener('click', showMovie);
  $('random-button').addEventListener('click', () => { state.deck = shuffle(state.deck); showMovie(); });
  let installPrompt;
  const installButton = $('install-button');
  window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); installPrompt = event; installButton.hidden = false; });
  installButton.addEventListener('click', async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    installButton.hidden = true;
  });
  window.addEventListener('appinstalled', () => { installPrompt = null; installButton.hidden = true; });
  Promise.all([fetch('movies.json?v=10'), fetch('audited-movies.json?v=10'), fetch('verified-movies.json?v=10')]).then(async ([moviesResponse, auditsResponse, verifiedResponse]) => { if (!moviesResponse.ok || !auditsResponse.ok || !verifiedResponse.ok) throw new Error('Movie bank could not be loaded'); return [await moviesResponse.json(), await auditsResponse.json(), await verifiedResponse.json()]; }).then(([movies, audits, verifiedTranslations]) => { state.movies = uniqueTitles(mergeVerifiedTranslations(mergeAudits(movies, audits), verifiedTranslations).filter(isPlayableTranslation)); setupFilters(); setFilter('', ''); }).catch(() => { clue.textContent = 'Movie bank unavailable'; $('progress-label').textContent = 'Please refresh'; });
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
})();
