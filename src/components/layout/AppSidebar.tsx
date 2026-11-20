import { Link, useRouterState } from "@tanstack/react-router";
import {
  Atom,
  Bot,
  Compass,
  CookingPot,
  Home,
  HeartPulse,
  LayoutDashboard,
  Menu,
  PanelLeft,
  ShieldCheck,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useNoorControl, useNoorLesson } from "@/components/noor/NoorProvider";
import { DEFAULT_LESSON_ID, journeys } from "@/data/mockCurriculum";
import { useAuth } from "@/lib/auth";
import { useLang, type UiKey } from "@/lib/i18n";
import { SidebarProvider, useSidebar } from "./sidebar-context";

/** App pages that get the sidebar; the landing page and the auth page keep their own layout. */
const SIDEBAR_PATHS = ["/dashboard", "/lesson", "/admin"];

const isIn = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`);

/**
 * Wraps every page: adds the collapsible sidebar next to the page on app routes, and renders the
 * page untouched everywhere else. Hidden in the lesson's teacher board mode, like Noor.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lesson = useNoorLesson();
  const available = SIDEBAR_PATHS.some((p) => isIn(pathname, p)) && !lesson?.hidden;

  return (
    <SidebarProvider available={available} pathname={pathname}>
      {available ? (
        <div className="flex min-h-screen">
          <AppSidebar pathname={pathname} />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      ) : (
        children
      )}
    </SidebarProvider>
  );
}

/** The button that opens / collapses the sidebar; renders nothing on pages that have none. */
export function SidebarToggle() {
  const { t } = useLang();
  const { available, expanded, mobileOpen, isDesktop, toggle } = useSidebar();
  if (!available) return null;
  const open = isDesktop ? expanded : mobileOpen;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-controls="app-sidebar"
      aria-expanded={open}
      aria-label={t(open ? "sidebarCollapse" : "sidebarExpand")}
      title={t(open ? "sidebarCollapse" : "sidebarExpand")}
      className="glass flex size-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-accent/60"
    >
      <Menu className="size-4" />
    </button>
  );
}

const itemBase =
  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors";

function AppSidebar({ pathname }: { pathname: string }) {
  const { t, l } = useLang();
  const { user } = useAuth();
  const { setOpen: setNoorOpen } = useNoorControl();
  const { expanded, mobileOpen, isDesktop, toggle, closeMobile } = useSidebar();
  const search = useRouterState({ select: (s) => s.location.search }) as Record<string, unknown>;
  const lessonId = typeof search["id"] === "string" ? search["id"] : undefined;
  /** A journey's lesson is highlighted under "Exploration journeys", not under "Simulations". */
  const onJourney = isIn(pathname, "/lesson") && journeys.some((j) => j.lessonId === lessonId);
  const isActive = (base: string) => isIn(pathname, base) && !(base === "/lesson" && onJourney);

  /** Text next to the icon; icons-only (but still announced) when collapsed on desktop. */
  const label = (key: UiKey) => <span className={expanded ? "" : "lg:sr-only"}>{t(key)}</span>;
  const center = expanded ? "" : "lg:justify-center lg:px-0";
  const state = (active: boolean) =>
    active
      ? "bg-subject/15 text-subject"
      : "text-muted-foreground hover:bg-accent hover:text-foreground";

  const links: { to: "/dashboard" | "/lesson"; icon: LucideIcon; key: UiKey; base: string }[] = [
    { to: "/dashboard", icon: LayoutDashboard, key: "sbCurriculum", base: "/dashboard" },
    { to: "/lesson", icon: Atom, key: "sbSimulations", base: "/lesson" },
  ];
  const soon: { icon: LucideIcon; key: UiKey }[] = [{ icon: CookingPot, key: "sbKitchen" }];

  return (
    <>
      {mobileOpen && !isDesktop && (
        <div
          aria-hidden
          onClick={closeMobile}
          className="fixed inset-0 z-[45] bg-background/70 backdrop-blur-sm lg:hidden"
        />
      )}
      <aside
        id="app-sidebar"
        aria-label={t("sidebarLabel")}
        inert={!isDesktop && !mobileOpen}
        className={
          "glass-strong z-50 flex flex-col border-e border-border/60 transition-[width,transform] duration-300 " +
          "max-lg:fixed max-lg:inset-y-0 max-lg:start-0 max-lg:w-72 " +
          (mobileOpen
            ? "max-lg:translate-x-0 "
            : "max-lg:-translate-x-full max-lg:rtl:translate-x-full ") +
          "lg:sticky lg:top-0 lg:h-dvh lg:shrink-0 " +
          (expanded ? "lg:w-64" : "lg:w-[4.5rem]")
        }
      >
        <div
          className={"flex h-16 items-center gap-2 px-3 " + (expanded ? "" : "lg:justify-center")}
        >
          <span
            className={
              "flex-1 truncate px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground " +
              (expanded ? "" : "lg:hidden")
            }
          >
            {t("sidebarMenu")}
          </span>
          <button
            type="button"
            onClick={toggle}
            aria-label={t(
              isDesktop ? (expanded ? "sidebarCollapse" : "sidebarExpand") : "sidebarClose",
            )}
            title={t(isDesktop ? (expanded ? "sidebarCollapse" : "sidebarExpand") : "sidebarClose")}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <PanelLeft className="size-4 max-lg:hidden rtl:-scale-x-100" />
            <X className="size-4 lg:hidden" />
          </button>
        </div>

        <nav aria-label={t("sidebarLabel")} className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
          <section aria-labelledby="sb-learn">
            <h2
              id="sb-learn"
              className={
                "mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground " +
                (expanded ? "" : "lg:sr-only")
              }
            >
              {t("sbLearn")}
            </h2>
            <ul className="space-y-1">
              {links.map(({ to, icon: Icon, key, base }) => (
                <li key={key}>
                  <Link
                    {...(to === "/lesson" ? { to, search: { id: DEFAULT_LESSON_ID } } : { to })}
                    title={t(key)}
                    aria-current={isActive(base) ? "page" : undefined}
                    className={`${itemBase} ${center} ${state(isActive(base))}`}
                  >
                    <Icon className="size-5 shrink-0" />
                    {label(key)}
                  </Link>
                </li>
              ))}
              {soon.map(({ icon: Icon, key }) => (
                <li key={key}>
                  <span
                    aria-disabled="true"
                    title={`${t(key)} — ${t("sbSoon")}`}
                    className={`${itemBase} ${center} cursor-not-allowed text-muted-foreground/60`}
                  >
                    <Icon className="size-5 shrink-0" />
                    {label(key)}
                    <span
                      className={
                        "ms-auto rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold " +
                        (expanded ? "" : "lg:hidden")
                      }
                    >
                      {t("sbSoon")}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="sb-journeys">
            <h2
              id="sb-journeys"
              className={
                "mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground " +
                (expanded ? "" : "lg:sr-only")
              }
            >
              {t("sbJourneys")}
            </h2>
            <ul className="space-y-1">
              {journeys.map((j) => {
                const active = onJourney && lessonId === j.lessonId;
                return (
                  <li key={j.id}>
                    <Link
                      to="/lesson"
                      search={{ id: j.lessonId }}
                      title={`${l(j.title)} — ${l(j.tagline)}`}
                      aria-current={active ? "page" : undefined}
                      className={`${itemBase} ${center} ${state(active)}`}
                    >
                      <HeartPulse className="size-5 shrink-0 text-destructive" />
                      <span className={expanded ? "" : "lg:sr-only"}>{l(j.title)}</span>
                      <span
                        className={
                          "ms-auto rounded-full bg-subject/15 px-2 py-0.5 text-[10px] font-semibold text-subject " +
                          (expanded ? "" : "lg:hidden")
                        }
                      >
                        {t("sbNew")}
                      </span>
                    </Link>
                  </li>
                );
              })}
              <li>
                <span
                  aria-disabled="true"
                  title={`${t("sbMoreJourneys")} — ${t("sbSoon")}`}
                  className={`${itemBase} ${center} cursor-not-allowed text-muted-foreground/60`}
                >
                  <Compass className="size-5 shrink-0" />
                  {label("sbMoreJourneys")}
                  <span
                    className={
                      "ms-auto rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold " +
                      (expanded ? "" : "lg:hidden")
                    }
                  >
                    {t("sbSoon")}
                  </span>
                </span>
              </li>
            </ul>
          </section>

          <section aria-labelledby="sb-quick">
            <h2
              id="sb-quick"
              className={
                "mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground " +
                (expanded ? "" : "lg:sr-only")
              }
            >
              {t("sbQuick")}
            </h2>
            <ul className="space-y-1">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setNoorOpen(true);
                    closeMobile();
                  }}
                  title={t("sbNoor")}
                  className={`${itemBase} ${center} w-full ${state(false)}`}
                >
                  <Bot className="size-5 shrink-0 text-subject" />
                  {label("sbNoor")}
                </button>
              </li>
              <li>
                <Link
                  to="/"
                  title={t("sbHome")}
                  className={`${itemBase} ${center} ${state(false)}`}
                >
                  <Home className="size-5 shrink-0" />
                  {label("sbHome")}
                </Link>
              </li>
              <li>
                <Link
                  {...(user
                    ? { to: "/auth" }
                    : { to: "/auth", search: { mode: "signin" as const } })}
                  title={t(user ? "account" : "signIn")}
                  className={`${itemBase} ${center} ${state(false)}`}
                >
                  <UserRound className="size-5 shrink-0" />
                  {label(user ? "account" : "signIn")}
                </Link>
              </li>
              {user?.isAdmin && (
                <li>
                  <Link
                    to="/admin"
                    title={t("adminLink")}
                    aria-current={isIn(pathname, "/admin") ? "page" : undefined}
                    className={`${itemBase} ${center} ${state(isIn(pathname, "/admin"))}`}
                  >
                    <ShieldCheck className="size-5 shrink-0" />
                    {label("adminLink")}
                  </Link>
                </li>
              )}
            </ul>
          </section>
        </nav>
      </aside>
    </>
  );
}
