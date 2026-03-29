import "./input.css";

function initNavCurrentPage(): void {
  const path = window.location.pathname;
  const page =
    path.endsWith("catalog.html") || path.endsWith("/catalog")
      ? "catalog"
      : path.endsWith("contact.html") || path.endsWith("/contact")
        ? "contact"
        : "home";

  document.querySelectorAll<HTMLAnchorElement>("[data-nav]").forEach((link) => {
    const key = link.dataset.nav;
    if (key === page) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function initRevealOnScroll(): void {
  const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
  if (!els.length || !("IntersectionObserver" in window)) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("opacity-100", "translate-y-0");
        e.target.classList.remove("opacity-0", "translate-y-4");
        io.unobserve(e.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );

  els.forEach((el, index) => {
    el.classList.add(
      "opacity-0",
      "translate-y-4",
      "transition-all",
      "duration-500",
      "ease-out",
    );
    el.style.transitionDelay = `${Math.min(index, 8) * 45}ms`;
    io.observe(el);
  });
}

function initCardTilt(): void {
  const cards = document.querySelectorAll<HTMLElement>("[data-tilt]");
  cards.forEach((card) => {
    card.addEventListener(
      "pointermove",
      (e) => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        const px = (x / r.width - 0.5) * 2;
        const py = (y / r.height - 0.5) * 2;
        card.style.setProperty("--tilt-x", `${py * -3}deg`);
        card.style.setProperty("--tilt-y", `${px * 3}deg`);
      },
      { passive: true },
    );
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  });
}

function initMagneticButtons(): void {
  const buttons = document.querySelectorAll<HTMLElement>("[data-magnetic]");
  buttons.forEach((btn) => {
    btn.addEventListener(
      "pointermove",
      (e) => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = `translate(${dx * 0.12}px, ${dy * 0.12}px)`;
      },
      { passive: true },
    );
    btn.addEventListener("pointerleave", () => {
      btn.style.transform = "";
    });
  });
}

function initContactForm(): void {
  const form = document.querySelector<HTMLFormElement>("#contact-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const status = document.querySelector("#form-status");
    if (status) {
      status.textContent = "Thanks — we will get back to you soon.";
      status.classList.remove("opacity-0");
      status.classList.add("opacity-100");
    }
    form.reset();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initNavCurrentPage();
  initRevealOnScroll();
  initCardTilt();
  initMagneticButtons();
  initContactForm();
});
