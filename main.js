/* ============================================================
   Scroll engine + page behaviour. No dependencies.
   One rAF loop writes --p (0..1) onto every [data-scene]:
     pin  — progress through a section taller than the viewport
            whose .stage is position:sticky (hero, claim, gathr,
            horizontal projects)
     view — progress of the element's travel through the viewport
            (everything that just reveals or parallaxes)
   CSS does the actual animating from --p; JS only measures.
   ============================================================ */

(function () {
  'use strict';

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- boot stinger: terminal types, then the site is revealed ----------
     Skippable with any input, runs once per session, never for reduced motion. */
  (function bootSequence() {
    const boot = document.getElementById('boot');
    const out = document.getElementById('term-out');

    function finish(instant) {
      document.documentElement.classList.add('booted');
      document.documentElement.style.overflow = '';
      if (instant) { boot.remove(); return; }
      /* the reveal always lands on the hero — never a restored mid-page position */
      scrollTo(0, 0);
      boot.classList.add('done');
      setTimeout(() => boot.classList.add('gone'), 550);
    }

    if (!boot) { document.documentElement.classList.add('booted'); return; }
    if (reduced) { finish(true); return; }

    /* keep the browser from re-applying a remembered scroll or anchor under the overlay */
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    scrollTo(0, 0);
    document.documentElement.style.overflow = 'hidden';
    let skipped = false;
    const skip = () => { if (!skipped) { skipped = true; finish(false); } };
    /* deliberate exits: the window's close button, Escape, or trying to scroll */
    document.getElementById('term-close').addEventListener('click', skip);
    addEventListener('keydown', e => { if (e.key === 'Escape') skip(); });
    addEventListener('wheel', skip, { once: true, passive: true });
    setTimeout(skip, 9000); // failsafe: nothing may strand a visitor behind the overlay

    const P = '<span class="p">~ %</span> ';
    /* the window title already says who this is — one command is enough */
    const script = [
      { cmd: 'dotnet run --project portfolio', out: null }
    ];
    let html = '';
    const caret = '<span class="caret"></span>';
    const render = extra => { out.innerHTML = html + extra; };

    (async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      render(caret);
      await wait(650);                       // the prompt sits there a beat first
      for (const line of script) {
        if (skipped) return;
        html += P;
        let typed = '';
        for (const ch of line.cmd) {
          if (skipped) return;
          typed += ch;
          render(typed + caret);
          await wait(62);                    // human typing speed
        }
        await wait(260);                     // beat before "enter"
        html += typed + '\n';
        if (line.out) html += '<span class="o">' + line.out + '</span>\n';
        render(caret);
        await wait(line.out ? 1050 : 800);   // time to actually read it
      }
      if (!skipped) { skipped = true; finish(false); }
    })();
  })();

  /* ---------- i18n ---------- */
  const DA = {
    nav_about: 'Om mig',
    nav_work: 'Projekter',
    nav_xp: 'Erfaring',
    nav_skills: 'Kompetencer',
    nav_certs: 'Certifikater',
    nav_contact: 'Kontakt',
    lede: 'Fullstack-udvikler i <strong>C#/.NET</strong> og <strong>Angular</strong>, på tredje år som datatekniker-elev med speciale i programmering på TEC. Jeg bygger hele systemer, fra databasen og API\'et til den skærm folk bruger, og jeg er medstifter af <strong>Vestegnens IT-løsninger</strong>, hvor jeg laver hjemmesider og software til lokale virksomheder. Næste skridt er <strong>DevOps</strong>: Docker, Kubernetes og automation med sikkerhed indbygget.',
    meta_loc: 'Storkøbenhavn',
    pcap_1: 'Fullstack-udvikler',
    claim: 'Jeg bygger hele systemet, fra database til brugerflade, og jeg giver ikke op, før det kører for dem, der skal bruge det.',
    n1_s: '. år',
    n1: 'Som datatekniker-elev med speciale i programmering på TEC, hvor jeg bygger fullstack-systemer hver dag',
    n2: 'Sider på vestegnensit.dk, firmasiden jeg bygger og driver med mine egne SEO-værktøjer',
    n3: 'Repositories på GitHub, fra konsolprogrammer til realtidsplatforme',
    k_sop: 'Chatplatform i realtid',
    team4: 'Hold på 4',
    s1h: 'Et Discord til klasselokalet',
    s1p: 'Servere, kanaler, private chats, fildeling og medlemsliste, bygget til eleverne på TEC. Én PC kører det, og alle andre åbner det bare i browseren.',
    s2h: 'Realtid og låst ned',
    s2p: 'Beskeder kommer ind med det samme over SignalR. Login bruger JWT med refresh tokens, og serveren tjekker medlemskab igen og rate-limiter hver bruger, så ingen kan læse en kanal, de ikke er med i.',
    s3h: 'Ren arkitektur, ét Docker-image',
    s3p: 'Rene lag (Domain, Application, Infrastructure, API), EF Core på SQL Server, et admin-dashboard og en daglig pensum-quiz med 1.000 spørgsmål. Leveres som ét Docker-image.',
    code_req: 'Kode på forespørgsel',
    e4_s: 'Jeg overvejer at læse automationssikkerhed, med cybersikkerhedskurser ved siden af min uddannelse, så de systemer jeg automatiserer er sikre fra starten.',
    e4_h: 'Automationssikkerhed og cybersikkerhed',
    e4_y: 'Overvejer',
    e3_s: 'Jeg kan godt lide at arbejde med DevOps-værktøjer, og at bevæge mig mod DevOps er et af mine største mål: containere med Docker, orkestrering med Kubernetes, CI/CD-pipelines og automatiserede deployments. SOPChat bliver allerede leveret som ét Docker-image.',
    e3_h: 'DevOps med Docker og Kubernetes',
    e3_y: 'Mål',
    s7_2: 'Cybersikkerhed, det næste på listen',
    s7_1: 'Hashede passwords og inputgrænser',
    s7_h: 'Sikkerhed og kvalitet',
    s4_3: 'Automationsscripts i Node, PowerShell og Bash',
    s4_2: 'Kubernetes (lærer det nu)',
    k_kvixa: 'Bestillingsplatform · i daglig brug',
    team: 'Holdprojekt',
    x1_h: 'Et produkt fra mit firma',
    x1_p: 'Selvbetjeningskiosker og online bestilling til grillbarer, caféer og takeawaysteder, solgt gennem Vestegnens IT-løsninger. Bygget sammen med Yasir Teksen og studiekammerater.',
    x2_h: 'Én kasseskærm til det hele',
    x2_p: 'Gæsterne bestiller ved kiosken i butikken eller på restaurantens egen hjemmeside, med én menu bag begge. Alle ordrer lander på én kasseskærm, og afhentningsnumre vises på et almindeligt TV.',
    x3_h: 'Live i en rigtig restaurant',
    x3_p: 'Chicken N Chicken Waves i Greve tager imod sine ordrer gennem Kvixa hver dag, på dansk og engelsk og i restaurantens eget design.',
    x_tags: 'Node.js · MongoDB · Kiosk · Online bestilling · Holdprojekt',
    w1_h: 'Én plan for en travl uge',
    w1_p: 'Arbejde, studie og træning ligger forskellige steder. Weft samler dem i én plan og lægger den om, når noget flytter sig.',
    w2_h: 'Bygget som hold',
    w2_p: 'Et holdprojekt med Yasir Teksen og Jawad Qayyum: en backend i C# og .NET, en frontend med dags-, uge- og månedsvisning og tests af de funktioner, vi byggede.',
    w3_h: 'Kører på Azure',
    w3_p: 'API\'et kører på Azure App Service med Azure SQL og login via Entra ID. Platformen er live, og produktets funktioner bliver gjort færdige inden lanceringen.',
    w_tags: 'C# · .NET 8 · Azure · Azure SQL · Entra ID · Test',
    visit_site: 'Hjemmeside',
    k_taxa: 'Prisberegner · skoleopgave',
    t1h: 'En pris på få sekunder',
    t1p: 'Bygget til et taxaselskabs kundeservice. Vælg to adresser, så udfyldes rute, afstand og køretid fra OpenStreetMap. Ud kommer en fuld prisspecifikation med alle linjer og en total.',
    t2h: 'Forretningsregler som kode',
    t2p: 'Dag-, aften- og helligdagstakster, to vogntyper og seks tillæg, fra lufthavnen til Storebælts- og Øresundsbroen. Hvert tillæg er sin egen klasse, så en ny regel aldrig rører de gamle.',
    t3h: 'Låst fast af tests',
    t3p: 'xUnit tester prismotoren, og Vitest tester Angular-appen. Én test læser den rigtige taksfil og tjekker selskabets officielle kontrolpris, så en forkert takst får buildet til at fejle.',
    k_vit: 'Mit firma · medstifter',
    live: 'Live',
    v1h: 'Stiftet i 2025',
    v1p: 'Vestegnens IT-løsninger laver hjemmesider, webapps og integrationer til små virksomheder på Vestegnen. Jeg arbejder med udvikling, hosting og teknisk SEO og taler med kunderne fra første møde til lancering.',
    v2h: 'Hurtig fra starten',
    v2p: 'Firmasiden har over 50 sider uden tungt framework: modulær CSS, et build-trin der minificerer alt og skærer ikonfonten ned til de ikoner, der faktisk bruges, og URL\'er, redirects og sitemap genereret fra én kilde.',
    v3h: 'Tjekket før hver deploy',
    v3p: 'Mine egne Node-scripts gennemgår interne links, canonical-ruter, redirects og indekserings-headers, før noget går live. Ved siden af: sider til et logistikfirma, en guldsmed, en frisør og et vikarbureau.',
    k_proj: 'Flere projekter',
    h_proj: 'Bred af natur',
    m_h: 'Værktøjer til produktionsdata',
    m_role: 'MEC APEM · i brug i produktionen',
    m_p: 'Python- og Streamlit-apps, der læser maskin- og testdata fra fabrikkens netværk og viser jobs, fremdrift og testresultater for en samlelinje. Afleveret med en installationsguide, så medarbejdere uden programmeringserfaring kan køre dem.',
    m_t: 'Dataanalyse',
    b_h: 'Biografbooking',
    b_role: 'Fullstack · C# og Angular',
    b_p: 'Film, forestillinger, sædevalg og bookinger med snacks. Et ASP.NET Core API med JWT-login og hashede passwords, EF Core-migrationer og seed-data og en Angular-klient.',
    d_h: 'Brugerplatform',
    d_role: 'Fullstack · Python og React',
    d_p: 'Oprettelse, e-mailbekræftelse, nulstilling af password, et kontodashboard og et adminpanel til at styre brugere. En Django REST-backend med rettigheder og en React-frontend.',
    h_h: 'Skolesystem, MVC + API',
    h_role: 'Backend · C#',
    h_p: 'En ASP.NET MVC-app med API-controllere til elever, lærere og fag, et servicelag bag interfaces og fillogning, hvor controller-API\'er sammenlignes med minimal API\'er.',
    i_h: 'InfoTavle',
    i_role: 'Holdprojekt · TEC',
    i_p: 'En infoskærm til TEC-elever med live afgange fra Rejseplanen og DSB, vejret og et nyhedsfeed, bygget sammen i en gruppe.',
    i_t: 'Offentlige API\'er',
    o_h: 'IoT: vanding og sensorer',
    o_role: 'Hardware · C++ og Python',
    o_p: 'Et automatisk vandingssystem til planter i C++ med PlatformIO og en Raspberry Pi i Python, der læser sensordata over seriel forbindelse og sender dem videre med publish/subscribe.',
    k_xp: 'Erfaring',
    h_xp: 'Hvor jeg har arbejdet',
    now: 'nu',
    j1_h: 'Medstifter og udvikler',
    j1_p: 'Bygger og driver hjemmesider og webapps til lokale virksomheder: udvikling, hosting, domæner og teknisk SEO. Jeg mødes direkte med kunderne og tager projekter fra første samtale til lancering.',
    j2_h: 'Udvikler, værktøjer til produktionsdata',
    j2_p: 'Byggede Python- og Streamlit-værktøjer, der gør maskin- og testdata fra en samlelinje til overblik over jobs, fremdrift og testresultater, og skrev installationsguiden, så medarbejderne kan køre dem uden hjælp.',
    j3_h: 'Programmør-elev (SKP)',
    j3_p: 'Fuldtids skolepraktik i Ballerup. Jeg bygger fullstack-systemer i teams med C#/.NET, Angular, SQL Server, tests og Docker, sådan som et udviklingsteam arbejder i en virksomhed. SOPChat og TaxaPris er lavet her.',
    k_skills: 'Værktøjer',
    h_skills: 'Hvad jeg arbejder med',
    s1_1: 'JWT, roller og rate limiting',
    s3_1: 'Views, stored procedures og triggers',
    s3_2: 'Databasedesign',
    s4_h: 'DevOps og automation',
    s4_1: 'Ren arkitektur · SOLID',
    s5_h: 'Derudover',
    s5_1: 'AI-assisteret udvikling',
    s6_h: 'Sprog',
    s6_1: 'Dansk og tyrkisk, modersmål',
    s6_2: 'Tyrkisk, modersmål',
    s6_3: 'Engelsk, flydende',
    k_certs: 'Certifikater',
    h_certs: 'Altid i gang med at lære',
    b_ai: 'AI',
    b_code: 'Programmering',
    b_tools: 'Værktøjer',
    certs_more: 'Se dem på LinkedIn',
    k_edu: 'Uddannelse',
    h_edu: 'Min vej indtil nu',
    e2_y: 'Næste',
    e2_h: 'En læreplads som programmør',
    e2_s: 'Jeg søger en virksomhed i Storkøbenhavn, hvor jeg kan gøre min datatekniker-uddannelse færdig og levere produktionskode i et team. Jeg kan starte med det samme.',
    e1_h: 'Datatekniker med speciale i programmering',
    e1_s: 'Hovedforløb i programmering og OOP, databaser og EF Core, web og REST API\'er, mønstre, test og arkitektur samt DevOps og sikkerhed.',
    k_contact: 'Kontakt',
    h_contact: 'Lad os bygge noget',
    contact_p: 'Jeg søger en læreplads som programmør i Storkøbenhavn, gerne i et team der arbejder med DevOps, automation eller sikkerhed, og jeg er åben for studiejob og freelanceopgaver. Koden bag projekterne ovenfor kan fås på forespørgsel. Den hurtigste vej til mig er en mail.',
    btn_mail: 'Skriv til mig',
    btn_cv: 'Hent CV',
    copy: '© 2026 Mirsad Köse. Alle rettigheder forbeholdes.',
    foot: 'Design af',
    to_top: 'Til toppen'
  };

  const EN = {};
  document.querySelectorAll('[data-i18n]').forEach(el => {
    EN[el.dataset.i18n] = EN[el.dataset.i18n] ?? el.innerHTML;
  });

  let lang = 'en';
  function setLang(l) {
    lang = l;
    document.documentElement.lang = l;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const v = l === 'da' ? (DA[el.dataset.i18n] ?? EN[el.dataset.i18n]) : EN[el.dataset.i18n];
      if (v !== undefined) el.innerHTML = v;
    });
    document.querySelectorAll('#l-en,#l2-en').forEach(e => e.classList.toggle('on', l === 'en'));
    document.querySelectorAll('#l-da,#l2-da').forEach(e => e.classList.toggle('on', l === 'da'));
    document.querySelectorAll('[data-words]').forEach(splitWords); // re-split after innerHTML swap
    /* the CV button follows the language: Danish site, Danish CV */
    const cv = l === 'da' ? 'Mirsad-Kose-CV.pdf' : 'Mirsad-Kose-CV-EN.pdf';
    document.querySelectorAll('[data-cv]').forEach(a => { a.href = 'assets/' + cv; a.download = cv; });
    measure();
  }
  document.querySelectorAll('#langbtn,#langbtn2').forEach(b =>
    b.addEventListener('click', () => {
      const next = lang === 'en' ? 'da' : 'en';
      setLang(next);
      try { localStorage.setItem('lang', next); } catch (e) {}
    }));

  /* ---------- theme (pre-paint script in <head> set the attribute) ---------- */
  const mq = matchMedia('(prefers-color-scheme: dark)');
  let dark = document.documentElement.dataset.theme === 'dark';
  function setTheme(d, remember) {
    dark = d;
    document.documentElement.dataset.theme = d ? 'dark' : 'light';
    document.querySelectorAll('#themebtn,#themebtn2').forEach(b =>
      b.setAttribute('aria-pressed', String(d)));
    if (remember) { try { localStorage.setItem('theme', d ? 'dark' : 'light'); } catch (e) {} }
  }
  setTheme(dark, false);
  document.querySelectorAll('#themebtn,#themebtn2').forEach(b =>
    b.addEventListener('click', () => setTheme(!dark, true)));
  mq.addEventListener('change', e => {
    let stored = null; try { stored = localStorage.getItem('theme'); } catch (err) {}
    if (!stored) setTheme(e.matches, false);
  });

  /* ---------- word splitting for the claim scene ---------- */
  function splitWords(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words
      .map((w, i) => `<span class="w" style="--i:${i}">${w}</span>`)
      .join(' ');
    el.style.setProperty('--n', words.length);
  }
  document.querySelectorAll('[data-words]').forEach(splitWords);

  /* ---------- mobile menu ---------- */
  const burger = document.getElementById('burger');
  const mobile = document.getElementById('mobile');
  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    mobile.classList.toggle('open');
  });
  mobile.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    burger.classList.remove('open'); mobile.classList.remove('open');
  }));

  /* ---------- scrollspy ---------- */
  const spyTargets = ['about', 'work', 'experience', 'skills', 'contact']
    .map(id => document.getElementById(id)).filter(Boolean);
  const allLinks = [...document.querySelectorAll('.navlinks a[href^="#"], .mobile a[href^="#"]')];
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        allLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { rootMargin: '-25% 0px -65% 0px' });
  spyTargets.forEach(t => spy.observe(t));

  /* ---------- count-up numbers ---------- */
  function runCounter(span) {
    if (span._done) return;
    span._done = true;
    const target = parseFloat(span.dataset.count);
    const decimals = parseInt(span.dataset.decimals || '0', 10);
    if (reduced) { span.textContent = target.toFixed(decimals); return; }
    const t0 = performance.now(), dur = 1100;
    (function step(t) {
      const k = clamp((t - t0) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - k, 3);
      span.textContent = (target * eased).toFixed(decimals);
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ---------- the engine ---------- */
  const scenes = [...document.querySelectorAll('[data-scene]')];
  /* every pinned scene that walks through captions: .gathr, .weft, whatever comes next.
     data-steps says how many, so one loop drives all of them. */
  const walks = [...document.querySelectorAll('[data-steps]')].map(el => ({
    el,
    n: Math.max(1, parseInt(el.dataset.steps, 10) || 1),
    steps: [...el.querySelectorAll('.step')],
    dots: [...el.querySelectorAll('.step-dots i')],
    shots: [...el.querySelectorAll('.shot')],
    active: -1
  }));
  const numbers = document.querySelector('.numbers');
  const counters = [...document.querySelectorAll('[data-count]')];
  const hscroll = document.querySelector('.hscroll');
  const track = document.getElementById('track');
  const nav = document.getElementById('nav');
  const bar = document.getElementById('bar');
  const isNarrow = () => matchMedia('(max-width: 860px)').matches;

  let vh = innerHeight;

  /* on narrow / short viewports the pinned stages must hold copy + screenshot
     with nothing clipped: shrink the browser frame (ratio kept) to what's left */
  function fitPanels() {
    for (const scene of document.querySelectorAll('.gathr, .weft')) {
      const stage = scene.querySelector('.stage');
      const grid = scene.querySelector('.gathr-grid');
      const copy = scene.querySelector('.gathr-copy');
      const browser = scene.querySelector('.gathr-visual .browser');
      if (!stage || !grid || !copy || !browser) continue;
      browser.style.width = '';
      const steps = scene.querySelector('.steps');
      if (steps) steps.style.minHeight = '';
      if (!isNarrow()) continue;
      /* reserve exactly the tallest step, not the CSS guess — the saved
         slack becomes screenshot width */
      if (steps) {
        let tallest = 0;
        for (const st of steps.children) {
          let h = 0;
          for (const el of st.children) {
            const cs = getComputedStyle(el);
            h += el.offsetHeight + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
          }
          tallest = Math.max(tallest, h);
        }
        if (tallest) steps.style.minHeight = tallest + 'px';
      }
      const st = getComputedStyle(stage);
      const inner = stage.clientHeight - parseFloat(st.paddingTop) - parseFloat(st.paddingBottom);
      const twoCol = getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length > 1;
      const gap = parseFloat(getComputedStyle(grid).rowGap) || 0;
      const avail = twoCol ? inner : inner - copy.offsetHeight - gap;
      const bar = browser.querySelector('.browser-bar');
      const barH = bar ? bar.offsetHeight : 38;
      const maxW = (avail - barH) * (1400 / 825);
      const colW = browser.parentElement.clientWidth || grid.clientWidth;
      if (maxW < colW) browser.style.width = Math.max(180, maxW) + 'px';
    }
  }

  function measure() {
    vh = innerHeight;
    // horizontal section: its height is the horizontal distance to cover
    if (hscroll && track) {
      if (isNarrow() || reduced) {
        hscroll.style.height = '';
        track.style.setProperty('--shift', '0px');
      } else {
        const shift = Math.max(0, track.scrollWidth - innerWidth);
        track.style.setProperty('--shift', -shift + 'px');
        hscroll.style.height = (vh + shift) + 'px';
      }
    }
    fitPanels();
    for (const s of scenes) {
      const r = s.getBoundingClientRect();
      s._top = r.top + scrollY;
      s._h = s.offsetHeight;
    }
  }

  function frame() {
    const y = scrollY;
    nav.classList.toggle('scrolled', y > 10);
    const doc = document.documentElement;
    bar.style.width = (y / Math.max(1, doc.scrollHeight - doc.clientHeight) * 100) + '%';

    for (const s of scenes) {
      let p;
      if (s.dataset.scene === 'pin') {
        p = clamp((y - s._top) / Math.max(1, s._h - vh), 0, 1);
      } else {
        // progress of the element travelling up through the viewport
        p = clamp((y + vh - s._top) / (vh + s._h), 0, 1);
      }
      if (Math.abs((s._p ?? -1) - p) > 0.0004) {
        s._p = p;
        s.style.setProperty('--p', p.toFixed(4));
      }
    }

    // step switching: the panel straightens over the first third, then the
    // captions take an equal share of the remainder. The +0.4 is that head start.
    for (const w of walks) {
      if (w.el._p === undefined) continue;
      const active = clamp(Math.floor(w.el._p * (w.n + 0.4)), 0, w.n - 1);
      if (w.active !== active) {
        w.active = active;
        w.steps.forEach((el, i) => el.classList.toggle('on', i === active));
        w.dots.forEach((el, i) => el.classList.toggle('on', i <= active));
        // a step can name the frame it wants, so three captions can share two frames
        const want = w.steps[active] && w.steps[active].dataset.shot;
        const shot = want ? +want : Math.min(active, w.shots.length - 1);
        w.shots.forEach((el, i) => el.classList.toggle('on', i === shot));
      }
    }

    // counters fire once their band is a third of the way up the screen
    if (numbers && numbers._p > 0.35) counters.forEach(runCounter);

    requestAnimationFrame(frame);
  }

  /* pointer tilt on the 3D panel — desktop only, on top of the scroll pose */
  if (!reduced && matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.gathr-visual').forEach(visual => {
      const panel = visual.querySelector('.panel3d');
      if (!panel) return;
      visual.addEventListener('mousemove', e => {
        const r = visual.getBoundingClientRect();
        panel.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5) * 7);
        panel.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5) * 7);
      });
      visual.addEventListener('mouseleave', () => {
        panel.style.setProperty('--mx', 0);
        panel.style.setProperty('--my', 0);
      });
    });
  }

  /* the mobile URL bar fires height-only resizes constantly while scrolling;
     re-measuring then causes thrash and jumps. Only a width change matters. */
  let lastW = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth !== lastW) { lastW = innerWidth; measure(); }
    else { vh = innerHeight; }
  }, { passive: true });
  addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  measure();

  if (reduced) {
    // CSS pins --p to 1 and flattens the pinned scenes; just finish the numbers
    counters.forEach(runCounter);
  } else {
    requestAnimationFrame(frame);
  }

  /* restore language: stored choice beats browser locale */
  let storedLang = null; try { storedLang = localStorage.getItem('lang'); } catch (e) {}
  if (storedLang === 'da' || storedLang === 'en') { if (storedLang !== 'en') setLang(storedLang); }
  else {
    /* device language OR a Copenhagen clock reads as a Danish visitor —
       catches Danes whose phone is set to English, no geo request needed */
    const langs = (navigator.languages || [navigator.language || '']).join(',').toLowerCase();
    let tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    if (langs.includes('da') || tz === 'Europe/Copenhagen') setLang('da');
  }
})();

