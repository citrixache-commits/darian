import Image from "next/image";

const NAV = [
  { href: "#produse", label: "Produse" },
  { href: "#galerie", label: "Galerie" },
  { href: "#despre", label: "Despre" },
  { href: "#evenimente", label: "Evenimente" },
  { href: "#contact", label: "Contact" },
];

const GALLERY = [
  {
    img: "/images/tort-mousse.jpg",
    caption: "Tort mousse de ciocolată cu zmeură",
  },
  {
    img: "/images/ness-grid.jpg",
    caption: "Prăjituri cu ness, tăiate pătrat",
  },
  {
    img: "/images/ness-plate.jpg",
    caption: "Pătrate cu cremă de cafea",
  },
  {
    img: "/images/ness-closeup.jpg",
    caption: "Felie cu ness și cacao",
  },
];

const PRODUCTS = [
  {
    img: "/images/tort.jpg",
    title: "Torturi personalizate",
    text: "Torturi pentru aniversări și ocazii speciale, cu blaturi pufoase și creme fine — decorate simplu și elegant, exact cum îți dorești.",
  },
  {
    img: "/images/pastry.jpg",
    title: "Prăjituri & pastry",
    text: "Eclere, choux-uri, tarte și prăjituri de casă, lucrate în serii mici, cu unt adevărat și multă răbdare.",
  },
  {
    img: "/images/cookies.jpg",
    title: "Cookies",
    text: "Cookies cu bucăți generoase de ciocolată — crocanți la margine, moi la mijloc. Vedeta cutiilor noastre.",
  },
  {
    img: "/images/marshmallow.jpg",
    title: "Marshmallows & sweets",
    text: "Marshmallows caramelizate, bezele pufoase și alte dulciuri mărunte, perfecte pentru candy bar sau cadouri.",
  },
];

const MARQUEE_ITEMS = [
  "cookies",
  "torturi",
  "marshmallows",
  "pastry",
  "candy bar",
  "prăjituri",
];

const STEPS = [
  {
    nr: "01",
    title: "Alegi ce-ți dorești",
    text: "Un tort, o cutie de cookies sau un candy bar întreg — ne spui ocazia și ce îți place.",
  },
  {
    nr: "02",
    title: "Stabilim detaliile",
    text: "Alegem împreună aromele, dimensiunea și decorul, apoi confirmăm data.",
  },
  {
    nr: "03",
    title: "Te bucuri de ele",
    text: "Pregătim totul proaspăt, cu grijă la fiecare detaliu, gata pentru momentul tău dulce.",
  },
];

