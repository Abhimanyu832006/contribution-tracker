"use client";

import { useEffect, useRef } from "react";

/**
 * Full-viewport animated paper texture — a jittered (not gridded) field
 * of dots, each behaving like a tiny damped spring anchored to its own
 * resting position. When the cursor comes near, a small local group of
 * dots gets pulled toward it (a gravity force competing against their
 * spring); when the cursor moves away, the same spring pulls them back
 * with a slight, physically-driven overshoot — no separate "return"
 * animation is needed, it falls out of one unified force model.
 *
 * Canvas-based and off the React render path entirely: mouse position
 * and per-dot state live in refs/typed arrays, everything is driven by
 * a single rAF loop, and nothing here triggers a React re-render.
 */

const CELL = 30; // average spacing between dots, px — matches the previous CSS dot density
const JITTER = CELL * 0.85; // how far a dot can wander from its cell center (keeps the field balanced, not clumpy)
const DOT_RADIUS = 1.15;

const GRAVITY_RADIUS = 85; // px — only dots this close to the cursor react at all
const ATTRACT_STRENGTH = 26000; // tuned against SPRING_K so max pull is a few px, not a snap
const SPRING_K = 130; // spring stiffness pulling each dot back to its resting position
const SPRING_DAMPING = 15; // viscous damping — underdamped relative to SPRING_K, so the return has a small, clean overshoot

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isDarkMode() {
  const theme = document.documentElement.getAttribute("data-theme");
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export default function DotField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = window.innerWidth;
    let height = window.innerHeight;

    let ox = new Float32Array(0);
    let oy = new Float32Array(0);
    let px = new Float32Array(0);
    let py = new Float32Array(0);
    let vx = new Float32Array(0);
    let vy = new Float32Array(0);
    let count = 0;

    function buildField() {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cols = Math.ceil(width / CELL) + 1;
      const rows = Math.ceil(height / CELL) + 1;
      count = cols * rows;
      ox = new Float32Array(count);
      oy = new Float32Array(count);
      px = new Float32Array(count);
      py = new Float32Array(count);
      vx = new Float32Array(count);
      vy = new Float32Array(count);

      let i = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Seed per-cell (not per-run) so the field is deterministic and
          // stable across reloads/resizes rather than reshuffling randomly.
          const rand = mulberry32((r * 92821 + c * 51749 + 17) >>> 0);
          const jx = (rand() - 0.5) * JITTER;
          const jy = (rand() - 0.5) * JITTER;
          const cx = c * CELL + CELL / 2 + jx;
          const cy = r * CELL + CELL / 2 + jy;
          ox[i] = cx;
          oy[i] = cy;
          px[i] = cx;
          py[i] = cy;
          vx[i] = 0;
          vy[i] = 0;
          i++;
        }
      }
    }

    buildField();

    const mouse = { x: -9999, y: -9999, active: false };
    function handleMove(e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    }
    function handleOut(e) {
      if (!e.relatedTarget) mouse.active = false;
    }
    if (!reduceMotion) {
      window.addEventListener("mousemove", handleMove, { passive: true });
      window.addEventListener("mouseout", handleOut, { passive: true });
    }

    let resizeTimer = null;
    function handleResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(buildField, 150);
    }
    window.addEventListener("resize", handleResize);

    let dotColor = "#14141a";
    let highlightColor = "#14141a";
    let bgColor = "#fdf6e3";
    function refreshColors() {
      const cs = getComputedStyle(document.documentElement);
      bgColor = cs.getPropertyValue("--color-bg").trim() || bgColor;
      if (isDarkMode()) {
        // Light dots need real opacity against a near-black page to be
        // "clearly visible" rather than a faint hint — 0.4 read as barely
        // there; the dots the cursor is currently pulling get an extra,
        // brighter pass (see the `frame` loop) so the interaction itself
        // is easy to perceive, not just the resting field.
        dotColor = "rgba(226, 226, 235, 0.62)";
        highlightColor = "rgba(255, 255, 255, 0.95)";
      } else {
        dotColor = cs.getPropertyValue("--color-border").trim() || dotColor;
        highlightColor = cs.getPropertyValue("--color-border-strong").trim() || dotColor;
      }
    }
    refreshColors();

    const themeObserver = new MutationObserver(refreshColors);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
    darkQuery.addEventListener?.("change", refreshColors);

    let rafId = null;
    let running = true;
    let lastT = performance.now();
    const gravityR2 = GRAVITY_RADIUS * GRAVITY_RADIUS;
    // The set of dots currently inside the cursor's gravity radius is
    // always tiny (a local neighborhood, never the whole field) — a
    // fixed-size scratch buffer avoids allocating an array every frame.
    const activeIdx = new Int32Array(512);

    function frame(t) {
      if (!running) return;
      let dt = (t - lastT) / 1000;
      lastT = t;
      if (dt > 0.05) dt = 0.05; // clamp huge jumps (e.g. after the tab was backgrounded)

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = dotColor;
      ctx.beginPath();
      let activeCount = 0;

      for (let i = 0; i < count; i++) {
        const dxo = ox[i] - px[i];
        const dyo = oy[i] - py[i];
        // Damped spring back to the resting position — always active.
        let ax = dxo * SPRING_K - vx[i] * SPRING_DAMPING;
        let ay = dyo * SPRING_K - vy[i] * SPRING_DAMPING;

        if (mouse.active) {
          const dx = mouse.x - px[i];
          const dy = mouse.y - py[i];
          const d2 = dx * dx + dy * dy;
          if (d2 < gravityR2 && d2 > 1) {
            const dist = Math.sqrt(d2);
            const influence = 1 - dist / GRAVITY_RADIUS;
            const pull = (influence * influence * ATTRACT_STRENGTH) / dist;
            ax += dx * pull;
            ay += dy * pull;
            if (activeCount < activeIdx.length) activeIdx[activeCount++] = i;
          }
        }

        vx[i] += ax * dt;
        vy[i] += ay * dt;
        px[i] += vx[i] * dt;
        py[i] += vy[i] * dt;

        ctx.moveTo(px[i] + DOT_RADIUS, py[i]);
        ctx.arc(px[i], py[i], DOT_RADIUS, 0, Math.PI * 2);
      }
      ctx.fill();

      // A brighter second pass over just the dots the cursor is currently
      // influencing — makes the gravity effect itself easy to perceive
      // (including through the spring-return bounce) without touching
      // the resting field's overall look.
      if (activeCount > 0) {
        ctx.fillStyle = highlightColor;
        ctx.beginPath();
        for (let k = 0; k < activeCount; k++) {
          const i = activeIdx[k];
          ctx.moveTo(px[i] + DOT_RADIUS, py[i]);
          ctx.arc(px[i], py[i], DOT_RADIUS, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      rafId = requestAnimationFrame(frame);
    }

    function handleVisibility() {
      if (document.hidden) {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
      } else if (!running) {
        running = true;
        lastT = performance.now();
        rafId = requestAnimationFrame(frame);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);

    rafId = requestAnimationFrame(frame);

    return () => {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      clearTimeout(resizeTimer);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseout", handleOut);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      themeObserver.disconnect();
      darkQuery.removeEventListener?.("change", refreshColors);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, zIndex: -1, display: "block" }}
    />
  );
}
