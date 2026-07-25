# Audit complet — site fíori. (fiorisweets.ro)

Rulat cu 14 agenti: 7 dimensiuni de audit + 7 verificatori adversariali.
**70 probleme raportate -> 55 confirmate, 15 respinse la verificare.**
Dupa deduplicare (aceeasi cauza raportata de mai multe dimensiuni): **37 probleme distincte**.

---


## CRITIC

### Singurul canal de comanda (comenzi@fiorisweets.ro) nu poate primi email — domeniul nu are DNS functional
*`app/page.tsx:395` · efort: small*

**Problema:** Intreg site-ul are UN singur punct de conversie: `href="mailto:comenzi@fiorisweets.ro"` (app/page.tsx:395), tinta ambelor CTA-uri din hero (`Comanda un tort` -> #contact, app/page.tsx:163). Domeniul e inregistrat, dar zona DNS nu raspunde:
- `whois -h whois.rotld.ro fiorisweets.ro` -> `Registered On: 2026-07-02`, `Registrar: Claus Web SRL` (deci domeniul EXISTA)
- `dig @8.8.8.8 fiorisweets.ro A` -> `status: SERVFAIL`
- `dig @1.1.1.1 fiorisweets.ro A` -> `status: SERVFAIL`
- `dig +short MX fiorisweets.ro` -> gol (niciun MX)
- `dig +short NS fiorisweets.ro` -> gol (delegare NS nefunctionala)
- `curl https://fiorisweets.ro/` -> `curl: (6) Could not resolve host: fiorisweets.ro`
Fara MX si fara zona DNS rezolvabila, orice mail trimis catre comenzi@fiorisweets.ro va face bounce la expeditor.

**Impact:** Clientul care apasa singurul buton de comanda de pe site trimite un email in gol si primeste bounce. 100% din comenzile venite prin site sunt pierdute, iar utilizatorul ramane cu impresia ca firma e neserioasa. Nu e o problema de cod, e blocajul comercial numarul 1 al site-ului.

**Fix:** Doua actiuni, in ordine:
1) URGENT (in afara codului): la Claus Web / in Vercel, seteaza nameserverele domeniului si publica zona; adauga inregistrari MX pentru casuta comenzi@ (Google Workspace, Zoho Mail free sau redirect catre wingereich@gmail.com). Verifica cu `dig MX fiorisweets.ro` -> trebuie sa intoarca NOERROR + inregistrari.
2) PANA ATUNCI (in cod, ca sa nu pierzi comenzi zilele astea): pune in app/page.tsx un mailto catre o adresa care functioneaza deja si adauga un canal alternativ instant, tipic pentru cofetarii in RO:
```tsx
<a href="https://wa.me/407XXXXXXXX?text=Buna!%20As%20vrea%20un%20tort%20pentru...">
  Scrie-ne pe WhatsApp
</a>
<a href="tel:+407XXXXXXXX">07XX XXX XXX</a>
```
Un numar de telefon + WhatsApp converteste mult mai bine decat mailto la acest tip de client si nu depinde de DNS.

**Nota verificator:** Doua corecturi de precizie, nu de fond. (1) Findingul spune „dig +short NS -> gol ... delegare NS nefunctionala" — delegarea la .ro exista si e corecta; problema e ca zona nu a fost creata niciodata pe serverele Claus Web (REFUSED, nu NXDOMAIN/lame). Formularea corecta pentru client: „nameserverele sunt setate, dar zona DNS nu e publicata la Claus Web". (2) Snippetul de fix contine numere inventate (`wa.me/407XXXXXXXX`, `tel:+407XXXXXXXX`) — NU se comite asa ceva; se pune un numar real sau, provizoriu, un mailto catre o casuta care functioneaza deja (ex. wingereich@gmail.com). Altfel severitatea e corecta: e singurul punct de conversie al site-ului si e mort. De remarcat ca e problema de ops/DNS, nu de cod — codul e doar victima.



## IMPORTANT

### Marquee-ul ruleaza infinit, fara pauza si fara respectarea prefers-reduced-motion (WCAG 2.2.2, nivel A)
*`app/page.tsx:88-108 + app/globals.css:16-23, 30-32` · efort: trivial*

**Problema:** Componenta Marquee anima o banda de text pe latimea intregii pagini, imediat sub hero: `className="flex w-max animate-[marquee_35s_linear_infinite] gap-8"` (page.tsx:92), cu `@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }` (globals.css:16-23). Miscarea porneste automat, dureaza mult peste 5 secunde (ciclu 35s, `infinite`) si e prezentata in paralel cu restul continutului. Nu exista niciun mecanism de oprire si niciun media query de reducere a miscarii — `grep -rn -e "prefers-reduced-motion" -e "motion-reduce" app/ next.config.ts` returneaza EXIT=1 (zero rezultate). In plus, `html { scroll-behavior: smooth }` (globals.css:30-32) e si el neconditonat, deci si sariturile pe ancore (#produse, #galerie etc.) genereaza scroll animat pentru utilizatorii care au cerut miscare redusa la nivel de sistem.

**Impact:** Esec normativ clar de nivel A (2.2.2 Pause, Stop, Hide) — cel mai bazal nivel WCAG, singurul din tot site-ul. Practic: utilizatorii cu tulburari vestibulare, migrene sau ADHD au text care aluneca permanent in campul vizual chiar sub hero, imposibil de oprit; pe iOS/Android cu 'Reduce Motion' activat site-ul ignora setarea. Pe mobil (publicul majoritar) banda ocupa toata latimea si e greu de evitat prin scroll.

**Fix:** In `app/globals.css` adauga un bloc care neutralizeaza ambele animatii cand utilizatorul cere miscare redusa:

```css
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .animate-\[marquee_35s_linear_infinite\],
  [class*="animate-"] { animation: none !important; }
  *, *::before, *::after { transition-duration: 0.01ms !important; }
}
```

Varianta mai curata: muta animatia intr-o clasa proprie (`.marquee-track { animation: marquee 35s linear infinite; }`) si scrie `@media (prefers-reduced-motion: reduce) { .marquee-track { animation: none; } }`. Cand animatia e oprita, banda ramane lizibila static — `w-max` cu `overflow-hidden` afiseaza primele cuvinte, deci nu se rupe layout-ul. `aria-hidden="true"` (page.tsx:91) e deja corect si se pastreaza.

**Nota verificator:** Two corrections. (1) Formal-conformance nuance: honoring prefers-reduced-motion is the sufficient technique for 2.3.3 (AAA) — for 2.2.2 the sufficient techniques are G4/G11/G152/SCR33, i.e. a mechanism available to ALL users, not only those with an OS flag. The proposed CSS is the right pragmatic fix and what everyone ships, but it does not strictly close 2.2.2 for a user without 'Reduce Motion' enabled. Say 'largely mitigates' rather than 'fixes 2.2.2'. (2) aria-hidden="true" on the wrapper (page.tsx:91) is irrelevant to 2.2.2 — that criterion is about visible motion, not the a11y tree; the finding is right to keep it. Fix itself is safe: with animation:none the track keeps `w-max` inside `overflow-hidden`, so the first items render statically and nothing reflows; the blanket transition-duration override only affects hover transitions (page.tsx:125,133,210,249) which is desirable.


### og:image si og:url arata catre fiorisweets.ro, domeniu care NU rezolva inca — preview-urile de link sunt rupte
*`app/layout.tsx:13,21,26-33` · efort: small*

**Problema:** metadataBase = new URL("https://fiorisweets.ro") si openGraph.url = "https://fiorisweets.ro". HTML-ul live de pe https://fiorisweets.vercel.app/ contine: <meta property="og:image" content="https://fiorisweets.ro/images/hero-box.jpg"/>, <meta property="og:url" content="https://fiorisweets.ro"/> si acelasi lucru la twitter:image. Dar: `dig +short fiorisweets.ro A` returneaza GOL (fara record A), iar `curl https://fiorisweets.ro/images/hero-box.jpg` -> HTTP=000, err="Could not resolve host: fiorisweets.ro". Aceeasi imagine pe https://fiorisweets.vercel.app/images/hero-box.jpg -> HTTP=200.

**Impact:** Orice link catre site trimis ACUM pe WhatsApp, Facebook, Messenger sau Instagram DM afiseaza un card fara poza (crawlerul nu poate rezolva hostul). Pentru o cofetarie care se promoveaza prin share-uri, cardul cu poza tortului este exact ce aduce click-uri. In plus og:url trimite catre un domeniu mort, deci si click-ul din card ar esua.

**Fix:** Fa domeniul configurabil, nu hardcodat:

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fiorisweets.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...
  openGraph: {
    ...
    url: "/",              // relativ, se rezolva prin metadataBase
    images: [{ url: "/images/hero-box.jpg", width: 1600, height: 893, alt: "..." }],
  },
};

Apoi in Vercel: fara variabila -> foloseste vercel.app (corect azi); dupa ce DNS-ul fiorisweets.ro propaga, setezi NEXT_PUBLIC_SITE_URL=https://fiorisweets.ro si redeploy. Zero cod schimbat la comutare.

**Nota verificator:** Fix-ul e valid si verificat in documentatia locala: node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md:396-397 si tabelul de la :456-460 confirma ca un camp relativ `/` se compune cu metadataBase (`/` -> https://acme.com). Singura precizare: `metadataBase` se evalueaza la BUILD, deci setarea NEXT_PUBLIC_SITE_URL in Vercel necesita redeploy, nu doar salvarea variabilei. Severitatea high se sustine — e singura problema din lista care e activ rupta in productie chiar acum (site live de ~20 zile, header `age: 1750482`).


### Site-ul nu mentioneaza niciun oras, telefon, adresa sau retea sociala — nu poate rankea pe nicio cautare locala
*`app/page.tsx` · efort: medium*

**Problema:** Cautarea in intreaga pagina nu gaseste niciun semnal de tip NAP (Name-Address-Phone) sau social:
`grep -niE "bucures|cluj|brasov|iasi|timisoar|constanta|romania|strada|str\.|telefon|0[0-9]{9}|\+40|instagram|facebook|whatsapp|tiktok|program|livrare|orar" app/page.tsx` -> 0 rezultate.
Singurele date de contact din tot site-ul sunt un mailto (app/page.tsx:395) si textul de footer `© 2026 fíori. — fiorisweets.ro · făcut cu drag`. Nu exista oras, judet, zona de livrare, telefon, program sau link de Instagram/Facebook.

**Impact:** Cautarile care aduc clienti la o cofetarie sunt de forma "cofetarie artizanala <oras>", "torturi personalizate <oras>", "candy bar botez <oras>". Fara ca orasul sa apara nicaieri in text, site-ul e practic imposibil de asociat cu o zona geografica si nu concureaza pentru niciuna dintre aceste cautari. In plus, lipsa oricarui link de Instagram taie dovada sociala — canalul principal de vanzare pentru cofetariile mici din Romania.

**Fix:** 1) Adauga orasul/zona in mod natural in copy: in subtitlul hero ("Torturi si prajituri facute cu drag in <Oras>"), in sectiunea Despre si in Contact.
2) In sectiunea #contact adauga un bloc NAP vizibil: telefon (`<a href="tel:...">`), zona de livrare, program de preluare comenzi.
3) Adauga in footer linkuri catre Instagram/Facebook (`rel="me"`), care alimenteaza si campul `sameAs` din JSON-LD.
4) In afara codului, dar obligatoriu pentru SEO local: creeaza Google Business Profile pe aceleasi date exacte (nume, telefon, oras) — trebuie sa fie identice cu cele de pe site.

