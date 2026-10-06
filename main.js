/* Portfolio site — Three.js hero (drag-to-rotate + parallax), nav, scroll
   reveal, lightbox gallery, stat counters, 3D tilt, magnetic buttons,
   cursor glow, scroll progress, title parallax. */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

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

    // Draggable group holding the whole scene
    var world = new THREE.Group();
    scene.add(world);

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
    world.add(particles);

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
      world.add(mesh);
      shapes.push(mesh);
    }

    // Subtle mouse parallax (target + lerp)
    var mouseX = 0, mouseY = 0;
    var targetX = 0, targetY = 0;
    window.addEventListener("mousemove", function (e) {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    // Drag-to-rotate the 3D scene (desktop pointers only)
    var dragging = false, lastX = 0, lastY = 0;
    var velX = 0, velY = 0;
    var rotX = 0, rotY = 0;
    if (finePointer && !reduceMotion) {
      canvas.style.cursor = "grab";
      canvas.addEventListener("pointerdown", function (e) {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        velX = 0;
        velY = 0;
        canvas.style.cursor = "grabbing";
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
      });
      canvas.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        var dx = e.clientX - lastX;
        var dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        velY = dx * 0.0045;
        velX = dy * 0.0045;
        rotY += velY;
        rotX += velX;
      });
      var endDrag = function () {
        dragging = false;
        canvas.style.cursor = "grab";
      };
      canvas.addEventListener("pointerup", endDrag);
      canvas.addEventListener("pointercancel", endDrag);
    }

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

        // Inertia after drag release
        if (!dragging) {
          rotY += velY;
          rotX += velX;
          velY *= 0.95;
          velX *= 0.95;
        }
        if (rotX > 0.6) rotX = 0.6;
        if (rotX < -0.6) rotX = -0.6;
        world.rotation.x = rotX;
        world.rotation.y = rotY;

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

  /* ---------- Scroll progress bar + section title parallax ---------- */
  function initScrollFX() {
    var bar = document.getElementById("scroll-progress");
    var titles = document.querySelectorAll(".section-title");
    var ticking = false;

    function update() {
      ticking = false;
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      var y = doc.scrollTop || window.pageYOffset;
      var p = max > 0 ? y / max : 0;
      if (bar) bar.style.width = (p * 100).toFixed(2) + "%";

      if (!reduceMotion && titles.length) {
        var vh = doc.clientHeight;
        titles.forEach(function (t) {
          var r = t.getBoundingClientRect();
          if (r.bottom < -120 || r.top > vh + 120) return;
          var offset = (r.top + r.height / 2 - vh / 2) * -0.06;
          t.style.setProperty("--py", offset.toFixed(1) + "px");
        });
      }
    }

    function request() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    update();
  }

  /* ---------- Animated stat counters ---------- */
  function initCounters() {
    var nums = document.querySelectorAll(".stat-number");
    if (!nums.length) return;

    function setFinal(el) {
      var target = parseFloat(el.getAttribute("data-target"));
      var dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
      el.textContent = target.toFixed(dec);
    }

    if (reduceMotion || !("IntersectionObserver" in window)) {
      nums.forEach(setFinal);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        observer.unobserve(el);
        var target = parseFloat(el.getAttribute("data-target"));
        var dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
        var dur = 1400;
        var t0 = null;
        function frame(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = (target * eased).toFixed(dec);
          if (p < 1) {
            requestAnimationFrame(frame);
          } else {
            el.textContent = target.toFixed(dec);
          }
        }
        requestAnimationFrame(frame);
      });
    }, { threshold: 0.5 });
    nums.forEach(function (n) { observer.observe(n); });
  }

  /* ---------- 3D tilt on cards ---------- */
  function initTilt() {
    if (!finePointer || reduceMotion) return;
    var max = 8;
    var cards = document.querySelectorAll(".tilt");
    cards.forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        if (!card.classList.contains("visible")) return;
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          "perspective(900px) rotateX(" + (-py * max).toFixed(2) + "deg)" +
          " rotateY(" + (px * max).toFixed(2) + "deg) translateZ(6px)";
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
      });
    });
  }

  /* ---------- Magnetic buttons ---------- */
  function initMagnetic() {
    if (!finePointer || reduceMotion) return;
    var btns = document.querySelectorAll(".hero-cta .btn");
    btns.forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        btn.style.transform =
          "translate(" + (x * 0.22).toFixed(1) + "px," + (y * 0.28).toFixed(1) + "px)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.transform = "";
      });
    });
  }

  /* ---------- Cursor glow ---------- */
  function initGlow() {
    var glow = document.getElementById("cursor-glow");
    if (!glow || !finePointer || reduceMotion) return;
    var gx = -600, gy = -600, tx = -600, ty = -600, shown = false;
    window.addEventListener("mousemove", function (e) {
      tx = e.clientX;
      ty = e.clientY;
      if (!shown) {
        shown = true;
        glow.classList.add("on");
        gx = tx;
        gy = ty;
      }
    }, { passive: true });
    document.addEventListener("mouseleave", function () {
      shown = false;
      glow.classList.remove("on");
    });
    (function follow() {
      requestAnimationFrame(follow);
      gx += (tx - gx) * 0.12;
      gy += (ty - gy) * 0.12;
      glow.style.transform = "translate(" + gx.toFixed(1) + "px," + gy.toFixed(1) + "px)";
    })();
  }

  /* ---------- Staggered reveal delays ---------- */
  function initStagger() {
    if (reduceMotion) return;
    var groups = document.querySelectorAll(
      ".hero-content, .cert-gallery, .projects-grid, .skills-grid, .stats-grid, " +
      ".timeline, .achieve-list, .pub-list, .contact-grid"
    );
    groups.forEach(function (g) {
      var items = g.querySelectorAll(":scope > .reveal");
      items.forEach(function (el, i) {
        el.style.setProperty("--reveal-delay", Math.min(i * 70, 560) + "ms");
      });
    });
  }

  /* ---------- Certificate gallery: hydrate images from data URIs ---------- */
  function initGallery() {
    var store = window.CERT_IMGS || {};
    var imgs = document.querySelectorAll(".cert-item img[data-cert]");
    imgs.forEach(function (img) {
      var key = img.getAttribute("data-cert");
      var src = store[key];
      if (src) {
        img.src = src;
      } else {
        // No image data available: hide the card rather than show a broken icon
        var card = img.closest(".cert-item");
        if (card) card.style.display = "none";
      }
    });
  }

  /* ---------- Certificate lightbox ---------- */
  function initLightbox() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".cert-item"));
    var box = document.getElementById("lightbox");
    if (!items.length || !box) return;
    var store = window.CERT_IMGS || {};
    var img = document.getElementById("lightbox-img");
    var cap = document.getElementById("lightbox-caption");
    var btnClose = document.getElementById("lightbox-close");
    var current = 0;
    var lastFocus = null;

    function keyFor(figure) {
      var picture = figure.querySelector("img");
      return picture ? picture.getAttribute("data-cert") : null;
    }

    function show(i) {
      current = (i + items.length) % items.length;
      var figure = items[current];
      var key = keyFor(figure);
      var picture = figure.querySelector("img");
      img.src = (key && store[key]) || (picture ? picture.src : "");
      img.alt = picture ? (picture.getAttribute("alt") || "") : "";
      cap.textContent = figure.querySelector("figcaption").textContent;
    }

    function open(i, opener) {
      lastFocus = opener || document.activeElement;
      show(i);
      box.hidden = false;
      void box.offsetWidth; // reflow so the fade transition runs
      box.classList.add("open");
      document.body.style.overflow = "hidden";
      if (btnClose) btnClose.focus();
    }

    function close() {
      box.classList.remove("open");
      document.body.style.overflow = "";
      setTimeout(function () { box.hidden = true; }, 320);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    items.forEach(function (figure, i) {
      figure.addEventListener("click", function () { open(i, figure); });
      figure.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(i, figure);
        }
      });
    });

    if (btnClose) btnClose.addEventListener("click", close);
    document.getElementById("lightbox-prev").addEventListener("click", function (e) {
      e.stopPropagation();
      show(current - 1);
    });
    document.getElementById("lightbox-next").addEventListener("click", function (e) {
      e.stopPropagation();
      show(current + 1);
    });
    box.addEventListener("click", function (e) {
      if (e.target === box) close();
    });
    document.addEventListener("keydown", function (e) {
      if (box.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(current - 1);
      else if (e.key === "ArrowRight") show(current + 1);
    });
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
    initStagger();
    initReveal();
    initScrollFX();
    initCounters();
    initTilt();
    initMagnetic();
    initGlow();
    initGallery();
    initLightbox();
    initYear();
  });
})();
