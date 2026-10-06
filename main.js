/* Portfolio site — Three.js hero, nav, scroll reveal. */

(function () {
  "use strict";

  /* ---------- Three.js animated hero background ---------- */
  function initHero() {
    if (typeof THREE === "undefined") return; // CDN failed: gradient fallback remains
    var canvas = document.getElementById("hero-canvas");
    if (!canvas) return;

    var hero = document.getElementById("hero");
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(hero.clientWidth, hero.clientHeight);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, hero.clientWidth / hero.clientHeight, 0.1, 100);
    camera.position.z = 14;

    var ACCENT = 0x38bdf8;

    // Floating particles
    var particleCount = window.innerWidth < 768 ? 220 : 480;
    var positions = new Float32Array(particleCount * 3);
    for (var i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 34;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 18;
    }
    var particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    var particleMat = new THREE.PointsMaterial({
      color: ACCENT,
      size: 0.09,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    var particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Wireframe geometric shapes drifting slowly
    var shapes = [];
    var geos = [
      new THREE.IcosahedronGeometry(1.1, 0),
      new THREE.OctahedronGeometry(0.9, 0),
      new THREE.TorusGeometry(0.8, 0.28, 10, 26),
      new THREE.TetrahedronGeometry(1.0, 0),
      new THREE.IcosahedronGeometry(0.65, 0)
    ];
    for (var s = 0; s < geos.length; s++) {
      var mat = new THREE.MeshBasicMaterial({
        color: ACCENT,
        wireframe: true,
        transparent: true,
        opacity: 0.22
      });
      var mesh = new THREE.Mesh(geos[s], mat);
      mesh.position.set(
        (Math.random() - 0.5) * 22,
        (Math.random() - 0.5) * 12,
        -4 - Math.random() * 6
      );
      mesh.userData = {
        rx: (Math.random() - 0.5) * 0.004,
        ry: (Math.random() - 0.5) * 0.006,
        fy: Math.random() * Math.PI * 2,
        fs: 0.3 + Math.random() * 0.5,
        baseY: mesh.position.y
      };
      scene.add(mesh);
      shapes.push(mesh);
    }

    // Subtle mouse parallax (target + lerp)
    var mouseX = 0, mouseY = 0;
    var targetX = 0, targetY = 0;
    window.addEventListener("mousemove", function (e) {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function onResize() {
      var w = hero.clientWidth, h = hero.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", onResize);

    var clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      var t = clock.getElapsedTime();

      if (!reduceMotion) {
        particles.rotation.y = t * 0.02;
        particles.position.y = Math.sin(t * 0.25) * 0.35;

        for (var k = 0; k < shapes.length; k++) {
          var m = shapes[k];
          m.rotation.x += m.userData.rx;
          m.rotation.y += m.userData.ry;
          m.position.y = m.userData.baseY + Math.sin(t * m.userData.fs + m.userData.fy) * 0.8;
        }

        targetX += (mouseX * 1.4 - targetX) * 0.04;
        targetY += (mouseY * 0.9 - targetY) * 0.04;
        camera.position.x = targetX;
        camera.position.y = -targetY;
        camera.lookAt(scene.position);
      }

      renderer.render(scene, camera);
    }
    animate();
  }

  /* ---------- Mobile nav toggle ---------- */
  function initNav() {
    var toggle = document.getElementById("nav-toggle");
    var links = document.getElementById("nav-links");
    if (!toggle || !links) return;

    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Active nav link highlighting ---------- */
  function initActiveNav() {
    var sections = document.querySelectorAll("section[id]");
    var navLinks = document.querySelectorAll(".nav-links a");
    if (!("IntersectionObserver" in window)) return;

    var map = {};
    navLinks.forEach(function (a) {
      map[a.getAttribute("href").slice(1)] = a;
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = map[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach(function (a) { a.classList.remove("active"); });
          link.classList.add("active");
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });

    sections.forEach(function (s) { observer.observe(s); });
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("visible"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Footer year ---------- */
  function initYear() {
    var y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initHero();
    initNav();
    initActiveNav();
    initReveal();
    initYear();
  });
})();
