"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
  useTransition,
} from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { NavigationLoadingOverlay } from "@/components/NavigationLoadingOverlay";

/**
 * Floor on how long the loading overlay stays up, even if the
 * destination is already ready (e.g. a prefetched route resolving
 * near-instantly). Without this, a fast navigation would flash the
 * overlay on and immediately off — a genuine loading indicator needs to
 * be perceivable, not just technically correct.
 */
const MIN_DISPLAY_MS = 450;

const REVEAL_FADE_MS = 200;

const DEFAULT_ACCENT = "var(--color-primary)";
const DEFAULT_LABEL = "Loading";
const DEFAULT_ICON = (
  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
);

// Browser back/forward (popstate) has no link element to read a label
// from — the browser has already changed the URL by the time we hear
// about it — so known routes get a friendly name from their pathname.
const ROUTE_LABELS = {
  "/dashboard": "Dashboard",
  "/contributions": "Contributions",
  "/peer-verification": "Peer Verification",
  "/scores": "Reports",
  "/team": "Team",
  "/settings": "Settings",
  "/log": "Log Contribution",
};

function labelForPath(path) {
  if (ROUTE_LABELS[path]) return ROUTE_LABELS[path];
  if (path.startsWith("/contributions/")) return "Contribution";
  return DEFAULT_LABEL;
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Collapses inner whitespace/newlines from an element's textContent
 * into a single clean line, for using link text as a loading label. */
function cleanLabel(text) {
  return text ? text.replace(/\s+/g, " ").trim() : "";
}

const NavigationLoadingContext = createContext(null);

export function useNavigationLoading() {
  return useContext(NavigationLoadingContext);
}

/**
 * Mounted once inside AppChrome.js (NOT inside any individual page) so
 * it persists across every navigation — that's what lets the overlay
 * survive the actual page swap instead of disappearing the instant the
 * old page unmounts.
 *
 * Covers EVERY in-app navigation, not just the dashboard's module
 * tiles:
 *   - Dashboard tiles call `beginTransition` directly with their own
 *     icon/accent/label (ModuleTransitionController.js) for a richer,
 *     module-specific look, calling preventDefault() themselves.
 *   - Every other same-origin, unmodified left-click on an in-app
 *     `<a>` is caught by the global click listener below and gets the
 *     same loading screen with a generic icon/accent and a label
 *     derived from the link's own text — so "every navigation" (the
 *     TopBar's back-to-dashboard link, any other in-app link) gets the
 *     same treatment without every caller having to wire it up by hand.
 *   - Browser back/forward is caught via the Navigation API (see below
 *     for why not `popstate`) — it mounts the same overlay directly
 *     with a route-derived label and reuses the same readiness watcher.
 *
 * Lifecycle, either way:
 *   1. the overlay mounts immediately, covering the screen;
 *   2. navigation fires immediately, inside startTransition, so the
 *      destination loads underneath while the overlay is up;
 *   3. once BOTH a minimum display time has elapsed (so the loader
 *      never just flashes on fast/prefetched navigations) AND real
 *      readiness is confirmed (pathname has moved on from where we
 *      started + isPending === false + a couple of paint frames —
 *      treated as a heuristic, never an absolute guarantee), the
 *      overlay fades out. If the destination is slow, it simply holds
 *      past the minimum with no visual cost — never a blank screen.
 */
export default function NavigationLoadingProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [active, setActive] = useState(null); // { label, icon, accent, textLight } | null
  const [phase, setPhase] = useState("idle"); // idle | waiting-for-ready

  const busyRef = useRef(false);
  const startPathnameRef = useRef(null);
  const shownAtRef = useRef(0);
  const overlayRef = useRef(null);

  const revealDestination = useCallback(() => {
    // Kill the destination page's own CSS mount-in animations (tile
    // stagger fade-ins, card fade/slide/scale-ins) before uncovering
    // it — otherwise the user sees our loading screen fade away only to
    // watch the actual content ALSO fade/slide in on top of that,
    // reading as "buffering that never got hidden" rather than a clean
    // reveal. Removing `animation` snaps each element straight to its
    // un-animated (fully visible) state; these classes carry no static
    // opacity/transform of their own, only via the @keyframes, so this
    // is a pure "stop animating, show final state" — never a flash of
    // hidden content.
    document
      .querySelectorAll(".stagger-children > *, .animate-fade-in, .animate-slide-in, .animate-scale-in")
      .forEach((node) => {
        node.style.animation = "none";
      });

    const el = overlayRef.current;
    if (!el) {
      setActive(null);
      setPhase("idle");
      busyRef.current = false;
      return;
    }
    const fadeAnim = el.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: REVEAL_FADE_MS, easing: "ease-in", fill: "forwards" },
    );
    fadeAnim.finished.catch(() => {}).then(() => {
      setActive(null);
      setPhase("idle");
      busyRef.current = false;
    });
  }, []);

  // Readiness watcher: checks pathname-moved-on rather than pathname-
  // equals-target so server-side redirects (e.g. /team -> /settings)
  // are handled correctly, combined with isPending===false, a couple of
  // paint frames, AND the minimum display floor above. Nothing here is
  // an absolute guarantee; if the destination is genuinely slow, this
  // effect simply keeps returning early and the overlay holds
  // indefinitely, which is the safe failure mode.
  useEffect(() => {
    if (phase !== "waiting-for-ready") return undefined;
    if (pathname === startPathnameRef.current) return undefined;
    if (isPending) return undefined;

    let cancelled = false;
    let raf1 = null;
    let raf2 = null;
    let timeoutId = null;

    const confirmPaintThenReveal = () => {
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          if (!cancelled) revealDestination();
        });
      });
    };

    const remaining = MIN_DISPLAY_MS - (Date.now() - shownAtRef.current);
    if (remaining > 0) {
      timeoutId = setTimeout(() => {
        if (!cancelled) confirmPaintThenReveal();
      }, remaining);
    } else {
      confirmPaintThenReveal();
    }

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [phase, pathname, isPending, revealDestination]);

  const beginTransition = useCallback(
    ({ href, label, icon, accent, textLight }) => {
      if (busyRef.current) return;

      if (prefersReducedMotion()) {
        router.push(href);
        return;
      }

      busyRef.current = true;
      startPathnameRef.current = pathname;
      shownAtRef.current = Date.now();

      setActive({
        label: label || DEFAULT_LABEL,
        icon: icon || DEFAULT_ICON,
        accent: accent || DEFAULT_ACCENT,
        textLight: !!textLight,
      });
      setPhase("waiting-for-ready");

      // Navigation fires immediately, alongside the overlay mounting —
      // the destination gets the full loading-screen window to load.
      startTransition(() => {
        router.push(href);
      });
    },
    [pathname, router, startTransition],
  );

  // Global click interception — this is what makes "every navigation"
  // actually true without every link in the app having to opt in by
  // hand. Runs on document in the bubble phase, so it always fires
  // AFTER React's own per-element onClick handlers (React's delegated
  // listeners sit on the app's root container, a descendant of
  // document, so they run first as the event bubbles up) — a handler
  // that already called preventDefault() (like the dashboard tiles'
  // own click handler) is correctly skipped via e.defaultPrevented.
  useEffect(() => {
    function handleDocumentClick(e) {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = e.target.closest("a[href]");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      let url;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;

      // `pathname` only reflects reality when nothing is pending — while
      // a transition is in flight it stays stuck at the ORIGINAL route
      // (React keeps the old tree mounted via startTransition until the
      // new one is ready). So this "same route, no-op" skip is only
      // safe to trust when we're not already busy; checking it
      // unconditionally let a same-target click during a pending
      // transition slip through without preventDefault(), handing the
      // click to Next's own <Link> handler and orphaning the original
      // transition's state forever (its readiness watcher would then
      // wait for pathname to move on from a route we'd already
      // returned to, which never happens).
      if (!busyRef.current && url.pathname === pathname) return;

      e.preventDefault();
      if (busyRef.current) return; // already mid-transition; swallow the click rather than race it

      router.prefetch(url.pathname);
      const label =
        anchor.getAttribute("data-nav-label") || cleanLabel(anchor.textContent) || DEFAULT_LABEL;
      beginTransition({ href: url.pathname + url.search, label });
    }

    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, [pathname, router, beginTransition]);

  // Browser back/forward — can't be prevented or wrapped in
  // beginTransition's own router.push (the browser's already committed
  // to the new history entry by the time we hear about it, and pushing
  // again would corrupt history). Instead this mounts the same overlay
  // directly and reuses the same readiness watcher above to reveal once
  // the route Next's router lands on actually settles — no navigation
  // call of our own is needed here, only tracking.
  //
  // Uses the Navigation API (`window.navigation`'s `navigate` event,
  // filtered to `navigationType === "traverse"`) rather than the legacy
  // `popstate` event — empirically, a `popstate` listener attached from
  // inside a React effect never actually ran for a back/forward
  // navigation in this app (confirmed via debug logging: Next's own
  // router-driven pathname update happened every time with zero calls
  // to our handler), while `window.navigation`'s `navigate` event fired
  // reliably and carries a `destination.url` we can read the target
  // route from before Next.js finishes rendering it. Feature-detected
  // since the Navigation API isn't supported everywhere (e.g. Firefox,
  // Safari) — those browsers simply don't get this specific enhancement
  // and back/forward behaves like a plain navigation with no overlay.
  useEffect(() => {
    if (typeof window === "undefined" || !window.navigation) return undefined;

    function handleNavigate(e) {
      if (e.navigationType !== "traverse") return; // only back/forward
      if (busyRef.current) return;
      if (prefersReducedMotion()) return;

      let newPath;
      try {
        newPath = new URL(e.destination.url).pathname;
      } catch {
        return;
      }
      if (newPath === pathname) return; // hash-only or no-op change

      busyRef.current = true;
      startPathnameRef.current = pathname;
      shownAtRef.current = Date.now();

      setActive({
        label: labelForPath(newPath),
        icon: DEFAULT_ICON,
        accent: DEFAULT_ACCENT,
        textLight: false,
      });
      setPhase("waiting-for-ready");
    }

    window.navigation.addEventListener("navigate", handleNavigate);
    return () => window.navigation.removeEventListener("navigate", handleNavigate);
  }, [pathname]);

  return (
    <NavigationLoadingContext.Provider value={{ beginTransition }}>
      {children}
      {active &&
        typeof document !== "undefined" &&
        createPortal(
          <NavigationLoadingOverlay
            label={active.label}
            icon={active.icon}
            accent={active.accent}
            textLight={active.textLight}
            overlayRef={overlayRef}
          />,
          document.body,
        )}
    </NavigationLoadingContext.Provider>
  );
}