**Nota verificator:** Confirmat integral, severitate corecta — e cel mai valoros finding SEO din lot si singurul cu impact comercial real independent de DNS. Doua nuante: (a) titlul si description din app/layout.tsx:14-16 acopera deja termenii de produs („cofetărie artizanală", „torturi personalizate", „candy bar"), deci lipsa nu e de keyword-uri, ci strict de semnal GEOGRAFIC si social; (b) pasul 4 din fix (Google Business Profile) e in realitate levierul principal pentru cautari locale — ar trebui pus pe primul loc, nu ultimul, iar pasii 1-3 din cod exista ca sa fie consistenti cu el (NAP identic).



## MEDIU

### Numerele pasilor 01/02/03 sunt practic invizibile: contrast 1.36:1 (necesar 4.5:1)
*`app/page.tsx:293-296` · efort: trivial*

**Problema:** In sectiunea Despre, cardurile de pas au fundal `bg-cream/80` asezat peste sectiunea `bg-blush` (page.tsx:262, 293), deci fundalul efectiv compozit este rgb(251,240,230) — aproape alb. Peste el, numarul pasului este `text-peach` (#f3c9ab), text de 14px semibold:

```tsx
<div key={s.nr} className="rounded-2xl bg-cream/80 p-5">
  <span className="text-sm font-semibold text-peach">{s.nr}</span>
```

Calcul (script /tmp, sRGB linearizat): peach #f3c9ab pe rgb(251,240,230) = **1.36:1**. Pragul AA pentru text sub 18.66px bold este 4.5:1. Este cel mai slab contrast din tot site-ul.

**Impact:** Numerotarea 01/02/03 — singurul indiciu vizual ca cei trei pasi sunt o secventa ordonata — dispare complet pentru orice utilizator, nu doar pentru cei cu deficiente de vedere. Pe telefon, la lumina ambientala, cardurile arata ca trei blocuri identice fara ordine. Esec 1.4.3 (AA) pe continut real, nu decorativ.

**Fix:** Schimba clasa in `text-fern` sau `text-fern-deep`, ambele verificate pe acelasi fundal compozit rgb(251,240,230): `text-fern` = **7.74:1**, `text-fern-deep` = **10.78:1**. Recomandat `text-fern` (pastreaza ierarhia vizuala fata de titlul pasului care e deja `text-fern-deep`):

```tsx
<span className="text-sm font-semibold text-fern">{s.nr}</span>
```

Daca se doreste pastrarea accentului peach, alternativa este sa se inverseze: numar `text-cream` pe un badge `bg-fern` rotund.

**Nota verificator:** One factual slip inside the finding: it calls 1.36:1 'cel mai slab contrast din tot site-ul', but finding punct-wordmark-invizibil-pe-blush correctly identifies 1.18:1 as the site minimum. Drop that superlative. Otherwise the math and the recommended fix are exact — `text-fern` is the right call (7.74:1) since `text-fern-deep` would collide with the step title on line 297 which is already fern-deep.


### Overlay-ul fern-deep/70 din sectiunea Evenimente e prea slab peste zonele deschise din fotografie (3.56:1)
*`app/page.tsx:311-333` · efort: trivial*

**Problema:** Sectiunea Evenimente pune text direct peste `candybar.jpg` cu un singur strat `<div className="absolute inset-0 bg-fern-deep/70" />` (page.tsx:320). Am esantionat imaginea reala (sharp, 1600x893) exact pe zona pe care cade textul la desktop 1440px (object-cover, scale 0.9, decupaj sursa x 187..827 / y 302..591 — zona in care se afla tortul roz, biscuitii si borcanul cu bezele albe):

```
DESKTOP 1440px - zona text
  medie zona:     bg=rgb(54,69,53)  peach=6.65  blush/90=6.70
  p98 luminanta:  bg=rgb(101,108,91) peach=3.56  blush/90=3.74  blush=4.20
  pixeli sub 4.5:1 pentru peach: 20.1% din zona
```

Deci pe ~20% din suprafata pe care sta textul, eyebrow-ul `text-peach` de 12px (page.tsx:323) coboara la 3.56:1 si paragraful `text-blush/90` de 16px (page.tsx:329) la 3.74:1, sub pragul AA de 4.5:1. Pe mobil (375px, decupaj sursa x 401..1199) situatia e mai buna dar tot exista: 7.0% din zona sub prag.

**Impact:** Textul 'evenimente' si paragraful despre candy bar devin greu de citit exact acolo unde fundalul e un tort roz sau un borcan cu bezele albe — iar aceasta este sectiunea cu CTA-ul 'Cere o oferta', adica una din cele doua cai de conversie ale site-ului. Efectul se accentueaza pe ecran in lumina puternica (exterior, telefon), scenariul tipic pentru publicul acestui site.

**Fix:** Cea mai simpla solutie verificata numeric: creste overlay-ul de la `/70` la `/85`. Pe cel mai luminos pixel din zona textului (rgb(253,222,201)) rezultatele sunt:

```
fern-deep/70: peach=3.58  blush/90=3.75
fern-deep/80: peach=4.65  blush/90=4.80
fern-deep/85: peach=5.32  blush/90=5.44
```

`bg-fern-deep/80` e minimul care trece; `/85` da marja. Alternativ, daca se vrea pastrarea fotografiei mai vizibile in dreapta, foloseste un gradient directional care intuneca doar coloana de text:

```tsx
<div className="absolute inset-0 bg-fern-deep/60 bg-gradient-to-r from-fern-deep/95 via-fern-deep/80 to-fern-deep/45" />
```

**Nota verificator:** Two corrections to the fix. (1) The recommendation 'bg-fern-deep/80 e minimul care trece' is WRONG. The auditor used rgb(253,222,201) as worst case; the actual brightest pixel in the text zone is rgb(255,255,243) (near-white icing/meringue). At /80, 0.6% of the text-zone pixels still fall under 4.5:1 for peach; only at /85 does the zone reach 0.0%. So `/85` is the minimum, not the floor-with-margin. (2) The mobile figure is overstated ~2x: I measure 3.7% (peach) / 3.2% (blush/90) below threshold on the 375px crop, not 7.0%. The directional-gradient alternative is untested numerically — if it is used, the `to-fern-deep/45` end must be re-measured, since 45% overlay over rgb(255,255,243) will fail badly wherever text wraps into it.


### next.config.ts gol: AVIF dezactivat, se serveste doar WebP (-15..18% pierdut)
*`next.config.ts:3` · efort: trivial*

**Problema:** next.config.ts nu contine deloc cheia `images`:
  const nextConfig: NextConfig = {
    /* config options here */
  };
Verificat in documentatia locala node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md (sectiunea `formats`, linia ~730): default-ul in Next 16 este `formats: ['image/webp']`. Confirmat LIVE — cerere cu `Accept: image/avif,image/webp,image/*,*/*` catre /_next/image?url=%2Fimages%2Fingredients.jpg&w=828&q=75 raspunde `content-type: image/webp`, deci AVIF nu e negociat.
Am masurat castigul REAL, nu cel din docs. Next 16 nu trimite quality-ul brut catre AVIF; in node_modules/next/dist/server/image-optimizer.js:884 mapeaza:
  transformer.avif({ quality: Math.max(quality - 20, 1), effort: 3 })
deci q=75 -> AVIF q=55, effort 3. Benchmark cu sharp-ul bundle-uit de Next, exact acesti parametri, pe toate cele 12 imagini (calibrat: valorile mele WebP q75 coincid la bit cu ce serveste Vercel, ex. ingredients@828 = 75.830 B in ambele):
  @828 (mobil DPR2): WebP 382 KB -> AVIF 325 KB  (-57 KB, -15%)
  @1080 (mobil DPR3): WebP 591 KB -> AVIF 482 KB  (-108 KB, -18%)
ATENTIE — capcana: cu AVIF la ACELASI quality numeric (75) rezultatul e cu 52% MAI MARE decat WebP (594 KB vs 391 KB). Castigul exista doar pentru ca Next scade automat 20. Nu seta `quality` mai sus "ca sa compenseze".

**Impact:** 57-108 KB in plus descarcati de fiecare vizitator de mobil (publicul principal), la fiecare vizita noua. Pe 4G lent inseamna ~1s in plus pana se aseaza galeria.

**Fix:** In next.config.ts:
  const nextConfig: NextConfig = {
    images: {
      formats: ['image/avif', 'image/webp'], // ordinea conteaza: primul match din Accept castiga
    },
  };
Ordinea AVIF-first cu WebP ca fallback e exact varianta documentata in image.md. Trade-off documentat: prima cerere per (imagine, latime) e ~50% mai lenta la encodare; pentru un site cu 12 imagini statice e un cost unic, apoi totul e HIT pe edge.

**Nota verificator:** No correction needed — this is the strongest finding in the set and the only one that hits the stated primary audience (mobile, first visit) on every single load. The author correctly avoided the naive 'AVIF is always smaller' claim and correctly identified that the entire win comes from Next's automatic -20 quality offset, then warned against cancelling it by raising `quality`. Medium is right, arguably the top-priority item. One thing worth adding for the implementer: image.md:771 notes each format is cached separately, so enabling both roughly doubles Vercel's optimized-image storage — irrelevant at 12 images.


### Navigatia dispare complet sub 768px si nu exista nicio alternativa (hamburger)
*`app/page.tsx:120` · efort: medium*

**Problema:** Nav-ul e singurul mijloc de navigare in pagina si e ascuns sub breakpoint-ul md (768px), fara fallback:

```tsx
<nav className="hidden items-center gap-8 text-sm font-medium text-blush/90 md:flex">
```

Nu exista nicaieri in `app/page.tsx` un buton hamburger, `<details>`, drawer sau vreo lista de ancore alternativa. Masurat in browser la 320px si 375px:

```
nav: { display: "none", visibleLinks: 0, totalLinks: 5 }
headerVisibleLinks: ["fíori.", "Comandă"]
document.documentElement.scrollHeight = 8128px @320  /  8418px @375
```

Deci pe telefon in header raman doar logo-ul (href="#") si butonul Comanda (href="#contact"). Cele 5 ancore (Produse, Galerie, Despre, Evenimente, Contact) sunt inaccesibile altfel decat prin scroll manual pe ~8.4 metri de pagina.

**Impact:** Publicul tinta e majoritar pe mobil, exact segmentul care ramane fara navigare. Un client care vrea sa vada Galeria sau sectiunea Evenimente (candy bar = comenzi mari) trebuie sa deruleze orbeste prin toata pagina; multi abandoneaza inainte. In plus, sectiunea Evenimente e la ~6250px de sus — practic invizibila pentru cine nu deruleaza pana la capat.

**Fix:** Meniu mobil CSS-only, ca sa nu transformi page.tsx in client component. Adauga in header, langa logo, un `<details>` care se inchide singur la click pe ancora (`:target`/`onClick` nu e necesar daca folosesti un `<details>` cu `open` resetat de CSS `:has()`), sau varianta minimala si cea mai ieftina — un rand de chip-uri orizontal scrollabile sub header, vizibil doar pe mobil:

```tsx
<nav className="flex gap-2 overflow-x-auto px-6 pb-3 [scrollbar-width:none] md:hidden">
  {NAV.map((item) => (
    <a key={item.href} href={item.href}
       className="shrink-0 rounded-full border border-blush/40 px-4 py-2.5 text-sm text-blush/90">
      {item.label}
    </a>
  ))}
</nav>
```

Pastreaza `hidden md:flex` pe nav-ul existent. Zero JS, zero client component, tap target 44px inclus.

**Nota verificator:** Faptele sunt exacte, dar 'high' e umflat pentru o vitrina one-page: CTA-ul principal (Comandă → #contact) ramane vizibil permanent in header sticky, iar pagina se citeste natural de sus in jos; nu se pierde acces la continut, doar scurtatura. Fix-ul cu rand de chip-uri e corect si nu cere client component (zero JS). Atentie insa la sugestia din text cu `<details>` + `:has()` pentru auto-inchidere — e hand-wavy si nu e necesara; varianta chip-uri e cea care merita implementata. Verifica si ca randul de chip-uri nu creste headerul sticky peste `scroll-mt-20` (80px) al sectiunilor, altfel ancorele ajung sub header.



## MINOR

### new Date().getFullYear() in footer este evaluat la build — anul ramane inghetat pana la urmatorul deploy
*`app/page.tsx:412` · efort: trivial*

**Problema:** Footer-ul foloseste `© {new Date().getFullYear()}`. Pagina e Server Component fara nicio API dinamica, deci e prerendered complet static. Dovezi: (a) .next/prerender-manifest.json, ruta "/": `"initialRevalidateSeconds": false` — nu se revalideaza niciodata; (b) .vercel/output/functions/index.prerender-config.json: `"expiration": false`; (c) headerele raspunsului live: `x-nextjs-prerender: 1`, `x-vercel-cache: HIT`, `age: 1750274` (~20 zile de cand a fost servit acelasi HTML); (d) HTML-ul livrat contine literal `2026<!-- --> fíori. — fiorisweets.ro · făcut cu drag`.

**Impact:** Real, dar mic. NU e bug de hidratare (fiind Server Component, clientul nu re-randeaza si nu apare mismatch). Consecinta concreta: pe 1 ianuarie 2027 site-ul va afisa "© 2026" pana la primul redeploy. Un vizitator care vede un an vechi in footer percepe site-ul ca abandonat — ceea ce conteaza pentru o afacere care traieste din incredere.

**Fix:** Cea mai buna solutie pentru un site vitrina: elimina complet anul, nu adaugi complexitate. `© fíori. — fiorisweets.ro · făcut cu drag`. Alternative daca vrei anul: (a) `export const revalidate = 86400` in app/page.tsx (regenereaza zilnic), sau (b) hardcodezi anul de start: `© 2026 fíori.` si il actualizezi manual. NU muta footer-ul intr-un Client Component doar pentru asta — ar strica prerenderul si e over-engineering.

**Nota verificator:** Corect, inclusiv precizarea onesta ca NU e bug de hidratare (Server Component prerendat, clientul nu re-randeaza). Fix-ul recomandat (scoate anul) e cel bun pentru un site-vitrina. Mica precizare pe alternativa (b): `export const revalidate = 86400` ar functiona, dar ar transforma pagina din static pur in ISR — pentru castigul unui an in footer nu merita, deci recomandarea de a scoate anul ramane corecta.


### Lipseste canonical, iar domeniul vercel.app e complet indexabil — risc sa ajunga el in Google in locul lui fiorisweets.ro
*`app/layout.tsx:12` · efort: trivial*

**Problema:** Obiectul `metadata` (app/layout.tsx:12-34) nu are `alternates`, deci nu se emite niciun canonical. Confirmat pe HTML-ul live: `canonical: LIPSA`, `meta robots: LIPSA`. In acelasi timp raspunsul de pe preview este perfect indexabil: `curl -I https://fiorisweets.vercel.app/` intoarce 200, `server: Vercel`, si NICIUN header `X-Robots-Tag`. Cum fiorisweets.ro nu rezolva (SERVFAIL), singura versiune crawlabila azi este cea de pe vercel.app.

**Impact:** Google poate indexa si afisa in rezultate `fiorisweets.vercel.app` ca site oficial al cofetariei — arata neprofesional si, dupa ce .ro devine activ, ai doua domenii cu continut identic care isi impart semnalele de ranking.

**Fix:** Adauga canonical, DAR abia dupa ce DNS-ul pentru fiorisweets.ro raspunde — un canonical catre un host SERVFAIL poate duce la scoaterea completa din index a paginii de pe vercel.app:
```ts
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  // ...
};
```
Suplimentar, in Vercel: Project Settings -> Domains, seteaza fiorisweets.ro ca Production Domain si activeaza redirect de pe domeniul .vercel.app, ca sa nu mai existe deloc doua versiuni servite.

**Nota verificator:** Faptele sunt exacte, dar severitatea „medium" e putin umflata pentru o vitrina nelansata, cu brand nou si zero backlinkuri — probabilitatea ca Google sa descopere si sa ranteze .vercel.app inainte de lansarea .ro e mica. Partea buna: avertismentul din fix (nu pune canonical spre .ro cat timp da SERVFAIL) e corect si important — ordinea propusa e cea sanatoasa. O singura exagerare: un canonical spre un host mort e in general IGNORAT de Google, nu duce automat la „scoaterea completa din index"; efectul real e ca semnalul se pierde. Recomandarea operationala (Production Domain + redirect din .vercel.app in Vercel) e solutia corecta si face canonical-ul aproape redundant.


### Textul din sectiunea Contact scade sub 4.5:1 acolo unde literele traverseaza liniutele decorative
*`app/page.tsx:380-393 + app/globals.css:25-28` · efort: trivial*

**Problema:** Sectiunea Contact combina `.pattern-dashes` cu `bg-fern` (page.tsx:380) si un strat interior `bg-fern/80` (page.tsx:381). Liniutele SVG sunt peach cu `fill-opacity='0.85'` (globals.css:26), deci fundalul are doua valori distincte, calculate:

```
contact: fond in afara dash-ului  rgb(51,82,63)   -> peach eyebrow = 5.68:1 (OK)
contact: fond peste dash          rgb(84,102,81)  -> peach eyebrow = 4.04:1 (FAIL)
                                                  -> blush/90 paragraf = 4.20:1 (FAIL)
```

Eyebrow-ul 'contact' (`text-xs ... text-peach`, page.tsx:383) si paragraful (`text-blush/90`, page.tsx:389) sunt sub 4.5:1 pe portiunile unde glifele se suprapun peste liniute. Titlul h2 (30px bold, prag 3:1) trece cu 4.76:1.

**Impact:** Impact partial — liniutele acopera ~11% din suprafata dalei de 32x32px, deci doar fragmente de litere pierd contrast. Se vede ca o 'murdarire' a textului mic in sectiunea de contact, exact langa adresa de email care e singurul canal de comanda al site-ului.

**Fix:** Doua optiuni verificate numeric:
(a) scade opacitatea liniutelor in `app/globals.css` de la `fill-opacity='0.85'` la `0.5` -> peach 4.65:1, blush/90 4.79:1;
(b) intareste stratul de acoperire de la `bg-fern/80` la `bg-fern/90` in page.tsx:381 -> peach 4.79:1, blush/90 4.93:1, pastrand pattern-ul asa cum e.
Optiunea (b) e o singura litera modificata si pastreaza design-ul; optiunea (a) pastreaza mai bine luminozitatea sectiunii.

**Nota verificator:** Math is flawless, severity is honest. Only caveat on fix (b): raising the inner layer to bg-fern/90 clears 4.5:1 with just 0.29 of headroom on the eyebrow, so any future darkening of the peach token or bump in fill-opacity re-breaks it. Fix (a) at fill-opacity 0.5 lands at 4.65 — equally thin. If this is touched at all, combining both (fill-opacity 0.6 + bg-fern/85) gives real margin. Given the ~11% partial-glyph coverage on a bakery showcase page, 'low' is correct and deferring it is defensible.


### Acelasi produs cu ness e numit in patru feluri diferite pe aceeasi pagina
*`app/page.tsx:16-27` · efort: trivial*

**Problema:** In array-ul GALLERY, trei imagini care par acelasi produs primesc trei nume:
- linia 18: `"Prăjituri cu ness, tăiate pătrat"`
- linia 22: `"Pătrate cu cremă de cafea"`
- linia 26: `"Felie cu ness și cacao"`
Iar textul introductiv al sectiunii Galerie (p. 237-238) il numeste a patra oara: `"pătratele cu cremă de ness"`. Similar, tortul e `"Tort mousse de ciocolată cu zmeură"` in caption (p. 14) dar `"tortul de mousse cu zmeură"` in intro (p. 237).

**Impact:** Clientul nu stie cum sa ceara produsul cand scrie emailul — "as vrea patratele alea" vs "prajitura cu ness". Pentru un brand care nu are meniu si nici preturi, denumirea consistenta a produsului este singurul mod in care produsul devine comandabil si memorabil.

**Fix:** Fixeaza cate un nume canonic per produs si foloseste-l identic peste tot (galerie, intro, viitor meniu, Instagram). Ex.: `"Patratele cu ness"` — captionurile devin variatiuni de unghi, nu de nume: `"Patratele cu ness"`, `"Patratele cu ness — tava intreaga"`, `"Patratele cu ness — felie"`. La fel, alege intre `"Tort mousse cu zmeura"` si `"Tort cu mousse de ciocolata si zmeura"` si pastreaza o singura forma.

**Nota verificator:** Confirmat, si adaug o inexactitate pe care finding-ul o rateaza: captionul de la linia 26 spune "Felie", dar public/images/ness-closeup.jpg arata un PATRAT intreg pe farfurie, nu o felie — deci acolo nu e doar inconsecventa de denumire, ci si descriere gresita a imaginii, iar acelasi string e folosit si ca alt (linia 247), deci afecteaza si accesibilitatea. Fix-ul propus (un nume canonic + variatiuni de unghi) e corect si nu strica nimic, captionul ramanand descriptiv.


### Deploy exclusiv manual din CLI, cu working tree murdar — ce e live nu e reproductibil din GitHub
*`package.json:10 (script deploy)` · efort: small*

**Problema:** Nu exista Vercel GitHub App: push-ul pe GitHub NU declanseaza deploy. Dovada din API-ul Vercel (`list_deployments`) — exista doar 2 deploy-uri, ambele create din CLI de acelasi actor, si amandoua marcate `gitDirty: 1`:
```
dpl_6HhTV23... created 2026-07-04T11:48:46Z  meta: { githubCommitSha: "225af59...", gitDirty: "1", actor: "claude-code_2-1-197_agent" }
dpl_6HQHV1C... created 2026-07-04T10:42:57Z  meta: { githubCommitSha: "10f2df9...", gitDirty: "1", actor: "claude-code_2-1-197_agent" }
```
Comitul `bc9571a` ("chore: sync package-lock dupa vercel build", 2026-07-04 13:45 local) a fost impins pe GitHub dar NU are niciun deploy corespunzator — intre deploy-urile de la 13:42 si 14:48 nu s-a intamplat nimic. Confirmare ca push != deploy.
`gitDirty: 1` inseamna ca ce ruleaza in productie a fost construit dintr-un working tree cu modificari necomise — deci SHA-ul atasat deploy-ului e o aproximatie, nu adevarul.
Si acum exista divergenta reala: `git status --porcelain` -> ` M package-lock.json` (26 insertii / 3 stergeri, bump de tranzitive @emnapi), modificari care nu sunt nici pe GitHub, nici garantat in build-ul live.

**Impact:** Nimeni nu poate spune cu certitudine ce cod ruleaza pe fiorisweets.vercel.app. Un viitor deploy facut de pe alta masina (sau dupa un `git clone` curat) poate sa dea inapoi silentios modificari care erau doar local. Nu exista rollback fiabil pe SHA si nici istoric de build per commit. Pe un site vitrina cu un singur dezvoltator riscul e operational, nu de securitate — dar costul de reparare e minim, deci nu merita lasat asa.

**Fix:** 1. Instaleaza Vercel GitHub App pe repo-ul `citrixache-commits/darian` (Vercel -> Project darian -> Settings -> Git -> Connect Git Repository). Dupa asta fiecare push pe `main` face deploy in productie automat, cu SHA corect si preview-uri pe PR-uri.
2. Pana atunci, disciplina: `git add -A && git commit && git push` INAINTE de `npm run deploy`, ca `gitDirty` sa fie 0.
3. Comite acum `package-lock.json`-ul modificat (sau da-i `git checkout -- package-lock.json` daca bump-ul de tranzitive nu e dorit) — nu-l lasa in limbo.

**Nota verificator:** Toate faptele se verifica, iar API-ul GitHub confirma independent teza (push != deploy). Doua corectii de impact care coboara severitatea: (1) desi bc9571a nu are deploy propriu, continutul lui E in productie, pentru ca 225af59 e descendentul lui si a fost deployat 1h mai tarziu — deci nu exista cod lipsa din live, doar lipsa de trasabilitate 1:1 commit->build; (2) am citit diff-ul din package-lock si TOATE intrarile modificate sunt `"dev": true` (@emnapi/wasi-threads 1.2.1->1.2.2 si intrari nested sub @unrs/resolver-binding-wasm32-wasi, toate optional/dev) — deci divergenta necomisa are impact ZERO asupra bundle-ului de productie. Ramane o problema reala de igiena (fara rollback pe SHA, fara istoric per commit), dar pe un repo cu 4 comituri, un dezvoltator si un site static, medium e umflat. Fix-ul e corect si ieftin; pasul 1 (instalare Vercel GitHub App) e cel care merita facut si e o schimbare de setari de cont — necesita actiunea lui Bogdan, nu se poate aplica din cod.


### `npm run lint` esueaza cu 1905 probleme, toate din artefacte de build .vercel/output
*`eslint.config.mjs:9-14` · efort: trivial*

**Problema:** Rulat in root: `npm run lint` -> exit 1, ultima linie: `✖ 1905 problems (14 errors, 1891 warnings)`. Am verificat sursa fiecarei probleme: `grep -E "^/Users/.../Darian site/" pe output | cut -d/ -f1 | sort | uniq -c` -> 13 .vercel (si NIMIC din app/). Exemple de erori: `.vercel/output/functions/_global-error.rsc.func/___next_launcher.cjs 11:26 error A require() style import is forbidden`. Cauza: globalIgnores() din config reproduce doar ignorarile implicite ale eslint-config-next (.next/**, out/**, build/**, next-env.d.ts), dar `npm run deploy` ruleaza `vercel build` care genereaza .vercel/output — folder pe care ESLint il parcurge.

**Impact:** Linterul este practic inutilizabil: iese mereu cu exit 1 si 1900+ de zgomot, deci nu il mai ruleaza nimeni si greselile reale din app/ (a11y, next/no-img-element, hooks) vor trece nedetectate. Deploy-ul NU e blocat (in Next 16 `next build` nu mai ruleaza lint — vezi node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md:1095), deci e problema de igiena, nu de productie.

**Fix:** In eslint.config.mjs, in lista globalIgnores adauga:

  ".vercel/**",
  "_raw/**",
  "_old/**",

Dupa fix, `npm run lint` trebuie sa iasa cu 0 probleme (app/ e deja curat — nicio problema raportata pe app/page.tsx sau app/layout.tsx).

**Nota verificator:** Problema e reala si diagnosticul e exact, dar e strict igiena de dev cu zero impact in productie pe un site static cu 2 fisiere sursa — low, nu medium. Corectie la fix: din cele trei ignore-uri propuse doar `.vercel/**` face ceva. Am verificat continutul: `_raw/` are doar .png, `_old/` doar .ico/.svg — ESLint nu le parcurge oricum (fara .js/.ts), deci cele doua intrari sunt inofensive dar inutile. Predictia „dupa fix, 0 probleme" se verifica: toate cele 1905 provin din .vercel.


### #evenimente are inaltime fixa in px si se sparge la text marit (setare accesibilitate Android/browser)
*`app/page.tsx:312` · efort: small*

**Problema:** Containerul are inaltime hard-codata iar continutul e pozitionat absolut si centrat, deci nu poate impinge cutia:

```tsx
<div className="relative h-[420px] w-full sm:h-[480px]">
  ...
  <div className="absolute inset-0 flex items-center">
```

La font implicit incape, dar la limita. Masurat in browser (320px si 375px, identic):
```
box: 420px, content: 348px, slack: 72px   (h2 = 2 randuri, p = 6 randuri x 26px)
```
Doar 36px marja sus/jos. Cand root font-size creste (setarea "Text scaling" din Android Chrome / font size din setarile browserului), clasele Tailwind sunt in rem si cresc, dar `h-[420px]` nu:
```
root 18px -> content 502px, box 420px, overflow: true  (spill 41px sus + 41px jos)
root 20px -> content 590px, box 420px, overflow: true  (spill 85px sus + 85px jos)
```
Confirmat si vizual la 20px: butonul "Cere o oferta" iese din banda cu poza si pluteste peste sectiunea `bg-cream` de dedesubt, iar eyebrow-ul "evenimente" (peach) urca peste sectiunea `bg-blush` de deasupra, unde devine aproape ilizibil (peach #f3c9ab pe blush #f9ddc8).

**Impact:** Utilizatorii care au marit textul in telefon — adica exact segmentul 45+, care comanda torturi aniversare si botez — vad sectiunea cu candy bar rupta: titlu peste sectiunea de deasupra, buton CTA plutind peste fundal crem. Arata a site stricat, nu a design.

**Fix:** Scoate inaltimea fixa si absolutul pentru continut; lasa poza sa fie fundal si textul in flux normal:

```tsx
<section id="evenimente" className="relative scroll-mt-20 overflow-hidden">
  <Image src="/images/candybar.jpg" alt="..." fill sizes="(min-width: 640px) 100vw, 200vw" className="object-cover -z-10" />
  <div className="absolute inset-0 -z-10 bg-fern-deep/70" />
  <div className="mx-auto flex min-h-[420px] w-full max-w-6xl flex-col justify-center px-6 py-16 sm:min-h-[480px]">
    ... continutul existent ...
  </div>
</section>
```

`min-h` in loc de `h` = aspectul ramane identic la font normal, dar sectiunea creste in loc sa se rupa.

**Nota verificator:** Mecanismul e real si fix-ul (h -> min-h + continut in flux) e corect si sigur. Doua corectii: (1) afirmatia 'masurat la 320px si 375px, identic' e imprecisa — la 375px NU exista overflow la root 18px (masurat: content 391 < box 420); pragul e root >=18px la 320px si >=20px la 375px. (2) Trigger-ul e mai ingust decat sugereaza impactul: setarea afecteaza doar utilizatorii care si-au marit font-size-ul implicit in Chrome (desktop/Android); Safari pe iOS nu scaleaza rem-urile unui site din setarile de sistem, deci o buna parte din publicul mobil nu e atins. De aici 'low', nu 'medium'. Atentie si la fix-ul propus: muta imaginea si overlay-ul pe `-z-10` in interiorul unei sectiuni fara background propriu — merge, dar e mai fragil decat pastrarea structurii actuale si simpla inlocuire `h-[420px]` -> `min-h-[420px]` cu continutul scos din `absolute`.


### Nicaieri nu apare un interval de pret sau cu cat timp inainte trebuie comandat
*`app/page.tsx:62-78` · efort: small*

**Problema:** Sectiunea "cum se comanda" (STEPS, liniile 62-78) descrie procesul — `"Alegi ce-ți dorești"`, `"Stabilim detaliile"`, `"Te bucuri de ele"` — dar nu contine nicio cifra. Grep pe `pre[tț]|lei|ron` in `app/` -> 0 rezultate. Singura aluzie la disponibilitate e vaga: `"Comenzile se preiau în limita locurilor disponibile"` (p. 391-392). Nu exista comanda minima, termen minim de preaviz, sau ordin de marime al pretului.

**Impact:** Astea sunt exact primele doua intrebari ale oricarui client de cofetarie: "cat costa?" si "cu cat timp inainte comand?". Fara raspuns pe site, o parte din vizitatori nu mai scriu deloc (presupun ca e scump), iar cei care scriu genereaza volum mare de intrebari repetitive care se termina in "prea scump" — timp pierdut de ambele parti.

**Fix:** Adauga in sectiunea Produse sau langa STEPS o caseta scurta, orientativa (nu lista de preturi fixa, ca sa pastrezi flexibilitatea):
```tsx
<div className="mt-8 rounded-2xl bg-cream/80 p-5 text-sm font-light text-cocoa/80">
  <p>Torturi de la <strong>XXX lei</strong> (aprox. 12 portii) · cutii cu dulciuri de la <strong>XX lei</strong> · candy bar de la <strong>XXX lei</strong>.</p>
  <p className="mt-2">Comenzile se plaseaza cu minimum <strong>X zile</strong> inainte; pentru evenimente mari, <strong>X saptamani</strong>.</p>
</div>
```

**Nota verificator:** Coborat de la medium: absenta preturilor la o cofetarie care lucreaza exclusiv pe comanda e o alegere comerciala legitima si foarte raspandita — finding-ul insusi o recunoaste in fix, unde propune doar valori orientative. Partea cu adevarat utila si necontroversata e termenul minim de preaviz, care nu depinde de decizii de pret. Ca la celelalte, cifrele trebuie sa vina de la client; nu e o modificare executabila din repo.


### Header-ul sticky poate acoperi elementul focusat la navigare inversa cu Shift+Tab (WCAG 2.2 — 2.4.11 AA)
*`app/globals.css:30-32 + app/page.tsx:115` · efort: trivial*

**Problema:** Header-ul este `sticky top-0 z-50` cu inaltime `h-16` = 64px (page.tsx:115-116). In `app/globals.css` singura regula pe `html` este:

```css
html {
  scroll-behavior: smooth;
}
```

Nu exista `scroll-padding-top`. Verificat: `grep -rn -e "scroll-padding" app/` returneaza EXIT=1. Cand utilizatorul navigheaza inapoi cu Shift+Tab spre un link aflat deasupra viewportului, browserul aduce elementul focusat la marginea de sus a zonei de scroll — adica exact sub cei 64px de header opac (`bg-fern/95 backdrop-blur`), deci indicatorul de focus devine invizibil. Sectiunile au `scroll-mt-20` (80px), deci sariturile pe ancore sunt corecte — problema e strict la focusul mutat cu tastatura.

**Impact:** Utilizatorul care navigheaza doar cu tastatura pierde temporar reperul vizual al focusului cand se intoarce in pagina. Impact real limitat: pagina are doar ~12 elemente focusabile si majoritatea sunt in header sau la inceputul sectiunilor. Este insa un criteriu AA nou in WCAG 2.2, iar remedierea e o singura linie.

**Fix:** Adauga in `app/globals.css`:

```css
html {
  scroll-behavior: smooth;
  scroll-padding-top: 5rem; /* 80px > h-16 (64px) al header-ului sticky */
}
```

Bonus: cu `scroll-padding-top` setat global, `scroll-mt-20` de pe fiecare sectiune (page.tsx:185, 228, 262, 311, 380) devine redundant si poate fi scos la o curatenie ulterioara.

**Nota verificator:** Real, and the one-line fix is correct — but the finding UNDERSTATES a side effect. It says scroll-mt-20 'devine redundant si poate fi scos la o curatenie ulterioara'. That is wrong: scroll-margin-top (on the target) and scroll-padding-top (on the scrollport) ADD. Ship scroll-padding-top:5rem while the five sections still carry scroll-mt-20 (page.tsx:185,228,262,311,380) and every anchor jump lands with 160px of dead space above the heading, not 80px — a visible regression on mobile. The two changes must be made together: add scroll-padding-top AND remove scroll-mt-20 in the same commit, or use scroll-padding-top only on a page without scroll-mt. Also worth noting the real exposure is small: on mobile the 5 nav links are display:none (`hidden ... md:flex`, page.tsx:120), so the mobile tab order is only ~7 stops.


### Poppins incarca greutatea 700 care nu e folosita nicaieri — 10 fisiere de font preincarcate pe mobil
*`app/layout.tsx:7` · efort: trivial*

**Problema:** weight: ["300", "400", "500", "600", "700"]. Analiza claselor din app/page.tsx: `grep -o "font-(light|normal|medium|semibold|bold|extrabold)" app/page.tsx | sort | uniq -c` -> 12 font-light (300), 9 font-medium (500), 16 font-semibold (600). ZERO font-bold. Greutatea 400 vine implicit din body. Deci 700 nu e folosita niciodata. Consecinta in productie: HTML-ul live contine 10 `<link rel="preload" ... as="font" type="font/woff2">` (5 greutati x 2 subseturi latin + latin-ext), ~66KB preincarcati (latin ~5.4KB/fisier, latin-ext ~7.7KB/fisier, masurat in .vercel/output/static/_next/static/media/).

**Impact:** 2 fisiere woff2 (~13KB) descarcate cu prioritate inalta degeaba, in concurenta directa cu imaginea hero (LCP) pe conexiuni mobile — exact publicul tinta. Nu rupe nimic, dar e cost gratuit de eliminat.

**Fix:** app/layout.tsx linia 7: weight: ["300", "400", "500", "600"]. Rezultat: 8 preload-uri in loc de 10. Subsetul latin-ext trebuie PASTRAT — e necesar pentru ă/â/î/ș/ț, iar site-ul e plin de diacritice.

**Nota verificator:** Confirmat, inclusiv aritmetica: eliminarea lui 700 taie ~5.5KB + ~7.8KB = ~13.3KB si duce preload-urile de la 10 la 8. Avertismentul de a PASTRA subsetul latin-ext e corect si important (diacriticele ă/â/î/ș/ț sunt peste tot in pagina). Fix fara risc — `font-semibold` (600) ramane in set.


### Singurul h1 al site-ului contine doar brandul, fara niciun cuvant cheie
*`app/page.tsx:148` · efort: trivial*

**Problema:** `<h1 className="mt-4 text-7xl ..."><Wordmark /></h1>` (app/page.tsx:148) randeaza doar wordmark-ul. Extragerea headingurilor din HTML-ul live confirma: `h1 fíori.` — atat. Textul descriptiv `cofetărie artizanală` este intr-un `<p>` deasupra (app/page.tsx:145-147), nu in h1. `fíori.` este un brand nou, deci un termen pe care nu il cauta nimeni inca.

**Impact:** Cel mai puternic semnal on-page al paginii e cheltuit pe un cuvant cu volum de cautare zero. Pentru cautarile care conteaza (cofetarie artizanala, torturi personalizate + oras) pagina nu are niciun heading relevant.

**Fix:** Pastreaza aspectul vizual, dar da-i h1-ului continut semantic — de exemplu muta kicker-ul in interiorul h1 ca text ascuns vizual:
```tsx
<h1 className="mt-4 text-7xl text-blush sm:text-8xl md:text-9xl">
  <Wordmark />
  <span className="sr-only"> — cofetărie artizanală în &lt;Oras&gt;: torturi personalizate, prăjituri și candy bar</span>
</h1>
```
(atentie: `sr-only` nu exista implicit in setup-ul curent Tailwind v4 din app/globals.css — verifica sau adauga utilitarul).

**Nota verificator:** Real, dar severitate umflata la „medium" si CU O EROARE FACTUALA in fix. Eroarea: parantezele „`sr-only` nu exista implicit in setup-ul curent Tailwind v4 — verifica sau adauga utilitarul" sunt gresite. Tailwind 4.3.2 (versiunea instalata) are `sr-only` ca utilitar static built-in — verificat in node_modules/tailwindcss/dist/lib.mjs: `sr-only",[["position","absolute"],["width","1px"],["height","1px"],["padding","0"],["margin","-1px"],["overflow","hidden"],["clip-path","inset(50%)"],["white-space","nowrap"],["border-width","0"]]` (plus `not-sr-only`). Nu trebuie adaugat nimic in app/globals.css. Pe fond: h1 e un semnal on-page slab in sine, iar `<title>` (app/layout.tsx:14) duce deja „cofetărie artizanală | torturi, prăjituri & dulciuri". Castigul real apare abia cuplat cu findingul 4 (orasul in h1). Low.


### Doar HSTS e prezent; lipsesc nosniff / frame-ancestors / Referrer-Policy (risc real: clickjacking de brand)
*`next.config.ts:3` · efort: trivial*

**Problema:** Raspunsul live are un singur header de securitate:
```
$ curl -sI https://fiorisweets.vercel.app
strict-transport-security: max-age=63072000; includeSubDomains; preload   <-- OK, pus de Vercel
access-control-allow-origin: *
```
Lipsesc: `X-Content-Type-Options`, `X-Frame-Options` / CSP `frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`. Cauza: `next.config.ts` e gol:
```ts
const nextConfig: NextConfig = {
  /* config options here */
};
```
Calibrare onesta a riscului pentru acest site: nu exista formular, input, cookie, sesiune sau autentificare, iar tot continutul e prerenderat (`x-nextjs-prerender: 1`). Deci XSS/CSRF/furt de sesiune nu se aplica. Singurul risc concret ramas este ca oricine poate incarca site-ul intr-un `<iframe>` pe alt domeniu (nu exista frame-ancestors) — util pentru un concurent sau pentru o pagina de tip "comanda aici" care imprumuta credibilitatea brandului fiori.

**Impact:** Impact mic si indirect: uzurpare de brand prin iframe, plus punctaj slab la orice scanare gen securityheaders.com daca vreun client corporate o cere. Nu pune in pericol date de utilizator, pentru ca site-ul nu colecteaza niciuna.

**Fix:** Patru headere ieftine in `next.config.ts` (nu e nevoie de vercel.json daca il pui aici):
```ts
const nextConfig: NextConfig = {
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
      ],
    }];
  },
};
```
RECOMANDARE EXPLICITA: NU adauga Content-Security-Policy aici. Pagina are un script inline Next si 12 atribute `style=` inline (`curl -s ... | grep -oE 'style='` -> 12), deci o CSP corecta ar cere nonce-uri si ar rupe site-ul la prima greseala, pentru un castig de securitate aproape nul pe continut static. Nu merita complexitatea.

**Nota verificator:** Confirmat si bine calibrat — findingul nu umfla riscul, spune explicit ca XSS/CSRF/furt de sesiune nu se aplica si ca ramane doar clickjacking de brand. Sunt de acord cu low (as accepta si nit). Doua observatii pe fix: (1) `X-Frame-Options: SAMEORIGIN` e headerul vechi; echivalentul modern e `Content-Security-Policy: frame-ancestors 'self'` — se pot pune amandoua, sunt independente si frame-ancestors nu are nevoie de nonce-uri, deci recomandarea "NU adauga CSP" e prea absoluta: CSP doar cu directiva frame-ancestors e perfect sigura aici; ce trebuie evitat e `script-src`/`style-src`, si acolo motivatia data (script inline Next + 12 atribute `style=`, numarate si de mine: exact 12) e corecta. (2) `interest-cohort=()` in Permissions-Policy e o directiva FLoC dezafectata din 2023 — inofensiva, dar e cargo cult; poate fi scoasa. Daca se face si findingul de cache, ambele seturi de headere trebuie puse in acelasi `headers()` din next.config.ts, nu in doua fisiere separate.


### Prop-ul `priority` de pe next/image e deprecat in Next.js 16 (a fost inlocuit cu `preload`)
*`app/page.tsx:174` · efort: trivial*

**Problema:** Imaginea hero foloseste `priority`. Documentatia locala node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md:291-293 spune explicit: "Starting with Next.js 16, the `priority` property has been deprecated in favor of the `preload` property in order to make the behavior clear." Tabelul de props din aceeasi pagina nici nu mai listeaza `priority`, doar `preload`. Iar in tipuri, node_modules/next/dist/shared/lib/get-img-props.d.ts:24-27: `/** @deprecated Use `preload` prop instead. */ priority?: boolean;`. Changelog-ul componentei (image.md:1402) confirma: "v16.0.0 ... `preload` prop added, `priority` prop deprecated".

**Impact:** Functioneaza corect azi (preload-ul hero se emite — am confirmat <link rel="preload" as="image" imageSrcSet="/_next/image?url=%2Fimages%2Fhero-box.jpg..." in HTML-ul live). Dar e API deprecat: IDE-ul il taie cu linie, si risca sa fie eliminat la Next 17, adica un upgrade viitor va crapa hero-ul LCP.

**Fix:** In app/page.tsx linia 174, inlocuieste `priority` cu `preload`. Comportamentul e identic pentru acest caz (o singura imagine LCP above the fold).

**Nota verificator:** Corect in totalitate. O nuanta din aceeasi pagina de documentatie pe care finding-ul o omite (image.md, sectiunea `preload`): „In most cases, you should use `loading=\"eager\"` or `fetchPriority=\"high\"` instead of `preload`" — dar exceptia listata explicit acolo („The image is the LCP element" / „above the fold, typically the hero image") descrie exact acest caz, deci `preload` ramane alegerea potrivita aici. Swap 1:1, zero risc.


### Imaginile sunt referite prin string, nu prin static import: fara blur placeholder si fara cache immutable
*`app/page.tsx:13, app/page.tsx:32, app/page.tsx:171` · efort: medium*

**Problema:** Toate cele 12 imagini sunt referite ca string-uri in array-uri (`img: "/images/tort-mousse.jpg"` la app/page.tsx:13, `img: "/images/tort.jpg"` la app/page.tsx:32, `src="/images/hero-box.jpg"` la app/page.tsx:171). Doua consecinte masurate:
(1) FARA blur placeholder. In HTML-ul live, niciun <img> nu are placeholder — 11 din 12 sunt `loading="lazy"` si apar brusc din alb. Documentatia locala (image.md, sectiunea blurDataURL): "If `src` is a static import of a jpg, png, webp, or avif file, `blurDataURL` is added automatically". Cu string nu se intampla nimic automat.
(2) FARA cache in browser. Verificat LIVE, inclusiv pe HIT de edge:
  curl -sI '.../_next/image?url=%2Fimages%2Fhero-box.jpg&w=1080&q=75'
  cache-control: public, max-age=0, must-revalidate
  x-vercel-cache: HIT   age: 60
Upstream-ul /images/hero-box.jpg raspunde tot `max-age=0, must-revalidate` (fisier necontinut-hash-uit din public/), si acesta se propaga la iesirea optimizata. Documentatia locala (image.md, sectiunea minimumCacheTTL) spune explicit ca solutia e static import: "it's better to use a Static Image Import which will automatically hash the file contents and cache the image forever with a Cache-Control header of immutable".

**Impact:** La fiecare revenire pe site browserul face 12 cereri conditionale de revalidare inainte sa afiseze orice poza — pe mobil, 12 round-trip-uri inutile. In plus, incarcarea "pop-in" alb->poza pe 11 imagini arata neingrijit pentru un site care isi vinde produsul prin fotografie.

**Fix:** Treci pe static imports; rezolva ambele probleme simultan si adauga si dimensiunile intrinseci:
  import tortMousse from "@/public/images/tort-mousse.jpg";
  const GALLERY = [{ img: tortMousse, caption: "..." }, ...];
  <Image src={g.img} alt={g.caption} fill placeholder="blur" sizes="..." className="object-cover" />
Pe hero NU pune placeholder="blur" — base64-ul inline creste HTML-ul si poate intarzia LCP-ul; lasa-l `empty`.
Daca vrei sa ramai pe string-uri, minimul e sa fortezi cache-ul upstream din next.config.ts:
  async headers() {
    return [{ source: '/images/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] }];
  }
(atentie: `immutable` pe fisiere fara hash inseamna ca trebuie sa redenumesti fisierul cand schimbi poza).

**Nota verificator:** Both sub-claims are true and the mechanism is verified in source, not just docs. Downgrading medium -> low on impact realism:
- The cache half only affects RETURN visitors, and `max-age=0, must-revalidate` produces 304s (a few hundred bytes each), not 12 full re-downloads. The finding's phrasing '12 cereri conditionale ... inainte sa afiseze orice poza' overstates it — 11 of the 12 are lazy and below the fold, so they revalidate as the user scrolls, not before first paint.
- The blur half is a perceived-polish item, not a metric; it moves no Core Web Vital.
The fix advice is otherwise good and I want to endorse two specific parts: telling the implementer NOT to put placeholder="blur" on the hero (inline base64 in the HTML would delay the LCP element) is correct, and the warning that `immutable` on unhashed public/ files forces a manual rename on every photo change is a real trap correctly called out. Prefer the static-import route over the headers() hack for exactly that reason.


### Lipsesc datele de identificare ale comerciantului cerute de Legea 365/2002
*`app/page.tsx:406-416` · efort: trivial*

**Problema:** Footerul contine integral doar: `© {new Date().getFullYear()} fíori. — fiorisweets.ro · făcut cu drag`. Nu apare nicaieri denumirea juridica (SRL/PFA/II), sediul, codul unic de inregistrare (CUI), numarul de la Registrul Comertului sau un telefon de contact rapid. Legea 365/2002 privind comertul electronic, art. 5, cere furnizorului de servicii ale societatii informationale sa puna la dispozitie permanent si direct accesibil: numele/denumirea, sediul, datele de contact (inclusiv email si un mijloc de contact rapid), numarul de inregistrare si codul fiscal. In plus, produsele alimentare pentru vanzare implica si autorizatia/inregistrarea sanitar-veterinara DSVSA — nementionata.

**Impact:** Expunere la sanctiune ANPC la un control sau la o reclamatie, si — la fel de important comercial — un client care nu vede nicio firma in spate presupune ca e o pagina de test sau un vanzator neinregistrat. Pentru comenzi de 500-1500 lei (tort de nunta, candy bar), lipsa datelor firmei e un motiv concret de abandon.

**Fix:** Adauga in footer un rand discret, sub copyright:
```tsx
<span className="font-light text-blush/60 text-xs">
  <NUME> SRL · CUI RO<xxxxxxx> · J<xx>/<xxxx>/<an> · <sediu> · tel. 07XX XXX XXX
</span>
```
Daca e PFA/II, se scrie forma corespunzatoare. Daca activitatea e inregistrata DSVSA, mentioneaza si numarul — pentru o cofetarie e un argument puternic de incredere, nu doar o obligatie.

**Nota verificator:** Lipsa e reala, dar "high" e umflat si incadrarea juridica e fortata: Legea 365/2002 vizeaza furnizorii de servicii ale societatii informationale, iar pagina nu are cos, formular sau flux de comanda — nicio tranzactie nu se incheie pe site. Riscul concret de sanctiune ANPC pentru o pagina pur de prezentare e mic. In plus fix-ul presupune ca exista deja o entitate inregistrata (SRL/PFA/II) si eventual un numar DSVSA — nimic din repo nu confirma asta, iar completarea footerului cu date inventate ar fi mai rau decat lipsa lor. Effort "trivial" doar dupa ce datele exista.


### Zero structured data (JSON-LD) — niciun schema.org Bakery/LocalBusiness
*`app/layout.tsx` · efort: small*

**Problema:** Nu exista niciun bloc de date structurate nici in sursa, nici in HTML-ul livrat:
- `grep -rniE "application/ld\+json|schema\.org|JsonLd" app/` -> NIMIC GASIT
- parsare HTML live de pe https://fiorisweets.vercel.app/ -> `ld+json blocks: 0`
Pentru o afacere locala, Google se bazeaza pe `LocalBusiness`/`Bakery` ca sa lege site-ul de entitatea din Maps/Business Profile si sa afiseze rezultate imbogatite.

**Impact:** Google nu are de unde sa inteleaga ca fiori. e o cofetarie cu locatie, program si zona de livrare. Fara asta nu apari in pachetul local de rezultate (harta cu 3 rezultate), care e sursa dominanta de trafic comercial pentru o cofetarie.

**Fix:** Adauga in app/layout.tsx, in <body>, un bloc JSON-LD (completat cu datele reale, nu placeholder):
```tsx
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Bakery",
  name: "fíori.",
  description: "Cofetarie artizanala: torturi personalizate, prajituri, cookies, marshmallows si candy bar.",
  url: "https://fiorisweets.ro",
  image: "https://fiorisweets.ro/images/hero-box.jpg",
  email: "comenzi@fiorisweets.ro",
  telephone: "+407XXXXXXXX",
  address: { "@type": "PostalAddress", streetAddress: "...", addressLocality: "ORAS", addressCountry: "RO" },
  areaServed: "ORAS",
  priceRange: "$$",
  sameAs: ["https://www.instagram.com/...", "https://www.facebook.com/..."],
};
// in JSX:
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
```
Nu publica campuri inventate — daca nu exista adresa fizica publica, omite `address` si pastreaza `areaServed` + `telephone`.

**Nota verificator:** Faptul e corect, dar impactul declarat e GRESIT si de aici severitatea umflata. Afirmatia „Fara asta nu apari in pachetul local de rezultate (harta cu 3 rezultate)" e falsa: local pack-ul e alimentat de Google Business Profile, nu de JSON-LD de pe site. Schema Bakery/LocalBusiness e un semnal de coroborare, nu o conditie de intrare. In plus fix-ul e blocat practic: fara adresa/telefon/oras reale (vezi findingul 4) nu poti popula `address`, `telephone`, `areaServed` sau `sameAs` — iar findingul insusi recunoaste asta la final. Pentru o vitrina de cofetarie nelansata inca: imbunatatire ieftina si utila, dar low, nu high.


### Nu exista vercel.json: cele 12 imagini (5.9 MB) se revalideaza la fiecare vizita
*`N/A (lipseste vercel.json in root)` · efort: trivial*

**Problema:** Nu exista `vercel.json` si nici `headers()` in `next.config.ts` (fisierul e gol, doar `const nextConfig: NextConfig = {};`). Rezultatul, pe raspunsul live:
```
$ curl -sI https://fiorisweets.vercel.app/images/tort.jpg
cache-control: public, max-age=0, must-revalidate      <-- 445 KB, zero cache in browser
content-length: 445549

$ curl -sI .../_next/image?url=%2Fimages%2Ftort.jpg&w=640&q=75
cache-control: public, max-age=0, must-revalidate      <-- si varianta optimizata mosteneste asta
```
Prin contrast, chunk-urile Next primesc corect `cache-control: public,max-age=31536000,immutable`. Deci exact activele grele (fotografiile) sunt singurele necachate.
Volumul: `du -sh public/images` -> `5.9M`, 12 fisiere intre 302 KB si 971 KB, si pagina face 12 cereri `/_next/image` (`curl -s ... | grep -c 'src="/_next/image'` -> 12).

**Impact:** Fiecare revenire pe site inseamna 12 cereri conditionale in plus inainte sa se afiseze ceva — pe 4G romanesc, latenta vizibila la scroll. In plus, pentru ca headerul de cache se propaga in optimizatorul de imagini, transformarile Vercel (metrica facturata pe planul Hobby/Pro) se pot reface mai des decat e nevoie pe niste poze care nu se schimba niciodata. Nu e o gaura de securitate, dar e bani si viteza pierduta pe degeaba.

**Fix:** Creeaza `vercel.json` in root:
```json
{
  "headers": [
    {
      "source": "/images/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```
Este sigur: numele fisierelor sunt stabile si continutul nu se schimba; daca inlocuiesti o poza, redenumeste-o (ex. `tort-v2.jpg`) sau lasa `max-age=604800` daca preferi prudenta.
Regiune: nu e nevoie sa fortezi `regions` — raspunsul vine deja din `fra1` (`x-vercel-id: fra1::...`), adica Frankfurt, cel mai apropiat edge pentru trafic din Romania. Iar redirectul www->apex se configureaza in Vercel -> Domains (vezi finding-ul de DNS), nu in vercel.json.

**Nota verificator:** Masuratorile sunt corecte si fix-ul e valid (confirmat de documentatia oficiala din node_modules, nu din memorie). Cobor severitatea pentru ca impactul e mult mai mic decat sugereaza textul: cele 12 cereri de revalidare intorc 304 cu payload de ~cateva sute de bytes, nu 5.9 MB, iar `x-vercel-cache: HIT` + `x-vercel-id: fra1::` arata ca originea e deja la Frankfurt (~20-40 ms din Romania). Nu se retransfera pozele, se platesc doar RTT-uri. Formularea "se revalideaza la fiecare vizita" din titlu e corecta tehnic dar induce ideea de 5.9 MB reincarcati, ceea ce e fals. Nota pe fix: `headers()` in next.config.ts e alternativa echivalenta si mai potrivita aici (docs-ul headers.md spune explicit "Headers are checked before the filesystem which includes pages and /public files"), si ar permite sa se puna in acelasi loc si headerele de securitate din findingul urmator, in loc de doua fisiere de config. Avertismentul despre redenumire la inlocuirea unei poze e corect si obligatoriu daca se pune `immutable`.


### Marquee: gap-8 pe containerul animat strica matematica lui translateX(-50%) — salt de 16px la fiecare bucla
*`app/page.tsx:92-94` · efort: trivial*

**Problema:** Structura: <div className="flex w-max animate-[marquee_35s_linear_infinite] gap-8"> cu exact 2 copii identici ({[0,1].map(...)}), fiecare <div className="flex shrink-0 items-center gap-8">. Din CSS-ul compilat: `.gap-8{gap:calc(var(--spacing) * 8)}` = 8 x 0.25rem = 2rem = 32px, iar `@keyframes marquee{0%{transform:translate(0)}to{transform:translate(-50%)}}`.

Calcul: fie A latimea unei jumatati. Containerul are w-max, deci latimea totala W = A + 32 + A = 2A + 32.
translateX(-50%) = -(A + 16).
Pentru bucla continua, deplasarea trebuie sa fie exact o perioada = A + 32 (jumatatea + gap-ul care o precede pe a doua).
Diferenta = 32 - 16 = 16px.

**Impact:** La fiecare ciclu de 35s banda cu "cookies · torturi · marshmallows..." sare vizibil 16px inapoi. Nu e catastrofal, dar e exact genul de detaliu care face un site sa para neterminat, si e sub bara de calitate a restului paginii.

**Fix:** Scoate gap-ul de pe containerul animat si pune-l ca padding in interiorul fiecarei jumatati, ca gap-ul sa faca parte din perioada:

  <div className="flex w-max animate-[marquee_35s_linear_infinite]">
    {[0, 1].map((half) => (
      <div key={half} className="flex shrink-0 items-center gap-8 pr-8">

Atunci latimea unei jumatati devine A+32, W = 2(A+32), iar -50% = -(A+32) = exact o perioada -> bucla perfect continua.

Obs: tripla duplicare `const row = [...M, ...M, ...M]` (linia 89) NU e cod mort — cu 6 termeni o singura copie are ~1000px, sub latimea unui ecran desktop, deci tripla e necesara ca fiecare jumatate sa acopere viewportul. Poate ramane.

**Nota verificator:** Calculul e corect si reprodus exact. ATENTIE la fix-ul principal propus — e gresit: scoaterea lui `gap-8` de pe containerul animat face bucla seamless, dar elimina si singurul spatiu dintre ultima bulina a jumatatii A si primul cuvant al jumatatii B (spatierea dintre span-uri vine din `gap-8`-ul jumatatii interioare, nu din cel exterior), deci la imbinare cuvintele se lipesc de bulina. Afirmatia 'spatierea ramane uniforma' e falsa. Foloseste varianta alternativa, care e corecta: `to { transform: translateX(calc(-50% - 16px)); }` in app/globals.css. Banda e `aria-hidden`, pur decorativa — cosmetic, deci 'low' e potrivit.


### Marquee-ul sare vizibil 16px la fiecare ciclu (gap-ul nu e inclus in translateX(-50%))
*`app/page.tsx:92` · efort: trivial*

**Problema:** Animatia muta banda cu -50% din latimea totala, dar containerul flex are si el `gap-8`, care intra in latimea totala:

```tsx
<div className="flex w-max animate-[marquee_35s_linear_infinite] gap-8">
```
```css
@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
```

Masurat in browser:
```
totalWidth: 6368,  half0: 3168,  half1: 3168,  columnGap: 32px
translate la -50% = 3184px
necesar pentru bucla continua = 3168 + 32 = 3200px
seamErrorPx = -16
```
Deci la fiecare 35 de secunde banda "sare" inapoi cu 16px.

**Impact:** Cosmetic, dar vizibil: pe mobil, unde banda ocupa toata latimea si e primul element sub hero, saltul se citeste ca un glitch. Nu strica layout-ul.

**Fix:** Scoate `gap-8` de pe containerul animat (span-urile interioare au deja `gap-8` si se termina cu bulina, deci spatierea ramane uniforma):
```tsx
<div className="flex w-max animate-[marquee_35s_linear_infinite]">
```
Alternativ, lasa gap-ul si corecteaza keyframe-ul: `to { transform: translateX(calc(-50% - 16px)); }`.

**Nota verificator:** Calculul e corect si reprodus exact. ATENTIE la fix-ul principal propus — e gresit: scoaterea lui `gap-8` de pe containerul animat face bucla seamless, dar elimina si singurul spatiu dintre ultima bulina a jumatatii A si primul cuvant al jumatatii B (spatierea dintre span-uri vine din `gap-8`-ul jumatatii interioare, nu din cel exterior), deci la imbinare cuvintele se lipesc de bulina. Afirmatia 'spatierea ramane uniforma' e falsa. Foloseste varianta alternativa, care e corecta: `to { transform: translateX(calc(-50% - 16px)); }` in app/globals.css. Banda e `aria-hidden`, pur decorativa — cosmetic, deci 'low' e potrivit.


### next 16.2.10 are 9 advisory-uri high; fixul e un patch (16.2.11), dar expunerea reala e mica
*`package.json:13` · efort: trivial*

**Problema:** ```
"next": "16.2.10",
```
`npm audit --omit=dev` raporteaza 3 pachete vulnerabile in dependintele de productie:
```
next 9.3.4-canary.0 - 16.3.0-preview.7   Severity: high   (9 advisories)
postcss <=8.5.17                          Severity: high   (3 advisories)
sharp <0.35.0                             Severity: high   (libvips CVE-2026-33327/33328/35590/35591)
3 high severity vulnerabilities
fix available via `npm audit fix --force`  -> Will install next@16.2.11
```
Am verificat cat din asta e exploatabil pe ACEST site, ca sa nu umflu severitatea:
- fara middleware, fara Server Actions, fara custom server, fara `rewrites` in `next.config.ts` (fisier gol) -> advisory-urile de middleware bypass, SSRF in Server Actions/rewrites si "unauthenticated disclosure of Server Function endpoints" nu au suprafata.
- endpointul de optimizare imagini E expus (`next/image` e importat in `app/page.tsx:1`, 12 utilizari), DAR e blindat: `/_next/image?url=%2Ficon.svg` -> `HTTP/2 400` (SVG respins), `/_next/image?url=https%3A%2F%2Fexample.com%2Fa.jpg` -> `HTTP/2 400` (host extern respins, `remotePatterns` gol). Deci DoS-ul prin SVG din GHSA-q8wf-6r8g-63ch nu e declansabil.
- ramane relevant grupul de cache confusion (GHSA-68g3-v927-f742 / GHSA-4633-3j49-mh5q), care tine de raspunsuri servite prin CDN si nu depinde de features aplicative.

**Impact:** Risc practic scazut pentru o vitrina statica fara input de la utilizator, fara cookies si fara autentificare — cel mai rau caz realist e servirea unui raspuns cache-uit gresit sau consum de resurse pe optimizatorul de imagini. Motivul pentru care merita totusi facut: costul fixului este aproape zero (patch release, acelasi minor) si scaparea nu se justifica intr-un scan public de dependinte.

**Fix:** Bump la ultimul patch de pe linia 16.2:
```bash
npm install next@16.2.11 eslint-config-next@16.2.11
npm run build   # verifica ca build-ul trece
```
Nu rula `npm audit fix --force` orbeste — poate sari pe alt minor. Dupa build ok: commit + push, apoi deploy. `postcss` si `sharp` se rezolva singure, fiind tranzitive prin `next`.

**Nota verificator:** Datele sunt exacte pana la ultima cifra si — spre deosebire de un audit tipic — findingul si-a facut singur triajul de exploatabilitate corect, ceea ce merita spus. Tocmai de aceea medium e inconsecvent cu propria analiza: pagina e integral preranderata (`x-nextjs-prerender: 1` in raspunsul live), site-ul e GET-only, fara cookies, fara sesiune, fara input de utilizator; advisory-urile de cache confusion (GHSA-68g3-v927-f742 / GHSA-4633-3j49-mh5q) vizeaza explicit "requests with bodies", pe care acest site nu le primeste niciodata. Risc practic ~zero, deci low. Fix-ul e corect si sigur (patch pe acelasi minor, existenta verificata pe npm), inclusiv avertismentul de a NU rula `npm audit fix --force` orb — acela ar fi sarit pe alt range. De coordonat cu findingul de deploy: bump-ul rescrie package-lock.json, care oricum e deja murdar, deci se face commit + push INAINTE de deploy.


### og:image are 301 KB — peste pragul la care WhatsApp renunta sa afiseze preview-ul
*`app/layout.tsx:29` · efort: small*

**Problema:** app/layout.tsx:29 declara ca imagine OpenGraph fisierul brut din public/:
  images: [{ url: "/images/hero-box.jpg", width: 1600, height: 893, ... }]
Verificat LIVE:
  curl -sI https://fiorisweets.vercel.app/images/hero-box.jpg  ->  content-length: 308667  (301,4 KB)
  <meta property="og:image" content="https://fiorisweets.ro/images/hero-box.jpg"/>
Crawlerele sociale iau fisierul BRUT, nu trec prin /_next/image, deci nu beneficiaza de nicio optimizare — primesc 301 KB de JPEG. Pragul uzual citat pentru preview-urile WhatsApp este ~300 KB, iar raportul de aspect 1600x893 (1.79:1) nu e cel recomandat de 1200x630 (1.91:1), deci imaginea mai si primeste un crop.

**Impact:** Cofetaria se distribuie in Romania aproape exclusiv prin WhatsApp si Facebook. Un link partajat fara imagine de preview arata ca spam si scade dramatic rata de click — e o pierdere directa de clienti, nu doar o problema de viteza.

**Fix:** Genereaza un OG dedicat 1200x630 sub ~150 KB si foloseste conventia de fisier din App Router (app/opengraph-image.jpg), care seteaza automat url/width/height/type si elimina nevoia campului manual din metadata. Alternativ, pastreaza campul dar pointeaza catre un fisier nou:
  npx sharp -i public/images/hero-box.jpg -o public/og.jpg resize 1200 630 --fit cover -- jpeg --quality 78 --mozjpeg
Verifica dupa deploy cu Facebook Sharing Debugger si trimite-ti linkul pe WhatsApp.

**Nota verificator:** Confirmed on the facts, but I am downgrading medium -> low and flagging two errors.
(1) The load-bearing causal claim is unverified. The whole severity rests on a '~300 KB WhatsApp threshold' that I could not substantiate from any authoritative source — it is widely repeated folklore. The file is 301.4 KiB, i.e. 0.5% over an approximate number. Building a medium on a 1.4 KB margin over an unproven threshold is not sound.
(2) The finding MISSES the actual blocker. `dig +short fiorisweets.ro` (A and AAAA) returns nothing and `curl https://fiorisweets.ro/images/hero-box.jpg` fails with code 000 — the domain does not resolve. Because metadataBase is https://fiorisweets.ro (app/layout.tsx:13), og:image is an absolute URL to a host that does not exist, so EVERY social preview is broken today regardless of file size. Shrinking the JPEG fixes nothing until DNS propagates. That inversion of cause matters more than the byte count.
(3) The proposed fix command is broken: `npx sharp -i ... -o ...` is sharp-cli syntax. I checked node_modules/sharp/package.json — `bin: null`, sharp 0.34.5 ships no executable, so npx will fail with 'could not determine executable to run'. The correct package is `sharp-cli`, or just a node one-liner.
The recommended direction (a dedicated app/opengraph-image.jpg at 1200x630) is still correct and worth doing.


### Repo public expune ca fotografiile produselor sunt generate AI — inutil pentru un site de client
*`README.md:7` · efort: trivial*

**Problema:** Repo-ul e confirmat public:
```
$ curl -s https://api.github.com/repos/citrixache-commits/darian | grep visibility
  "private": false,
  "visibility": "public",
```
iar README-ul comis in el spune direct:
```
- **Imagini:** generate cu Higgsfield (Nano Banana Pro), stil Fivori — originalele PNG sunt in `_raw/` (negit-uit)
```
Site-ul prezinta aceleasi imagini ca fotografii ale produselor cofetariei (torturi, cookies, candy bar). Nu e o scurgere de secrete — am verificat si nu exista niciuna (vezi mai jos) — dar e o informatie interna care nu are ce cauta public.
De mentionat ca restul igienei repo-ului e CURATA, verificat: `git ls-files` nu contine `.env*`, `.vercel/`, chei sau fisiere personale; `.gitignore` acopera corect `.env*`, `.vercel`, `_raw/`, `_old/` (`git check-ignore -v` confirma); `git log --all --stat` pe toate cele 4 comituri arata ca singurele fisiere sterse din istoric sunt `app/favicon.ico` si SVG-urile default din create-next-app; `git grep` pentru chei/token/parole/cai `/Users/...` in fisierele urmarite nu returneaza nimic; toate comiturile au emailul noreply corect (`260246357+citrixache-commits@users.noreply.github.com`). Si `CLAUDE.md` din repo are 11 octeti (`@AGENTS.md`), iar `AGENTS.md` contine doar o nota generica despre Next.js — CLAUDE.md-ul personal cu date despre firma, furnizori si adrese sta la `/Users/cetinoiu/Downloads/CLAUDE.md`, UN NIVEL DEASUPRA repo-ului, deci nu e si nu poate fi comis.

**Impact:** Risc reputational mic dar real: daca un client sau un concurent gaseste repo-ul, afla ca pozele nu sunt ale produselor reale, ceea ce contrazice mesajul "facute cu drag, in serii mici" de pe site. Pentru un brand artizanal, increderea in fotografie e tot capitalul. Probabilitatea ca cineva sa caute repo-ul e mica, de aici severitatea low.

**Fix:** Cel mai simplu: fa repo-ul privat (GitHub -> Settings -> General -> Danger Zone -> Change visibility -> Private). Un site de prezentare al unui client nu castiga nimic din a fi public, si Vercel functioneaza identic pe repo privat.
Daca vrei sa ramana public, scoate randul despre generarea AI din README si tine detaliul in notele locale.
Pe termen mediu, indiferent de vizibilitate: inlocuieste treptat imaginile generate cu fotografii reale ale produselor — altfel exista si o expunere de practica comerciala inselatoare (ANPC) daca un client comanda dupa o poza care nu corespunde produsului livrat.

**Nota verificator:** Confirmat factual. Doua nuante. (1) Nu e chiar un finding de infra, e reputational/continut — dar e legitim ridicat si severitatea low e potrivita: probabilitatea ca un client sa caute repo-ul `citrixache-commits/darian` (nume care nici nu contine "fiori") e foarte mica. (2) Cea mai valoroasa parte a findingului e de fapt ultimul paragraf, care nu tine de vizibilitatea repo-ului: pozele generate AI sunt prezentate ca produse reale ale cofetariei, iar asta e o expunere de practica comerciala inselatoare indiferent daca repo-ul e public sau privat — ascunderea repo-ului nu rezolva riscul, doar il face mai putin vizibil. Recomandarea de a face repo-ul privat e corecta si gratuita (Vercel merge identic pe repo privat), dar e o schimbare de setari pe contul GitHub al lui Bogdan, nu o modificare de cod. ATENTIE la regula din CLAUDE.md: nimic din acest finding nu implica stergere de fisiere; daca se scoate randul din README, textul se muta in notele locale, nu se pierde.


### robots.txt si sitemap.xml intorc 404 in productie
*`app/robots.ts (inexistent)` · efort: trivial*

**Problema:** Ambele lipsesc din sursa si intorc 404 live:
- `find app public -type f` -> doar globals.css, icon.svg, layout.tsx, page.tsx + 12 jpg. Nu exista app/robots.ts, app/robots.txt, app/sitemap.ts, app/sitemap.xml, app/opengraph-image.*, app/manifest.ts.
- `curl -o /dev/null -w %{http_code} https://fiorisweets.vercel.app/robots.txt` -> `404`
- `curl -o /dev/null -w %{http_code} https://fiorisweets.vercel.app/sitemap.xml` -> `404`
Pentru un site cu o singura ruta, sitemap-ul are valoare mica de descoperire, dar robots.txt e locul standard unde se declara sitemap-ul si e prima resursa ceruta de orice crawler.

**Impact:** Impact direct mic (o pagina se descopera oricum), dar Google Search Console semnaleaza robots.txt lipsa, iar la momentul in care se adauga pagini noi (contact, portofoliu torturi) nu exista infrastructura de indexare. E si conditia pentru pasul urmator: blocarea indexarii domeniului vercel.app.

**Fix:** Conventia din Next 16.2.10 (verificata in node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/robots.md si sitemap.md):
```ts
// app/robots.ts
import type { MetadataRoute } from 'next'
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://fiorisweets.ro/sitemap.xml',
  }
}
```
```ts
// app/sitemap.ts
import type { MetadataRoute } from 'next'
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: 'https://fiorisweets.ro', lastModified: new Date(), changeFrequency: 'monthly', priority: 1 }]
}
```

**Nota verificator:** Severitate umflata la „medium". Un robots.txt care da 404 e interpretat de Google ca „allow all" — nu blocheaza si nu penalizeaza nimic; iar un sitemap pentru O SINGURA ruta are valoare de descoperire nula. Findingul insusi admite „impact direct mic". Atentie la fix: ambele snippeturi hardcodeaza `https://fiorisweets.ro` — acelasi host mort din findingul 2. Daca se implementeaza acum, sitemap-ul va declara un URL care nu rezolva, ceea ce e mai rau decat sa lipseasca. De folosit aceeasi constanta SITE_URL propusa la findingul 2.


### Atributul sizes ignora plafonul de latime al containerului -> ~400 KB in plus pe desktop retina
*`app/page.tsx:209, app/page.tsx:248, app/page.tsx:269, app/page.tsx:372` · efort: trivial*

**Problema:** Containerele sunt plafonate la max-w-6xl (72rem = 1152px) cu px-6 (24px/parte) => latime utila fixa 1104px. Latimile reale randate sunt deci: carduri Produse (gap-8, 4 col) = (1104-96)/4 = 252px; carduri Galerie (gap-6, 4 col) = (1104-72)/4 = 258px; Despre / Cutii cadou (gap-12, 2 col) = (1104-48)/2 = 528px. Dar sizes declara procente din viewport fara breakpoint de plafonare:
  app/page.tsx:209  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
  app/page.tsx:248  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
  app/page.tsx:269  sizes="(min-width: 1024px) 50vw, 100vw"
  app/page.tsx:372  sizes="(min-width: 1024px) 50vw, 100vw"
Pe un monitor 1920px @DPR2, 25vw = 480 CSS px => browserul cere 960 device px => alege candidatul w=1080; necesar real 252*2 = 504 => ar fi ajuns w=640. Idem 50vw = 960 CSS px => 1920 device px => w=1920; necesar real 528*2 = 1056 => w=1080.
Masurat LIVE pe https://fiorisweets.vercel.app (curl pe /_next/image, Accept: image/webp):
  cele 8 carduri (Produse+Galerie): w=640 total = 182.524 B | w=1080 total = 388.078 B  -> risipa 205.554 B
  ingredients.jpg: w=1080 = 141.490 B | w=1920 = 323.204 B                              -> risipa 181.714 B
  giftbox.jpg:     w=1080 =  15.612 B | w=1920 =  36.856 B                              -> risipa  21.244 B
Total risipa masurata: 408.512 B (~399 KB). Ironic, hero-ul (app/page.tsx:175) are sizes CORECT — "(min-width: 1152px) 1104px, 100vw" — deci tehnica e cunoscuta, doar ca nu a fost aplicata si in restul paginii.

**Impact:** Un vizitator de desktop cu ecran retina descarca ~399 KB in plus de imagini (mai mult decat dubleaza payload-ul de imagini al paginii). Nu afecteaza LCP (toate sunt lazy, sub fold), dar creste consumul de date, timpul de decodare si costul de Image Optimization pe Vercel. Pe mobil nu se schimba nimic.

**Fix:** Adauga un prim breakpoint cu latimea fixa in px, ca la hero:
  // Produse (app/page.tsx:209)
  sizes="(min-width: 1152px) 252px, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
  // Galerie (app/page.tsx:248)
  sizes="(min-width: 1152px) 258px, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
  // Despre (app/page.tsx:269) si Cutii cadou (app/page.tsx:372)
  sizes="(min-width: 1152px) 528px, (min-width: 1024px) 50vw, 100vw"

**Nota verificator:** Facts, math and measurements are flawless — I could not break a single number. I am lowering medium -> low purely on context weight, not accuracy: this fires ONLY on desktop >=1024px with DPR>=2. The project brief states the audience is 'majoritatea pe mobil', and on mobile the bytes are identical. All 8+2 affected images are below the fold with loading="lazy" (verified in live HTML), so there is zero LCP, CLS or FCP impact — it is pure background bandwidth plus Vercel Image Optimization transform count. Real, verified, trivially fixable, but no user-visible symptom for the target audience.


### Ambele elemente tapabile din header sunt sub 44x44px — si sunt singurele de pe mobil
*`app/page.tsx:131` · efort: trivial*

**Problema:** Masurat cu getBoundingClientRect la 320px si 375px:
```
{ txt: "fíori.",  w: 50,  h: 32 }   // logo, app/page.tsx:117
{ txt: "Comandă", w: 112, h: 36 }   // CTA header, app/page.tsx:131
```
Butonul Comanda: `px-5 py-2 text-sm` = 8 + 8 padding + 20px line-height = 36px. Logo: `text-2xl` fara padding = 32px line-height.

Restul butoanelor din pagina sunt OK (masurat: 44, 46, 44, 44, 56px), deci problema e izolata in header — dar headerul e `sticky top-0`, adica e permanent pe ecran, si (vezi finding-ul `nav-mobil-lipsa`) e singura zona de interactiune disponibila pe telefon.

**Impact:** Sub minimul de 44x44pt (Apple HIG) / 48dp (Material). Ratari de tap si tap-uri accidentale exact pe CTA-ul principal — butonul pe care se bazeaza intreaga conversie pe mobil, pentru ca nav-ul nu exista.

**Fix:** Trivial, doar padding:
```tsx
// linia 131 — py-2 -> py-3 (12+12+20 = 44px)
className="rounded-full bg-peach px-5 py-3 text-sm font-semibold text-fern-deep ..."

// linia 117 — extinde zona tapabila fara sa schimbi aspectul
className="inline-flex min-h-11 items-center text-2xl text-blush"
```
Headerul e `h-16` (64px), deci incap 44px fara sa se modifice inaltimea.

**Nota verificator:** Existenta e confirmata exact, dar 'medium' e usor umflat: 44x44 e ghid de platforma (Apple HIG) / 48dp (Material), NU criteriu WCAG. Criteriul WCAG 2.2 aplicabil e 2.5.8 Target Size (Minimum) = 24x24 CSS px, Level AA — ambele elemente il trec (50x32 si 112x36). Riscul real de ratare a tap-ului la un buton de 112px latime si 36px inaltime e mic. Fix-ul propus e corect si sigur: `py-2` -> `py-3` da exact 44px si incape in `h-16`; `inline-flex min-h-11 items-center` pe logo e valid in Tailwind v4 (min-h-11 = 2.75rem) si nu schimba aspectul.



## COSMETIC

### Alt-textul imaginilor dubleaza exact titlul/legenda de dedesubt
*`app/page.tsx:205-211, 244-254` · efort: small*

**Problema:** La carduri de produs, `alt` este identic cu `<h3>`-ul imediat urmator:

```tsx
<Image src={p.img} alt={p.title} ... />   // linia 207
...
<h3 className="text-lg font-semibold text-fern-deep">{p.title}</h3>  // linia 214
```

La galerie, `alt` este identic cu `<figcaption>`:

```tsx
<Image src={g.img} alt={g.caption} ... />                    // linia 246
<figcaption ...>{g.caption}</figcaption>                     // linia 252-254
```

Un cititor de ecran anunta deci de doua ori la rand acelasi text: 'imagine, Tort mousse de ciocolata cu zmeura' urmat de 'Tort mousse de ciocolata cu zmeura'. Structura `<figure>/<figcaption>` este de altfel folosita corect (page.tsx:242-255) — tocmai de aceea legenda e deja asociata programatic imaginii.

**Impact:** Nu blocheaza nimic, dar face parcurgerea cu VoiceOver/TalkBack de doua ori mai lunga pe cele 8 imagini din Produse + Galerie si suna a eroare de implementare. Sub 1.1.1 alt-ul redundant nu e esec formal, dar e antipattern documentat (tehnica H67).

**Fix:** Pentru galerie, unde `<figcaption>` deja descrie imaginea, pune `alt=""` ca imaginea sa fie tratata ca decorativa fata de legenda:

```tsx
<Image src={g.img} alt="" fill ... />
```

Pentru cardurile de produs, fie `alt=""` (titlul h3 acopera informatia), fie — mai bine — un alt descriptiv care adauga informatie fata de titlu, de ex. `alt="Tort in doua etaje cu crema alba si flori de bezea"` in loc de `alt="Torturi personalizate"`. Nu lasa acelasi sir in ambele locuri. Imaginile care au deja alt bun si nu se repeta in text (hero-box, ingredients, candybar, giftbox) raman neschimbate.

**Nota verificator:** Downgraded low -> nit, and two technical claims in the finding are wrong. (1) H67 is MIS-CITED: H67 is a *sufficient technique* for using null alt on decorative images, not a documented antipattern for redundant alt — there is no WCAG technique that prohibits redundant alt. (2) 'legenda e deja asociata programatic imaginii' is INCORRECT: <figcaption> supplies the accessible name of the <figure> element, it is not programmatically associated with the <img> (that would require aria-labelledby/aria-describedby). So `alt=""` on a gallery image is a defensible editorial choice, but not for the reason given — and on some AT it results in the image being skipped entirely with only the figure label read. Net: this is a polish item with zero conformance impact on a 12-image vitrine, not a defect. Safe to ship as-is.


### CSS-ul de 5,5 KB e render-blocking; experimental.inlineCss l-ar elimina din waterfall
*`next.config.ts:3` · efort: trivial*

**Problema:** HTML-ul live referentiaza /_next/static/chunks/1ixjeurplywsc.css printr-un <link> — 5.491 B pe fir (brotli), 23.983 B brut. Fiind render-blocking, browserul trebuie sa descarce HTML-ul, sa-l parseze, sa descopere <link>-ul si abia apoi sa ceara CSS-ul, inainte sa poata picta ceva. Documentatia locala node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/inlineCss.md descrie exact profilul acestui site ca fiind cazul ideal: "Enable if you use atomic CSS (like Tailwind) and want to optimize first-load performance for new visitors", cu beneficiu maxim pe 'First-time visitors' si 'Slow connections'. Site-ul e o singura pagina cu ancore (deci nu exista navigare intre pagini care sa profite de CSS cache-uit) si publicul e majoritar mobil, in mare parte la prima vizita.

**Impact:** Un round-trip in plus inainte de primul pixel pictat. Pe 4G romanesc cu ~100-150 ms RTT, asta se traduce direct in FCP/LCP mai mari.

**Fix:** In next.config.ts:
  const nextConfig: NextConfig = {
    experimental: { inlineCss: true },
  };
Atentie, e marcat `version: experimental` in docs si nu functioneaza in dev, doar in build de productie — deci verifica pe preview deployment inainte de prod. Daca ajungi vreodata sa ai mai multe pagini reale, reevalueaza: atunci CSS-ul extern cache-uit devine mai bun.

**Nota verificator:** Accurate and honestly caveated, but downgrading low -> nit. This is an enhancement suggestion, not a defect — nothing is wrong with the current setup. And the upside is smaller than framed: at 5.5 KB brotli the stylesheet fits inside the initial TCP congestion window and is fetched from the same already-warm HTTPS connection as the HTML, so the saving is one RTT of request latency, not a full transfer — realistically tens of ms, not the '~100-150 ms' implied. Against that you are turning on an `experimental`-flagged behaviour on a live production site whose entire value is being simple and not breaking. The finding's own advice to verify on a preview deployment first is right; my read is that the risk/reward does not justify it here at all. The reasoning and the docs citations are sound — I just would not act on it.


### Punctul din logotipul 'fiori.' dispare cand Wordmark e folosit inline pe fundal blush (1.18:1)
*`app/page.tsx:80-86, 281` · efort: trivial*

**Problema:** Componenta Wordmark codifica dur culoarea punctului:

```tsx
function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-semibold lowercase tracking-tight ${className}`}>
      fíori<span className="text-peach">.</span>
    </span>
  );
}
```

`text-peach` nu se schimba niciodata, indiferent de `className`. La linia 281 componenta e folosita inline intr-un paragraf, pe sectiunea `bg-blush` (page.tsx:262): `<Wordmark className="text-fern-deep" />`. Contrast calculat: peach #f3c9ab pe blush #f9ddc8 = **1.18:1** — cel mai slab raport din pagina. In celelalte utilizari (header, hero, footer, toate pe fern/fern-deep) punctul trece: 4.99:1, 6.70:1 si respectiv 7.92:1.

**Impact:** Numele brandului apare in text ca 'fíori' fara punct — iar punctul face parte din identitatea vizuala ('fíori.'). Nu e blocant, dar e simultan bug de contrast (1.4.3) si inconsecventa de brand, intr-un paragraf care tocmai povesteste originea brandului.

**Fix:** Fa culoarea punctului configurabila, cu peach ca implicit:

```tsx
function Wordmark({ className = "", dotClassName = "text-peach" }: { className?: string; dotClassName?: string }) {
  return (
    <span className={`font-semibold lowercase tracking-tight ${className}`}>
      fíori<span className={dotClassName}>.</span>
    </span>
  );
}
```

Apoi la page.tsx:281: `<Wordmark className="text-fern-deep" dotClassName="text-fern" />`. Verificat: fern-deep pe blush = 9.33:1, deci si un punct `text-fern-deep` ar fi perfect lizibil.

**Nota verificator:** Headline number is right, but two of the four supporting figures are WRONG. The finding says the dot passes at '4.99:1' in the header and '6.70:1' in the hero. Both are bg-fern surfaces (header bg-fern/95 composited over the bg-fern hero at page.tsx:142), so both are peach-on-fern = 5.68:1, not 4.99 and not 6.70. (6.70:1 is fern-on-blush, borrowed from a different calculation.) Footer 7.92:1 is correct. Downgraded low -> nit: the affected content is a single 4px-wide period inside a decorative wordmark whose word is fully legible in fern-deep at 9.33:1 — no information is lost, so 1.4.3 impact is theoretical. It is a brand-consistency bug more than an a11y bug, and the finding says so honestly. Proposed dotClassName prop is clean and non-breaking (default preserves all four existing call sites).


### 5,90 MB de JPG-uri in repo, recomprimabile la 1,70 MB fara pierdere vizibila
*`public/images/` · efort: small*

**Problema:** Toate cele 12 imagini sunt 1600px pe latura mare, dar comprimate foarte lejer:
  ingredients.jpg 971.049 B | pastry.jpg 770.485 B | cookies.jpg 569.199 B | marshmallow.jpg 567.401 B
  ness-plate.jpg 526.221 B | giftbox.jpg 456.457 B | tort.jpg 445.549 B | ness-grid.jpg 436.030 B
  tort-mousse.jpg 431.639 B | ness-closeup.jpg 403.407 B | hero-box.jpg 308.667 B | candybar.jpg 302.320 B
  TOTAL 6.188.424 B = 5,90 MB
Recomprimare la aceleasi dimensiuni cu mozjpeg q78 (masurat cu sharp): 1.784.473 B = 1,70 MB, adica -71%.
Despre supradimensionare in PIXELI: sursele de 1600px sunt de fapt corect dimensionate pentru hero (1104 CSS px), candybar (full-bleed) si Despre/Cutii cadou (528 CSS px @DPR2 = 1056). Doar cele 8 imagini de card sunt supradimensionate — se afiseaza la 252-258 CSS px, deci ~516 px @DPR2, adica sursa are ~3x latimea utila (~9.6x ca arie). Nu produce insa risipa la utilizator, pentru ca optimizatorul downscaleaza oricum; problema reala de livrare e cea din finding-ul `sizes-gresit-container-plafonat`.
Observatie colaterala verificata: w=1920 si w=3840 returneaza IDENTIC 44.842 B pentru hero-box.jpg, pentru ca image-optimizer.js:879 foloseste `withoutEnlargement: true` — deci ultimele candidate din srcset sunt duplicate ale sursei de 1600px. Nu e o problema, doar srcset redundant.

**Impact:** Nu afecteaza vizitatorii (nimeni nu descarca JPEG-urile brute, cu exceptia crawlerelor OG). Afecteaza doar marimea repo-ului, timpul de git clone si upload-ul la fiecare build Vercel.

**Fix:** Optional, curatenie: recomprima sursele in loc, la aceleasi dimensiuni.
  node -e "const s=require('sharp'),f=require('fs');for(const n of f.readdirSync('public/images')) s('public/images/'+n).jpeg({quality:78,mozjpeg:true}).toFile('/tmp/out/'+n)"
Conform CLAUDE.md, muta originalele in public/images/_old/ in loc sa le suprascrii direct. Nu urgent — nu schimba nimic pentru utilizator.

**Nota verificator:** Confirmed and correctly scoped — the finding states plainly that it does not affect visitors, only repo size and Vercel upload time, and marks itself optional. Nit is right.
One technical caveat it should have flagged: recompressing the sources to mozjpeg q78 introduces generation loss, because those files are then re-encoded AGAIN by the optimizer to WebP q75 (or AVIF q55 if finding #2 is applied). Compressing an already-lossy JPEG and then transcoding it means the bytes users actually receive get slightly worse, in exchange for a saving no user ever sees. If the repo size genuinely matters, resizing the 8 card sources down (e.g. to ~800px, which is still >=DPR2 for a 258px slot) is a better trade than blanket requantisation at full dimensions. Also note the CLAUDE.md rule is correctly honoured — move originals to public/images/_old/, never overwrite or delete.



---

## Respinse la verificarea adversariala

Probleme raportate de auditori dar eliminate pentru ca nu rezista verificarii:

- **Single-page cu ancore: o singura ruta indexabila, deci un singur set title/description pentru toate produsele** — Faptele citate sunt exacte — `find app -name page.tsx` -> o singura ruta (app/page.tsx); NAV la app/page.tsx:3-9 e integral pe ancore; sectiunea `<section id="evenimente">` e chiar la linia 311, cum se afirma. Dar nu exista niciun defect: arhitectura single-page cu ancore este exact specificatia pro
- **Imaginea OG e corect declarata, dar are raport si greutate suboptime pentru preview-uri** — Am refacut ambele calcule. Dimensiuni: `sips` -> pixelWidth 1600, pixelHeight 893, identice cu app/layout.tsx:28-29 — deci declaratia e corecta, cum admite si findingul. Raport: 1600/893 = 1.7917 vs 1200/630 = 1.9048; pentru raportul „recomandat" la latime 1600 ar trebui inaltime 840, deci decupajul
- **Zero mentiune despre alergeni, desi se vand produse cu oua, lapte, gluten si fructe cu coaja** — Partea factuala e adevarata (grep "alergen" pe app/ -> 0 rezultate), dar incadrarea juridica nu se aplica aici. Verificat in cod: pagina nu are cos, formular, pret sau vreun mecanism prin care sa se "finalizeze o comanda" — singurul canal e mailto:comenzi@fiorisweets.ro (app/page.tsx:394-399). Reg. 
- **Numele apare in 3 grafii diferite (fíori. / fiori / Fívori) si accentul blocheaza cautarea pe Google** — `grep -rn "fiori" app/` returneaza DOAR app/page.tsx:395, 398 (mailto), 412 (footer "fiorisweets.ro") si app/layout.tsx:13, 21 (URL-uri) — toate sunt domeniul, nu o a doua grafie a numelui de brand. In cod brandul e scris intr-o singura forma, printr-o componenta unica Wordmark (app/page.tsx:80-86),
- **Sectiunea Despre trece de la persoana a III-a la persoana I plural in doua propozitii consecutive** — Citit app/page.tsx:280-290. Subiectul primei propozitii NU e cofetarul, ci brandul: "<Wordmark /> a pornit din bucataria de acasa" — persoana a III-a e obligatorie gramatical acolo, nu o alegere de voce narativa. "din pasiunea unui tanar cofetar" e o referire indefinita in interiorul aceleiasi propo
- **"in limita locurilor disponibile" e formulare de rezervare la restaurant, nu de comanda** — app/page.tsx:389-392 verificat, textul e exact cel citat: "Comenzile se preiau in limita locurilor disponibile." Insa "in limita locurilor disponibile" e o formula idiomatica consacrata in romana pentru orice oferta cu capacitate limitata, nu doar pentru scaune — "loc" functioneaza metaforic, ca slo
- **"Compune o cutie... Ambalate frumos" — dezacord de numar intre propozitii** — app/page.tsx:355-359 citit integral. "Ambalate" se acorda corect cu enumerarea plurala din propozitia anterioara — "cookies, marshmallows, prajituri" — care e antecedentul natural (continutul cutiei, ambalat frumos, gata de daruit). Premisa finding-ului, ca antecedentul ar trebui sa fie ultimul nucl
- **"Cookies ... crocanți" — masculin, in contradictie cu "Marshmallows caramelizate" de dedesubt** — app/page.tsx:44 contine intr-adevar "crocanti" (masculin plural) si :49 "caramelizate". Dar argumentul DOOM e aplicat unei forme pe care DOOM nu o normeaza: textul foloseste pluralul englezesc "cookies", nu forma adaptata "cookie-uri" pentru care se enunta regula de acord la neutru. In copy-ul gastr
- **"Te bucuri de ele" — pronumele plural nu are antecedent in pasii anteriori** — Verificat app/page.tsx:62-78 impreuna cu randarea de la 291-304: fiecare card afiseaza si textul sub titlu (linia 300-302), nu doar titlul. Referentul lui "ele" e disponibil imediat in cardul 01 — "Un tort, o cutie de cookies sau un candy bar intreg" (linia 66) — si in tot contextul paginii. Analiza
- **Nu exista skip-link catre continutul principal** — The absence is real — `grep -c 'sr-only' site.css` = 0 on the deployed bundle, and page.tsx:117 is indeed the first focusable. But the cited criterion does not apply: WCAG 2.4.1 Bypass Blocks is scoped to 'blocks of content that are repeated on multiple Web pages'. This is a single page with no repe
- **Eyebrow-urile de 12px cu tracking 0.4em sunt la limita lizibilitatii pe mobil** — The code facts check out — all seven lines (145,187,230,274,323,349,383) carry `text-xs font-medium uppercase tracking-[0.4em]`, and only :145 adds sm:text-sm. The contrast figures cited as reassurance also reproduce exactly in my own recomputation: fern on cream = 8.02:1, peach on fern = 5.68:1, fe
- **AGENTS.md / CLAUDE.md / .claude/launch.json sunt commit-uite in repo — noise, dar inofensiv** — Faptele sunt exacte — `git ls-files` confirma AGENTS.md, CLAUDE.md si .claude/launch.json ca trackuite; am citit toate trei: CLAUDE.md are o singura linie (`@AGENTS.md`), AGENTS.md are 2 linii despre citirea docs-urilor Next, .claude/launch.json contine doar `{name: darian-dev, npm run dev, port 300
- **Singurul canal de contact e mailto: — cel mai slab CTA posibil pe telefon** — Observatia factuala e reala: in HTML-ul live `mailto:` apare de 2 ori (href + text), iar `tel:`=0, `wa.me`=0, `instagram`=0. app/page.tsx:394-399 e singurul canal. DAR: brief-ul proiectului stabileste explicit 'contact doar prin email placeholder comenzi@fiorisweets.ro' — nu exista inca numar de tel
- **Imaginea hero se reduce la o fasie de 153px inaltime pe telefon** — Masuratorile sunt corecte, le-am reprodus live: la 320px imaginea hero = 272x153, la 375px = 327x184; cardurile de produs sunt 272x272 la 320px. Sursa hero-box.jpg = 1600x893 (verificat cu sips), srcset generat 640..3840, la 375px/DPR2 browserul alege w=640. app/page.tsx:169 `aspect-[16/9] w-full`.
- **First Load JS ~151 KB brotli / 517 KB brut pentru o pagina fara nicio interactiune client** — I reproduced the measurement independently and it is accurate to within 0.1%. Brotli wire sizes fetched with Accept-Encoding: br from production: 0iec5q4ack_04.js 72,283 + 0cbr67yte101v.js 49,904 + 14mumt5_n0xhi.js 14,386 + 3ll07n217cgxf.js 7,872 + 0on9ev1fw2cou.js 5,882 + turbopack-0nqnc73oa2lgs.js

---

# Adaugat de criticul de completitudine

Ultimul agent a cautat ce au ratat cele 7 dimensiuni. A gasit 9 probleme noi.
Nu au trecut prin verificare adversariala automata, dar am verificat manual afirmatiile factuale: 404-ul in engleza, cele trei icon-uri pe 404, absenta color-scheme, raportul 9:0 al grafiei brandului si alt-textul cu token — toate confirmate.


## [CRITIC] Toate fotografiile sunt generate AI, dar copy-ul le prezinta ca produse reale iesite din atelier — practica comerciala inselatoare (Legea 363/2007)
*`README.md:7 + app/page.tsx:194,231,237,242-255` · efort: large*

**Problema:** Auditul de infra a semnalat doar ca *repo-ul public dezvaluie* ca pozele sunt AI („repo-public-fara-motiv") — a tratat-o ca pe o scurgere de informatie. Problema reala e alta: continutul paginii afirma explicit ca acele imagini SUNT produsele cofetariei.

Dovada provenientei — README.md:7:
`- **Imagini:** generate cu Higgsfield (Nano Banana Pro), stil Fívori — originalele PNG sunt în _raw/ (negit-uit)`

Dovada afirmatiilor de pe site — app/page.tsx:
- l.231 eyebrow: `din atelier`
- l.237: `Câteva dintre dulciurile ieșite din atelier — de la tortul de mousse cu zmeură până la pătratele cu cremă de ness.`
- l.242-255: fiecare imagine e intr-un `<figure>` cu `<figcaption>` care o eticheteaza ca produs concret („Tort mousse de ciocolată cu zmeură", „Pătrate cu cremă de cafea")
- l.194: `Fiecare produs iese din atelier proaspăt, din ingrediente atent alese.`
- l.281: `fíori. a pornit din bucătăria de acasă, din pasiunea unui tânăr cofetar`

Verificat: `grep -rni "ilustrativ|orientativ|imagine de prezentare" app/ README.md` → ZERO disclaimere. Toate cele 12 imagini din public/images/ provin din _raw/*.png generate AI.

Niciuna dintre cele 7 dimensiuni nu a atins conflictul dintre proveniența imaginilor si afirmatiile din copy.

**Impact:** Clientul comanda „tortul de mousse cu zmeură" din galerie asteptand exact ce vede; produsul livrat nu poate arata asa, pentru ca originalul nu exista. Sub Legea 363/2007 (transpune Dir. 2005/29/CE), art. 6 — actiune inselatoare privind natura si caracteristicile produsului — sanctionabila de ANPC cu amenda + ordin de incetare. Practic: reclamatii, cereri de returnare a banilor, review-uri negative, si o reputatie distrusa exact la lansare. Este singurul risc din tot auditul care NU se rezolva printr-o modificare de cod si care are termen lung de remediere (necesita sedinta foto reala) — de aceea trebuie inceput acum, nu la final.

**Fix:** Doua etape.

(1) IMEDIAT, pana la sedinta foto — schimba incadrarea din „acestea sunt produsele noastre" in „acesta este stilul nostru". Concret in app/page.tsx:
- l.237 inlocuieste `Câteva dintre dulciurile ieșite din atelier` cu ceva ce nu afirma paternitatea, ex. `Așa arată dulciurile pe care le pregătim — imagini cu rol de prezentare.`
- adauga sub grila din #galerie o nota vizibila (nu doar in alt): `<p className="mt-6 text-center text-xs font-light text-blush/60">Imaginile au rol de prezentare. Fiecare comandă se lucrează personalizat.</p>`
- l.231 schimba eyebrow-ul `din atelier` in `inspirație`

(2) PRIORITATE REALA — inlocuieste toate cele 12 imagini cu fotografii ale produselor efectiv facute de Darian. Pana atunci nu porni promovare platita si nu trimite linkul catre clienti. Odata ce exista poze reale, disclaimerul de la (1) se scoate si copy-ul original („ieșite din atelier") redevine corect si devine chiar un avantaj.

Secundar: sterge din README.md:7 mentiunea Higgsfield/_raw sau fa repo-ul privat — nu ca sa ascunzi problema, ci pentru ca dupa fix-ul (2) informatia devine oricum falsa.


## [IMPORTANT] Zero informatii despre alergeni, desi site-ul preia comenzi la distanta pentru produse cu gluten, oua, lapte si posibil fructe cu coaja — obligatoriu conform Reg. (UE) 1169/2011
*`app/page.tsx:34-51, 393` · efort: small*

**Problema:** Verificat: `grep -rni "alergen|gluten|lacto|nuci|arahide" app/` → ZERO mentiuni in tot proiectul.

In acelasi timp, textele descriu explicit ingrediente care sunt alergeni din Anexa II a Reg. 1169/2011:
- l.39: `Eclere, choux-uri, tarte și prăjituri de casă, lucrate în serii mici, cu unt adevărat` → lapte, gluten, oua
- l.34: `blaturi pufoase și creme fine` → gluten, oua, lapte
- l.44: `Cookies cu bucăți generoase de ciocolată` → gluten, lapte, posibil soia
- l.267 (alt): `Ingrediente pentru copt: cacao, ciocolată, ouă și făină`

Iar site-ul incheie contracte la distanta: singurul canal e `mailto:comenzi@fiorisweets.ro` (l.395), iar copy-ul de la l.389-392 invita explicit la comanda prin email.

Cadru legal: Reg. (UE) 1169/2011 art. 14 (vanzare la distanta) cere ca informatiile obligatorii — inclusiv alergenii de la art. 9(1)(c) — sa fie disponibile INAINTE de incheierea comenzii si fara cost suplimentar; art. 44 mentine obligatia si pentru alimentele nepreambalate (cazul unei cofetarii artizanale). Auditul de continut a semnalat doar lipsa datelor de firma (Legea 365/2002), nu si obligatia pe alimente.

**Impact:** Doua consecinte distincte. Legal: neconformitate directa constatabila de ANPC/DSVSA la prima verificare sau prima sesizare, cu amenda — este cea mai des sanctionata neconformitate la cofetariile mici. Sanitar: un client cu alergie la gluten, lapte, oua sau alune comanda un tort fara sa aiba de unde sti ce contine; consecinta unui incident nu e amenda, ci raspundere pentru vatamare. Publicul e romanesc, majoritar pe mobil, iar comanda se face prin email — deci exact scenariul de vanzare la distanta pe care articolul 14 il vizeaza.

**Fix:** Adauga o sectiune scurta inainte de #contact in app/page.tsx (nu o pagina separata — pe mobil nimeni nu o deschide):

```tsx
<section id="alergeni" className="bg-cream py-12">
  <div className="mx-auto w-full max-w-3xl px-6">
    <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-fern">Alergeni</h2>
    <p className="mt-3 text-sm font-light leading-relaxed text-cocoa/80">
      Produsele noastre conțin sau pot conține: <strong>cereale cu gluten</strong> (grâu),
      <strong> ouă</strong>, <strong>lapte</strong>, <strong>fructe cu coajă lemnoasă</strong> (nuci, alune, migdale)
      și <strong>soia</strong>. Sunt preparate într-un atelier în care se lucrează cu acești alergeni,
      deci pot apărea urme și în produsele care nu îi conțin ca ingredient.
      Ne poți spune la comandă dacă ai o alergie — confirmăm în scris ce conține exact produsul tău.
    </p>
  </div>
</section>
```

Adauga si o linie in blocul de contact (dupa l.392): `Ai o alergie? Scrie-ne — îți trimitem lista completă de ingrediente înainte de a confirma comanda.`

Cand adaugi JSON-LD (deja pe lista ca `lipsa-jsonld-bakery`), pune si `suitableForDiet`/mentiunea alergenilor acolo. Lista exacta de alergeni trebuie confirmata de Darian pe reteta reala — cea de mai sus e un draft acoperitor, nu final.


## [MEDIU] Pagina 404 e cea implicita din Next, in engleza si fara nicio cale inapoi catre site — pe un site cu lang="ro"
*`app/ (lipseste not-found.tsx)` · efort: small*

**Problema:** Directorul app/ contine doar 4 fisiere: globals.css, icon.svg, layout.tsx, page.tsx. Nu exista `not-found.tsx`.

Verificat in productie:
```
curl https://fiorisweets.vercel.app/pagina-inexistenta
→ status=404
→ <html lang="ro">
→ <title>404: This page could not be found.</title>
→ <h2 ...>This page could not be found.</h2>
```

Deci: text englezesc servit intr-un document declarat `lang="ro"` (screen reader-ul romanesc il va citi cu pronuntie romaneasca), fara logo, fara culorile brandului, fara niciun link inapoi la pagina principala. Utilizatorul ajuns acolo nu are decat butonul Back.

Nicio dimensiune nu a testat un URL inexistent — auditul SEO a verificat /robots.txt si /sitemap.xml (ambele 404), dar nu a raportat CUM arata acel 404.

**Impact:** Se ajunge acolo mai des decat pare: linkuri vechi partajate pe WhatsApp cu typo, `/contact` sau `/produse` tastate manual (utilizatorii presupun ca sunt pagini, nu ancore), sau linkuri scanate de boti. Cand fiorisweets.ro va fi in sfarsit conectat, orice URL gresit va arata un ecran alb, in engleza, care nu seamana deloc cu brandul — pe un public romanesc majoritar pe mobil, asta citeste ca „site stricat" si utilizatorul pleaca. Intersecteaza si dimensiunea a11y (mismatch limba/continut, WCAG 3.1.1).

**Fix:** Creeaza `app/not-found.tsx`. Cu un singur root layout, fisierul din radacina app/ acopera si URL-urile care nu se potrivesc cu nicio ruta — nu ai nevoie de `experimental.globalNotFound` (verificat in node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/not-found.md; `global-not-found.js` e pentru aplicatii cu mai multe root layout-uri, nu e cazul aici):

```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-fern px-6 text-center">
      <span className="text-6xl font-semibold lowercase tracking-tight text-blush">
        fíori<span className="text-peach">.</span>
      </span>
      <h1 className="mt-8 text-2xl font-semibold text-blush">Pagina asta nu există</h1>
      <p className="mt-3 max-w-md font-light leading-relaxed text-blush/80">
        Poate linkul e vechi sau are o greșeală de tastare. Hai înapoi la dulciuri.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-peach px-7 py-3 text-sm font-semibold text-fern-deep transition-colors hover:bg-blush"
      >
        Înapoi la pagina principală
      </Link>
    </div>
  );
}
```


## [MEDIU] Lipseste color-scheme, deci Chrome pe Android cu „Force dark mode" inverseaza automat paleta si distruge contrastul brandului
*`app/globals.css:30-32` · efort: trivial*

**Problema:** Verificat: `grep -rn "color-scheme|colorScheme|prefers-color-scheme" app/` → NONE FOUND. Verificat si in HTML-ul livrat: singura aparitie a `color-scheme` in live.html vine din stilul intern al paginii de eroare Next (`@media(prefers-color-scheme:dark){body{color:#fff;background:#000}}`), nu din site.

app/globals.css declara doar:
```css
html { scroll-behavior: smooth; }
```
Si in `@theme` culorile brandului sunt toate light: `--color-cream: #fbf5ee`, `--color-blush: #f9ddc8`, `--color-peach: #f3c9ab`.

Cand Chrome pe Android are activat „Force dark mode" (setare foarte des activata de utilizatorii romani pe telefoane Android, si activa implicit in modul de economisire a bateriei pe unele device-uri Samsung/Xiaomi), algoritmul de auto-darkening inverseaza fundalurile deschise fara sa atinga imaginile. Concret aici: `bg-cream` si `bg-blush` devin inchise, textul `text-cocoa/80` (maro inchis) devine deschis — dar `text-peach` si `text-blush` de pe sectiunile verzi raman neschimbate, pentru ca sunt deja deschise pe fundal inchis. Rezultatul e o pagina hibrida cu contraste rupte in exact sectiunile care aveau contrast bun (Produse, Despre, Cutii cadou).

Dimensiunea responsive a testat latimi si zoom text, dimensiunea a11y a calculat contraste pe paleta declarata — niciuna nu a testat scenariul in care browserul rescrie paleta.

**Impact:** Publicul e explicit „majoritatea pe mobil", iar in Romania cota Android e dominanta. Pentru fractiunea cu force-dark activ, site-ul arata rupt: exact contrariul impresiei de „cofetarie artizanala ingrijita" pe care o vinde designul. Agraveaza si problemele de contrast deja confirmate (numerele 01/02/03 la 1.36:1 devin si mai imprevizibile dupa inversare, pentru ca `text-peach` pe `bg-cream/80` inversat ajunge peach-deschis pe fundal inchis).

**Fix:** O linie in app/globals.css. `only light` (nu doar `light`) e forma care opteaza explicit in afara auto-darkening-ului din Chrome:

```css
:root {
  color-scheme: only light;
}
```

De pus imediat dupa blocul `@theme inline`, inainte de `@keyframes`. Nu afecteaza nimic altceva si nu are cost de performanta. Daca vrei sa fii explicit si in `<head>`, adauga in app/layout.tsx la exportul `viewport` — dar declaratia CSS e suficienta si e sursa unica de adevar.


## [MEDIU] Brandul e scris „fíori" cu í accentuat in toate cele 9 aparitii; forma „fiori", pe care o va cauta si tasta clientul, nu apare niciodata ca text
*`app/page.tsx:83, app/layout.tsx:14-30` · efort: small*

**Problema:** Verificat:
```
grep -o "fíori" app/*.tsx | wc -l  → 9
grep -o "\bfiori\b" app/*.tsx | wc -l → 0
```

Wordmark-ul (app/page.tsx:83) randeaza `fíori<span>.</span>` cu U+00ED. Aceeasi forma accentuata e in `title`, `description`, `openGraph.title`, `openGraph.siteName`, `og:image.alt` si in toate cele 4 randari vizuale (header, h1, Despre, footer).

În schimb: domeniul e `fiorisweets.ro`, proiectul Vercel e `fiorisweets`, iar brief-ul de brand spune „fiori.". README.md:7 introduce chiar o a treia grafie — `stil Fívori`.

Observatie importanta: `í` NU este un diacritic romanesc (romana are ă â î ș ț). Nu se poate tasta pe o tastatura romaneasca standard si nu apartine niciunei conventii ortografice locale — deci nici un utilizator, nici mecanismul de folding al motoarelor de cautare nu il trateaza ca varianta evidenta a lui `i`.

Auditul de continut a prins inconsistenta la denumirile produselor cu ness, iar cel SEO a prins ca h1 contine doar brandul — dar nimeni nu a observat ca acel brand e scris intr-o forma pe care nimeni nu o va tasta.

**Impact:** Se combina fix cu problema deja confirmata `h1-doar-brand`: singurul h1 al site-ului nu contine niciun cuvant cheie SI e scris intr-o forma necautabila. Cine aude numele la o petrecere si scrie in Google „fiori cofetarie" sau „fiori sweets" cauta un sir care nu exista nicaieri in textul paginii — singura potrivire e fragmentul de domeniu din footer (l.412). Pentru un business local a carui unica sursa de trafic va fi cautarea dupa nume, asta anuleaza chiar canalul principal. In plus, cardurile de share (og:title, twitter:title — verificate in productie, ambele contin „fíori.") propaga forma accentuata mai departe pe WhatsApp.

**Fix:** Pastreaza `fíori.` ca logotip vizual — e o alegere de design legitima — dar asigura-te ca forma simpla exista in text, in trei locuri:

1. app/layout.tsx — pune ambele grafii in `description`, natural:
```ts
description: "fíori. (fiori) este o cofetărie artizanală din <ORAȘ>: torturi personalizate, prăjituri, cookies, marshmallows și candy bar pentru evenimente."
```
(rezolva simultan si `zero-semnale-local-seo` — pune orasul aici)

2. app/page.tsx — da wordmark-ului din `<h1>` un `aria-label` cu forma simpla, ca sa fie si citit corect de screen reader:
`<h1 className="..." aria-label="fiori — cofetărie artizanală">`

3. In JSON-LD-ul de tip Bakery (deja pe lista ca `lipsa-jsonld-bakery`) adauga:
```json
"name": "fíori.",
"alternateName": ["fiori", "fiori sweets", "Fiori Sweets"]
```

Si corecteaza README.md:7 — `stil Fívori` e a treia grafie a aceluiasi nume si va deruta pe oricine preia proiectul.


## [MINOR] Doar icon.svg; /favicon.ico si apple-touch-icon returneaza 404, deci „Adaugă pe ecranul principal" pe iPhone salveaza o captura de ecran in loc de logo
*`app/ (exista doar icon.svg)` · efort: small*

**Problema:** Verificat in productie:
```
/favicon.ico          → 404
/apple-touch-icon.png → 404
/manifest.json        → 404
/icon.svg             → 200 image/svg+xml
```
Iar in HTML-ul livrat exista un singur tag de icon:
```html
<link rel="icon" href="/icon.svg?icon.1g3o609tb1y6u.svg" sizes="any" type="image/svg+xml"/>
```
Niciun `rel="apple-touch-icon"`, niciun `rel="manifest"`.

Conform node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/app-icons.md, conventiile Next 16 sunt `app/favicon.ico`, `app/icon.*` si `app/apple-icon.(jpg|jpeg|png)` — proiectul are doar a doua.

**Impact:** Safari pe iOS nu foloseste SVG pentru „Adaugă pe ecranul principal": fara `apple-icon.png` salveaza o miniatura a paginii. Pentru o vitrina fara e-commerce, „salveaza pe ecranul principal" e chiar gestul de retentie pe care il vrei de la un client care nu comanda azi, iar publicul e majoritar pe mobil. Separat, unii agregatori si clienti de mail cer inca /favicon.ico direct si primesc 404. Impact mic, dar reparatia e de cateva minute si se face oricum in aceeasi trecere cu icon.svg.

**Fix:** Adauga in app/, reutilizand designul din app/icon.svg (patrat verde #33523f, „f" blush, punct peach):
- `app/favicon.ico` — 32x32 (Next il expune la /favicon.ico automat)
- `app/apple-icon.png` — 180x180, PNG opac, FARA colturi rotunjite (iOS aplica singur masca; raza de 14 din SVG va aparea dublata daca o pastrezi)

Optional, `app/manifest.ts` pentru numele scurt si culoarea de tema pe Android:
```ts
import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "fíori. — cofetărie artizanală",
    short_name: "fíori.",
    start_url: "/",
    display: "browser",
    background_color: "#fbf5ee",
    theme_color: "#33523f",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
```


## [MINOR] Site-ul nu are absolut nicio masuratoare: nu poti sti daca cineva l-a vizitat sau daca a apasat vreodata butonul de comanda
*`app/layout.tsx (fara analytics), app/page.tsx:394-399` · efort: trivial*

**Problema:** Verificat in HTML-ul din productie: `grep -o 'src="https\?://[^"]*"' live.html` → niciun rezultat. Zero scripturi externe, zero analytics, zero pixel. package.json nu contine `@vercel/analytics` sau echivalent.

In acelasi timp, intreaga palnie de conversie e formata din 4 CTA-uri care duc toate in acelasi punct — app/page.tsx l.132 („Comandă"), l.163 („Comandă un tort"), l.335 („Cere o ofertă"), l.361 („Comandă o cutie") — toate `href="#contact"`, iar #contact se termina intr-un singur `mailto:` (l.395). Un `mailto:` nu produce nicio navigare, deci chiar si cu analytics instalat nu ar fi masurat fara un handler explicit.

Dimensiunea infra a acoperit deploy-ul si cache-ul, nu si observabilitatea produsului.

**Impact:** Consecinta practica: dupa ce DNS-ul se repara si emailul incepe sa functioneze, nu ai cum sa distingi intre „nimeni nu intra pe site" si „intra, dar nu ajung la contact" si „ajung la contact, dar nu apasa" — trei probleme cu solutii complet diferite. Pe un site a carui singura functie e generarea de comenzi, asta inseamna ca nu poti valida daca isi face treaba, si nici nu poti prioritiza restul reparatiilor din acest audit dupa impact real.

**Fix:** Vercel Web Analytics — fara cookie-uri, deci nu declanseaza obligatia de banner de consimtamant (relevant aici: site-ul nu are momentan niciun cookie si e bine sa ramana asa).

```bash
npm i @vercel/analytics
```
In app/layout.tsx:
```tsx
import { Analytics } from "@vercel/analytics/next";
// ...
<body className="font-sans bg-cream text-cocoa antialiased">
  {children}
  <Analytics />
</body>
```
Apoi activeaza Analytics din dashboard-ul proiectului Vercel.

Pentru clicul pe mailto — care e evenimentul care conteaza — foloseste `track` pe legatura din #contact (necesita transformarea sectiunii intr-un client component mic, sau extragerea doar a butonului). Alternativa fara JS: adauga o eticheta in adresa, ex. `mailto:comenzi@fiorisweets.ro?subject=Comandă%20de%20pe%20site` — nu masoara clicul, dar iti spune in inbox ca lead-ul a venit din site si nu din alta parte.


## [MINOR] Singura actiune de conversie e un mailto fara subiect/corp precompletat, care pe mobilul fara client de mail configurat nu face absolut nimic
*`app/page.tsx:394-399` · efort: trivial*

**Problema:** app/page.tsx l.394-399:
```tsx
<a href="mailto:comenzi@fiorisweets.ro" className="mt-8 inline-block rounded-full bg-peach ...">
  comenzi@fiorisweets.ro
</a>
```
Doua lucruri, distincte de problema DNS deja confirmata:

(1) Fara `?subject=` / `?body=`, desi textul imediat de deasupra (l.389-392) cere informatii specifice: `Scrie-ne ce sărbătorești și când`. Utilizatorul ajunge intr-un compose gol si trebuie sa-si aminteasca singur ce sa scrie.

(2) Adresa exista pe pagina DOAR ca text al butonului `mailto:`. Pe Android/iOS fara aplicatie de mail configurata — situatie obisnuita la utilizatorii care folosesc doar aplicatia Gmail dezinstalata sau doar WhatsApp — apasarea nu produce nimic vizibil: nici eroare, nici feedback. Utilizatorul apasa de doua ori si pleaca, convins ca site-ul e stricat.

Auditul de continut a semnalat lipsa canalelor alternative (telefon/WhatsApp/Instagram) si cel de infra ca adresa e moarta din lipsa MX — dar nimeni nu a analizat comportamentul propriu-zis al legaturii `mailto` pe mobil.

**Impact:** Se compune cu problemele deja gasite: 4 CTA-uri, un singur punct terminal, zero redundanta. Chiar dupa ce DNS-ul si MX-ul sunt reparate, o parte din utilizatorii de mobil — publicul principal — vor apasa butonul si nu se va intampla nimic. Fiind si singurul punct de iesire al palniei, orice esec aici e o comanda pierduta definitiv, fara urma in inbox.

**Fix:** In app/page.tsx, la l.394-399:

(1) Precompleteaza mesajul, ca sa-l ajuti pe client sa scrie ce ai nevoie:
```tsx
href="mailto:comenzi@fiorisweets.ro?subject=Comand%C4%83%20fiori&body=Ocazia%3A%20%0AData%20evenimentului%3A%20%0ANum%C4%83r%20de%20persoane%3A%20%0ACe%20mi-a%C8%99%20dori%3A%20%0AAlergii%3A%20%0ATelefon%3A%20"
```
(campul „Alergii" rezolva partial si obligatia de la `alergeni-lipsa-reg-1169-2011`)

(2) Randeaza adresa si ca text selectabil, in afara butonului, ca sa existe o cale de rezerva cand handler-ul mailto lipseste:
```tsx
<p className="mt-4 text-sm font-light text-blush/70">
  sau copiază adresa: <span className="select-all font-medium text-blush">comenzi@fiorisweets.ro</span>
</p>
```

(3) Cand adaugi WhatsApp-ul (deja pe lista ca `zero-localizare-si-canale-alternative`), pune-l ca al doilea buton chiar aici, nu doar in footer — `https://wa.me/407XXXXXXXX?text=...` functioneaza pe mobil fara nicio configurare si ar trebui sa fie CTA-ul principal pentru acest public.


## [COSMETIC] Alt-textul unei imagini contine numele unui token Tailwind („bandă peach") in loc de o culoare in romana
*`app/page.tsx:370` · efort: trivial*

**Problema:** app/page.tsx l.370:
```tsx
alt="Cutie cadou verde cu bandă peach"
```
`peach` este numele variabilei de tema din app/globals.css l.6 (`--color-peach: #f3c9ab`), nu un cuvant romanesc. A ajuns direct din paleta in text destinat utilizatorului final.

Este singurul alt-text cu aceasta problema; celelalte 11 sunt in romana curata (verificat toate atributele alt din page.tsx). Auditul a11y a analizat alt-textele doar din perspectiva redundantei fata de legenda (`alt-redundant-produse-galerie`), nu si a limbii.

**Impact:** Un utilizator de cititor de ecran in limba romana aude „bandă piici" sau „bandă peah", in functie de motorul TTS — cuvant fara sens in context. Impact minim ca amploare (o singura imagine), dar semnaleaza ca vocabularul intern de design s-a scurs in continutul public, si e reparabil in cateva secunde.

**Fix:** app/page.tsx l.370:
```tsx
alt="Cutie cadou verde, legată cu panglică crem"
```
Merita o verificare rapida cu aceeasi ocazie ca „blush", „fern" si „cocoa" nu apar in alte texte vizibile — momentan nu apar, dar sunt aceeasi categorie de risc pe masura ce se adauga continut.



**Sinteza criticului:** Cele 7 dimensiuni au acoperit bine codul, dar au ratat doua riscuri reale de business: toate cele 12 imagini sunt generate AI (dovada in README.md:7) in timp ce copy-ul le prezinta explicit ca produse „ieșite din atelier\" — practica inselatoare sub Legea 363/2007 — si lipseste complet informatia despre alergeni, obligatorie la vanzarea de alimente la distanta conform Reg. (UE) 1169/2011 art. 14 si 44. Pe partea tehnica, nimeni nu a testat un URL inexistent (404-ul implicit Next apare in engleza pe un document `lang=\"ro\"`, fara cale inapoi), nimeni nu a verificat comportamentul sub „force dark mode\" pe Android (lipseste `color-scheme`, iar paleta light se inverseaza), iar brandul e scris exclusiv „fíori\" cu un `í` care nu e diacritic romanesc si nu apare niciodata in forma „fiori\" pe care o va tasta clientul — ceea ce agraveaza direct problema deja confirmata a h1-ului fara cuvinte cheie.