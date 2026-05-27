/**
 * Floating particle system — ambient cinematic background
 */
(function () {
  'use strict';

  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  let width = 0;
  let height = 0;
  let intensity = 1;
  let animationId = null;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.8 + 0.4,
      opacity: Math.random() * 0.4 + 0.1,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.25 - 0.1,
      hue: Math.random() > 0.5 ? 'gold' : 'rose',
      pulse: Math.random() * Math.PI * 2,
    };
  }

  function init(count) {
    particles = Array.from({ length: count }, createParticle);
  }

  function drawParticle(p) {
    const alpha = p.opacity * intensity * (0.7 + 0.3 * Math.sin(p.pulse));
    const color =
      p.hue === 'gold'
        ? `rgba(201, 169, 98, ${alpha})`
        : `rgba(184, 92, 111, ${alpha * 0.7})`;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Soft glow
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
    ctx.fillStyle =
      p.hue === 'gold'
        ? `rgba(201, 169, 98, ${alpha * 0.15})`
        : `rgba(184, 92, 111, ${alpha * 0.1})`;
    ctx.fill();
  }

  function update() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach((p) => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.pulse += 0.02;

      // Gentle drift like slow dance movement
      p.x += Math.sin(p.pulse * 0.5) * 0.15;
      p.y += Math.cos(p.pulse * 0.3) * 0.1;

      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;
      if (p.y < -10) p.y = height + 10;
      if (p.y > height + 10) p.y = -10;

      drawParticle(p);
    });

    animationId = requestAnimationFrame(update);
  }

  function start() {
    resize();
    const count = prefersReducedMotion ? 20 : Math.min(80, Math.floor((width * height) / 12000));
    init(count);
    if (!prefersReducedMotion) update();
  }

  window.Particles = {
    setIntensity(value) {
      intensity = Math.max(0.3, Math.min(2.5, value));
    },
    boost() {
      intensity = 2;
      setTimeout(() => {
        intensity = 1.5;
      }, 3000);
    },
  };

  window.addEventListener('resize', () => {
    resize();
    const count = prefersReducedMotion ? 20 : Math.min(80, Math.floor((width * height) / 12000));
    if (particles.length < count) {
      while (particles.length < count) particles.push(createParticle());
    }
  });

  start();
})();

/**
 * Heart particles for the YES ending
 */
(function () {
  'use strict';

  const canvas = document.getElementById('hearts-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let hearts = [];
  let running = false;
  let animationId = null;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createHeart() {
    return {
      x: Math.random() * canvas.width,
      y: canvas.height + 20,
      size: Math.random() * 14 + 8,
      speed: Math.random() * 1.2 + 0.4,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.03 + 0.01,
      opacity: Math.random() * 0.5 + 0.3,
      rotation: Math.random() * Math.PI,
    };
  }

  function drawHeart(x, y, size, rotation, opacity) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = opacity;
    ctx.fillStyle = '#b85c6f';
    ctx.beginPath();
    const s = size / 16;
    ctx.moveTo(0, s * 3);
    ctx.bezierCurveTo(-s * 5, -s * 2, -s * 10, s * 4, 0, s * 12);
    ctx.bezierCurveTo(s * 10, s * 4, s * 5, -s * 2, 0, s * 3);
    ctx.fill();
    ctx.restore();
  }

  function animate() {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (hearts.length < 40 && Math.random() > 0.85) {
      hearts.push(createHeart());
    }

    hearts = hearts.filter((h) => {
      h.y -= h.speed;
      h.wobble += h.wobbleSpeed;
      h.x += Math.sin(h.wobble) * 0.8;
      h.rotation += 0.01;
      h.opacity *= 0.998;

      drawHeart(h.x, h.y, h.size, h.rotation, h.opacity);
      return h.y > -30 && h.opacity > 0.05;
    });

    animationId = requestAnimationFrame(animate);
  }

  window.HeartParticles = {
    start() {
      resize();
      canvas.classList.add('active');
      running = true;
      hearts = Array.from({ length: 15 }, createHeart);
      animate();
    },
    stop() {
      running = false;
      if (animationId) cancelAnimationFrame(animationId);
    },
  };

  window.addEventListener('resize', resize);
})();
