# Balloon Burst — play in your browser

A cheerful balloon-popping tower defense that ships as **one self-contained
HTML file**: every sprite is drawn in code, every sound is synthesized, there
are no accounts and no servers, and your progress never leaves your device.

**▶ Play: https://nickaisbitt.github.io/balloonburst-game/**

- 123 hand-drawn maps across 10 worlds · 20 towers · 21 balloon species
- An 18-stage journey, three difficulties, boss blimps with moving weak points
- Daily challenges, weekly cups, weekend tournaments, a map editor with
  share codes, couch co-op on one phone
- Offline-safe: save the file, keep it forever, play on a plane
- No ads unless you ask (rewarded videos are always opt-in); kid mode
  disables interstitials entirely
- UI in English, Spanish, French, and German

## Press kit

Everything a store, portal, or journalist needs is in [`press/`](press/):
cover image, gameplay trailer (mp4 + gif), and screenshots. Facts: 123 maps,
20 towers, 21 species, single-file build ≈ 840 KB (288 KB gzipped), zero
network calls after load. Privacy policy: [privacy.html](privacy.html).

## For portal/dev reviewers

The build is a single `index.html` with no external requests — you can serve
it from any origin or unzip-and-open it from disk. Full source of the game
lives at https://github.com/nickaisbitt/modern-tower-defense-app.

*This repository exists to host the playable build; it contains no game
source.*
