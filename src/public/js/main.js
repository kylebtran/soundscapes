document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);

  const heroTitle = document.querySelector(".hero-content h1");
  const heroSubtitle = document.querySelector(".hero-content h2");

  if (heroTitle && heroSubtitle) {
    const heroTimeline = gsap.timeline({
      defaults: { duration: 1, ease: "power3.out" },
    });
    heroTimeline
      .from(heroTitle, {
        y: 50,
        opacity: 0,
        autoAlpha: 0,
      })
      .from(
        heroSubtitle,
        {
          y: 30,
          opacity: 0,
          autoAlpha: 0,
        },
        "-=0.5"
      );
  }

  const featureTitles = document.querySelectorAll(".feature-title");
  if (featureTitles.length > 0) {
    featureTitles.forEach((title) => {
      gsap.from(title, {
        scrollTrigger: {
          trigger: title,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
        y: 50,
        opacity: 0,
        duration: 1,
      });
    });
  }

  const backgroundWrapper = document.querySelector(".background-wrapper");
  if (backgroundWrapper) {
    gsap.fromTo(
      backgroundWrapper,
      {
        scale: 1,
      },
      {
        scale: 0.8,
        ease: "power3.inOut",
        scrollTrigger: {
          trigger: "body",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      }
    );
  }

  const featureCards = document.querySelector(".feature-card");
  const featuresSection = document.querySelector(".features-section");
  if (featureCards && featuresSection) {
    gsap.from(".feature-card", {
      scrollTrigger: {
        trigger: ".features-section",
        start: "top 60%",
        toggleActions: "play none none reverse",
      },
      y: 100,
      opacity: 0,
      duration: 1,
      stagger: 0.2,
    });
  }

  let lastScroll = 0;
  const navbar = document.querySelector("nav");
  if (navbar) {
    window.addEventListener("scroll", () => {
      const currentScroll = window.pageYOffset;
      if (currentScroll <= 0) {
        navbar.classList.remove("scroll-up");
        return;
      }
      if (
        currentScroll > lastScroll &&
        !navbar.classList.contains("scroll-down")
      ) {
        navbar.classList.remove("scroll-up");
        navbar.classList.add("scroll-down");
      } else if (
        currentScroll < lastScroll &&
        navbar.classList.contains("scroll-down")
      ) {
        navbar.classList.remove("scroll-down");
        navbar.classList.add("scroll-up");
      }
      lastScroll = currentScroll;
    });
  }
});
