/* Test digital · Networker con IA — lógica de slides y puntuación */
(function () {
  "use strict";

  var CFG = window.__BRAND__ || {};
  var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function safe(fn, name) {
    try { fn(); } catch (e) { if (window.console) console.warn("[init " + name + "]", e); }
  }

  var state = { current: 0, answers: {}, busy: false };
  var slides, steps;

  /* ---------- Navegación entre slides ---------- */
  function go(index, dir) {
    if (index === state.current || !slides[index]) return;
    var from = slides[state.current];
    var to = slides[index];
    var back = dir === "back" || index < state.current;

    from.classList.remove("is-active");
    from.classList.add(back ? "is-leaving-back" : "is-leaving");
    to.classList.remove("is-leaving", "is-leaving-back");
    if (back) to.classList.add("enter-from-left");
    // forzar reflow para que la transición arranque desde el lado correcto
    void to.offsetWidth;
    to.classList.remove("enter-from-left");
    to.classList.add("is-active");

    setTimeout(function () { from.classList.remove("is-leaving", "is-leaving-back"); }, 420);

    state.current = index;
    updateSteps();
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Foco accesible en el título de la nueva slide
    var focusEl = to.querySelector("h1, h2");
    if (focusEl) { focusEl.setAttribute("tabindex", "-1"); setTimeout(function () { focusEl.focus({ preventScroll: true }); }, 380); }

    if (index === 4) runCalc();
    if (index === 0) reset();
  }

  function updateSteps() {
    var cur = state.current === 4 ? 5 : state.current;
    steps.forEach(function (li) {
      var s = parseInt(li.getAttribute("data-step"), 10);
      li.classList.toggle("is-current", s === cur);
      li.classList.toggle("is-done", s < cur);
    });
  }

  function reset() {
    state.answers = {};
    document.querySelectorAll(".opt").forEach(function (o) { o.setAttribute("aria-checked", "false"); });
    document.querySelectorAll(".options").forEach(function (g) { g.classList.remove("is-locked"); });
  }

  function initNav() {
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-next], [data-prev], [data-go]");
      if (!t) return;
      if (t.hasAttribute("data-go")) { e.preventDefault(); go(parseInt(t.getAttribute("data-go"), 10), "back"); return; }
      if (t.hasAttribute("data-next")) go(state.current + 1, "fwd");
      if (t.hasAttribute("data-prev")) go(state.current - 1, "back");
    });
  }

  /* ---------- Respuestas ---------- */
  function initOptions() {
    document.querySelectorAll(".options").forEach(function (group) {
      var q = group.getAttribute("data-q");
      var opts = Array.prototype.slice.call(group.querySelectorAll(".opt"));

      opts.forEach(function (opt, i) {
        opt.addEventListener("click", function () {
          if (group.classList.contains("is-locked")) return;
          opts.forEach(function (o) { o.setAttribute("aria-checked", "false"); });
          opt.setAttribute("aria-checked", "true");
          state.answers[q] = parseInt(opt.getAttribute("data-points"), 10) || 0;
          group.classList.add("is-locked");
          setTimeout(function () {
            group.classList.remove("is-locked");
            go(state.current + 1, "fwd");
          }, 480);
        });
        // Flechas para moverse dentro del grupo
        opt.addEventListener("keydown", function (e) {
          if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); opts[(i + 1) % opts.length].focus(); }
          if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); opts[(i - 1 + opts.length) % opts.length].focus(); }
        });
      });
    });

    // Atajos de teclado: A/B/C o 1/2/3 en las preguntas
    document.addEventListener("keydown", function (e) {
      var slide = slides[state.current];
      if (!slide || !slide.classList.contains("slide--q")) return;
      var map = { a: 0, b: 1, c: 2, "1": 0, "2": 1, "3": 2 };
      var k = (e.key || "").toLowerCase();
      if (k in map) {
        var opt = slide.querySelectorAll(".opt")[map[k]];
        if (opt) opt.click();
      }
    });
  }

  /* ---------- Cálculo y resultado ---------- */
  function score() {
    return (state.answers["1"] || 0) + (state.answers["2"] || 0) + (state.answers["3"] || 0);
  }

  function pickResult(total) {
    var list = CFG.results || [{ id: "r1", min: 3, max: 5 }, { id: "r2", min: 6, max: 7 }, { id: "r3", min: 8, max: 9 }];
    for (var i = 0; i < list.length; i++) {
      if (total >= list[i].min && total <= list[i].max) return list[i].id;
    }
    return total < 3 ? "r1" : "r3";
  }

  function runCalc() {
    var msgs = CFG.calcMessages || [];
    var el = document.querySelector("[data-calc-msg]");
    var dur = CFG.calcDurationMs || 2000;
    var step = dur / Math.max(msgs.length, 1);
    msgs.forEach(function (m, i) { setTimeout(function () { if (state.current === 4 && el) el.textContent = m; }, i * step); });

    var total = score();
    var id = pickResult(total);
    document.querySelectorAll("[data-result]").forEach(function (r) { r.hidden = r.getAttribute("data-result") !== id; });

    sendOptional(total, id);

    setTimeout(function () {
      if (state.current !== 4) return;
      go(5, "fwd");
      animateScore(total);
    }, dur);
  }

  function animateScore(total) {
    var num = document.querySelector("[data-score]");
    var fill = document.querySelector(".gauge-fill");
    if (fill) {
      fill.style.transition = "none";
      fill.style.strokeDashoffset = "100";
      void fill.getBoundingClientRect();
      fill.style.transition = "";
      setTimeout(function () { fill.style.strokeDashoffset = String(100 - (total / 9) * 100); }, 60);
    }
    if (!num) return;
    var start = null, d = 1000;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / d, 1);
      num.textContent = Math.round(total * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // Envío opcional (anónimo) a un webhook si está configurado
  function sendOptional(total, id) {
    if (!CFG.endpoint || !window.fetch) return;
    try {
      fetch(CFG.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puntaje: total, resultado: id, respuestas: state.answers, fecha: new Date().toISOString() })
      }).catch(function () {});
    } catch (e) {}
  }

  function initWhatsApp() {
    var link = document.querySelector("[data-wa]");
    if (link && CFG.whatsappCommunity) link.setAttribute("href", CFG.whatsappCommunity);
  }

  /* ---------- Fondo: brillo que sigue el mouse ---------- */
  function initGlow() {
    if (matchMedia("(hover: none)").matches) return;
    var root = document.documentElement, raf = 0, x = 50, y = 30;
    window.addEventListener("pointermove", function (e) {
      x = (e.clientX / window.innerWidth) * 100;
      y = (e.clientY / window.innerHeight) * 100;
      if (!raf) raf = requestAnimationFrame(function () {
        root.style.setProperty("--mx", x + "%");
        root.style.setProperty("--my", y + "%");
        raf = 0;
      });
    }, { passive: true });
  }

  /* ---------- Fondo: red de conexiones (nodos) ---------- */
  function initNet() {
    var c = document.querySelector(".net");
    if (!c || !c.getContext) return;
    var ctx = c.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W, H, nodes = [], mouse = { x: -999, y: -999 };
    var colors = ["8,123,255", "8,123,255", "8,123,255", "121,251,37", "255,182,41"];

    function size() {
      W = c.clientWidth; H = c.clientHeight;
      c.width = W * dpr; c.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(70, (W * H) / 22000));
      nodes = [];
      for (var i = 0; i < n; i++) {
        nodes.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25,
          r: Math.random() * 1.6 + .8, c: colors[i % colors.length]
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var max = 140;
      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < max) {
            ctx.strokeStyle = "rgba(8,123,255," + (0.28 * (1 - d / max)) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        var md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (md < 180) {
          ctx.strokeStyle = "rgba(121,251,37," + (0.35 * (1 - md / 180)) + ")";
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
        ctx.fillStyle = "rgba(" + a.c + ",.9)";
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      }
    }

    function step() {
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      }
      draw();
      if (!document.hidden) requestAnimationFrame(step); else setTimeout(function () { requestAnimationFrame(step); }, 500);
    }

    size();
    window.addEventListener("resize", function () { size(); if (reduced) draw(); });
    window.addEventListener("pointermove", function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    if (reduced) draw(); else requestAnimationFrame(step);
  }

  function boot() {
    slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
    steps = Array.prototype.slice.call(document.querySelectorAll(".steps li"));
    safe(initNav, "nav");
    safe(initOptions, "options");
    safe(initWhatsApp, "whatsapp");
    safe(updateSteps, "steps");
    safe(initGlow, "glow");
    safe(initNet, "net");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
