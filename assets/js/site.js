(function () {
  "use strict";
  var MB = window.MB || {};
  var T = MB.t || {};
  var B = T.build || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var fill = function (s, o) { return String(s).replace(/\{(\w+)\}/g, function (_, k) { return o[k]; }); };
  var mobile = window.matchMedia("(max-width: 960px)");
  var STORE = "minibites-mesa";

  /* Encabezado */
  var top = $("#top");
  var onScroll = function () { top.classList.toggle("is-scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var toggle = $(".nav-toggle");
  var nav = $("#nav");
  var setNav = function (open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? toggle.dataset.close : toggle.dataset.open);
  };
  toggle.addEventListener("click", function () { setNav(toggle.getAttribute("aria-expanded") !== "true"); });
  $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { setNav(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("is-open")) { setNav(false); toggle.focus(); } });

  // El cambio de idioma conserva la sección y el origen (?src=).
  $$("[data-lang-link]").forEach(function (a) {
    a.addEventListener("click", function () { a.href = a.getAttribute("href").split("#")[0] + location.search + location.hash; });
  });

  /* Estado compartido: paquete y postres elegidos */
  var state = { package: "", desserts: [], fields: {} };
  try { var saved = JSON.parse(localStorage.getItem(STORE) || "null"); if (saved && typeof saved === "object") state = Object.assign(state, saved); } catch (e) {}
  state.desserts = (state.desserts || []).filter(function (s) { return MB.desserts && MB.desserts[s]; });
  var save = function () { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {} };

  var has = function (slug) { return state.desserts.indexOf(slug) !== -1; };
  var setDessert = function (slug, on) {
    var i = state.desserts.indexOf(slug);
    if (on && i === -1) state.desserts.push(slug);
    if (!on && i !== -1) state.desserts.splice(i, 1);
    save();
    syncDesserts();
  };

  var syncDesserts = function () {
    $$("[data-add]").forEach(function (btn) {
      var on = has(btn.dataset.add);
      btn.setAttribute("aria-pressed", String(on));
      if (btn.classList.contains("add")) btn.setAttribute("aria-label", on ? btn.dataset.labelRemove : btn.dataset.labelAdd);
    });
    $$('input[name="desserts"]').forEach(function (c) { c.checked = has(c.value); });
    renderPreview();
  };

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-add]");
    if (!btn) return;
    setDessert(btn.dataset.add, !has(btn.dataset.add));
  });

  /* Menú: escenario con tres ángulos (escritorio) o acordeón (celular) */
  var stageImg = $("#stage-img");
  var stageAngles = $("#stage-angles");
  var stageName = $("#stage-name");
  var stageDesc = $("#stage-desc");
  var stageChef = $("#stage-chef");
  var stageAdd = $("#stage-add");
  var items = $$(".menu-item");
  var current = null;

  var showPhoto = function (p, nameText) {
    if (stageImg.getAttribute("src") === p.src) return;
    stageImg.classList.add("is-swapping");
    var img = new Image();
    img.onload = img.onerror = function () {
      stageImg.src = p.src;
      stageImg.width = p.w; stageImg.height = p.h;
      stageImg.alt = nameText + ", " + p.label.toLowerCase();
      stageImg.classList.remove("is-swapping");
    };
    img.src = p.src;
  };

  var selectItem = function (item) {
    if (!item) return;
    current = item;
    items.forEach(function (it) { it.classList.toggle("is-current", it === item); });
    var photos = JSON.parse(item.dataset.photos);
    var nameText = item.dataset.name;
    stageName.textContent = nameText;
    stageDesc.textContent = item.dataset.desc;
    stageChef.hidden = item.dataset.chef !== "1";
    stageAdd.dataset.add = item.dataset.slug;
    stageAngles.innerHTML = "";
    photos.forEach(function (p, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-pressed", String(i === 0));
      b.innerHTML = '<img alt="" width="' + p.w + '" height="' + p.h + '"><span></span>';
      b.querySelector("img").src = p.src;
      b.querySelector("span").textContent = p.label;
      b.addEventListener("click", function () {
        $$("button", stageAngles).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        showPhoto(p, nameText);
      });
      stageAngles.appendChild(b);
    });
    stageAngles.hidden = photos.length < 2;
    showPhoto(photos[0], nameText);
    stageAdd.setAttribute("aria-pressed", String(has(item.dataset.slug)));
  };

  var openItem = function (item, open) {
    var main = $(".item-main", item);
    var det = $(".item-detail", item);
    item.classList.toggle("is-open", open);
    main.setAttribute("aria-expanded", String(open));
    det.hidden = !open;
  };

  items.forEach(function (item) {
    $(".item-main", item).addEventListener("click", function () {
      if (mobile.matches) openItem(item, !item.classList.contains("is-open"));
      else selectItem(item);
    });
  });
  var applyMode = function () {
    items.forEach(function (it) {
      if (!mobile.matches) { $(".item-detail", it).hidden = true; $(".item-main", it).removeAttribute("aria-expanded"); it.classList.remove("is-open"); }
      else { $(".item-main", it).setAttribute("aria-expanded", String(it.classList.contains("is-open"))); }
    });
  };
  if (mobile.addEventListener) mobile.addEventListener("change", applyMode); else if (mobile.addListener) mobile.addListener(applyMode);
  applyMode();
  var chef = $('.menu-item[data-slug="profiterol"]');
  if (chef) selectItem(chef);

  // Los postres del inicio llevan a su ficha del menú.
  $$(".dessert").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var item = $("#d-" + a.dataset.slug);
      if (!item) return;
      e.preventDefault();
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (mobile.matches) {
        openItem(item, true);
        item.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      } else {
        selectItem(item);
        $("#menu").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      }
      history.replaceState(null, "", "#d-" + a.dataset.slug);
    });
  });
  if (/^#d-/.test(location.hash)) {
    var deep = $(location.hash);
    if (deep && deep.classList.contains("menu-item")) { if (mobile.matches) openItem(deep, true); else selectItem(deep); }
  }

  /* Arma tu mesa */
  var form = $("#builder");
  var pkgById = {};
  (MB.packages || []).forEach(function (p) { pkgById[p.id] = p; });
  var money = function (n) { return "$" + (Math.round(n * 100) / 100).toLocaleString(MB.locale, { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }); };

  var shelf = $("#preview-shelf");
  var renderPreview = function () {
    var pkg = pkgById[state.package];
    var n = state.desserts.length;
    var each = pkg && n ? Math.floor(pkg.count / n) : 0;
    var prev = {};
    $$("li", shelf).forEach(function (li) { prev[li.dataset.slug] = true; });
    shelf.innerHTML = "";
    state.desserts.forEach(function (slug) {
      var d = MB.desserts[slug];
      var li = document.createElement("li");
      li.dataset.slug = slug;
      li.className = d.type;
      var img = document.createElement("img");
      img.src = d.src; img.alt = d.name; img.loading = "lazy";
      if (prev[slug]) img.style.animation = "none";
      li.appendChild(img);
      if (each) { var tent = document.createElement("span"); tent.className = "tent"; tent.textContent = "≈ " + each; li.appendChild(tent); }
      shelf.appendChild(li);
    });
    $("#preview-empty").hidden = n > 0;
    $(".preview-shelf-wrap").classList.toggle("is-empty", n === 0);
    $("#preview-suggest").hidden = n > 0;
    $("#sum-pkg").textContent = pkg ? pkg.name + " · " + pkg.count : B.preview.noPkg;
    $("#sum-price").textContent = pkg ? money(pkg.price) : "–";
    $("#sum-deposit").textContent = pkg ? money(pkg.price / 2) : "–";
    $("#sum-each").textContent = pkg && n ? fill(B.preview.about, { n: each }) : (pkg ? money(pkg.price / pkg.count) : "–");
  };

  // Restaurar borrador
  var fieldNames = ["eventDate", "eventType", "guests", "city", "theme", "name", "email", "phone", "notes"];
  if (state.package) { var r = form.querySelector('input[name="package"][value="' + state.package + '"]'); if (r) r.checked = true; }
  fieldNames.forEach(function (k) { var el = form.elements[k]; if (el && state.fields && state.fields[k] != null) el.value = state.fields[k]; });

  form.addEventListener("change", function (e) {
    var t = e.target;
    if (t.name === "package") { state.package = t.value; $("#err-package").hidden = true; }
    else if (t.name === "desserts") { setDessert(t.value, t.checked); return; }
    save();
    renderPreview();
  });
  form.addEventListener("input", function (e) {
    var t = e.target;
    if (fieldNames.indexOf(t.name) !== -1) { state.fields[t.name] = t.value; save(); }
    if (t.getAttribute("aria-invalid") === "true") validateField(t);
  });

  $$("[data-choose]").forEach(function (a) {
    a.addEventListener("click", function () {
      var r = form.querySelector('input[name="package"][value="' + a.dataset.choose + '"]');
      if (r) { r.checked = true; state.package = r.value; save(); renderPreview(); $("#err-package").hidden = true; }
    });
  });

  var today = new Date();
  var iso = function (d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  form.elements.eventDate.min = iso(today);

  var showErr = function (el, msg) {
    var err = $("#err-" + (el.id || "").replace(/^f-/, ""));
    el.setAttribute("aria-invalid", msg ? "true" : "false");
    if (err) { err.hidden = !msg; if (msg) err.textContent = msg; }
    return !msg;
  };
  var validateField = function (el) {
    var v = (el.value || "").trim();
    if (el.name === "name") return showErr(el, v.length >= 2 ? "" : B.errors.name);
    if (el.name === "email") return showErr(el, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : B.errors.email);
    if (el.name === "eventDate") return showErr(el, !v ? B.errors.date : (v < iso(today) ? B.errors.datePast : ""));
    return true;
  };

  var params = new URLSearchParams(location.search);
  var source = (params.get("src") || params.get("utm_source") || "").slice(0, 60);

  var longDate = function (v) {
    if (!v) return "";
    var p = v.split("-");
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return d.toLocaleDateString(MB.locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  };

  var buildInquiry = function () {
    var pkg = pkgById[state.package];
    var f = form.elements;
    return {
      language: MB.lang,
      package: pkg.id,
      dessertCount: pkg.count,
      packagePrice: pkg.price,
      desserts: state.desserts.slice(),
      letMiniBitesSuggest: state.desserts.length === 0,
      eventDate: f.eventDate.value,
      eventType: f.eventType.value || "",
      guests: f.guests.value ? Number(f.guests.value) : null,
      city: f.city.value.trim(),
      theme: f.theme.value.trim(),
      name: f.name.value.trim(),
      email: f.email.value.trim(),
      phone: f.phone.value.trim(),
      notes: f.notes.value.trim().slice(0, 1000),
      source: source,
      status: "new",
    };
  };

  var summary = function (q) {
    var m = B.mail;
    var pkg = pkgById[q.package];
    var lines = [m.hello, ""];
    lines.push(m.pkg + ": " + pkg.name + " · " + fill(B.pkgLine, { count: pkg.count, price: pkg.price }));
    lines.push(m.desserts + ": " + (q.desserts.length ? q.desserts.map(function (s) { return MB.desserts[s].name; }).join(", ") : m.suggest));
    lines.push(m.date + ": " + longDate(q.eventDate));
    if (q.eventType) lines.push(m.type + ": " + (T.eventTypes[q.eventType] || q.eventType));
    if (q.guests) lines.push(m.guests + ": " + q.guests);
    if (q.city) lines.push(m.city + ": " + q.city);
    if (q.theme) lines.push(m.theme + ": " + q.theme);
    lines.push("");
    lines.push(m.name + ": " + q.name);
    lines.push(m.email + ": " + q.email);
    if (q.phone) lines.push(m.phone + ": " + q.phone);
    if (q.notes) { lines.push(""); lines.push(m.notes + ": " + q.notes); }
    if (q.source) { lines.push(""); lines.push(m.ref + ": " + q.source); }
    return lines.join("\n");
  };

  // Guarda la solicitud (Base44) cuando hay endpoint configurado. El correo sale siempre.
  var record = function (q) {
    if (!MB.endpoint) return Promise.resolve(false);
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 4000) : null;
    return fetch(MB.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(q), keepalive: true, signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { return r.ok; })
      .catch(function () { return false; })
      .then(function (ok) { if (timer) clearTimeout(timer); return ok; });
  };

  var sent = $("#sent");
  var sentText = $("#sent-text");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = true;
    var firstBad = null;
    if (!state.package) { ok = false; $("#err-package").hidden = false; firstBad = firstBad || form.querySelector('input[name="package"]'); }
    ["eventDate", "name", "email"].forEach(function (k) {
      var el = form.elements[k];
      if (!validateField(el)) { ok = false; firstBad = firstBad || el; }
    });
    $("#form-error").hidden = ok;
    if (!ok) { if (firstBad) firstBad.focus(); return; }

    var q = buildInquiry();
    var text = summary(q);
    var subject = fill(B.mail.subject, { pkg: pkgById[q.package].name, date: longDate(q.eventDate) });
    var mailto = "mailto:" + MB.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(text.replace(/\n/g, "\r\n"));
    sentText.value = text;
    record(q).then(function () {
      window.location.href = mailto;
      sent.hidden = false;
      sent.focus({ preventScroll: true });
      sent.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  $("#copy-request").addEventListener("click", function () {
    var btn = this;
    var label = btn.querySelector("span");
    var done = function () { var old = label.textContent; label.textContent = B.sent.copied; setTimeout(function () { label.textContent = old; }, 1800); };
    var fallback = function () { sentText.focus(); sentText.select(); try { document.execCommand("copy"); done(); } catch (e) {} };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(sentText.value).then(done, fallback);
    else fallback();
  });
  $("#edit-request").addEventListener("click", function () { sent.hidden = true; form.elements.name.focus(); });

  syncDesserts();
})();
