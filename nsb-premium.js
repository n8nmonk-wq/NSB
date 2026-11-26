document.addEventListener("DOMContentLoaded", () => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Hover spotlight on tiles
  document.querySelectorAll(".tile, .acc").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  // Tabs (pillars)
  document.querySelectorAll("[data-tabs]").forEach((root) => {
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    const panels = [...root.querySelectorAll('[role="tabpanel"]')];
    const select = (i, focus) => {
      tabs.forEach((t, n) => {
        const on = n === i;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        panels[n].hidden = !on;
      });
      if (focus) tabs[i].focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(i));
      t.addEventListener("keydown", (e) => {
        const k = e.key;
        if (["ArrowDown", "ArrowRight"].includes(k)) { e.preventDefault(); select((i + 1) % tabs.length, true); }
        if (["ArrowUp", "ArrowLeft"].includes(k)) { e.preventDefault(); select((i - 1 + tabs.length) % tabs.length, true); }
      });
    });
    select(0);
  });

  // Count-up numbers
  const fmt = (el, v) => { el.textContent = `${el.dataset.prefix || ""}${Math.round(v)}${el.dataset.suffix || ""}`; };
  const counters = document.querySelectorAll("[data-count]");
  if (reduce || !("IntersectionObserver" in window)) {
    counters.forEach((el) => fmt(el, +el.dataset.count));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        const el = en.target, end = +el.dataset.count, t0 = performance.now(), dur = 1400;
        const tick = (t) => {
          const p = Math.min(1, (t - t0) / dur);
          fmt(el, end * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });
    counters.forEach((el) => { fmt(el, 0); io.observe(el); });
  }

  // Stagger reveal inside grids
  document.querySelectorAll(".bento, .stepper, .tl-list, .sub, .accordion").forEach((g) => {
    [...g.children].forEach((c, i) => c.style.setProperty("--i", i));
  });
});
