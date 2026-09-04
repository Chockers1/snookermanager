import { expect, test, type Page } from "@playwright/test";
import { ACTIVE_SAVE_KEY } from "../src/game/saveStorage";
import {
  bookTravelState,
  continueToNextTournamentState,
  createStarterState,
  enterTournamentState,
  getNextEligibleTournament,
  simulateTournamentMatchState,
  startLiveMatchState,
} from "../src/hooks/useGameState";

const viewports = [
  { name: "desktop", width: 1920, height: 1080 },
  { name: "laptop", width: 1280, height: 720 },
  { name: "ipad-landscape", width: 1024, height: 768 },
  { name: "ipad-portrait", width: 768, height: 1024 },
  { name: "phone", width: 390, height: 844 },
  { name: "small-phone", width: 320, height: 568 },
];

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth - document.body.clientWidth,
    document:
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  }));
  expect(
    overflow.body,
    `body overflowed by ${overflow.body}px`,
  ).toBeLessThanOrEqual(1);
  expect(
    overflow.document,
    `document overflowed by ${overflow.document}px`,
  ).toBeLessThanOrEqual(1);
}

for (const viewport of viewports) {
  test(`${viewport.name} keeps launcher and tournament controls usable`, async ({
    page,
  }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.addInitScript(
      ({ key, value }) => {
        window.localStorage.clear();
        window.localStorage.setItem(key, value);
      },
      { key: ACTIVE_SAVE_KEY, value: JSON.stringify(createStarterState()) },
    );

    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Your career starts here." }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.getByRole("button", { name: /Continue Career/ }).click();
    if (viewport.width < 1280)
      await page.getByRole("button", { name: "Open navigation" }).click();
    await page.getByRole("link", { name: "Tournament Hub" }).click();
    await expect(page.getByText("Tournament Hub").first()).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: /Enter Tournament|Book Travel|Advance to Tournament|Play Next Match|Open Equipment/,
      }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    if (viewport.width < 1280)
      await expect(
        page.getByRole("button", { name: "Open navigation" }),
      ).toBeVisible();
  });
}

test("laptop hub keeps the match action and live bracket in view", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  let career = createStarterState();
  const tournament = getNextEligibleTournament(career);
  expect(tournament).toBeDefined();
  if (!tournament) return;
  career = enterTournamentState(career, tournament.id);
  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.clear();
      window.localStorage.setItem(key, value);
    },
    { key: ACTIVE_SAVE_KEY, value: JSON.stringify(career) },
  );

  await page.goto("/");
  await page.getByRole("button", { name: /Continue Career/ }).click();
  await page.evaluate(() => {
    window.history.pushState({}, "", "/tournaments/hub");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });

  const primaryAction = page.getByRole("button", {
    name: /Book Travel|Advance to Tournament|Play Next Match|Open Equipment/,
  });
  await expect(primaryAction).toBeVisible();
  await expect(primaryAction).toBeInViewport();
  await expect(
    page.getByRole("heading", { name: "Tournament Bracket" }),
  ).toBeInViewport();
  await expect(page.getByTestId("tournament-bracket")).toBeVisible();
  await expect(page.getByLabel(/Last 16 bracket/)).toBeVisible();
  await expect(
    page.getByText(career.player.fullName, { exact: true }).last(),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);

  const mainOverflow = await page
    .locator("#main-content")
    .evaluate((main) => main.scrollHeight - main.clientHeight);
  expect(
    mainOverflow,
    `hub page scrolled by ${mainOverflow}px`,
  ).toBeLessThanOrEqual(1);
});

test("laptop match preview keeps symmetrical profiles and the tactical plan visible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  let career = createStarterState();
  const tournament = getNextEligibleTournament(career);
  expect(tournament).toBeDefined();
  if (!tournament) return;
  career = enterTournamentState(career, tournament.id);
  career = continueToNextTournamentState(career);
  career = bookTravelState(career, tournament.id);

  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.clear();
      window.localStorage.setItem(key, value);
    },
    { key: ACTIVE_SAVE_KEY, value: JSON.stringify(career) },
  );
  await page.goto("/");
  await page.getByRole("button", { name: /Continue Career/ }).click();
  await page.evaluate(() => {
    window.history.pushState({}, "", "/match/preview");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });

  const playerProfile = page.getByLabel("Player profile");
  const opponentProfile = page.getByLabel("Opponent profile");
  for (const profile of [playerProfile, opponentProfile]) {
    await expect(
      profile.getByText("Confidence", { exact: true }),
    ).toBeVisible();
    await expect(profile.getByText("Fatigue", { exact: true })).toBeVisible();
    await expect(profile.getByText("Pressure", { exact: true })).toBeVisible();
  }

  const tacticalPlan = page.getByTestId("tactical-plan");
  await expect(tacticalPlan).toBeInViewport();
  const tacticalOverflow = await tacticalPlan.evaluate(
    (element) => element.scrollHeight - element.clientHeight,
  );
  expect(tacticalOverflow).toBeLessThanOrEqual(1);
  await expectNoHorizontalOverflow(page);
});