function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-semibold lowercase tracking-tight ${className}`}>
      fíori<span className="text-peach">.</span>
    </span>
  );
}

function Marquee() {
  const row = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="overflow-hidden bg-fern-deep py-4" aria-hidden="true">
      <div className="flex w-max animate-[marquee_35s_linear_infinite] gap-8">
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0 items-center gap-8">
            {row.map((item, i) => (
              <span
                key={`${half}-${i}`}
                className="flex items-center gap-8 text-sm font-medium uppercase tracking-[0.3em] text-blush/80"
              >
                {item}
                <span className="h-1.5 w-1.5 rounded-full bg-peach/70" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-fern/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <a href="#" className="text-2xl text-blush">
            <Wordmark />
          </a>
          <nav className="hidden items-center gap-8 text-sm font-medium text-blush/90 md:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-peach"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <a
            href="#contact"
            className="rounded-full bg-peach px-5 py-2 text-sm font-semibold text-fern-deep transition-colors hover:bg-blush"
          >
            Comandă
          </a>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-fern">
          <div className="absolute inset-x-0 bottom-0 h-56 bg-blush sm:h-72" />
          <div className="relative mx-auto w-full max-w-6xl px-6 pb-16 pt-16 text-center sm:pt-24">
            <p className="text-xs font-medium uppercase tracking-[0.4em] text-peach/90 sm:text-sm">
              cofetărie artizanală
            </p>
            <h1 className="mt-4 text-7xl text-blush sm:text-8xl md:text-9xl">
              <Wordmark />
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base font-light leading-relaxed text-blush/90 sm:text-lg">
              Torturi, prăjituri și dulciuri făcute cu drag, în serii mici —
              pentru aniversări, evenimente sau pur și simplu pentru poftă.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#produse"
                className="rounded-full bg-peach px-7 py-3 text-sm font-semibold text-fern-deep transition-colors hover:bg-blush"
              >
                Vezi produsele
              </a>
              <a
                href="#contact"
                className="rounded-full border border-blush/60 px-7 py-3 text-sm font-semibold text-blush transition-colors hover:border-peach hover:text-peach"
              >
                Comandă un tort
              </a>
            </div>
            <div className="relative mx-auto mt-12 aspect-[16/9] w-full overflow-hidden rounded-3xl shadow-2xl">
              <Image
                src="/images/hero-box.jpg"
                alt="Cutie fíori. cu cookies și marshmallows caramelizate"
                fill
                priority
                sizes="(min-width: 1152px) 1104px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        <Marquee />

        {/* Produse */}
        <section id="produse" className="scroll-mt-20 bg-cream py-20">
          <div className="mx-auto w-full max-w-6xl px-6">
            <p className="text-xs font-medium uppercase tracking-[0.4em] text-fern">
              ce pregătim
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-fern-deep sm:text-4xl">
              Dulciuri făcute ca acasă
            </h2>
            <p className="mt-4 max-w-2xl font-light leading-relaxed text-cocoa/80">
              Fiecare produs iese din atelier proaspăt, din ingrediente atent
              alese. Fără scurtături, fără compromisuri — doar dulciuri cum se
              fac în familie.
            </p>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {PRODUCTS.map((p) => (
                <article
                  key={p.title}
                  className="group overflow-hidden rounded-3xl bg-white shadow-sm transition-shadow hover:shadow-xl"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={p.img}
                      alt={p.title}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-fern-deep">
                      {p.title}
                    </h3>
                    <p className="mt-2 text-sm font-light leading-relaxed text-cocoa/75">
                      {p.text}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Galerie */}
        <section id="galerie" className="scroll-mt-20 bg-fern py-20">
          <div className="mx-auto w-full max-w-6xl px-6">
            <p className="text-xs font-medium uppercase tracking-[0.4em] text-peach">
              din atelier
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-blush sm:text-4xl">
              Galerie
            </h2>
            <p className="mt-4 max-w-2xl font-light leading-relaxed text-blush/85">
              Câteva dintre dulciurile ieșite din atelier — de la tortul de
              mousse cu zmeură până la pătratele cu cremă de ness.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {GALLERY.map((g) => (
                <figure key={g.img} className="group">
                  <div className="relative aspect-square overflow-hidden rounded-3xl shadow-lg">
                    <Image
                      src={g.img}
                      alt={g.caption}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <figcaption className="mt-3 text-center text-sm font-light text-blush/80">
                    {g.caption}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* Despre */}
        <section id="despre" className="scroll-mt-20 bg-blush py-20">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
            <div className="relative aspect-square overflow-hidden rounded-3xl shadow-lg">
              <Image
                src="/images/ingredients.jpg"
                alt="Ingrediente pentru copt: cacao, ciocolată, ouă și făină"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.4em] text-fern">
                despre noi
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-fern-deep sm:text-4xl">
                Un atelier mic, cu suflet mare
              </h2>
              <p className="mt-6 font-light leading-relaxed text-cocoa/80">
                <Wordmark className="text-fern-deep" /> a pornit din bucătăria
                de acasă, din pasiunea unui tânăr cofetar pentru lucrurile
                făcute bine: aluaturi frământate cu răbdare, ciocolată adevărată
                și rețete testate până ies perfect.
              </p>
              <p className="mt-4 font-light leading-relaxed text-cocoa/80">
                Lucrăm în serii mici, la comandă, ca fiecare tort și fiecare
                cutie de dulciuri să plece din atelier proaspătă și exact așa
                cum a fost gândită.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {STEPS.map((s) => (
                  <div key={s.nr} className="rounded-2xl bg-cream/80 p-5">
                    <span className="text-sm font-semibold text-peach">
                      {s.nr}
                    </span>
                    <h3 className="mt-2 text-sm font-semibold text-fern-deep">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-xs font-light leading-relaxed text-cocoa/70">
                      {s.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Evenimente / Candy bar */}
        <section id="evenimente" className="relative scroll-mt-20">
          <div className="relative h-[420px] w-full sm:h-[480px]">
            <Image
              src="/images/candybar.jpg"
              alt="Candy bar cu torturi, cookies și marshmallows în cutii verzi"
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-fern-deep/70" />
            <div className="absolute inset-0 flex items-center">
              <div className="mx-auto w-full max-w-6xl px-6">
                <p className="text-xs font-medium uppercase tracking-[0.4em] text-peach">
                  evenimente
                </p>
                <h2 className="mt-3 max-w-xl text-3xl font-semibold text-blush sm:text-4xl">
                  Candy bar pentru momentele mari
                </h2>
                <p className="mt-4 max-w-xl font-light leading-relaxed text-blush/90">
                  Aniversări, botezuri, nunți sau petreceri de firmă — compunem
                  împreună un candy bar asortat, în culorile evenimentului tău:
                  torturi, cookies, marshmallows și cutii dulci pentru invitați.
                </p>
                <a
                  href="#contact"
                  className="mt-8 inline-block rounded-full bg-peach px-7 py-3 text-sm font-semibold text-fern-deep transition-colors hover:bg-blush"
                >
                  Cere o ofertă
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Cutii cadou */}
        <section className="bg-cream py-20">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <p className="text-xs font-medium uppercase tracking-[0.4em] text-fern">
                cadouri dulci
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-fern-deep sm:text-4xl">
                Cutii cadou fíori.
              </h2>
              <p className="mt-6 font-light leading-relaxed text-cocoa/80">
                Compune o cutie cu ce îți place: cookies, marshmallows,
                prăjituri sau un mix din toate. Ambalate frumos, gata de dăruit
                — pentru cineva drag sau pentru partenerii tăi.
              </p>
              <a
                href="#contact"
                className="mt-8 inline-block rounded-full bg-fern px-7 py-3 text-sm font-semibold text-blush transition-colors hover:bg-fern-deep"
              >
                Comandă o cutie
              </a>
            </div>
            <div className="relative order-1 aspect-square overflow-hidden rounded-3xl shadow-lg lg:order-2">
              <Image
                src="/images/giftbox.jpg"
                alt="Cutie cadou verde cu bandă peach"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="scroll-mt-20 pattern-dashes bg-fern">
          <div className="bg-fern/80 py-20">
            <div className="mx-auto w-full max-w-3xl px-6 text-center">
              <p className="text-xs font-medium uppercase tracking-[0.4em] text-peach">
                contact
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-blush sm:text-4xl">
                Hai să vorbim despre ceva dulce
              </h2>
              <p className="mx-auto mt-4 max-w-xl font-light leading-relaxed text-blush/90">
                Scrie-ne ce sărbătorești și când — revenim cu propuneri și
                toate detaliile. Comenzile se preiau în limita locurilor
                disponibile.
              </p>
              <a
                href="mailto:comenzi@fiorisweets.ro"
                className="mt-8 inline-block rounded-full bg-peach px-8 py-4 text-base font-semibold text-fern-deep transition-colors hover:bg-blush"
              >
                comenzi@fiorisweets.ro
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-fern-deep py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-blush/70 sm:flex-row">
          <span className="text-xl text-blush">
            <Wordmark />
          </span>
          <span className="font-light">
            © {new Date().getFullYear()} fíori. — fiorisweets.ro · făcut cu
            drag
          </span>
        </div>
      </footer>
    </div>
  );
}