/* ---------- GoatCounter events: which contact links and certificates people open ----------
   count.js loads async and skips localhost, so this quietly does nothing until it is there */
function track(path, title) {
  try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path, title, event: true }); } catch (e) {}
}
document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('a[href]');
  if (!a) return;
  const h = a.getAttribute('href');
  if (h.startsWith('mailto:')) track('click-email', 'Clicked email');
  else if (h.includes('linkedin.com')) track('click-linkedin', 'Clicked LinkedIn');
  else if (h.includes('github.com')) track('click-github', 'Clicked GitHub');
  else if (h.endsWith('.pdf')) track('download-cv-' + (h.includes('-EN') ? 'en' : 'da'), 'Downloaded CV (' + (h.includes('-EN') ? 'English' : 'Danish') + ')');
});

/* ---------- certificate viewer: cards open a lightbox, the link still works without JS ---------- */
(() => {
  const dlg = document.getElementById('certview');
  const cards = [...document.querySelectorAll('.cert[data-cert]')];
  if (!dlg || !cards.length || typeof dlg.showModal !== 'function') return;
  const img = document.getElementById('cv-img');
  const title = document.getElementById('cv-title');
  const by = document.getElementById('cv-by');
  let i = 0;

  function show(n) {
    i = (n + cards.length) % cards.length;
    const c = cards[i];
    const name = c.querySelector('h3').textContent;
    img.src = 'assets/certs/' + c.dataset.cert + '.jpg';
    img.alt = name;
    title.textContent = name;
    by.textContent = c.querySelector('.by').textContent + ' · ' + c.querySelector('.date').textContent;
  }

  // view only: no right-click "save image" or dragging the certificate out
  document.querySelectorAll('.cert img, #cv-img').forEach(el => {
    el.setAttribute('draggable', 'false');
    el.addEventListener('contextmenu', e => e.preventDefault());
  });

  cards.forEach((c, n) => c.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // let new-tab clicks through
    e.preventDefault();
    show(n);
    dlg.showModal();
    track('cert-' + c.dataset.cert, 'Certificate: ' + c.querySelector('h3').textContent);
  }));
  document.getElementById('cv-close').addEventListener('click', () => dlg.close());
  document.getElementById('cv-prev').addEventListener('click', () => show(i - 1));
  document.getElementById('cv-next').addEventListener('click', () => show(i + 1));
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); }); // backdrop
  dlg.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') show(i - 1);
    if (e.key === 'ArrowRight') show(i + 1);
  });
  dlg.addEventListener('close', () => cards[i].focus({ preventScroll: true }));
})();
