// Injected via evaluateOnNewDocument so it survives SPA navigation.
// Everything runs in-page on requestAnimationFrame — never a Node-side drift loop.
export const CURSOR_INIT = `
(() => {
  if (window.__cursorInstalled) return;
  window.__cursorInstalled = true;

  const S = { x: 200, y: 200, el: null };

  function ensure() {
    if (S.el && document.body.contains(S.el)) return S.el;
    const el = document.createElement("div");
    el.id = "__demo_cursor";
    el.style.cssText = [
      "position:fixed", "z-index:2147483647", "pointer-events:none",
      "width:22px", "height:22px", "border-radius:50%",
      "background:rgba(52,211,153,0.28)",
      "border:2px solid rgba(52,211,153,0.95)",
      "box-shadow:0 0 14px rgba(52,211,153,0.55)",
      "transform:translate(-50%,-50%)",
      "left:" + S.x + "px", "top:" + S.y + "px",
      "transition:none",
    ].join(";");
    (document.body || document.documentElement).appendChild(el);
    S.el = el;
    return el;
  }

  const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  window.__cursor = {
    moveTo(x, y, ms) {
      return new Promise(res => {
        const el = ensure();
        const sx = S.x, sy = S.y, t0 = performance.now();
        function step(now) {
          const k = Math.min(1, (now - t0) / ms), e = ease(k);
          S.x = sx + (x - sx) * e; S.y = sy + (y - sy) * e;
          el.style.left = S.x + "px"; el.style.top = S.y + "px";
          if (k < 1) requestAnimationFrame(step); else res();
        }
        requestAnimationFrame(step);
      });
    },
    pulse() {
      return new Promise(res => {
        const el = ensure();
        const ring = document.createElement("div");
        ring.style.cssText = "position:fixed;z-index:2147483646;pointer-events:none;width:22px;height:22px;border-radius:50%;border:2px solid rgba(52,211,153,0.9);transform:translate(-50%,-50%);left:" + S.x + "px;top:" + S.y + "px";
        document.body.appendChild(ring);
        const t0 = performance.now();
        function step(now) {
          const k = Math.min(1, (now - t0) / 420);
          const s = 1 + k * 2.2;
          ring.style.transform = "translate(-50%,-50%) scale(" + s + ")";
          ring.style.opacity = String(1 - k);
          if (k < 1) requestAnimationFrame(step); else { ring.remove(); res(); }
        }
        requestAnimationFrame(step);
      });
    },
    // Freeze-trap filler: gentle oscillation keeps the compositor repainting.
    idle(ms) {
      return new Promise(res => {
        const el = ensure();
        const cx = S.x, cy = S.y, t0 = performance.now();
        function step(now) {
          const t = now - t0;
          if (t >= ms) { S.x = cx; S.y = cy; el.style.left = cx + "px"; el.style.top = cy + "px"; res(); return; }
          S.x = cx + Math.sin(t / 900) * 14;
          S.y = cy + Math.cos(t / 1300) * 9;
          el.style.left = S.x + "px"; el.style.top = S.y + "px";
          requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    },
  };
})();
`;
