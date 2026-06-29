/* ============================================================================
   fantomatik. javascript vanilla, sans dépendance.
   modules indépendants : ghost-waveform, boot, flicker, reveal.
   règle de rédaction : aucun tiret cadratin, ici non plus.

   tous les réglages éditables sont regroupés dans l'objet REGLAGES ci-dessous.
   ============================================================================ */

(function () {
  'use strict';

  /* réglages éditables ------------------------------------------------------ */
  var REGLAGES = {
    waveform: {
      opacite: 0.62,        // intensité globale de la ligne (le css gère aussi .opacity)
      amplitude: 0.15,      // hauteur de l'onde, en fraction de la hauteur du hero
      cyclesEcran: 2.2,     // nombre d'ondulations visibles d'un bord à l'autre
      vitesse: 0.28,        // hz approximatif du défilement de phase (lent)
      pasPixels: 2,         // échantillonnage horizontal (plus grand = plus léger)
      dprMax: 2,            // plafond de densité de pixels (perf mobile)
      resonance: {
        intervalleMin: 7000, // ms, délai minimal entre deux résonances
        intervalleMax: 15000,// ms, délai maximal
        montee: 0.8,         // s, temps de montée de la résonance
        chute: 2.4           // s, temps de retombée (le balayage de la 303)
      },
      pointeur: {            // réactivité au pointeur (souris ou doigt)
        force: 0.9,          // amplitude de la bosse sous le pointeur
        largeur: 0.06,       // largeur de la bosse (fraction de la largeur)
        lissage: 0.14,       // suivi de la position du pointeur (plus grand = plus vif)
        reponse: 0.08        // vitesse de montée puis de retombée de la bosse
      }
    },
    boot: {
      lignes: [
        '> initialisation du signal...',
        '> verrouillage de la fréquence...',
        '> fantomatik'
      ],
      vitesseFrappe: 14,   // ms par caractère
      pauseLigne: 90,      // ms entre deux lignes
      pauseFin: 260        // ms après la dernière ligne avant le fondu
    },
    flicker: {
      intervalleMin: 4000, // ms
      intervalleMax: 6000  // ms
    }
  };

  /* préférence de mouvement, partagée par tous les modules. */
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduceMotion = mqReduce.matches;

  /* petit pont entre modules : le wordmark peut réveiller la waveform. */
  var api = {};

  /* ==========================================================================
     1. ghost-waveform
     ========================================================================== */
  (function waveform() {
    var canvas = document.getElementById('waveform');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var cfg = REGLAGES.waveform;
    var w = 0, h = 0, dpr = 1;
    var rafId = null;
    var running = false;

    // état de résonance (le balayage façon 303).
    var resNiveau = 0;            // 0..1, enveloppe courante
    var resProchaine = 0;        // timestamp ms du prochain déclenchement
    var resDebut = -1;           // timestamp ms du début de l'événement en cours

    // réactivité au pointeur (la bosse sous la souris ou le doigt).
    var ptr = cfg.pointeur;
    var pxCible = 0.5, pxLisse = 0.5;     // position normalisée 0..1
    var pointeCible = 0, pointeCur = 0;   // amplitude 0..1 de la bosse

    function tailleCanvas() {
      var rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, cfg.dprMax);
      w = Math.max(1, Math.floor(rect.width * dpr));
      h = Math.max(1, Math.floor(rect.height * dpr));
      canvas.width = w;
      canvas.height = h;
    }

    // valeur de l'onde à la position x (0..1) et au temps t (s).
    function echantillon(xNorm, t, res) {
      var phase = t * cfg.vitesse * Math.PI * 2;
      // onde de base : sinusoïde lente, plus une légère harmonie pour la vie.
      var y = Math.sin(xNorm * cfg.cyclesEcran * Math.PI * 2 + phase);
      y += 0.12 * Math.sin(xNorm * cfg.cyclesEcran * 2.7 * Math.PI * 2 + phase * 1.6);

      // résonance : composante plus rapide dont la fréquence balaye vers le haut
      // puis redescend, comme l'ouverture du filtre d'une 303.
      if (res > 0.001) {
        var balayage = Math.sin(res * Math.PI); // 0 -> 1 -> 0 sur la durée de l'event
        var freqRes = 6 + balayage * 16;
        y += res * 0.55 * Math.sin(xNorm * freqRes * Math.PI * 2 + phase * 3);
      }

      // bosse locale sous le pointeur : le doigt sur l'oscilloscope.
      if (pointeCur > 0.001) {
        var dp = (xNorm - pxLisse) / ptr.largeur;
        y += pointeCur * ptr.force * Math.exp(-0.5 * dp * dp);
      }
      return y;
    }

    function tracer(t) {
      ctx.clearRect(0, 0, w, h);

      var centre = h / 2;
      var amp = h * cfg.amplitude * (1 + resNiveau * 0.6);
      var pas = Math.max(1, cfg.pasPixels * dpr);

      // construit le tracé une seule fois, réutilisé pour le halo et la ligne fine.
      ctx.beginPath();
      for (var x = 0; x <= w; x += pas) {
        var y = centre + amp * echantillon(x / w, t, resNiveau);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // passe 1 : halo large et peu opaque (afterglow, sans shadowBlur).
      ctx.strokeStyle = 'rgba(77, 255, 176, 0.10)';
      ctx.lineWidth = 6 * dpr;
      ctx.stroke();

      // passe 2 : ligne fine et vive.
      ctx.strokeStyle = 'rgba(77, 255, 176, ' + cfg.opacite + ')';
      ctx.lineWidth = 1.5 * dpr;
      ctx.stroke();
    }

    function majResonance(now) {
      var r = cfg.resonance;
      if (resDebut < 0) {
        if (now >= resProchaine) {
          resDebut = now;
        } else {
          resNiveau = 0;
          return;
        }
      }
      var ecoule = (now - resDebut) / 1000;
      var montee = r.montee;
      var chute = r.chute;
      if (ecoule < montee) {
        resNiveau = ecoule / montee;
      } else if (ecoule < montee + chute) {
        resNiveau = 1 - (ecoule - montee) / chute;
      } else {
        // fin de l'événement, planifie le suivant.
        resNiveau = 0;
        resDebut = -1;
        resProchaine = now + r.intervalleMin +
          Math.random() * (r.intervalleMax - r.intervalleMin);
      }
    }

    function boucle(nowMs) {
      majResonance(nowMs);
      // lissage du suivi de pointeur et de l'amplitude de la bosse.
      pxLisse += (pxCible - pxLisse) * ptr.lissage;
      pointeCur += (pointeCible - pointeCur) * ptr.reponse;
      tracer(nowMs / 1000);
      rafId = window.requestAnimationFrame(boucle);
    }

    function demarrer() {
      if (running) return;
      running = true;
      rafId = window.requestAnimationFrame(boucle);
    }

    function arreter() {
      running = false;
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = null;
    }

    // frame figée et agréable pour le mode réduit (légère résonance gelée).
    function frameStatique() {
      resNiveau = 0.45;
      tracer(2.2);
    }

    // déclenche une résonance immédiate (utilisé par l'easter egg du wordmark).
    function forceResonance() {
      resDebut = (window.performance && performance.now ? performance.now() : 0);
    }

    // branche la réactivité au pointeur : survol à la souris, glissé au doigt.
    function brancherPointeur() {
      var hero = canvas.parentElement || document.querySelector('.hero');
      if (!hero) return;
      function suivre(e) {
        var rect = canvas.getBoundingClientRect();
        if (!rect.width) return;
        pxCible = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        pointeCible = 1;
      }
      function relacher() { pointeCible = 0; }
      // pointer events : souris, tactile et stylet dans le même code. on ne bloque
      // jamais le scroll (passive), le doigt qui glisse défile la page normalement.
      hero.addEventListener('pointermove', suivre, { passive: true });
      hero.addEventListener('pointerdown', suivre, { passive: true });
      hero.addEventListener('pointerleave', relacher);
      hero.addEventListener('pointerup', relacher);
      hero.addEventListener('pointercancel', relacher);
    }

    function init() {
      tailleCanvas();
      if (reduceMotion) {
        frameStatique();
        return;
      }
      resProchaine = (window.performance && performance.now ? performance.now() : 0) +
        cfg.resonance.intervalleMin;
      demarrer();
      brancherPointeur();
    }

    api.resonance = forceResonance;

    // redimensionnement, débounce léger.
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        tailleCanvas();
        if (reduceMotion) frameStatique();
      }, 150);
    });

    // économie de batterie : pause quand l'onglet est masqué.
    document.addEventListener('visibilitychange', function () {
      if (reduceMotion) return;
      if (document.hidden) arreter();
      else demarrer();
    });

    init();
  })();

  /* ==========================================================================
     2. écran de boot
     ========================================================================== */
  (function boot() {
    var root = document.documentElement;
    var overlay = document.getElementById('boot');
    var log = document.getElementById('boot-log');

    // si le mode réduit est actif, la classe « boot-pending » n'a pas été posée :
    // rien à faire, le hero est déjà visible.
    if (!overlay || !log || reduceMotion || !root.classList.contains('boot-pending')) {
      return;
    }

    var cfg = REGLAGES.boot;
    var timers = [];
    var fini = false;

    function planifier(fn, delai) {
      var id = window.setTimeout(fn, delai);
      timers.push(id);
      return id;
    }

    function nettoyerTimers() {
      timers.forEach(window.clearTimeout);
      timers = [];
    }

    function quitter() {
      if (fini) return;
      fini = true;
      nettoyerTimers();
      retirerEcoute();
      overlay.classList.add('is-leaving');
      var done = function () {
        root.classList.remove('boot-pending');
        overlay.style.display = 'none';
      };
      overlay.addEventListener('transitionend', done, { once: true });
      // filet de sécurité si transitionend ne se déclenche pas.
      planifier(done, 800);
    }

    // tape le texte ligne par ligne.
    function taper(indexLigne, indexChar, texteCourant) {
      if (fini) return;
      if (indexLigne >= cfg.lignes.length) {
        planifier(quitter, cfg.pauseFin);
        return;
      }
      var ligne = cfg.lignes[indexLigne];
      if (indexChar <= ligne.length) {
        log.textContent = texteCourant + ligne.slice(0, indexChar);
        planifier(function () {
          taper(indexLigne, indexChar + 1, texteCourant);
        }, cfg.vitesseFrappe);
      } else {
        var suite = texteCourant + ligne + '\n';
        planifier(function () {
          taper(indexLigne + 1, 0, suite);
        }, cfg.pauseLigne);
      }
    }

    // passable : clic, scroll, ou touche.
    function surInteraction() { quitter(); }
    function retirerEcoute() {
      window.removeEventListener('pointerdown', surInteraction);
      window.removeEventListener('keydown', surInteraction);
      window.removeEventListener('wheel', surInteraction);
      window.removeEventListener('touchmove', surInteraction);
    }
    window.addEventListener('pointerdown', surInteraction);
    window.addEventListener('keydown', surInteraction);
    window.addEventListener('wheel', surInteraction, { passive: true });
    window.addEventListener('touchmove', surInteraction, { passive: true });

    taper(0, 0, '');
  })();

  /* ==========================================================================
     3. flicker du wordmark
     ========================================================================== */
  (function flicker() {
    if (reduceMotion) return;
    var wordmark = document.getElementById('wordmark');
    if (!wordmark) return;

    var cfg = REGLAGES.flicker;

    function unCreux(callback) {
      wordmark.classList.add('is-flickering');
      window.setTimeout(function () {
        wordmark.classList.remove('is-flickering');
        // de temps en temps, un second clignotement très bref (tube fatigué).
        if (Math.random() < 0.5) {
          window.setTimeout(function () {
            wordmark.classList.add('is-flickering');
            window.setTimeout(function () {
              wordmark.classList.remove('is-flickering');
              callback();
            }, 40);
          }, 55);
        } else {
          callback();
        }
      }, 60);
    }

    function planifier() {
      var delai = cfg.intervalleMin +
        Math.random() * (cfg.intervalleMax - cfg.intervalleMin);
      window.setTimeout(function () {
        unCreux(planifier);
      }, delai);
    }

    planifier();
  })();

  /* ==========================================================================
     4. reveal au scroll
     ========================================================================== */
  (function reveal() {
    var cibles = document.querySelectorAll('.reveal');
    if (!cibles.length) return;

    // mode réduit ou absence d'intersectionobserver : on révèle tout de suite.
    if (reduceMotion || !('IntersectionObserver' in window)) {
      cibles.forEach(function (el) { el.classList.add('revealed'); });
      return;
    }

    var obs = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (entree) {
        if (entree.isIntersecting) {
          entree.target.classList.add('revealed');
          obs.unobserve(entree.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    cibles.forEach(function (el) { obs.observe(el); });
  })();

  /* ==========================================================================
     5. sequenceurs 16 pas (separateurs de sections)
     construit les 16 pas a partir de l'attribut data-seq (16 caracteres 0/1)
     plus une tete de lecture. l'animation et la cadence (120 bpm) sont gerees
     en css. sans js, le bloc .seq garde sa fine ligne de repli.
     ========================================================================== */
  (function sequenceurs() {
    var seqs = document.querySelectorAll('.seq[data-seq]');
    if (!seqs.length) return;

    seqs.forEach(function (seq) {
      // on ne garde que les 0 et 1, puis on cale sur 16 pas.
      var motif = (seq.getAttribute('data-seq') || '').replace(/[^01]/g, '');
      motif = (motif + '0000000000000000').slice(0, 16);

      var frag = document.createDocumentFragment();
      for (var i = 0; i < 16; i++) {
        var pas = document.createElement('span');
        pas.className = motif.charAt(i) === '1' ? 'seq-step on' : 'seq-step';
        frag.appendChild(pas);
      }
      var tete = document.createElement('span');
      tete.className = 'seq-head';
      frag.appendChild(tete);

      seq.appendChild(frag);
      seq.classList.add('seq--ready');
    });
  })();

  /* ==========================================================================
     6. compte a rebours du concert
     decompte sobre, registre machine, vers la date data-cible de la figure.
     decoratif (aria-hidden) : la date lisible « 5 XII 2026 · lille » reste la
     source accessible. sans js, le bloc reste vide, sans rien casser.
     ========================================================================== */
  (function compteARebours() {
    var el = document.querySelector('.compte[data-cible]');
    if (!el) return;
    var cible = new Date(el.getAttribute('data-cible')).getTime();
    if (isNaN(cible)) return;

    // construit la structure une fois : 4 groupes nombre + unite, separes par « : ».
    var unites = [['j'], ['h'], ['m'], ['s']];
    var nums = {};
    unites.forEach(function (u, i) {
      if (i > 0) {
        var sep = document.createElement('span');
        sep.className = 'compte-sep';
        sep.textContent = ':';
        el.appendChild(sep);
      }
      var grp = document.createElement('span');
      grp.className = 'compte-grp';
      var n = document.createElement('span');
      n.className = 'compte-num';
      n.textContent = '00';
      var lab = document.createElement('span');
      lab.className = 'compte-unite';
      lab.textContent = u[0];
      grp.appendChild(n);
      grp.appendChild(lab);
      el.appendChild(grp);
      nums[u[0]] = n;
    });

    function pad(v, n) {
      v = String(v);
      while (v.length < n) v = '0' + v;
      return v;
    }

    var timer = null;
    function tick() {
      var diff = cible - Date.now();
      if (diff <= 0) {
        if (timer) window.clearInterval(timer);
        el.textContent = 'signal en direct';
        el.classList.add('compte--live');
        return;
      }
      var j = Math.floor(diff / 86400000);
      var h = Math.floor((diff % 86400000) / 3600000);
      var m = Math.floor((diff % 3600000) / 60000);
      var s = Math.floor((diff % 60000) / 1000);
      nums.j.textContent = pad(j, j > 99 ? 3 : 2);
      nums.h.textContent = pad(h, 2);
      nums.m.textContent = pad(m, 2);
      nums.s.textContent = pad(s, 2);
    }

    tick();
    timer = window.setInterval(tick, 1000);
  })();

  /* ==========================================================================
     7. easter egg : le fantome repond quand on touche le wordmark
     clic ou tap sur « fantomatik » : resonance 303 forcee + rafale de flicker.
     pur bonus, coupe sous reduced-motion, jamais requis pour comprendre la page.
     ========================================================================== */
  (function easterEgg() {
    if (reduceMotion) return;
    var wm = document.getElementById('wordmark');
    if (!wm) return;
    wm.style.cursor = 'pointer';

    var enCours = false;
    function reveil() {
      if (enCours) return;
      enCours = true;
      if (api.resonance) api.resonance();
      var n = 0;
      (function rafale() {
        wm.classList.toggle('is-flickering');
        n++;
        if (n < 8) {
          window.setTimeout(rafale, 50 + Math.random() * 45);
        } else {
          wm.classList.remove('is-flickering');
          enCours = false;
        }
      })();
    }

    wm.addEventListener('click', reveil);
  })();

})();
