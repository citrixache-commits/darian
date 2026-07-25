# Handover – Preluare proiect fíori., publicare în Vercel și conectare domeniu

*Actualizat: 25.07.2026*

## Date proiect

- **Site-ul este deja construit și LIVE:** https://fiorisweets.vercel.app
- **Repository sursă (public):** https://github.com/citrixache-commits/darian
- **Domeniu final:** fiorisweets.ro — **înregistrat de voi (Darian) direct la ROTLD**, la 02.07.2026; datele de administrare (parola domeniului) au venit pe emailul folosit la înregistrare. Reînnoirea e responsabilitatea voastră: reminder în calendar înainte de 02.07.2027 — dacă expiră, pică și site-ul și emailul
- **Administrare domeniu ROTLD:** https://www.rotld.ro/domadmin/
- **Raport de audit complet:** fișierul `AUDIT.md` din repository (toate îmbunătățirile recomandate, cu fix-uri concrete)

Ce conține site-ul acum: pagină de prezentare cu secțiunile Produse, Galerie (cu pozele reale ale prăjiturilor: „mărul verde”, lava cake + 3 filmări scurte din atelier), Despre (cu poza reală de la decorarea tortului), Evenimente / candy bar, Cutii cadou și Contact.

⚠️ **De știut de la început:**
1. Domeniul fiorisweets.ro **nu funcționează încă** (zona DNS nu există) — se rezolvă la pașii 8–9;
2. Adresa de pe site, comenzi@fiorisweets.ro, e **placeholder și nu primește mesaje** — se rezolvă la pasul 11;
3. La pasul 8 **e nevoie de Bogdan o singură dată** (domeniul e momentan atașat în contul lui Vercel de test și trebuie eliberat de acolo) — anunțați-l când ajungeți la pasul 8; ordinea pașilor 8 → 9 e importantă. Pasul 9 îl faceți singuri, cu parola voastră de la ROTLD.

---

## 1. Creează un cont Gmail propriu

Creează sau folosește un cont Gmail personal, ales de tine.

Recomandat: folosește același cont Gmail pentru GitHub și Vercel, ca să fie mai ușor de administrat.

Contul trebuie să fie al vostru și să rămână permanent sub controlul vostru.

## 2. Creează contul GitHub

Accesează https://github.com și creează un cont nou folosind contul Gmail de la pasul 1.

Păstrează în siguranță:

- adresa Gmail;
- parola;
- codurile de recuperare;
- autentificarea în doi pași, dacă este activată.

Contul GitHub trebuie să fie al vostru, nu al unei terțe persoane.

## 3. Copiază proiectul în repository-ul vostru

**Varianta simplă, recomandată (fără linie de comandă):**

1. Autentificat în contul vostru GitHub, deschide: https://github.com/new/import
2. La „The URL for your source repository” pune: `https://github.com/citrixache-commits/darian`
3. Numele noului repository: `darian` (sau alt nume). Alege **Private** (recomandat).
4. Apasă „Begin import” și așteaptă să se termine.

**Varianta cu Git (doar dacă știi ce faci):** întâi creează un repository **gol** numit `darian` în contul vostru, la https://github.com/new (fără README, fără .gitignore) — `git push` nu poate crea singur repository-ul. Atenție: push prin HTTPS NU merge cu parola de GitHub — ai nevoie de un Personal Access Token sau de aplicația GitHub Desktop.

```bash
git clone https://github.com/citrixache-commits/darian.git
cd darian
git remote remove origin
git remote add origin https://github.com/CONTUL-VOSTRU/darian.git
git push -u origin main
```

Branch-ul principal se numește `main`.

La final, verifică dacă toate fișierele apar în repository-ul vostru (inclusiv folderele `app/`, `public/images/`, `public/videos/` și fișierul `AUDIT.md`).

**Din acest moment, se lucrează doar în repository-ul vostru.**

## 4. Creează contul Vercel

Accesează https://vercel.com și creează un cont nou (plan Hobby, gratuit).

La înregistrare, alege opțiunea **Continue with GitHub** — folosește contul GitHub creat la pasul 2. Astfel Vercel se conectează automat la repository-urile voastre.

Contul Vercel trebuie să fie al vostru și să rămână sub controlul vostru.

Notă: planul Hobby e oficial pentru uz necomercial; pentru site-ul unei afaceri, Vercel poate cere cândva trecerea pe planul Pro (~20 USD/lună). Puteți porni liniștit pe Hobby, dar e bine să știți regula.

