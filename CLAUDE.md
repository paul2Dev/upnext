# UpNext — Movie Discovery App

Aplicație personală de descoperire și tracking filme.

## Stack
- **Framework:** Nuxt.js 4 (Vue)
- **UI:** Nuxt UI v4 + Tailwind CSS v4
- **Auth + DB:** Supabase (@nuxtjs/supabase)
- **Date filme:** TMDB API (The Movie Database)
- **Deploy:** Vercel

## Comenzi utile
```bash
pnpm dev          # pornește dev server
pnpm build        # build pentru producție
pnpm preview      # previzualizare build local
pnpm lint         # rulează ESLint
pnpm typecheck    # verificare TypeScript
```

## Variabile de mediu
Copiază `.env.example` în `.env` și completează valorile:
- `SUPABASE_URL` + `SUPABASE_KEY` — din dashboard.supabase.com
- `TMDB_API_KEY` — din themoviedb.org/settings/api

## Arhitectură

### Pagini (`app/pages/`)
| Pagină | Rută | Descriere |
|--------|------|-----------|
| index.vue | `/` | Homepage cu recomandări personalizate |
| discover.vue | `/discover` | Browsing + filtrare filme |
| movie/[id].vue | `/movie/:id` | Detalii film |
| watchlist.vue | `/watchlist` | Filmele mele |
| login.vue | `/login` | Autentificare Google |
| confirm.vue | `/confirm` | Callback OAuth Supabase |
| onboarding.vue | `/onboarding` | Selectare genuri favorite (prima autentificare) |

### Server API (`server/api/`)
| Endpoint | Descriere |
|----------|-----------|
| `/api/movies/trending` | Filme trending de pe TMDB |
| `/api/movies/search` | Căutare filme |
| `/api/movies/[id]` | Detalii film + streaming availability |
| `/api/movies/[id]/recommendations` | Recomandări similare |
| `/api/movies/discover` | Filtrare avansată |
| `/api/user/watchlist` | GET/POST/DELETE watchlist |
| `/api/user/ratings` | GET/POST ratings personale |
| `/api/user/recommendations` | Recomandări personalizate bazate pe ratings |

### DB Supabase (tabele)
| Tabel | Coloane principale |
|-------|-------------------|
| `profiles` | id, preferred_genres[], onboarding_done |
| `watchlist` | id, user_id, movie_id, tmdb_data (jsonb), added_at |
| `watched` | id, user_id, movie_id, rating (1-5), watched_at |

## Plan de implementare

### Faza 1 — Fundație
- [x] Inițializare proiect Nuxt.js cu Nuxt UI
- [x] Configurare Supabase + TMDB în nuxt.config.ts
- [x] Creare tabele în Supabase (profiles, watchlist, watched)
- [x] Pagina de login cu Google OAuth
- [x] Middleware de autentificare (redirect la /login dacă nu ești logat)
- [x] Pagina `/confirm` pentru callback OAuth

### Faza 2 — TMDB Integration
- [x] Server API: trending, search, detalii film
- [ ] Pagina `/discover` cu grid de filme și filtre (gen, platformă, an, durată)
- [ ] Pagina `/movie/[id]` cu detalii complete + streaming availability
- [ ] Componenta MovieCard (poster, titlu, rating, gen)

### Faza 3 — Watchlist & Ratings
- [ ] Server API: watchlist (GET/POST/DELETE)
- [ ] Server API: ratings (GET/POST)
- [ ] Pagina `/watchlist` cu filmele adăugate
- [ ] Acțiuni pe film: Adaugă la watchlist / Marcat ca văzut / Rating 1-5 stele

### Faza 4 — Recomandări
- [ ] Pagina `/onboarding` — selectare genuri favorite + câteva filme văzute
- [ ] Server API: recomandări personalizate
- [ ] Homepage cu secțiunile: "Pentru tine", "Trending", "În curând"

### Faza 5 — Polish
- [ ] Design responsive (mobile)
- [ ] Loading states + error handling
- [ ] Deploy pe Vercel

## Convenții de cod
- Componente Vue în `app/components/`
- Pagini în `app/pages/`
- API routes în `server/api/`
- Composables în `app/composables/`
- Tipuri TypeScript în `types/`
- Apelurile TMDB se fac **doar** din `server/api/` (cheia e privată)
