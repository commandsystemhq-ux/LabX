import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * State of the collapsible app sidebar. Desktop (lg+): in the page flow, expanded (icons + text) or
 * collapsed (icons only), remembered in localStorage. Smaller screens: an off-canvas drawer that
 * is never persisted and closes on navigation / Esc.
 */

const STORAGE_KEY = "labx.sidebar.v1";
const DESKTOP_QUERY = "(min-width: 1024px)";

interface SidebarValue {
  /** False on pages without a sidebar (landing, auth, teacher board mode). */
  available: boolean;
  expanded: boolean;
  mobileOpen: boolean;
  isDesktop: boolean;
  toggle: () => void;
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarValue>({
  available: false,
  expanded: true,
  mobileOpen: false,
  isDesktop: true,
  toggle: () => {},
  closeMobile: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export function SidebarProvider({
  available,
  pathname,
  children,
}: {
  available: boolean;
  pathname: string;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const firstPath = useRef(pathname);

  // Read the saved preference after mount (no hydration mismatch). Only "0" / "1" are trusted;
  // with nothing saved, the lesson workspace starts collapsed to leave room for the simulation.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "0") setExpanded(false);
      else if (saved === "1") setExpanded(true);
      else if (firstPath.current.startsWith("/lesson")) setExpanded(false);
    } catch {
      /* storage blocked: keep the default */
    }
  }, []);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      setIsDesktop(true);
      return;
    }
    const query = window.matchMedia(DESKTOP_QUERY);
    const sync = () => setIsDesktop(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  const drawerOpen = mobileOpen && !isDesktop && available;
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  const toggle = useCallback(() => {
    if (isDesktop) {
      const next = !expanded;
      setExpanded(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* storage blocked: the toggle still works for this visit */
      }
    } else {
      setMobileOpen((open) => !open);
    }
  }, [isDesktop, expanded]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const value = useMemo<SidebarValue>(
    () => ({ available, expanded, mobileOpen, isDesktop, toggle, closeMobile }),
    [available, expanded, mobileOpen, isDesktop, toggle, closeMobile],
  );
  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}