## 5. (Opțional) Conectează GitHub și Vercel în Claude

Necesar **doar** dacă vreți să folosiți Claude la pașii 6, 10 sau 11. E nevoie de un cont Claude (pentru Claude Code — abonament plătit; întrebați-l pe Bogdan ce cont folosiți).

În Claude: **Settings → Connectors** → conectează **GitHub** și **Vercel**, autentificându-te cu conturile voastre nou create.

## 6. Importă repository-ul vostru în Vercel

**Varianta simplă:** în Vercel, apasă **Add New → Project**, alege repository-ul `darian` din lista GitHub și apasă **Deploy**. Nu trebuie schimbată nicio setare — Vercel detectează singur Next.js. (Repository privat + plan Hobby = nicio problemă.)

**Varianta cu Claude:** deschide un chat Claude Code (Opus 5 sau mai bun) și trimite linkul repository-ului VOSTRU cu mesajul:

> „Acesta este repository-ul meu GitHub. Importă-l în contul meu Vercel, configurează proiectul, publică site-ul și repară eventualele erori de build sau deployment.”

Bonus: odată importat așa, **orice modificare împinsă pe GitHub se publică automat** — nu mai e nevoie de comenzi de deploy.

## 7. Verifică publicarea în Vercel

Vercel va genera o adresă temporară, de forma `darian-....vercel.app`.

Verifică:

- pagina principală și toate secțiunile din meniu;
- imaginile din Galerie și cele 3 filmări (apasă play);
- butoanele de comandă (duc la secțiunea Contact);
- afișarea pe telefon;
- eventualele erori.

## 8. Adaugă domeniul în Vercel — întâi îl eliberează Bogdan

⚠️ Domeniile `fiorisweets.ro` și `www.fiorisweets.ro` sunt momentan în contul Vercel al lui Bogdan, **la nivel de cont, nu doar de proiect**.

**Ordinea corectă:**

1. **ÎNAINTE de orice**, dați-i mesaj lui Bogdan să elimine complet domeniul din contul lui: din proiectul lui (Project → Settings → Domains) **și** din tab-ul **Domains** de la nivelul contului (echivalent: `vercel domains rm fiorisweets.ro`);
2. Abia apoi, în proiectul vostru: **Project → Settings → Domains** → adăugați `fiorisweets.ro` și `www.fiorisweets.ro` — se vor adăuga fără verificări suplimentare;
3. **Nu încercați varianta cu înregistrarea TXT** dacă Vercel o cere: domeniul nu are încă zonă DNS, deci nu există unde să o puneți. Dacă apare cererea de TXT, înseamnă că pasul 1 nu s-a făcut complet — mesaj lui Bogdan.

## 9. Configurează DNS-ul domeniului — pasul care lipsește azi

**Situația actuală (verificată la 25.07.2026):** domeniul fiorisweets.ro este înregistrat corect, dar **zona DNS nu există** — nameserverele actuale (ns.clausweb.ro / ns.registar.ro / ns.romania-webhosting.com) nu răspund pentru acest domeniu. De aceea site-ul nu se poate deschide încă pe fiorisweets.ro și niciun email către @fiorisweets.ro nu ajunge nicăieri.

✅ **Acest pas îl faceți voi:** domeniul e înregistrat de voi la ROTLD, deci autentificarea la https://www.rotld.ro/domadmin/ se face cu **numele domeniului + parola domeniului**, primite pe emailul vostru la înregistrare. Dacă nu mai găsiți parola, folosiți recuperarea din pagina de login — vine tot pe emailul vostru.

⚠️ **Ordinea e critică:** nameserverele se schimbă **doar DUPĂ** ce domeniul a fost scos din contul Vercel al lui Bogdan și adăugat cu succes la proiectul vostru (pasul 8). Dacă se schimbă înainte, domeniul rămâne legat de contul lui și nu-l mai puteți revendica.

**Calea recomandată (cea mai simplă):** mutarea pe nameserverele Vercel — apoi Vercel administrează tot automat:

1. Autentificați-vă la https://www.rotld.ro/domadmin/ și schimbați nameserverele domeniului în:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
2. ROTLD trimite o cheie de confirmare pe emailul de contact al domeniului — trebuie introdusă pentru finalizare;
3. Se așteaptă propagarea (de la câteva minute la câteva ore). Vercel emite automat certificatul SSL.

