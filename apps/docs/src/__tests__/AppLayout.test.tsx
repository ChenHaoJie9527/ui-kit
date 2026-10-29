import { act } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppLayout } from "../App";

function TestPage({ children }: { children: string }) {
  return <p>{children}</p>;
}

describe("AppLayout page transitions", () => {
  beforeEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it("replaces an unfinished page instead of animating both pages", async () => {
    const router = createMemoryRouter(
      [
        {
          path: "/",
          element: <AppLayout />,
          children: [
            { index: true, element: <TestPage>Overview page</TestPage> },
            {
              path: "hooks/use-list",
              element: <TestPage>List page</TestPage>,
            },
            {
              path: "hooks/use-observable",
              element: <TestPage>Observable page</TestPage>,
            },
          ],
        },
      ],
      { initialEntries: ["/"] },
    );
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<RouterProvider router={router} />);
    });

    await act(async () => {
      await router.navigate("/hooks/use-list");
    });
    await act(async () => {
      await router.navigate("/hooks/use-observable");
    });

    const currentPages = document.querySelectorAll<HTMLElement>(
      '[data-page-kind="current"]',
    );
    const basePage = document.querySelector<HTMLElement>(
      '[data-page-kind="base"]',
    );

    expect(currentPages).toHaveLength(1);
    expect(currentPages[0]?.dataset.pageRoute).toBe("hooks/use-observable");
    expect(currentPages[0]?.dataset.transitioning).toBe("true");
    expect(currentPages[0]?.textContent).toContain("Observable page");
    expect(basePage?.dataset.pageRoute).toBe("overview");
    expect(basePage?.hasAttribute("inert")).toBe(true);
    expect(basePage?.getAttribute("aria-hidden")).toBe("true");
    expect(document.body.textContent).not.toContain("List page");

    await act(async () => {
      currentPages[0]?.dispatchEvent(
        new Event("animationend", { bubbles: true }),
      );
    });

    expect(document.querySelectorAll('[data-page-kind="base"]')).toHaveLength(
      0,
    );
    expect(
      document
        .querySelector('[data-page-kind="current"]')
        ?.getAttribute("data-transitioning"),
    ).toBe("false");

    await act(async () => {
      root.unmount();
    });
  });
});

describe("AppLayout footer", () => {
  beforeEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it("links the ICP filing number to the MIIT registry", async () => {
    const router = createMemoryRouter([
      {
        path: "/",
        element: <AppLayout />,
        children: [
          { index: true, element: <TestPage>Overview page</TestPage> },
        ],
      },
    ]);
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<RouterProvider router={router} />);
    });

    const icpLink = document.querySelector<HTMLAnchorElement>(
      'a[href="https://beian.miit.gov.cn/"]',
    );
    expect(icpLink?.textContent).toBe("粤ICP备2026167457号-1");
    expect(icpLink?.target).toBe("_blank");
    expect(icpLink?.rel).toBe("noreferrer");

    await act(async () => {
      root.unmount();
    });
  });
});
