# Filmi Flip

An offline Bollywood movie-title guessing game powered by the included expanded playable-translation film bank.

## Run it locally

From this folder, start any static file server, then open the local URL it prints. For example:

```sh
python3 -m http.server 4173
```

Open `http://localhost:4173` in a browser. Once loaded, the app caches its files for offline use.

## Play

- Open **Year filter** to choose a start and end year, or use a decade shortcut.
- English-title films are hidden by default; turn off **Hide English-title films** to include them.
- Only literal English translations that do not reuse a meaningful word from the Hindi title are included as clues.
- Audited translations take precedence when the expanded and audited game banks contain the same movie.
- User-verified translations take precedence over all other translations, and may add movies that are not in the larger bank.
- **Reveal answer** shows the Hindi film title and release year.
- **Next movie** draws the next unused title; **Random** reshuffles the remaining unused titles.
- Numbered sequel titles are excluded. A title is never repeated within the active filter's round; after all matching titles are shown, a fresh round begins automatically.
