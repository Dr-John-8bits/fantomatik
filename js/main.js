/* ============================================================================
   fantomatik. javascript vanilla, sans dépendance.
   identite risographie / rave. modules : reveal au scroll, compte a rebours,
   easter egg (secousse de mauvais reperage sur le wordmark).
   regle de redaction : aucun tiret cadratin, ici non plus.
   ============================================================================ */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==========================================================================
     1. reveal au scroll
     ========================================================================== */
  (function reveal() {
    var cibles = document.querySelectorAll('.reveal');
    if (!cibles.length) return;

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
     2. compte a rebours du concert
     decompte vers la date data-cible de la figure (date iso, heure editable).
     decoratif (aria-hidden) : la date lisible « 05 · XII · 2026 » reste la
     source accessible. sans js, le bloc reste vide, sans rien casser.
     ========================================================================== */
  (function compteARebours() {
    var el = document.querySelector('.count[data-cible]');
    if (!el) return;
    var cible = new Date(el.getAttribute('data-cible')).getTime();
    if (isNaN(cible)) return;

    var unites = ['j', 'h', 'm', 's'];
    var nums = {};
    unites.forEach(function (u, i) {
      if (i > 0) {
        var sep = document.createElement('span');
        sep.className = 'count-sep';
        sep.textContent = ':';
        el.appendChild(sep);
      }
      var grp = document.createElement('span');
      grp.className = 'count-grp';
      var n = document.createElement('span');
      n.className = 'count-num';
      n.textContent = '00';
      var lab = document.createElement('span');
      lab.className = 'count-unite';
      lab.textContent = u;
      grp.appendChild(n);
      grp.appendChild(lab);
      el.appendChild(grp);
      nums[u] = n;
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
        el.classList.add('count--live');
        return;
      }
      nums.j.textContent = pad(Math.floor(diff / 86400000), 2);
      nums.h.textContent = pad(Math.floor((diff % 86400000) / 3600000), 2);
      nums.m.textContent = pad(Math.floor((diff % 3600000) / 60000), 2);
      nums.s.textContent = pad(Math.floor((diff % 60000) / 1000), 2);
    }

    tick();
    timer = window.setInterval(tick, 1000);
  })();

  /* ==========================================================================
     3. easter egg : le wordmark se decale quand on le touche
     clic ou tap sur « fantomatik » : breve secousse de mauvais reperage.
     pur bonus, coupe sous reduced-motion.
     ========================================================================== */
  (function easterEgg() {
    if (reduceMotion) return;
    var wm = document.getElementById('word');
    if (!wm) return;
    wm.addEventListener('click', function () {
      wm.classList.remove('shudder');
      // force le redemarrage de l'animation.
      void wm.offsetWidth;
      wm.classList.add('shudder');
    });
    wm.addEventListener('animationend', function () {
      wm.classList.remove('shudder');
    });
  })();

})();
