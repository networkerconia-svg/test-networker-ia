/* Test · ¿Tu multinivel te impulsa o te limita? — lógica de etapas, validación y envío */
(function () {
  "use strict";

  var CFG = window.__BRAND__ || {};
  function safe(fn, name) { try { fn(); } catch (e) { if (window.console) console.warn("[init " + name + "]", e); } }

  var slides, bar;
  var state = { i: 0, answers: {}, sending: false, sentId: null };
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  /* ---------- Navegación ---------- */
  function go(index) {
    if (index < 0 || index >= slides.length || index === state.i) return;
    var from = slides[state.i], to = slides[index], back = index < state.i;
    from.classList.remove("is-active");
    from.classList.add("is-leaving");
    if (back) { to.classList.add("from-back"); void to.offsetWidth; to.classList.remove("from-back"); }
    to.classList.add("is-active");
    setTimeout(function () { from.classList.remove("is-leaving"); }, 450);
    state.i = index;
    updateBar();
    window.scrollTo({ top: 0, behavior: "smooth" });
    var h = to.querySelector("h1, h2");
    if (h) { h.setAttribute("tabindex", "-1"); setTimeout(function () { h.focus({ preventScroll: true }); }, 420); }
  }
  function indexOfStep(step) { for (var i = 0; i < slides.length; i++) if (slides[i].getAttribute("data-step") === step) return i; return -1; }
  function updateBar() {
    if (!bar) return;
    var total = slides.length - 1;
    bar.style.width = Math.round((state.i / total) * 100) + "%";
  }

  function initNav() {
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-next], [data-prev], [data-continue], [data-restart]");
      if (!t) return;
      if (t.hasAttribute("data-next")) go(state.i + 1);
      else if (t.hasAttribute("data-prev")) go(state.i - 1);
      else if (t.hasAttribute("data-continue")) { if (!t.disabled) go(state.i + 1); }
      else if (t.hasAttribute("data-restart")) restart();
    });
  }

  /* ---------- Preguntas ---------- */
  function initOptions() {
    slides.forEach(function (slide) {
      var q = slide.getAttribute("data-q");
      if (!q) return;
      var opts = Array.prototype.slice.call(slide.querySelectorAll(".opt"));
      var cont = slide.querySelector("[data-continue]");
      opts.forEach(function (opt, k) {
        opt.addEventListener("click", function () {
          opts.forEach(function (o) { o.setAttribute("aria-checked", "false"); });
          opt.setAttribute("aria-checked", "true");
          state.answers[q] = {
            letra: opt.getAttribute("data-letter"),
            texto: opt.querySelector(".opt-t").textContent.trim(),
            puntos: parseInt(opt.getAttribute("data-points"), 10) || 0
          };
          if (cont) cont.disabled = false;
        });
        opt.addEventListener("keydown", function (e) {
          if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); opts[(k + 1) % opts.length].focus(); }
          if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); opts[(k - 1 + opts.length) % opts.length].focus(); }
        });
      });
    });
  }

  function score() {
    var s = 0;
    ["1", "2", "3", "4"].forEach(function (q) { if (state.answers[q]) s += state.answers[q].puntos; });
    return s; // la pregunta 5 NO suma
  }
  function pickResult(total) {
    var list = CFG.results || [];
    for (var i = 0; i < list.length; i++) if (total >= list[i].min && total <= list[i].max) return list[i];
    return list[list.length - 1] || { id: "r4", title: "" };
  }

  /* ---------- Formulario ---------- */
  function initForm() {
    var form = document.getElementById("lead-form");
    if (!form) return;
    var phoneWrap = form.querySelector("[data-phone]");
    var phone = form.querySelector("#f-phone");

    form.querySelectorAll('input[name="wa"]').forEach(function (r) {
      r.addEventListener("change", function () {
        var yes = r.value === "si" && r.checked;
        phoneWrap.hidden = !yes;
        if (yes) { if (!phone.value) phone.value = (CFG.defaultCountryCode || "+57") + " "; setTimeout(function () { phone.focus(); }, 50); }
        setInvalid(form.querySelector("fieldset.wa"), false);
      });
    });
    form.querySelectorAll("input").forEach(function (inp) {
      inp.addEventListener("input", function () { var f = inp.closest(".field"); if (f) setInvalid(f, false); });
    });
    form.querySelector('input[name="consent"]').addEventListener("change", function () { showErr("consent", false); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (state.sending) return;               // evita envíos dobles
      var data = validate(form);
      if (!data) return;
      submit(data);
    });
  }

  function setInvalid(field, on) { if (field) field.classList.toggle("is-invalid", !!on); }
  function showErr(key, on) { var el = document.querySelector('[data-err="' + key + '"]'); if (el) el.classList.toggle("is-shown", !!on); }

  function validate(form) {
    var ok = true, first = null;
    var nombre = form.nombre.value.trim();
    var email = form.email.value.trim();
    var waSel = form.querySelector('input[name="wa"]:checked');
    var wa = waSel ? waSel.value : "";
    var tel = form.whatsapp.value.trim();
    var consent = form.consent.checked;

    function fail(el, field) { ok = false; setInvalid(field, true); if (!first) first = el; }
    if (nombre.length < 2) fail(form.nombre, form.nombre.closest(".field"));
    if (!EMAIL_RE.test(email)) fail(form.email, form.email.closest(".field"));
    if (!wa) fail(form.querySelector('input[name="wa"]'), form.querySelector("fieldset.wa"));
    var telClean = tel.replace(/[^\d+]/g, "");
    if (wa === "si" && !/^\+\d{9,15}$/.test(telClean)) fail(form.whatsapp, form.whatsapp.closest(".field"));
    if (!consent) { ok = false; showErr("consent", true); if (!first) first = form.consent; }

    if (!ok) { if (first) first.focus(); return null; }
    return { nombre: nombre, email: email, wa: wa, tel: wa === "si" ? telClean : "" };
  }

  function uid() {
    var a = new Uint8Array(8); (window.crypto || window.msCrypto).getRandomValues(a);
    return Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
  }

  function submit(d) {
    state.sending = true;
    var btn = document.querySelector("[data-submit]");
    if (btn) { btn.disabled = true; btn.textContent = "Enviando…"; }

    var total = score();
    var res = pickResult(total);
    if (!state.sentId) state.sentId = uid();  // mismo id si reintenta → el servidor puede deduplicar

    var payload = {
      id: state.sentId,
      fecha: new Date().toISOString(),
      nombre: d.nombre,
      email: d.email,
      p1: state.answers["1"], p2: state.answers["2"], p3: state.answers["3"], p4: state.answers["4"], p5: state.answers["5"],
      puntaje: total,
      resultado_id: res.id,
      resultado: res.title,
      whatsapp_autoriza: d.wa === "si",
      whatsapp: d.tel,
      origen: location.href
    };

    paintResult(d, total, res);
    go(indexOfStep("calc"));

    var minWait = new Promise(function (r) { setTimeout(r, 1800); });
    var send = sendLead(payload);
    Promise.all([minWait, send]).then(function (vals) {
      var sent = vals[1];
      var note = document.querySelector("[data-mail-note]");
      if (note) { note.hidden = !sent; var to = note.querySelector("[data-mail-to]"); if (to) to.textContent = d.email; }
      go(indexOfStep("result"));
      setTimeout(function () { movePin(total); }, 80);
      state.sending = false;
      if (btn) { btn.disabled = false; btn.textContent = "Ver mi resultado"; }
    });
  }

  function sendLead(payload) {
    if (!CFG.endpoint || !window.fetch) return Promise.resolve(false);
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 9000);
    return fetch(CFG.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) { clearTimeout(timer); return r.ok; })
      .catch(function () { clearTimeout(timer); return false; });
  }

  function paintResult(d, total, res) {
    document.querySelectorAll("[data-result]").forEach(function (r) { r.hidden = r.getAttribute("data-result") !== res.id; });
    var greet = document.querySelector("[data-greet]");
    if (greet) greet.textContent = "Tu evaluación, " + d.nombre.split(" ")[0];
    var link = document.querySelector("[data-wa]");
    if (link) {
      var msg = (CFG.whatsappMessage || "").replace("{nombre}", d.nombre).replace("{resultado}", res.title.replace(/\.$/, ""));
      var num = String(CFG.whatsappNumber || "").replace(/\D/g, "");
      link.href = "https://wa.me/" + num + "?text=" + encodeURIComponent(msg);
    }
    var pin = document.querySelector("[data-pin]");
    if (pin) pin.style.left = "0%";
  }
  function movePin(total) {
    var pin = document.querySelector("[data-pin]");
    if (!pin) return;
    var pct = Math.max(0, Math.min(1, (total - 4) / 8));
    pin.style.left = (4 + pct * 92) + "%";
  }

  function restart() {
    state.answers = {}; state.sentId = null;
    document.querySelectorAll(".opt").forEach(function (o) { o.setAttribute("aria-checked", "false"); });
    document.querySelectorAll("[data-continue]").forEach(function (b) { b.disabled = true; });
    var form = document.getElementById("lead-form");
    if (form) { form.reset(); form.querySelector("[data-phone]").hidden = true; }
    go(0);
  }

  function boot() {
    slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
    bar = document.querySelector("[data-bar]");
    safe(initNav, "nav");
    safe(initOptions, "options");
    safe(initForm, "form");
    safe(updateBar, "bar");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