**Alternativa** (doar dacă aveți deja un serviciu de hosting/DNS unde puteți crea zona — nameserverele actuale, ns.clausweb.ro etc., nu servesc azi nimic pentru domeniu): creați zona cu exact valorile afișate de Vercel la pasul 8 — de regulă `A 76.76.21.21` pentru fiorisweets.ro și `CNAME cname.vercel-dns.com` pentru www. Nu folosiți valori aproximative.

## 10. Configurare cu Computer Use (opțional)

După autentificarea manuală în panoul ROTLD, se poate transmite în Claude:

> „Navighează în panoul ROTLD și configurează pentru fiorisweets.ro exact înregistrările DNS afișate în proiectul meu Vercel. Nu modifica alte setări DNS.”

## 11. Emailul de comenzi — trebuie rezolvat, altfel se pierd comenzile

Adresa `comenzi@fiorisweets.ro` care apare pe site este un **placeholder**: căsuța nu există, iar domeniul nu are înregistrări MX, deci orice mesaj trimis acolo se pierde. Două variante:

- **Varianta corectă:** după pasul 9, creați căsuța `comenzi@fiorisweets.ro` (Zoho Mail are plan gratuit; Google Workspace e contra cost). Înregistrările MX cerute de furnizor se adaugă în dashboard-ul Vercel: meniul **Domains** din sidebar (la nivel de cont, NU în proiect) → click pe `fiorisweets.ro` → **DNS Records** (există și „Add DNS Preset” pentru Zoho/Google). Atenție: asta funcționează doar dacă la pasul 9 ați mutat domeniul pe nameserverele Vercel; dacă ați ales alt serviciu de DNS, MX-urile se adaugă acolo, în zona DNS respectivă.
- **Varianta rapidă:** schimbați adresa din site cu una care există deja (Gmail-ul vostru). Se modifică în fișierul `app/page.tsx` (apare de două ori, căutați `comenzi@fiorisweets.ro`) — sau îi cereți lui Claude asta, în chat-ul conectat la repository.

Notă: pentru că azi domeniul nu are deloc zonă DNS, nu există înregistrări MX/SPF/DKIM de păstrat — se pornește de la zero. Dacă pe viitor emailul funcționează, nu ștergeți niciodată acele înregistrări.

## 12. Validarea finală

În Vercel, la Domains, ambele domenii trebuie să apară cu **Valid Configuration**. Apoi verificați:

- https://fiorisweets.ro se deschide cu lacăt (SSL valid);
- https://www.fiorisweets.ro redirecționează corect;
- trimiteți linkul pe WhatsApp — trebuie să apară preview cu imaginea cutiei fíori.

**După ce fiorisweets.ro funcționează, nu mai distribuiți linkul fiorisweets.vercel.app** — acela rămâne în contul lui Bogdan, cu versiunea veche a site-ului, și poate dispărea oricând.

## 13. Ce mai e de îmbunătățit pe site (pe scurt)

Raportul complet, cu fix-uri gata scrise, este în `AUDIT.md` din repository — poate fi dat direct lui Claude („aplică fix-urile din AUDIT.md”). Cele mai importante, în ordine:

1. **Date reale de contact:** telefon / buton WhatsApp / Instagram / orașul — momentan site-ul nu spune nici măcar în ce oraș e cofetăria;
2. **Poze reale în locul celor generate:** imaginile din secțiunea Produse și o parte din Galerie (tortul cu zmeură, prăjiturile cu ness) sunt generate cu AI ca stil de prezentare; „mărul verde”, lava cake, felia cu zmeură, filmările și poza din Despre sunt reale. Pe măsură ce faceți poze bune produselor reale, înlocuiți-le pe cele generate — până atunci nu promiteți clienților un produs după o poză generată;
3. **Meniu de navigare pe telefon** (acum linkurile din meniu apar doar pe desktop);
4. O frază despre **alergeni** (produsele conțin gluten, ouă, lactate) și **datele firmei** în subsol, când există firma.

## 14. Cum se lucrează pe site după preluare

- Local: `npm install`, apoi `npm run dev` → http://localhost:3000 (necesită Node.js instalat);
- Sau totul prin Claude Code conectat la repository-ul vostru — îi spui ce să schimbe, iar după import (pasul 6) fiecare push pe `main` se publică automat pe Vercel;
- Regula de aur: repository-ul GitHub al vostru este sursa de adevăr — orice modificare trece prin el, ca să nu se piardă nimic.

---

*Site construit cu Next.js + Tailwind, în stilul brandului fíori. (verde forest + peach, font Poppins). Imagini generate cu Higgsfield Nano Banana Pro + conținut real din atelier. Spor la treabă, Darian! 🍰*
