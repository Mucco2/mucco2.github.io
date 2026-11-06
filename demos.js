/* The things you can try on the page. Plain JavaScript, nothing is stored or sent anywhere.
   Nabolys, Kvixa and Weft are team projects, and their demos follow the ones on
   Yasir Teksen's site. The quiz uses real questions from SOPChat, and the price
   calculator uses the same rules and rates as TaxaPris. */
(function () {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const isDa = () => document.documentElement.lang === 'da';
  const say = (da, en) => (isDa() ? da : en);
  const loc = () => (isDa() ? 'da-DK' : 'en-GB');
  const num = (n, d) => n.toLocaleString(loc(), { maximumFractionDigits: d === undefined ? 1 : d });
  const kr = n => n.toLocaleString(loc(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' kr.';
  const hm = (h, m) => String(h).padStart(2, '0') + (isDa() ? '.' : ':') + String(m).padStart(2, '0');
  const clock = () => { const t = new Date(); return hm(t.getHours(), t.getMinutes()); };
  const reRender = [];
  document.addEventListener('langchange', () => reRender.forEach(f => f()));

  /* GoatCounter: count the first time someone uses each demo, nothing more */
  const used = {};
  const ping = key => {
    if (used[key]) return;
    used[key] = true;
    try { if (typeof window.track === 'function') window.track('try-' + key, 'Tried the ' + key + ' demo'); } catch (e) {}
  };

  /* ================================================================
     SOPChat: five questions from the real quiz, one per main course.
     The Danish is exactly what is in the seed files; the English is a translation.
     ================================================================ */
  const QUIZ = [
    {
      code: 'H1', course: ['Programmering og OOP', 'Programming and OOP'],
      q: ['Hvilket nøgleord erklærer en variabel, hvis type compileren selv udleder?', 'Which keyword declares a variable whose type the compiler works out by itself?'],
      o: [['dynamic', 'dynamic'], ['object', 'object'], ['var', 'var'], ['auto', 'auto']],
      a: 2,
      x: ['var lader compileren udlede typen ved oversættelsen. Typen er stadig statisk og kan ikke skifte bagefter — det er dynamic, der udskyder typen til kørselstid.',
          'var lets the compiler infer the type when it compiles. The type is still static and cannot change later. It is dynamic that puts the type off until run time.']
    },
    {
      code: 'H2', course: ['Databaser og EF Core', 'Databases and EF Core'],
      q: ['Hvad betyder atomicitet i ACID?', 'What does atomicity mean in ACID?'],
      o: [['At transaktionen enten gennemføres helt eller slet ikke', 'That the transaction either completes fully or not at all'],
          ['At to transaktioner aldrig kan køre samtidig', 'That two transactions can never run at the same time'],
          ['At data skrives direkte til disken', 'That data is written straight to disk'],
          ['At transaktionen altid kan rulles tilbage bagefter', 'That the transaction can always be rolled back afterwards']],
      a: 0,
      x: ['Alt-eller-intet. Går noget galt undervejs, rulles hele transaktionen tilbage, så databasen aldrig står med en halv opdatering.',
          'All or nothing. If something goes wrong on the way, the whole transaction is rolled back, so the database is never left with half an update.']
    },
    {
      code: 'H3', course: ['Web og REST-API', 'Web and REST APIs'],
      q: ['Hvilken HTTP-statuskode betyder, at kaldet lykkedes og en ny ressource blev oprettet?', 'Which HTTP status code means the call succeeded and a new resource was created?'],
      o: [['200 OK', '200 OK'], ['201 Created', '201 Created'], ['204 No Content', '204 No Content'], ['302 Found', '302 Found']],
      a: 1,
      x: ['201 bruges til svar på et vellykket POST, typisk med en Location-header der peger på den nye ressource.',
          '201 is the answer to a successful POST, usually with a Location header that points to the new resource.']
    },
    {
      code: 'H4', course: ['Mønstre, test og arkitektur', 'Patterns, testing and architecture'],
      q: ['Hvad siger Single Responsibility Principle?', 'What does the Single Responsibility Principle say?'],
      o: [['En klasse må kun have én offentlig metode', 'A class may only have one public method'],
          ['En klasse bør have én grund til at blive ændret', 'A class should have one reason to change'],
          ['En metode må højst tage én parameter', 'A method may take at most one parameter'],
          ['En klasse må kun arve fra én basisklasse', 'A class may only inherit from one base class']],
      a: 1,
      x: ['Princippet handler om ændringsårsager, ikke om at tælle metoder. Samler en klasse to ansvar, trækker to slags krav i den.',
          'The principle is about reasons to change, not about counting methods. If a class holds two responsibilities, two kinds of requirements pull at it.']
    },
    {
      code: 'H5', course: ['DevOps, drift og sikkerhed', 'DevOps, operations and security'],
      q: ['Hvad er forskellen på en container og en virtuel maskine?', 'What is the difference between a container and a virtual machine?'],
      o: [['Containeren deler værtens kerne, mens en VM har sit eget styresystem', 'The container shares the host\'s kernel, while a VM has its own operating system'],
          ['Containeren er langsommere', 'The container is slower'],
          ['VM\'en deler kernen', 'The VM shares the kernel'],
          ['De er ens', 'They are the same']],
      a: 0,
      x: ['Derfor starter containere på sekunder og fylder langt mindre.',
          'That is why containers start in seconds and take up far less space.']
    }
  ];
  const quizEl = $('#quiz');
  if (quizEl) {
    const t = pair => (isDa() ? pair[0] : pair[1]);
    const qs = { i: 0, picked: null, right: 0 };
    function drawQuiz(focus) {
      if (qs.i >= QUIZ.length) {
        quizEl.innerHTML = `
          <div class="qz-end">
            <p class="qz-score">${qs.right}<small>/${QUIZ.length}</small></p>
            <p class="qz-end-t">${say(`${qs.right} rigtige, det giver ${qs.right * 10} point. I SOPChat ville det tælle på dagens topliste.`, `${qs.right} right, which is ${qs.right * 10} points. In SOPChat that would count on today's leaderboard.`)}</p>
            <button type="button" class="qz-btn" id="qz-again">${say('Prøv igen', 'Try again')}</button>
          </div>`;
        if (focus) $('#qz-again').focus();
        return;
      }
      const q = QUIZ[qs.i];
      const done = qs.picked !== null;
      quizEl.innerHTML = `
        <div class="qz-top">
          <span class="qz-code">${q.code}</span>
          <span class="qz-course">${t(q.course)}</span>
          <span class="qz-count">${qs.i + 1} / ${QUIZ.length}</span>
        </div>
        <div class="qz-bar" aria-hidden="true">${QUIZ.map((_, n) => `<i class="${n < qs.i || (n === qs.i && done) ? 'on' : ''}"></i>`).join('')}</div>
        <p class="qz-q" id="qz-q">${t(q.q)}</p>
        <div class="qz-opts" role="group" aria-labelledby="qz-q">${q.o.map((o, n) => {
          let cls = '';
          if (done) cls = n === q.a ? 'right' : (n === qs.picked ? 'wrong' : 'dim');
          return `<button type="button" class="qz-opt ${cls}" data-n="${n}" ${done ? 'disabled' : ''}><b>${'ABCD'[n]}</b><span>${t(o)}</span></button>`;
        }).join('')}</div>
        ${done ? `<div class="qz-after" role="status">
          <p class="qz-x"><strong>${qs.picked === q.a ? say('Rigtigt.', 'Right.') : say('Ikke helt.', 'Not quite.')}</strong> ${t(q.x)}</p>
          <button type="button" class="qz-btn" id="qz-next">${qs.i < QUIZ.length - 1 ? say('Næste spørgsmål →', 'Next question →') : say('Se resultatet →', 'See the result →')}</button>
        </div>` : ''}`;
      if (!focus) return;
      if (done) $('#qz-next').focus();
      else $('.qz-opt', quizEl).focus();
    }
    quizEl.addEventListener('click', e => {
      const opt = e.target.closest('.qz-opt');
      if (opt && qs.picked === null) {
        ping('quiz');
        qs.picked = +opt.dataset.n;
        if (qs.picked === QUIZ[qs.i].a) qs.right++;
        drawQuiz(true);
        return;
      }
      if (e.target.closest('#qz-next')) { qs.i++; qs.picked = null; drawQuiz(true); return; }
      if (e.target.closest('#qz-again')) { qs.i = 0; qs.picked = null; qs.right = 0; drawQuiz(true); }
    });
    drawQuiz(false);
    reRender.push(() => drawQuiz(false));
  }

  /* ================================================================
     Nabolys: a phone you can click around in
     ================================================================ */
  const proto = $('#proto');
  if (proto) {
    const NAV = [
      { to: 'hjem', x: 0 }, { to: 'beskeder', x: 20 }, { to: 'familie', x: 40 }, { to: 'lager', x: 60 }, { to: 'nabolag', x: 80 }
    ].map(n => ({ ...n, y: 92.6, w: 20, h: 6.7 }));
    const BACK = { x: 2.1, y: .9, w: 25.6, h: 5.5, label: () => say('Tilbage', 'Back') };
    const SCREENS = {
      hjem: {
        name: () => say('Hjem', 'Home'),
        text: () => say('»Jeg er ok«, hjælp og Nødskærm står øverst, og under dem kan du se, hvordan det går med familien.', '“I am OK”, help and the emergency screen come first, and below them you can see how the family is doing.'),
        hot: [
          { act: 'okFamily', x: 4.1, y: 15.6, w: 91.8, h: 7.4, label: () => say('Jeg er ok', 'I am OK') },
          { act: 'help', x: 4.1, y: 24.4, w: 91.8, h: 7.4, label: () => say('Jeg har brug for hjælp', 'I need help') },
          { to: 'krise', x: 4.1, y: 33.6, w: 91.8, h: 7.4, label: () => say('Åbn nødskærm', 'Open the emergency screen') },
          ...NAV
        ]
      },
      beskeder: {
        name: () => say('Beskeder', 'Messages'),
        text: () => say('Familiens samtale. Hurtige svar er ét tryk, og under dine beskeder står, hvad der er sket med dem.', 'The family conversation. Quick replies take one tap, and under your messages it says what has happened to them.'),
        hot: NAV
      },
      bluetooth: {
        name: () => say('Beskeder uden net', 'Messages without network'),
        text: () => say('Eksempel med opdigtede navne. Uden net kan to telefoner tæt på hinanden skrive sammen over Bluetooth, og under hver besked står, hvor langt den er nået.', 'Example with invented names. Without a network, two phones close to each other can write to each other over Bluetooth, and under each message it says how far it has got.'),
        hot: NAV
      },
      nabolag: {
        name: () => say('Nabolag', 'Neighbours'),
        text: () => say('Lukkede grupper for din opgang eller gade. Tryk på gruppen på telefonen, så kan du se opslagene.', 'Closed groups for your building or street. Tap the group on the phone to see the posts.'),
        hot: [{ to: 'nabogruppe', x: 4.1, y: 35.5, w: 91.8, h: 8.1, label: () => say('Naboerne på Birkestien', 'The neighbour group') }, ...NAV]
      },
      nabogruppe: {
        parent: 'nabolag',
        name: () => say('Nabogruppe', 'Neighbour group'),
        text: () => '',
        hot: [{ to: 'nabolag', ...BACK }]
      },
      familie: {
        name: () => say('Familie', 'Family'),
        text: () => say('Hvem der har sagt ok, hvem du kan nå lige nu, og familiens plan, hvis der sker noget.', 'Who has said they are OK, who you can reach right now, and the family plan if something happens.'),
        hot: NAV
      },
      lager: {
        name: () => say('Lager', 'Stock'),
        text: () => say('Hvor mange døgn husstanden er klar til, og hvad der mangler. Tryk på »Se 3-døgnslisten« på telefonen.', 'How many days the household is ready for, and what is missing. Tap “Se 3-døgnslisten” (the three-day list) on the phone.'),
        hot: [{ to: 'liste', x: 4.1, y: 61.1, w: 91.8, h: 6.5, label: () => say('Se 3-døgnslisten', 'See the three-day list') }, ...NAV]
      },
      liste: {
        name: () => say('3-døgnsliste', 'Three-day list'),
        text: () => say('Regnet ud for dem, der bor der, efter myndighedernes tal. Du kan prøve beregningen længere nede.', 'Worked out for the people who live there, from the authorities’ numbers. You can try the calculation further down.'),
        hot: [{ to: 'lager', ...BACK }]
      },
      krise: {
        name: () => say('Nødskærm', 'Emergency screen'),
        text: () => say('Mørk skærm og store knapper, når det gælder. Prøv »Jeg er ok«.', 'Dark screen and big buttons when it matters. Try “Jeg er ok” (I am OK).'),
        hot: [
          { act: 'okNearby', x: 4.1, y: 18.5, w: 91.8, h: 11.1, label: () => say('Jeg er ok', 'I am OK') },
          { act: 'help', x: 4.1, y: 30.9, w: 91.8, h: 8.3, label: () => say('Jeg har brug for hjælp', 'I need help') },
          { to: 'hjem', ...BACK }
        ]
      }
    };
    const ORDER = Object.keys(SCREENS);
    const TABS = ['hjem', 'lager', 'liste', 'familie', 'beskeder', 'bluetooth', 'nabolag', 'krise'];
    const OFFLINE = ['bluetooth', 'krise'];
    const screens = $('#screens');
    const tabs = $('#proto-tabs');
    const toast = $('#phone-toast');
    let current = 'hjem';
    let toastTimer;

    screens.innerHTML = ORDER.map(k =>
      `<div class="screen${k === current ? ' on' : ''}" data-s="${k}"><img src="assets/demo/screen-${k}.webp" alt="" width="620" height="1377" loading="lazy" draggable="false">` +
      SCREENS[k].hot.map((h, i) => `<button type="button" class="hot" data-i="${i}" style="left:${h.x}%;top:${h.y}%;width:${h.w}%;height:${h.h}%"></button>`).join('') +
      '</div>').join('');

    function labels() {
      ORDER.forEach(k => $$(`.screen[data-s="${k}"] .hot`).forEach(b => {
        const h = SCREENS[k].hot[+b.dataset.i];
        b.setAttribute('aria-label', h.label ? h.label() : SCREENS[h.to].name());
      }));
      const alt = {
        hjem: say('Nabolys Hjem med knapperne Jeg er ok, hjælp og Nødskærm, og familien nedenunder', 'Nabolys home with the buttons for I am OK, help and the emergency screen, and the family below'),
        beskeder: say('Nabolys Beskeder: familiens samtale over nettet med hurtige svar', 'Nabolys messages: the family conversation over the network with quick replies'),
        bluetooth: say('Eksempel: beskeder uden net over Bluetooth, med en linje under hver besked om, hvor langt den er nået', 'Example: messages without a network over Bluetooth, with a line under each message about how far it has got'),
        nabolag: say('Nabolys Nabolag med en lukket gruppe for gaden', 'Nabolys neighbours with a closed group for the street'),
        nabogruppe: say('Opslag i en nabogruppe: status, kan hjælpe med og har brug for hjælp', 'Posts in a neighbour group: status, can help with and needs help'),
        familie: say('Nabolys Familie med tjek-ind og invitation', 'Nabolys family screen with check-ins and an invitation'),
        lager: say('Nabolys Lager: klar til 2 af 3 døgn, og hvad der mangler', 'Nabolys stock: ready for 2 of 3 days, and what is missing'),
        liste: say('Nabolys 3-døgnsliste for 4 personer', 'Nabolys three-day list for 4 people'),
        krise: say('Nabolys Nødskærm på mørk baggrund', 'Nabolys emergency screen on a dark background')
      };
      ORDER.forEach(k => { $(`.screen[data-s="${k}"] img`).alt = alt[k]; });
      const active = SCREENS[current].parent || current;
      tabs.innerHTML = TABS.map(k =>
        `<li class="${k === active ? 'on' : ''}"><button type="button" data-s="${k}" aria-pressed="${k === active}">${SCREENS[k].name()}</button>${k === active ? `<p>${SCREENS[k].text()}</p>` : ''}</li>`).join('');
      const off = OFFLINE.includes(current);
      $('#netswitch-label').textContent = off ? say('Tænd for nettet igen', 'Turn the network back on') : say('Slå nettet fra', 'Turn the network off');
      $('#netswitch').setAttribute('aria-pressed', String(off));
    }
    function go(k) {
      ping('nabolys');
      current = k;
      proto.dataset.screen = k;
      $$('.screen', screens).forEach(s => s.classList.toggle('on', s.dataset.s === k));
      hideToast();
      labels();
    }
    function hideToast() { clearTimeout(toastTimer); toast.classList.remove('on'); }
    function showToast(text) {
      toast.textContent = text;
      toast.classList.add('on');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(hideToast, 4500);
    }
    screens.addEventListener('click', e => {
      const b = e.target.closest('.hot');
      if (!b) return;
      const h = SCREENS[b.closest('.screen').dataset.s].hot[+b.dataset.i];
      if (h.to) { go(h.to); return; }
      ping('nabolys');
      if (h.act === 'okNearby') showToast(say(`Du har sagt ok kl. ${clock()}. Det sendes, når der er net eller nogen i nærheden.`, `You said OK at ${clock()}. It is sent when there is a network or someone nearby.`));
      if (h.act === 'okFamily') showToast(say(`Du har sagt ok kl. ${clock()}. Familien kan se det.`, `You said OK at ${clock()}. The family can see it.`));
      if (h.act === 'help') showToast(say('Din familie kan nu se, at du har brug for hjælp.', 'Your family can now see that you need help.'));
    });
    tabs.addEventListener('click', e => {
      const b = e.target.closest('button[data-s]');
      if (b) { go(b.dataset.s); const again = $(`#proto-tabs button[data-s="${b.dataset.s}"]`); if (again) again.focus(); }
    });
    $('#netswitch').addEventListener('click', () => go(OFFLINE.includes(current) ? 'beskeder' : 'bluetooth'));
    labels();
    reRender.push(labels);
  }

  /* ================================================================
     Nabolys: the whole three-day list, with the same rules and numbers as in the app
     ================================================================ */
  if ($('#calc')) {
    const SOURCES = { samsik: 'Styrelsen for Samfundssikkerhed', fvst: 'Fødevarestyrelsen', nb: 'Nationalbanken' };
    const FOOD = [
      { k: 'knaekbroed', g: 500, da: 'Knækbrød', en: 'Crispbread' },
      { k: 'fisk-og-koed', g: 300, da: 'Fisk eller kød på dåse (fx makrel i tomat)', en: 'Tinned fish or meat (such as mackerel in tomato)' },
      { k: 'baelgfrugter', g: 300, da: 'Bælgfrugter på dåse (kikærter, bønner)', en: 'Tinned pulses (chickpeas, beans)' },
      { k: 'groentsager', g: 1500, da: 'Grøntsager på dåse eller glas', en: 'Tinned or jarred vegetables' },
      { k: 'pasta-og-ris', g: 500, da: 'Pasta eller couscous', en: 'Pasta or couscous' },
      { k: 'gryn', g: 500, da: 'Gryn (fx havregryn)', en: 'Oats and similar grains' },
      { k: 'noedder', g: 100, da: 'Nødder', en: 'Nuts' }
    ];
    const WATER_PER_DAY = 3, DAYS = 3, CASH = 250;
    const hh = { adults: 2, children: 2, infants: 0, pets: 0, medicine: false };
    const FIELDS = [
      { k: 'adults', da: 'Voksne', en: 'Adults' },
      { k: 'children', da: 'Børn', en: 'Children' },
      { k: 'infants', da: 'Småbørn under 3', en: 'Small children under 3' },
      { k: 'pets', da: 'Kæledyr', en: 'Pets' }
    ];
    const weight = g => (g >= 1000 ? num(g / 1000) + ' kg' : num(g, 0) + ' g');

    /* the list in the app's order and groups. Every line says what it is based on. */
    const needs = () => {
      const persons = Math.max(1, hh.adults + hh.children + hh.infants);
      const eaters = Math.max(1, hh.adults + hh.children);
      const infantNote = hh.infants > 0 ? say(' Småbørn er regnet med som personer, og det er Nabolys’ egen tolkning.', ' Small children are counted as people, which is Nabolys’ own reading.') : '';
      const stk = n => `${n} ${say('stk.', 'pcs')}`;
      const noAmount = say('uden mængde', 'no amount');
      return {
        persons, eaters,
        groups: [
          { k: 'vand', name: say('Vand', 'Water'), src: SOURCES.samsik, rows: [
            { k: 'vand', q: WATER_PER_DAY * persons * DAYS, show: `${num(WATER_PER_DAY * persons * DAYS, 0)} ${say('liter', 'litres')}`, name: say('Drikkevand', 'Drinking water'),
              note: say('3 liter pr. person pr. døgn til at drikke og evt. lave mad.', '3 litres per person per day for drinking and any cooking.') + infantNote + (hh.pets > 0 ? say(' Kæledyr skal have vand ud over dette.', ' Pets need water on top of this.') : '') }
          ] },
          { k: 'mad', name: say('Mad', 'Food'), src: SOURCES.fvst, intro: say('Fødevarestyrelsens eksempel pr. person til tre dage.', 'The Food Administration’s example per person for three days.'), rows: [
            ...FOOD.map(f => ({ k: f.k, q: f.g * eaters, show: weight(f.g * eaters), name: isDa() ? f.da : f.en, note: say(`ca. ${weight(f.g)} pr. person`, `about ${weight(f.g)} per person`) })),
            { k: 'olie', q: null, show: noAmount, name: say('Olie og smagsgivere', 'Oil and seasoning') },
            ...(hh.infants > 0 ? [{ k: 'babymad', q: null, show: noAmount, own: true, name: say('Modermælkserstatning og babymad', 'Infant formula and baby food'), note: say('Ingen officiel mængde. Forslag: barnets dagsforbrug × 3 døgn.', 'No official amount. Suggestion: what the child uses in a day × 3 days.') }] : [])
          ] },
          { k: 'kogning', name: say('Kogning', 'Cooking'), src: SOURCES.samsik, rows: [
            { k: 'kogeudstyr', q: 1, show: stk(1), name: say('Mulighed for at koge vand uden strøm', 'A way to boil water without power'), note: say('Fx stormkøkken eller grill. Aldrig indendørs.', 'Such as a camping stove or a grill. Never indoors.') }
          ] },
          { k: 'medicin', name: say('Medicin og førstehjælp', 'Medicine and first aid'), src: SOURCES.samsik, rows: [
            ...(hh.medicine ? [{ k: 'medicin', q: DAYS, show: `${DAYS} ${say('døgn', 'days')}`, name: say('Nødvendig medicin', 'Necessary medicine'), note: say('Medicin til mindst 3 døgn.', 'Medicine for at least 3 days.') }] : []),
            { k: 'smertestillende', q: 1, show: say('1 pakke', '1 pack'), name: say('Smertestillende og febernedsættende', 'Painkillers and fever reducers'), note: say('Fra myndighedernes Beredskabsberegner.', 'From the authorities’ preparedness calculator.') },
            { k: 'foerstehjaelp', q: 1, show: stk(1), name: say('Førstehjælpskasse', 'First aid kit') },
            { k: 'jodtabletter', q: null, show: noAmount, name: say('Jodtabletter', 'Iodine tablets'), note: say('Anbefales til personer under 40 år samt gravide og ammende.', 'Recommended for people under 40 and for pregnant and breastfeeding women.') }
          ] },
          { k: 'hygiejne', name: say('Hygiejne', 'Hygiene'), src: SOURCES.samsik, rows: [
            { k: 'hygiejne', q: 1, show: stk(1), name: say('Hygiejne (toiletpapir, håndsprit, vådservietter, bind)', 'Hygiene (toilet paper, hand sanitiser, wet wipes, sanitary pads)'), note: say('Nævnt uden mængde. Appen regner med mindst én ting.', 'Mentioned with no amount. The app counts at least one item.') },
            ...(hh.infants > 0 ? [{ k: 'bleer', q: null, show: noAmount, own: true, name: say('Bleer', 'Nappies'), note: say('Ingen officiel mængde. Forslag: barnets dagsforbrug × 3 døgn.', 'No official amount. Suggestion: what the child uses in a day × 3 days.') }] : [])
          ] },
          { k: 'varme', name: say('Varme og lys', 'Warmth and light'), src: SOURCES.samsik, rows: [
            { k: 'varme', q: persons, show: `${persons} ${say('sæt', persons === 1 ? 'set' : 'sets')}`, own: true, name: say('Tæpper og varmt tøj', 'Blankets and warm clothes'), note: say('Tæpper, dyner og varmt tøj er nævnt officielt. 1 sæt pr. person er Nabolys’ forslag.', 'Blankets, duvets and warm clothes are mentioned officially. 1 set per person is Nabolys’ suggestion.') },
            { k: 'lommelygte', q: 1, show: stk(1), name: say('Lommelygte', 'Torch') }
          ] },
          { k: 'stroem', name: say('Strøm og information', 'Power and information'), src: SOURCES.samsik, rows: [
            { k: 'batterier', q: 1, show: say('1 sæt', '1 set'), name: say('Batterier til lygte og radio', 'Batteries for torch and radio') },
            { k: 'powerbank', q: 1, show: stk(1), name: say('Powerbank eller batteripakke', 'Power bank or battery pack') },
            { k: 'radio', q: 1, show: stk(1), name: say('FM-radio med batteri, håndsving eller solceller', 'FM radio with battery, hand crank or solar cells'), note: say('Eller en bilradio.', 'Or a car radio.') }
          ] },
          { k: 'penge', name: say('Penge', 'Money'), src: SOURCES.nb, rows: [
            { k: 'kontanter', q: CASH * persons, show: `${num(CASH * persons, 0)} kr.`, name: say('Kontanter i små sedler og mønter', 'Cash in small notes and coins'), note: say('Nationalbankens pejlemærke: 250 kr. pr. person.', 'The National Bank’s guide: 250 kr. per person.') + infantNote },
            { k: 'betalingskort', q: 2, show: stk(2), name: say('Fysiske betalingskort (husk pinkoden)', 'Physical payment cards (remember the PIN)'), note: say('Mindst 2 pr. husstand af forskellige mærker.', 'At least 2 per household, of different brands.') }
          ] },
          ...(hh.pets > 0 ? [{ k: 'dyr', name: say('Kæledyr', 'Pets'), src: SOURCES.samsik, rows: [
            { k: 'kaeledyr', q: null, show: noAmount, name: say('Mad og vand til kæledyr', 'Food and water for pets'), note: say('Nævnt uden mængde. Beregn dyrenes eget dagsforbrug.', 'Mentioned with no amount. Work out what the animals use in a day.') }
          ] }] : [])
        ]
      };
    };

    const drawCalc = () => {
      $('#steppers').innerHTML = FIELDS.map(f => `
        <div class="stepper">
          <span class="st-name" id="st-${f.k}">${isDa() ? f.da : f.en}</span>
          <div class="st-ctl" role="group" aria-labelledby="st-${f.k}">
            <button type="button" data-k="${f.k}" data-d="-1" aria-label="${say('Færre', 'Fewer')}" ${hh[f.k] === 0 || (f.k !== 'pets' && hh.adults + hh.children + hh.infants <= 1) ? 'disabled' : ''}>−</button>
            <output>${hh[f.k]}</output>
            <button type="button" data-k="${f.k}" data-d="1" aria-label="${say('Flere', 'More')}" ${hh[f.k] >= 12 ? 'disabled' : ''}>+</button>
          </div>
        </div>`).join('') + `
        <label class="st-check"><input type="checkbox" id="st-medicine" ${hh.medicine ? 'checked' : ''}><span>${say('Nogen har brug for fast medicin', 'Someone needs regular medicine')}</span></label>`;
      const n = needs();
      const water = WATER_PER_DAY * n.persons * DAYS;
      const food = FOOD.reduce((a, f) => a + f.g, 0) * n.eaters;
      $('#calc-out').innerHTML = `
        <div class="big3">
          <div><strong>${num(water, 0)} <small>${say('liter', 'litres')}</small></strong><span>${say('drikkevand', 'drinking water')}</span></div>
          <div><strong>${weight(food).replace(' ', ' <small>')}</small></strong><span>${say('holdbar mad', 'food that keeps')}</span></div>
          <div><strong>${num(CASH * n.persons, 0)} <small>kr.</small></strong><span>${say('i kontanter', 'in cash')}</span></div>
        </div>`;
      $('#calc-list').innerHTML = `
        <div class="calc-groups">${n.groups.map(g => `
          <section class="calc-group">
            <h4><span>${g.name}</span><em>${g.src}</em></h4>
            ${g.intro ? `<p class="calc-intro">${g.intro}</p>` : ''}
            <ul class="calc-list">${g.rows.map(r => `
              <li data-k="${r.k}">
                <div class="cl-top"><span>${r.name}</span><b>${r.show}</b></div>
                ${r.own ? `<p class="cl-own">${say('Forslag fra Nabolys', 'Suggestion from Nabolys')}</p>` : ''}
                ${r.note ? `<p class="cl-note">${r.note}</p>` : ''}
              </li>`).join('')}</ul>
          </section>`).join('')}</div>`;
    };
    $('#steppers').addEventListener('click', e => {
      const b = e.target.closest('button[data-k]');
      if (!b || b.disabled) return;
      ping('nabolys-calc');
      const k = b.dataset.k, d = b.dataset.d;
      hh[k] = Math.max(0, hh[k] + +d);
      drawCalc();
      const again = $(`#steppers button[data-k="${k}"][data-d="${d}"]`);
      if (again && !again.disabled) again.focus();
      else { const other = $(`#steppers button[data-k="${k}"]:not([disabled])`); if (other) other.focus(); }
    });
    $('#steppers').addEventListener('change', e => {
      if (e.target.id !== 'st-medicine') return;
      hh.medicine = e.target.checked;
      drawCalc();
      $('#st-medicine').focus();
    });
    drawCalc();
    reRender.push(drawCalc);
    const calcToggle = $('#calc-toggle');
    const calcFull = $('#calc-full');
    const drawToggle = () => {
      const open = !calcFull.hidden;
      calcToggle.setAttribute('aria-expanded', open);
      calcToggle.innerHTML = `${open ? say('Skjul listen', 'Hide the list') : say('Se hele listen', 'See the full list')}<i aria-hidden="true"></i>`;
    };
    calcToggle.addEventListener('click', () => { calcFull.hidden = !calcFull.hidden; drawToggle(); });
    drawToggle();
    reRender.push(drawToggle);
  }

  /* ================================================================
     Kvixa: kiosk, counter screen and TV, with the same steps as the real system.
     New > Received > Ready > Handed over. An order leaves both screens only when it is handed over.
     ================================================================ */
  if ($('#kv')) {
    const MENU = [
      { id: 'burger', price: 79, da: 'Cheeseburger', en: 'Cheeseburger' },
      { id: 'hotdog', price: 45, da: 'Hotdog', en: 'Hot dog' },
      { id: 'fries', price: 32, da: 'Pommes frites', en: 'French fries' },
      { id: 'shake', price: 39, da: 'Vanilje-shake', en: 'Vanilla shake' }
    ];
    const STEPS = {
      fresh: { band: '#c74a12', label: () => say('Ny, ikke modtaget', 'New, not received'), btn: () => say('Modtaget', 'Received'), next: 'busy' },
      busy: { band: '#46506a', label: () => say('Modtaget, i gang', 'Received, in progress'), btn: () => say('Klar', 'Ready'), next: 'ready' },
      ready: { band: '#1e7a45', label: () => say('Klar til udlevering', 'Ready for pickup'), btn: () => say('Udleveret', 'Handed over'), next: null }
    };
    const basket = {};
    let orders = [
      { no: 212, st: 'ready', items: { burger: 1 } },
      { no: 213, st: 'busy', items: { hotdog: 2, fries: 1 } },
      { no: 214, st: 'fresh', items: { burger: 1, fries: 1, shake: 1 } }
    ];
    let nextNo = 215;
    let kioskDone = null;
    let doneTimer;
    const count = () => Object.values(basket).reduce((a, b) => a + b, 0);
    const sum = () => MENU.reduce((a, m) => a + (basket[m.id] || 0) * m.price, 0);
    const nameOf = m => (isDa() ? m.da : m.en);

    const drawKiosk = () => {
      $('#kiosk-items').innerHTML = MENU.map(m => `
        <button type="button" class="kiosk-item" data-id="${m.id}">
          <img src="assets/demo/food-${m.id}.webp" alt="" width="123" height="110" loading="lazy">
          <span class="ki-name">${nameOf(m)}</span>
          <span class="ki-row"><span>${m.price} kr</span><i aria-hidden="true">${basket[m.id] ? basket[m.id] : '+'}</i></span>
        </button>`).join('');
      const n = count();
      $('#kiosk-sum').innerHTML = n ? `${n} ${n === 1 ? say('vare', 'item') : say('varer', 'items')} <b>${sum()} kr</b> <button type="button" id="kiosk-clear">${say('Ryd', 'Clear')}</button>` : say('Tryk på en ret', 'Tap a dish');
      const pay = $('#kiosk-pay');
      pay.textContent = say('Bestil', 'Order');
      pay.disabled = !n;
      const done = $('#kiosk-done');
      done.hidden = !kioskDone;
      if (kioskDone) {
        done.innerHTML = `
          <p class="kd-t">${say('Tak for din bestilling', 'Thank you for your order')}</p>
          <p class="kd-l">${say('Dit ordrenummer er', 'Your order number is')}</p>
          <p class="kd-n">${kioskDone}</p>
          <p class="kd-w">${say('Hold øje med skærmen. Vi kalder dit nummer, når maden er klar.', 'Keep an eye on the screen. We call your number when the food is ready.')}</p>
          <button type="button" id="kiosk-again">${say('Ny bestilling', 'New order')}</button>`;
      }
    };

    const drawCounter = scrollDown => {
      const box = $('#counter');
      const old = $('.tk-list', box);
      const top = old ? old.scrollTop : 0;
      const n = st => orders.filter(o => o.st === st).length;
      box.innerHTML = `<div class="counter-in">
        <div class="scr-top">
          <p class="scr-title">${say('Kasseskærm', 'Counter screen')}</p>
          <p class="scr-counts"><span style="background:${STEPS.fresh.band}">${n('fresh')} ${say('ny', 'new')}</span><span style="background:${STEPS.busy.band}">${n('busy')} ${say('i gang', 'in progress')}</span><span style="background:${STEPS.ready.band}">${n('ready')} ${say('klar', 'ready')}</span></p>
        </div>
        ${n('fresh') ? `<p class="scr-ring">${say('Ny ordre: tryk Modtaget', 'New order: tap Received')}</p>` : ''}
        <div class="tk-list" tabindex="0" aria-label="${say('Åbne ordrer', 'Open orders')}">${orders.length ? orders.map(o => {
          const s = STEPS[o.st];
          return `<div class="ticket${o.isNew ? ' fresh' : ''}">
            <b class="tk-no">${o.no}</b>
            <div class="tk-body">
              <span class="tk-state" style="background:${s.band}">${s.label()}</span>
              <span class="tk-lines">${MENU.filter(m => o.items[m.id]).map(m => `${o.items[m.id]} × ${nameOf(m)}`).join(', ')}</span>
            </div>
            <button type="button" data-no="${o.no}" style="background:${s.band}">${s.btn()}</button>
          </div>`;
        }).join('') : `<p class="scr-empty">${say('Ingen åbne ordrer lige nu.', 'No open orders right now.')}</p>`}</div>
      </div>`;
      orders.forEach(o => { delete o.isNew; });
      const list = $('.tk-list', box);
      list.scrollTop = scrollDown ? list.scrollHeight : top;
    };

    const drawTv = popped => {
      const nums = list => list.map(o => `<span class="${o.no === popped ? 'fresh' : ''}">${o.no}</span>`).join('');
      /* as on the real screen: the 6 newest being made and the 4 newest ready */
      const prep = orders.filter(o => o.st === 'fresh' || o.st === 'busy').slice(-6);
      const ready = orders.filter(o => o.st === 'ready').slice(-4);
      $('#tv').innerHTML = `
        <p class="tv-top">Byens Grill</p>
        <div class="tv-col prep"><h5>${say('Tilberedes', 'Being made')}</h5><div class="tv-nums">${nums(prep)}</div></div>
        <div class="tv-col done"><h5>${say('Er klar', 'Ready')}</h5><div class="tv-nums">${nums(ready)}</div></div>`;
    };
    const drawKv = () => { drawKiosk(); drawCounter(); drawTv(); };

    $('#kiosk-items').addEventListener('click', e => {
      const b = e.target.closest('.kiosk-item');
      if (!b) return;
      ping('kvixa');
      const id = b.dataset.id;
      basket[id] = (basket[id] || 0) + 1;
      drawKiosk();
      $(`.kiosk-item[data-id="${id}"]`).focus();
    });
    $('#kiosk-sum').addEventListener('click', e => {
      if (e.target.id !== 'kiosk-clear') return;
      Object.keys(basket).forEach(k => delete basket[k]);
      drawKiosk();
      $('#kiosk-pay').focus();
    });
    $('#kiosk-pay').addEventListener('click', () => {
      if (!count()) return;
      const no = nextNo++;
      orders.push({ no, st: 'fresh', isNew: true, items: { ...basket } });
      Object.keys(basket).forEach(k => delete basket[k]);
      kioskDone = no;
      clearTimeout(doneTimer);
      doneTimer = setTimeout(() => { kioskDone = null; drawKiosk(); }, 6000);
      drawKiosk();
      drawCounter(true);
      drawTv(no);
    });
    $('#kiosk-done').addEventListener('click', e => {
      if (e.target.id !== 'kiosk-again') return;
      clearTimeout(doneTimer);
      kioskDone = null;
      drawKiosk();
    });
    $('#counter').addEventListener('click', e => {
      const b = e.target.closest('button[data-no]');
      if (!b) return;
      ping('kvixa');
      const no = +b.dataset.no;
      const o = orders.find(x => x.no === no);
      const next = STEPS[o.st].next;
      if (next) o.st = next;
      else orders = orders.filter(x => x.no !== no);
      drawCounter();
      drawTv(next === 'ready' ? no : null);
      const again = $(`#counter button[data-no="${no}"]`);
      if (again) again.focus();
    });
    drawKv();
    reRender.push(drawKv);
  }

  /* ================================================================
     TaxaPris: the pricing engine from TaxaPris.Core, ported line for line.
     Rates and surcharges are the ones in TaxaPris.Api/appsettings.json, the period
     rules are TariffPeriodResolver's, and the lines come out in the same order and
     with the same Danish names. Money is counted in øre so nothing rounds wrong.
     ================================================================ */
  if ($('#tx')) {
    /* kr. as whole øre: 13,50 kr. = 1350 */
    const RATES = {
      normal: { day: { start: 3900, km: 1350, min: 500 }, eve: { start: 4900, km: 1700, min: 600 } },
      large: { day: { start: 7700, km: 1700, min: 575 }, eve: { start: 8700, km: 1900, min: 700 } }
    };
    /* in the order the API registers them, so the lines come out the same way */
    const SUR = [
      { k: 'bike', per: 3000, count: true, da: 'Cykeltillæg', en: 'Bicycles' },
      { k: 'carry', per: 3000, count: true, da: 'Opbæring', en: 'Carrying' },
      { k: 'airport', per: 1500, da: 'Lufthavnstillæg', en: 'Airport' },
      { k: 'lift', per: 35000, da: 'Liftvogn', en: 'Lift vehicle' },
      { k: 'oresund', per: 36000, da: 'Øresundsbroen', en: 'Øresund Bridge' },
      { k: 'storebaelt', per: 57000, da: 'Storebæltsbroen', en: 'Great Belt Bridge' }
    ];
    const CONTROL = { day: 23400, eve: 29100 };
    const START_STATE = { car: 'normal', km: 10, min: 12, day: 'weekday', t: 12 * 60, bike: 0, carry: 0, airport: false, lift: false, oresund: false, storebaelt: false };
    const tx = { ...START_STATE };
    const ore = v => v / 100;

    /* TariffPeriodResolver: holiday, then weekend, then outside 06:00-17:59, else day */
    const period = () => {
      if (tx.day === 'holiday') return { p: 'eve', why: say('En helligdag bruger aftentaksten.', 'A public holiday uses the evening rate.') };
      if (tx.day === 'weekend') return { p: 'eve', why: say('Lørdag og søndag bruger aftentaksten hele døgnet.', 'Saturday and Sunday use the evening rate all day.') };
      if (tx.t < 6 * 60 || tx.t >= 18 * 60) return { p: 'eve', why: say('Før kl. 06.00 og fra kl. 18.00 gælder aftentaksten.', 'Before 06:00 and from 18:00 the evening rate applies.') };
      return { p: 'day', why: say('Hverdage fra kl. 06.00 til 17.59.', 'Weekdays from 06:00 to 17:59.') };
    };

    const calculate = () => {
      const per = period();
      const r = RATES[tx.car][per.p];
      const kmStr = tx.km.toLocaleString(loc(), { maximumFractionDigits: 2 });
      /* km in tenths × rate in øre = thousandths of a krone; round half away from zero to øre */
      const kmOre = Math.round((Math.round(tx.km * 10) * r.km) / 10);
      const lines = [
        { name: say('Starttakst', 'Start fee'), amt: r.start },
        { name: say(`Kilometer (${kmStr} km × ${kr(ore(r.km))})`, `Distance (${kmStr} km × ${kr(ore(r.km))})`), amt: kmOre },
        { name: say(`Tid (${tx.min} min × ${kr(ore(r.min))})`, `Time (${tx.min} min × ${kr(ore(r.min))})`), amt: tx.min * r.min }
      ];
      SUR.forEach(s => {
        const amt = s.count ? tx[s.k] * s.per : (tx[s.k] ? s.per : 0);
        if (amt > 0) lines.push({ name: isDa() ? s.da : s.en, amt, sur: true });
      });
      const total = lines.reduce((a, l) => a + l.amt, 0);
      return { per, lines, total };
    };

    const isStandard = () => tx.car === 'normal' && tx.km === 10 && tx.min === 12 && SUR.every(s => !tx[s.k]);

    const drawForm = () => {
      const seg = (name, key, opts) => `
        <div class="tx-field">
          <span class="tx-label" id="tx-l-${key}">${name}</span>
          <div class="seg" role="group" aria-labelledby="tx-l-${key}">${opts.map(o =>
            `<button type="button" data-seg="${key}" data-v="${o.v}" aria-pressed="false">${o.t}${o.s ? `<small>${o.s}</small>` : ''}</button>`).join('')}</div>
        </div>`;
      const range = (name, key, min, max, step) => `
        <div class="tx-field tx-range">
          <label class="tx-label" for="tx-${key}">${name}</label><output id="tx-${key}-o" for="tx-${key}"></output>
          <input type="range" id="tx-${key}" data-range="${key}" min="${min}" max="${max}" step="${step}">
        </div>`;
      $('#tx-form').innerHTML = `
        ${seg(say('Vogn', 'Car'), 'car', [
          { v: 'normal', t: say('Almindelig vogn', 'Regular car'), s: say('1-4 personer', '1–4 people') },
          { v: 'large', t: say('Stor vogn', 'Large car'), s: say('5-8 personer', '5–8 people') }
        ])}
        ${range(say('Afstand', 'Distance'), 'km', 1, 60, 0.5)}
        ${range(say('Køretid', 'Driving time'), 'min', 1, 90, 1)}
        ${seg(say('Dag', 'Day'), 'day', [
          { v: 'weekday', t: say('Hverdag', 'Weekday') },
          { v: 'weekend', t: say('Weekend', 'Weekend') },
          { v: 'holiday', t: say('Helligdag', 'Public holiday') }
        ])}
        ${range(say('Afhentning', 'Pickup time'), 't', 0, 1425, 15)}
        <div class="tx-field">
          <span class="tx-label">${say('Tillæg', 'Surcharges')}</span>
          <div class="tx-sur">
            ${SUR.filter(s => !s.count).map(s => `
              <label class="tx-chk"><input type="checkbox" data-chk="${s.k}"><span>${isDa() ? s.da : s.en}</span><em>${kr(ore(s.per))}</em></label>`).join('')}
            ${SUR.filter(s => s.count).map(s => `
              <div class="tx-cnt">
                <span id="tx-c-${s.k}">${isDa() ? s.da : s.en}<em>${say(`${kr(ore(s.per))} pr. stk.`, `${kr(ore(s.per))} each`)}</em></span>
                <div class="st-ctl" role="group" aria-labelledby="tx-c-${s.k}">
                  <button type="button" data-cnt="${s.k}" data-d="-1" aria-label="${say('Færre', 'Fewer')}">−</button>
                  <output data-out="${s.k}"></output>
                  <button type="button" data-cnt="${s.k}" data-d="1" aria-label="${say('Flere', 'More')}">+</button>
                </div>
              </div>`).join('')}
          </div>
        </div>
        <div class="tx-presets">
          <button type="button" data-preset="day">${say('Standardtur om dagen', 'Standard trip by day')}</button>
          <button type="button" data-preset="eve">${say('Standardtur om aftenen', 'Standard trip in the evening')}</button>
        </div>`;
      syncForm();
    };

    /* the form is drawn once per language; after that only its values follow the state */
    const syncForm = () => {
      $$('#tx-form [data-seg]').forEach(b => b.setAttribute('aria-pressed', String(tx[b.dataset.seg] === b.dataset.v)));
      $$('#tx-form [data-range]').forEach(inp => { inp.value = tx[inp.dataset.range]; });
      $('#tx-km-o').textContent = `${tx.km.toLocaleString(loc(), { maximumFractionDigits: 1 })} km`;
      $('#tx-min-o').textContent = `${tx.min} min`;
      $('#tx-t-o').textContent = say('kl. ', '') + hm(Math.floor(tx.t / 60), tx.t % 60);
      $$('#tx-form [data-chk]').forEach(c => { c.checked = !!tx[c.dataset.chk]; });
      $$('#tx-form [data-out]').forEach(o => { o.textContent = tx[o.dataset.out]; });
      $$('#tx-form [data-cnt]').forEach(b => {
        const v = tx[b.dataset.cnt];
        b.disabled = b.dataset.d === '-1' ? v <= 0 : v >= 6;
      });
    };

    const drawOut = () => {
      const { per, lines, total } = calculate();
      let check = '';
      if (isStandard()) {
        const hit = total === CONTROL[per.p];
        check = hit
          ? `<p class="tx-check ok"><b aria-hidden="true">✓</b> ${per.p === 'day'
              ? say('Den officielle kontrolpris for en standardtur om dagen. En test i projektet får buildet til at fejle, hvis tallet ændrer sig.', 'The official control price for a standard trip by day. A test in the project fails the build if this number ever changes.')
              : say('Den officielle kontrolpris for en standardtur om aftenen. En test i projektet får buildet til at fejle, hvis tallet ændrer sig.', 'The official control price for a standard trip in the evening. A test in the project fails the build if this number ever changes.')}</p>`
          : '';
      }
      const mini = $('#tx-mini');
      if (mini) mini.innerHTML = `<span>${per.p === 'day' ? say('Dagtakst', 'Day rate') : say('Aftentakst', 'Evening rate')}</span><b>${kr(ore(total))}</b>`;
      $('#tx-out').innerHTML = `
        <div class="tx-card">
          <div class="tx-head">
            <span class="tx-period ${per.p}">${per.p === 'day' ? say('Dagtakst', 'Day rate') : say('Aften- og weekendtakst', 'Evening and weekend rate')}</span>
            <span class="tx-why">${per.why}</span>
          </div>
          <ul class="tx-lines">${lines.map(l => `<li class="${l.sur ? 'sur' : ''}"><span>${l.name}</span><b>${kr(ore(l.amt))}</b></li>`).join('')}</ul>
          <div class="tx-total"><span>${say('Total', 'Total')}</span><b>${kr(ore(total))}</b></div>
          ${check}
        </div>`;
    };

    const form = $('#tx-form');
    form.addEventListener('input', e => {
      const k = e.target.dataset.range;
      if (!k) return;
      ping('taxapris');
      tx[k] = k === 'km' ? parseFloat(e.target.value) : parseInt(e.target.value, 10);
      syncForm();
      drawOut();
    });
    form.addEventListener('change', e => {
      const k = e.target.dataset.chk;
      if (!k) return;
      ping('taxapris');
      tx[k] = e.target.checked;
      drawOut();
    });
    form.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      ping('taxapris');
      if (b.dataset.seg) tx[b.dataset.seg] = b.dataset.v;
      else if (b.dataset.cnt) tx[b.dataset.cnt] = Math.min(6, Math.max(0, tx[b.dataset.cnt] + +b.dataset.d));
      else if (b.dataset.preset) Object.assign(tx, START_STATE, { t: b.dataset.preset === 'day' ? 12 * 60 : 20 * 60 });
      else return;
      syncForm();
      drawOut();
      if (b.disabled) { const other = b.parentElement.querySelector('button:not([disabled])'); if (other) other.focus(); }
    });
    drawForm();
    drawOut();
    reRender.push(() => { drawForm(); drawOut(); });
  }

  /* ================================================================
     Weft: a small planner. What is fixed stays, the rest finds the next free time
     ================================================================ */
  if ($('#plan')) {
    const START = 8, END = 22, GAP = 0.5;
    const planState = { shift: false, cancel: false };
    const SCEN = [
      { k: 'shift', da: 'Vagten rykkes til kl. 12', en: 'The shift moves to 12:00' },
      { k: 'cancel', da: 'Forelæsningen bliver aflyst', en: 'The lecture is cancelled' }
    ];
    const ITEMS = {
      lecture: { kind: 'study', da: 'Forelæsning', en: 'Lecture' },
      study: { kind: 'study', da: 'Selvstudie', en: 'Self study' },
      train: { kind: 'train', da: 'Træning', en: 'Training' },
      shift: { kind: 'work', da: 'Vagt', en: 'Shift' }
    };
    const schedule = st => {
      const placed = [];
      if (!st.cancel) placed.push({ id: 'lecture', from: 9, to: 11 });
      placed.push(st.shift ? { id: 'shift', from: 12, to: 17 } : { id: 'shift', from: 16, to: 21 });
      const free = (from, len) => placed.every(p => from + len + GAP <= p.from || from >= p.to + GAP);
      [{ id: 'study', len: 2, from: 9 }, { id: 'train', len: 1, from: 14.5 }].forEach(f => {
        let t = f.from;
        while (t + f.len <= END && !free(t, f.len)) t += GAP;
        placed.push({ id: f.id, from: t, to: t + f.len });
      });
      return placed;
    };
    const hhmm = v => hm(Math.floor(v), v % 1 ? 30 : 0);
    let lastPlan = schedule(planState);
    const day = $('#plan-day');
    const drawHours = () => {
      let h = '';
      for (let t = START; t <= END; t += 2) h += `<span class="hr" style="top:${((t - START) / (END - START)) * 100}%">${hhmm(t)}</span>`;
      $$('.hr', day).forEach(n => n.remove());
      day.insertAdjacentHTML('afterbegin', h);
    };
    Object.keys(ITEMS).forEach(id => {
      const el = document.createElement('div');
      el.className = `blk ${ITEMS[id].kind}`;
      el.dataset.id = id;
      day.appendChild(el);
    });
    const drawPlan = moved => {
      drawHours();
      const now = schedule(planState);
      $$('.blk', day).forEach(el => {
        const it = now.find(p => p.id === el.dataset.id);
        el.classList.toggle('gone', !it);
        const base = ITEMS[el.dataset.id];
        if (it) {
          el.style.top = ((it.from - START) / (END - START)) * 100 + '%';
          el.style.height = `calc(${((it.to - it.from) / (END - START)) * 100}% - 3px)`;
          el.innerHTML = `<b>${isDa() ? base.da : base.en}</b><span>${hhmm(it.from)}–${hhmm(it.to)}</span>`;
          el.classList.toggle('moved', !!moved && moved.includes(el.dataset.id));
        }
      });
      $('#plan-btns').innerHTML = SCEN.map(s => `<button type="button" data-k="${s.k}" aria-pressed="${planState[s.k]}">${isDa() ? s.da : s.en}</button>`).join('');
    };
    const planMessage = moved => {
      const names = moved.map(id => (isDa() ? ITEMS[id].da : ITEMS[id].en));
      const list = names.length > 1 ? names.slice(0, -1).join(', ') + say(' og ', ' and ') + names[names.length - 1] : names[0];
      const many = names.length > 1;
      $('#plan-msg').textContent = names.length
        ? say(`${list} fandt selv ${many ? 'nye pladser' : 'en ny plads'}.`, `${list} found ${many ? 'new places by themselves' : 'a new place by itself'}.`)
        : say('Her skulle resten ikke flyttes.', 'Nothing else had to move this time.');
    };
    $('#plan-btns').addEventListener('click', e => {
      const b = e.target.closest('button[data-k]');
      if (!b) return;
      ping('weft');
      const k = b.dataset.k;
      planState[k] = !planState[k];
      const next = schedule(planState);
      const moved = ['study', 'train'].filter(id => {
        const a = lastPlan.find(p => p.id === id), c = next.find(p => p.id === id);
        return a && c && a.from !== c.from;
      });
      lastPlan = next;
      drawPlan(moved);
      planMessage(moved);
      $(`#plan-btns button[data-k="${k}"]`).focus();
    });
    drawPlan();
    $('#plan-msg').textContent = '';
    reRender.push(() => { drawPlan(); $('#plan-msg').textContent = ''; });
  }

  /* ================================================================
     Contact: copy the e-mail address
     ================================================================ */
  const copyBtn = $('#copy-mail');
  if (copyBtn) {
    let copied = false;
    const drawCopy = () => { copyBtn.textContent = copied ? say('Kopieret', 'Copied') : say('Kopiér', 'Copy'); };
    copyBtn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(copyBtn.dataset.mail); } catch (e) { return; }
      copied = true;
      drawCopy();
      ping('copy-email');
      setTimeout(() => { copied = false; drawCopy(); }, 2200);
    });
    drawCopy();
    reRender.push(drawCopy);
  }
})();
