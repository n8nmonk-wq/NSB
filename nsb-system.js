document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("motion-ready");

  const root = document.documentElement;
  const mobileBtn = document.getElementById("mobileMenuBtn");
  const navLinks = document.getElementById("navLinks");

  const setScroll = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    root.style.setProperty("--scroll", Math.min(1, Math.max(0, window.scrollY / max)).toFixed(4));
  };

  window.addEventListener("scroll", setScroll, { passive: true });
  setScroll();

  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener("click", () => {
      const open = navLinks.classList.toggle("active");
      mobileBtn.setAttribute("aria-expanded", String(open));
      const lines = mobileBtn.querySelectorAll(".hamburger-line");
      if (lines.length === 3) {
        lines[0].style.transform = open ? "rotate(45deg) translate(4px, 4px)" : "";
        lines[1].style.opacity = open ? "0" : "1";
        lines[2].style.transform = open ? "rotate(-45deg) translate(4px, -4px)" : "";
      }
    });
  }

  const contactForm = document.querySelector(".contact-form[data-contact-email]");
  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(contactForm);
      const recipient = contactForm.dataset.contactEmail;
      const purpose = formData.get("purpose") || "Website enquiry";
      const body = [
        `Name: ${formData.get("name") || ""}`,
        `Email: ${formData.get("email") || ""}`,
        `Purpose: ${purpose}`,
        "",
        formData.get("message") || "",
      ].join("\n");
      window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(purpose)}&body=${encodeURIComponent(body)}`;
    });
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
});
