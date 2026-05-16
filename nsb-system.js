document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("motion-ready");
  const root = document.documentElement;
  const header = document.getElementById("siteHeader");
  const mobileBtn = document.getElementById("mobileMenuBtn");
  const navLinks = document.getElementById("navLinks");

  const setPointer = (event) => {
    const point = event.touches ? event.touches[0] : event;
    root.style.setProperty("--mx", ((point.clientX / window.innerWidth - 0.5) * 2).toFixed(3));
    root.style.setProperty("--my", ((point.clientY / window.innerHeight - 0.5) * 2).toFixed(3));
  };

  const setScroll = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    root.style.setProperty("--scroll", Math.min(1, Math.max(0, window.scrollY / max)).toFixed(4));
    if (header) header.classList.toggle("scrolled", window.scrollY > 16);
  };

  window.addEventListener("pointermove", setPointer, { passive: true });
  window.addEventListener("touchmove", setPointer, { passive: true });
  window.addEventListener("scroll", setScroll, { passive: true });
  setScroll();

  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener("click", () => {
      const open = navLinks.classList.toggle("active");
      mobileBtn.setAttribute("aria-expanded", String(open));
      const lines = mobileBtn.querySelectorAll(".hamburger-line");
      lines[0].style.transform = open ? "rotate(45deg) translate(4px, 4px)" : "";
      lines[1].style.opacity = open ? "0" : "1";
      lines[2].style.transform = open ? "rotate(-45deg) translate(4px, -4px)" : "";
    });
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -50px 0px" });
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;
      document.querySelectorAll(".filter-btn").forEach((item) => item.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll("[data-category]").forEach((card) => {
        card.style.display = filter === "all" || card.dataset.category === filter ? "" : "none";
      });
    });
  });
});