for (const viewport of viewports) {
  test(`${viewport.name} keeps live scores, tactics, and statistics usable`, async ({
    page,
  }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    let career = createStarterState();
    const tournament = getNextEligibleTournament(career);
    expect(tournament).toBeDefined();
    if (!tournament) return;
    career = enterTournamentState(career, tournament.id);
    career = continueToNextTournamentState(career);
    career = bookTravelState(career, tournament.id);
    career = startLiveMatchState(career, tournament.id);
    expect(career.liveMatch).not.toBeNull();

    await page.addInitScript(
      ({ key, value }) => {
        window.localStorage.clear();
        window.localStorage.setItem(key, value);
      },
      { key: ACTIVE_SAVE_KEY, value: JSON.stringify(career) },
    );
    await page.goto("/");
    await page.getByRole("button", { name: /Continue Career/ }).click();
    await page.evaluate(() => {
      window.history.pushState({}, "", "/match/live");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await expect(page.getByTestId("live-match-score-centre")).toBeVisible();
    await expect(page.getByText("Match Score", { exact: true })).toBeVisible();
    await expect(page.getByTestId("frame-tactics")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Frame Statistics" }),
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: "Match Stats" })).toBeVisible();
    await page.getByRole("button", { name: "Safety", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Safety", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expectNoHorizontalOverflow(page);
  });
}

for (const viewport of [
  { name: "tablet-routes", width: 768, height: 1024 },
  { name: "phone-routes", width: 390, height: 844 },
]) {
  test(`${viewport.name} keeps management routes inside the viewport`, async ({
    page,
  }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.addInitScript(
      ({ key, value }) => {
        window.localStorage.clear();
        window.localStorage.setItem(key, value);
      },
      { key: ACTIVE_SAVE_KEY, value: JSON.stringify(createStarterState()) },
    );
    await page.goto("/");
    await page.getByRole("button", { name: /Continue Career/ }).click();

    for (const route of [
      "/",
      "/training",
      "/finance",
      "/equipment/cues",
      "/calendar",
      "/tournaments/hub",
      "/rankings",
      "/sponsorship",
      "/inbox",
      "/mental",
      "/health",
      "/saves",
      "/career/progression",
    ]) {
      await page.evaluate((path) => {
        window.history.pushState({}, "", path);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }, route);
      await expect(page.locator("#main-content")).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  });
}

for (const viewport of [
  { name: "laptop-support", width: 1280, height: 720, fitted: true },
  { name: "ipad-support", width: 768, height: 1024, fitted: false },
]) {
  test(`${viewport.name} keeps mental and health workspaces usable`, async ({
    page,
  }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.addInitScript(
      ({ key, value }) => {
        window.localStorage.clear();
        window.localStorage.setItem(key, value);
      },
      { key: ACTIVE_SAVE_KEY, value: JSON.stringify(createStarterState()) },
    );
    await page.goto("/");
    await page.getByRole("button", { name: /Continue Career/ }).click();

    for (const route of ["/mental", "/health"]) {
      await page.evaluate((path) => {
        window.history.pushState({}, "", path);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }, route);
      await expect(
        page.getByRole("heading", {
          name: route === "/mental" ? "Mental State" : "Health Centre",
          exact: true,
        }),
      ).toBeVisible();
      await expect(page.locator("#main-content")).toBeVisible();
      await expectNoHorizontalOverflow(page);

      const scrollState = await page
        .locator("#main-content")
        .evaluate((main) => ({
          overflowY: getComputedStyle(main).overflowY,
          scrollRange: main.scrollHeight - main.clientHeight,
        }));
      expect(["auto", "scroll"]).toContain(scrollState.overflowY);
      if (viewport.fitted) {
        expect(scrollState.scrollRange).toBeLessThanOrEqual(1);
        const horizontalFit = await page.evaluate(
          (testId) => {
            const main = document.querySelector<HTMLElement>("#main-content");
            const workspace = document.querySelector<HTMLElement>(
              `[data-testid="${testId}"]`,
            );
            if (!main || !workspace) return null;
            return {
              mainRight: Math.round(main.getBoundingClientRect().right),
              workspaceRight: Math.round(
                workspace.getBoundingClientRect().right,
              ),
            };
          },
          route === "/mental" ? "mental-viewport" : "health-viewport",
        );
        expect(horizontalFit).not.toBeNull();
        expect(horizontalFit?.workspaceRight).toBe(horizontalFit?.mainRight);
      } else {
        expect(scrollState.scrollRange).toBeGreaterThan(0);
        await page.locator("footer").last().scrollIntoViewIfNeeded();
      }
      await expect(page.locator("footer").last()).toBeInViewport();
    }
  });
}

test("Play Next Match opens preview before the live match", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  let career = createStarterState();
  const tournament = getNextEligibleTournament(career);
  expect(tournament).toBeDefined();
  if (!tournament) return;
  career = enterTournamentState(career, tournament.id);
  career = continueToNextTournamentState(career);
  career = bookTravelState(career, tournament.id);
  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.clear();
      window.localStorage.setItem(key, value);
    },
    { key: ACTIVE_SAVE_KEY, value: JSON.stringify(career) },
  );
  await page.goto("/");
  await page.getByRole("button", { name: /Continue Career/ }).click();
  await page.evaluate(() => {
    window.history.pushState({}, "", "/tournaments/hub");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });

  await page.getByRole("button", { name: "Play Next Match" }).click();
  await expect(page).toHaveURL(/\/match\/preview/);
  await expect(
    page.getByRole("heading", { name: "Match Preview" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start Match" }).click();
  await expect(page).toHaveURL(/\/match\/live/);
  await expect(page.getByTestId("live-match-score-centre")).toBeVisible();
});

for (const viewport of [
  { name: "laptop-inbox", width: 1280, height: 720 },
  { name: "ipad-inbox", width: 768, height: 1024 },
  { name: "small-phone-inbox", width: 320, height: 568 },
]) {
  test(`${viewport.name} confines scrolling to the inbox panes`, async ({
    page,
  }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    const inboxCareer = createStarterState();
    inboxCareer.inbox = Array.from({ length: 18 }, (_, index) => ({
      ...inboxCareer.inbox[index % inboxCareer.inbox.length],
      id: `responsive-inbox-${index}`,
      subject: `Career message ${index + 1}`,
    }));
    await page.addInitScript(
      ({ key, value }) => {
        window.localStorage.clear();
        window.localStorage.setItem(key, value);
      },
      { key: ACTIVE_SAVE_KEY, value: JSON.stringify(inboxCareer) },
    );

    await page.goto("/");
    await page.getByRole("button", { name: /Continue Career/ }).click();
    await page.evaluate(() => {
      window.history.pushState({}, "", "/inbox");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    await expect(
      page.getByRole("heading", { name: "Inbox", exact: true }),
    ).toBeVisible();

    const layout = await page.evaluate(() => {
      const main = document.querySelector<HTMLElement>("#main-content");
      const messages = document.querySelector<HTMLElement>(
        '[aria-label="Inbox messages"]',
      );
      if (!main || !messages) return null;
      return {
        mainOverflow: main.scrollHeight - main.clientHeight,
        messageOverflow: messages.scrollHeight - messages.clientHeight,
        messageOverflowY: getComputedStyle(messages).overflowY,
      };
    });

    expect(layout).not.toBeNull();
    expect(layout?.mainOverflow).toBeLessThanOrEqual(1);
    expect(layout?.messageOverflow).toBeGreaterThan(0);
    expect(layout?.messageOverflowY).toBe("auto");
    await expectNoHorizontalOverflow(page);
  });
}

test("equipment categories share one responsive workspace", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.clear();
      window.localStorage.setItem(key, value);
    },
    { key: ACTIVE_SAVE_KEY, value: JSON.stringify(createStarterState()) },
  );

  await page.goto("/");
  await page.getByRole("button", { name: /Continue Career/ }).click();
  await page.evaluate(() => {
    window.history.pushState({}, "", "/equipment/cues");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });

  const categories = [
    { name: "Cues", path: "/equipment/cues" },
    { name: "Chalk", path: "/equipment/chalk-tips#chalk" },
    { name: "Tips", path: "/equipment/chalk-tips#tips" },
    { name: "Cases", path: "/equipment/cases" },
    { name: "Training Facility", path: "/equipment/table-setup" },
    { name: "Maintenance", path: "/equipment/maintenance" },
  ];

  for (const category of categories) {
    await page.getByRole("tab", { name: category.name, exact: true }).click();
    await expect(page).toHaveURL(
      new RegExp(`${category.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
    );
    await expect(page.getByRole("heading", { name: "Cue Shop" })).toBeVisible();
    await expect(
      page.getByText("Equipment marketplace and current setup management."),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sort: Performance" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "All Items" })).toBeVisible();
    await expect(
      page.getByRole("tab", { name: category.name, exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    await expectNoHorizontalOverflow(page);
  }
});

for (const viewport of [
  { name: "laptop-training", width: 1280, height: 720 },
  { name: "ipad-training", width: 768, height: 1024 },
  { name: "phone-training", width: 390, height: 844 },
]) {
  test(`${viewport.name} keeps focus presets and the editable week usable`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(
      ({ key, value }) => {
        window.localStorage.clear();
        window.localStorage.setItem(key, value);
      },
      { key: ACTIVE_SAVE_KEY, value: JSON.stringify(createStarterState()) },
    );
    await page.goto("/");
    await page.getByRole("button", { name: /Continue Career/ }).click();
    await page.evaluate(() => {
      window.history.pushState({}, "", "/training");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await expect(
      page.getByRole("heading", { name: "Build This Week" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Potting & Scoring/ }),
    ).toBeVisible();
    await page.getByRole("button", { name: /Recovery Freshness/ }).click();
    await expect(
      page.getByRole("button", { name: /Recovery Freshness/ }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("Expected Development")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
}

test("completed match review opens the matching resolved bracket", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  let career = createStarterState();
  const tournament = getNextEligibleTournament(career);
  expect(tournament).toBeDefined();
  if (!tournament) return;
  career = enterTournamentState(career, tournament.id);
  career = continueToNextTournamentState(career);
  career = bookTravelState(career, tournament.id);
  let randomState = 90210;
  const originalRandom = Math.random;
  Math.random = () => {
    randomState = (randomState * 16807) % 2147483647;
    return (randomState - 1) / 2147483646;
  };
  career = simulateTournamentMatchState(
    { ...career, player: { ...career.player, confidence: 25, fatigue: 100 } },
    tournament.id,
  );
  Math.random = originalRandom;
  expect(
    career.tournaments.find((event) => event.id === tournament.id)?.status,
  ).toBe("Completed");

  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.clear();
      window.localStorage.setItem(key, value);
    },
    { key: ACTIVE_SAVE_KEY, value: JSON.stringify(career) },
  );
  await page.goto("/");
  await page.getByRole("button", { name: /Continue Career/ }).click();
  await page.evaluate(() => {
    window.history.pushState({}, "", "/match/result");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(
    page.getByRole("heading", { name: "Match Review" }),
  ).toBeVisible();
  await expect(page.getByText("Attribute development")).toBeVisible();
  await page
    .getByRole("button", { name: /View Completed Bracket/ })
    .first()
    .click();
  await expect(page).toHaveURL(
    new RegExp(`/tournaments/draw\\?tournament=${tournament.id}`),
  );
  await expect(
    page.getByRole("heading", { name: tournament.name }),
  ).toBeVisible();
  await expect(page.getByLabel("Completed event summary")).toBeVisible();
  await expect(page.getByText("Completed Bracket")).toBeVisible();
  await expect(page.getByText("Champion").first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

for (const viewport of viewports) {
  test(`${viewport.name} fits the complete travel planner without page scrolling`, async ({
    page,
  }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    const career = createStarterState();
    const tournament = getNextEligibleTournament(career);
    if (tournament) tournament.status = "Entered";
    await page.addInitScript(
      ({ key, value }) => {
        window.localStorage.clear();
        window.localStorage.setItem(key, value);
      },
      { key: ACTIVE_SAVE_KEY, value: JSON.stringify(career) },
    );

    await page.goto("/");
    await page.getByRole("button", { name: /Continue Career/ }).click();
    await page.evaluate(() => {
      window.history.pushState({}, "", "/travel");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await expect(page.getByTestId("travel-planner-viewport")).toBeVisible();
    await expect(page.getByRole("button", { name: "Auto Plan" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Finance" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Confirm Travel" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Match Preview" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Back To Calendar" }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const overflow = await page.evaluate(() => {
      const main = document.querySelector<HTMLElement>("#main-content");
      const planner = document.querySelector<HTMLElement>(
        '[data-testid="travel-planner-viewport"]',
      );
      return {
        main: main ? main.scrollHeight - main.clientHeight : 999,
        planner: planner ? planner.scrollHeight - planner.clientHeight : 999,
      };
    });
    expect(
      overflow.main,
      `main scrolled by ${overflow.main}px`,
    ).toBeLessThanOrEqual(1);
    expect(
      overflow.planner,
      `planner overflowed by ${overflow.planner}px`,
    ).toBeLessThanOrEqual(1);
  });
}
