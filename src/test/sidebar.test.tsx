import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell, SidebarToggle } from "@/components/layout/AppSidebar";
import { NoorProvider, useNoorOpen } from "@/components/noor/NoorProvider";
import { LanguageProvider } from "@/lib/i18n";

const KEY = "labx.sidebar.v1";

function setViewport(desktop: boolean) {
  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({
        matches: desktop,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  );
}

function NoorProbe() {
  return <span data-testid="noor-open">{String(useNoorOpen())}</span>;
}

async function mount(path: string) {
  const root = createRootRoute({
    component: () => (
      <LanguageProvider>
        <NoorProvider>
          <AppShell>
            <SidebarToggle />
            <Outlet />
          </AppShell>
          <NoorProbe />
        </NoorProvider>
      </LanguageProvider>
    ),
  });
  const page = (p: string) =>
    createRoute({ getParentRoute: () => root, path: p, component: () => <p>page {p}</p> });
  const router = createRouter({
    routeTree: root.addChildren([page("/"), page("/dashboard"), page("/lesson"), page("/auth")]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.lang = "ar";
  document.documentElement.dir = "rtl";
  setViewport(true);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Collapsible sidebar", () => {
  it("shows the sections on app pages and nothing on the landing page", async () => {
    await mount("/dashboard");
    const side = screen.getByRole("complementary", { name: "التنقل الرئيسي" });
    const nav = within(side);
    expect(nav.getByRole("link", { name: "لوحة المنهج والدروس" }).getAttribute("href")).toBe(
      "/dashboard",
    );
    expect(nav.getByRole("link", { name: "المحاكاة التفاعلية" }).getAttribute("href")).toMatch(
      /^\/lesson\?id=/,
    );
    // Future sections are visible but not navigable.
    for (const name of ["رحلات جديدة", "المطبخ الكيميائي"]) {
      expect(nav.queryByRole("link", { name })).toBeNull();
      expect(nav.getByText(name).closest("[aria-disabled='true']")).not.toBeNull();
    }
    // The adrenaline journey is a real, clearly labelled entry under "Exploration journeys".
    expect(nav.getByRole("heading", { name: "رحلات الاستكشاف" })).toBeTruthy();
    expect(nav.getByRole("link", { name: /رحلة الأدرينالين والقلب/ }).getAttribute("href")).toBe(
      "/lesson?id=g12-biology-u4-l1",
    );
    expect(nav.getByRole("button", { name: "اسأل نور" })).toBeTruthy();
    expect(
      nav.getByRole("link", { name: "لوحة المنهج والدروس" }).getAttribute("aria-current"),
    ).toBe("page");

    cleanup();
    await mount("/");
    expect(screen.queryByRole("complementary")).toBeNull();
    expect(screen.queryByRole("button", { name: /الشريط الجانبي/ })).toBeNull();
  });

  it("collapses to icons only, expands again, and remembers the choice", async () => {
    await mount("/dashboard");
    const side = () => screen.getByRole("complementary", { name: "التنقل الرئيسي" });
    expect(side().className).toContain("lg:w-64");

    // Two buttons share the label: the page-level one and the one in the sidebar header.
    expect(screen.getAllByRole("button", { name: "طي الشريط الجانبي" })).toHaveLength(2);
    fireEvent.click(screen.getAllByRole("button", { name: "طي الشريط الجانبي" })[0]!);
    expect(side().className).toContain("lg:w-[4.5rem]");
    expect(window.localStorage.getItem(KEY)).toBe("0");
    // Collapsed still exposes accessible names for the icons.
    expect(within(side()).getByRole("link", { name: "لوحة المنهج والدروس" })).toBeTruthy();

    cleanup();
    await mount("/dashboard");
    expect(side().className).toContain("lg:w-[4.5rem]");

    fireEvent.click(screen.getAllByRole("button", { name: "فتح الشريط الجانبي" })[0]!);
    expect(side().className).toContain("lg:w-64");
    expect(window.localStorage.getItem(KEY)).toBe("1");
  });

  it("ignores a corrupt saved value, and starts collapsed in a lesson only when nothing is saved", async () => {
    window.localStorage.setItem(KEY, "banana");
    await mount("/dashboard");
    expect(screen.getByRole("complementary").className).toContain("lg:w-64");

    cleanup();
    window.localStorage.clear();
    await mount("/lesson");
    expect(screen.getByRole("complementary").className).toContain("lg:w-[4.5rem]");

    cleanup();
    window.localStorage.setItem(KEY, "1");
    await mount("/lesson");
    expect(screen.getByRole("complementary").className).toContain("lg:w-64");
  });

  it("is an off-canvas drawer on small screens: closed by default, Esc and links close it", async () => {
    setViewport(false);
    await mount("/dashboard");
    const side = () => screen.getByRole("complementary", { hidden: true });
    expect(side().hasAttribute("inert")).toBe(true);

    fireEvent.click(screen.getAllByRole("button", { name: "فتح الشريط الجانبي" })[0]!);
    expect(side().hasAttribute("inert")).toBe(false);
    expect(window.localStorage.getItem(KEY)).toBeNull(); // the drawer is never persisted

    fireEvent.keyDown(document, { key: "Escape" });
    expect(side().hasAttribute("inert")).toBe(true);

    fireEvent.click(screen.getAllByRole("button", { name: "فتح الشريط الجانبي" })[0]!);
    await act(async () => {
      fireEvent.click(screen.getByRole("link", { name: "المحاكاة التفاعلية" }));
    });
    expect(side().hasAttribute("inert")).toBe(true);
  });

  it("opens Noor from the quick-access button", async () => {
    await mount("/dashboard");
    expect(screen.getByTestId("noor-open").textContent).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "اسأل نور" }));
    expect(screen.getByTestId("noor-open").textContent).toBe("true");
  });
});

describe("Journey entry in the sidebar", () => {
  it("highlights the journey, not the generic simulations link, while its lesson is open", async () => {
    await mount("/lesson?id=g12-biology-u4-l1");
    const side = within(screen.getByRole("complementary", { name: "التنقل الرئيسي" }));
    expect(
      side.getByRole("link", { name: /رحلة الأدرينالين والقلب/ }).getAttribute("aria-current"),
    ).toBe("page");
    expect(
      side.getByRole("link", { name: "المحاكاة التفاعلية" }).getAttribute("aria-current"),
    ).toBeNull();

    cleanup();
    await mount("/lesson?id=g12-physics-u1-l2");
    const other = within(screen.getByRole("complementary", { name: "التنقل الرئيسي" }));
    expect(
      other.getByRole("link", { name: "المحاكاة التفاعلية" }).getAttribute("aria-current"),
    ).toBe("page");
  });
});
