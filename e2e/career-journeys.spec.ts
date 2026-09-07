import { expect, test } from "@playwright/test";
import { readCareerSave } from './read-career-save';
import {
  chalkCatalog,
  cueMarketplaceCatalog,
  tipCatalog,
} from "../src/data/gameContent";
import { ACTIVE_SAVE_KEY, encodeCareerSave } from "../src/game/saveStorage";
import {
  advanceWeekState,
  buyChalkState,
  buyCueState,
  buyTipState,
  createNewCareerState,
  createStarterState,
  enterTournamentState,
  getNextEligibleTournament,
} from "../src/hooks/useGameState";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!window.sessionStorage.getItem("e2e-initialized")) {
      window.localStorage.clear();
      window.sessionStorage.setItem("e2e-initialized", "true");
    }
  });
});

test("creates a career through the visible setup flow and survives reload", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Your career starts here." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Continue Career/ }),
  ).toBeDisabled();
  await page.getByRole("button", { name: /New Career/ }).click();
  await expect(page).toHaveURL(/\/new-career/);
  await page.locator("input").nth(0).fill("Browser Journey");
  await page.getByLabel("Nationality").selectOption("New Zealand");
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("button", { name: /Start Career/ }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Browser Journey").first()).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Your career starts here." }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Continue Career/ }).click();
  await expect(page.getByText("Browser Journey").first()).toBeVisible();
});

test("creates and reloads a named save slot using real controls", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Demo Career/ }).click();
  await page.getByRole("button", { name: "Career and save options" }).click();
  await page.getByRole("link", { name: "Save Manager" }).click();
  await page.getByLabel("Save slot name").fill("E2E checkpoint");
  await page.getByRole("button", { name: /Create Copy/ }).click();
  await expect(page.getByText(/Created and switched to “E2E checkpoint”/)).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /Continue Career/ }).click();
  await page.getByRole("button", { name: "Career and save options" }).click();
  await page.getByRole("link", { name: "Save Manager" }).click();
  await expect(page.getByText("E2E checkpoint")).toBeVisible();
  await page.getByText("E2E checkpoint", { exact: true }).locator("../../..").getByRole("button", { name: "Load", exact: true }).click();
  await expect(page.getByText(/Loaded “E2E checkpoint”/)).toBeVisible();
});

test("shows player summary once in the global dashboard status bar", async ({
  page,
}) => {
  const demoPlayerName = createStarterState().player.fullName;
  await page.goto("/");
  await page.getByRole("button", { name: /Demo Career/ }).click();
  await expect(page.getByText(demoPlayerName, { exact: true })).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: /Open notifications/ }),
  ).toHaveCount(0);
  const sidebar = page.locator("aside").first();
  await expect(sidebar.getByRole("link", { name: "New Career" })).toHaveCount(
    0,
  );
  await expect(sidebar.getByRole("link", { name: "Save Manager" })).toHaveCount(
    0,
  );
  await expect(sidebar.getByText("Next Event", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Career and save options" }).click();
  await expect(page.getByRole("link", { name: "Save Manager" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Start New Career" }),
  ).toBeVisible();
  await expect(page.getByText("Current Ranking", { exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByText("Career Details", { exact: true })).toBeVisible();
});

test("inbox uses selected-message actions and persists read state", async ({
  page,
}) => {
  let career = buyTipState(
    buyChalkState(
      buyCueState(
        createNewCareerState({
          age: 16,
          startingLevelId: "start-club-junior",
        } as Parameters<typeof createNewCareerState>[0]),
        cueMarketplaceCatalog[0].id,
      ),
      chalkCatalog[0].id,
    ),
    tipCatalog[0].id,
  );
  const tournament = getNextEligibleTournament(career);
  expect(tournament).toBeDefined();
  if (!tournament) return;
  career = enterTournamentState(career, tournament.id);

  await page.addInitScript(
    ({ key, value }) => {
      if (!window.sessionStorage.getItem("inbox-career-seeded")) {
        window.localStorage.setItem(key, value);
        window.sessionStorage.setItem("inbox-career-seeded", "true");
      }
    },
    { key: ACTIVE_SAVE_KEY, value: JSON.stringify(career) },
  );
  await page.goto("/inbox");
  await page.getByRole("button", { name: /Continue Career/ }).click();
  await page.getByRole("navigation").getByRole("link", { name: /^Inbox/ }).click();

  await expect(
    page.getByRole("tablist", { name: "Inbox filters" }),
  ).toBeVisible();
  await expect(page.getByText("Latest News")).toHaveCount(0);
  await expect(page.getByText("Tournament Invite")).toHaveCount(0);
  await page
    .getByRole("button", { name: new RegExp(`Entered ${tournament.name}`) })
    .click();
  await expect(page.getByRole("button", { name: /Book Travel/ })).toBeVisible();
  await expect(page.getByText("Travel not booked")).toBeVisible();
  await page.getByRole("button", { name: /Book Travel/ }).click();
  await expect(page).toHaveURL(/\/travel/);

  await page.getByRole("navigation").getByRole("link", { name: /^Inbox/ }).click();
  await page.getByRole("button", { name: /Mark All Read/ }).click();
  await expect(page.getByText("0 unread")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open inbox (0 unread messages)" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Dashboard" }).click();
  await page.getByRole("navigation").getByRole("link", { name: /^Inbox/ }).click();
  await expect(page.getByText("0 unread")).toBeVisible();
  await expect.poll(async () => (await readCareerSave(page)).inbox.every(message => message.read)).toBe(true);
  await page.reload();
  await page.getByRole("button", { name: /Continue Career/ }).click();
  await page.getByRole("navigation").getByRole("link", { name: /^Inbox/ }).click();
  await expect(page.getByText("0 unread")).toBeVisible();
});

test("requires the end-of-season world report before starting the next season", async ({
  page,
}) => {
  const closingSeason = createStarterState();
  closingSeason.currentDate = "2027-06-29";
  const rolledSeason = advanceWeekState(closingSeason);
  expect(rolledSeason.seasonReview?.pending).toBe(true);

  await page.addInitScript(
    ({ key, value }) => window.localStorage.setItem(key, value),
    { key: ACTIVE_SAVE_KEY, value: encodeCareerSave(rolledSeason) },
  );
  await page.goto("/");
  await page.getByRole("button", { name: /Continue Career/ }).click();
  await expect(page).toHaveURL(/\/season-review/);
  await page.getByRole("dialog", { name: "2026/27 Season Review" }).getByRole("button", { name: "Full Season Review", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /End of Season Report/ }),
  ).toBeVisible();
  await expect(page.getByText("Career Status Decision")).toBeVisible();
  await expect(page.getByText("Major Tournament Winners")).toBeVisible();
  await expect(page.getByText("World Number One")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Retirements" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Start New Season" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: "Enter Tournament", exact: true })).toBeVisible();
  await page.getByRole("navigation").getByRole("link", { name: /^Inbox/ }).click();
  await expect(
    page.getByRole("button", { name: /Invitation:/ }).first(),
  ).toBeVisible();
});

test("enters, travels to, and completes every round of a tournament", async ({
  page,
}) => {
  test.setTimeout(240_000);
  const eliteCareer = buyTipState(
    buyChalkState(
      buyCueState(
        createNewCareerState({
          age: 25,
          startingLevelId: "start-top-16",
        } as Parameters<typeof createNewCareerState>[0]),
        cueMarketplaceCatalog[0].id,
      ),
      chalkCatalog[0].id,
    ),
    tipCatalog[0].id,
  );
  for (const group of Object.values(eliteCareer.attributes)) {
    for (const key of Object.keys(group)) group[key] = 99;
  }
  eliteCareer.player.confidence = 99;
  eliteCareer.player.morale = 99;
  eliteCareer.player.fatigue = 0;
  eliteCareer.tournaments = eliteCareer.tournaments.filter(t => t.name !== 'Championship League');
  const eliteTournament = getNextEligibleTournament(eliteCareer);
  expect(eliteTournament).toBeDefined();
  if (!eliteTournament) return;
  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    { key: ACTIVE_SAVE_KEY, value: JSON.stringify(eliteCareer) },
  );
  await page.goto("/tournaments/hub");
  await page.getByRole("button", { name: /Continue Career/ }).click();
  await page.getByRole("link", { name: "Tournament Hub" }).click();
  const primary = page
    .getByRole("button", {
      name: /Enter Tournament|Book Travel|Advance to Tournament|Play Next Match/,
    })
    .first();
  await expect(primary).toContainText("Enter Tournament");
  await primary.click();
  await expect(primary).toContainText("Book Travel");
  await primary.click();
  await expect(page).toHaveURL(/\/travel/);
  await page.getByRole("button", { name: "Confirm Travel" }).first().click();
  await expect(page).toHaveURL(/\/tournament\/preparation/);
  await page.getByRole("button", { name: "Confirm plan" }).click();
  await expect(page).toHaveURL(/\/match\/preview/);
  await page.getByRole("link", { name: "Tournament Hub" }).click();
  await expect(page).toHaveURL(/\/tournaments\/hub/);
  await expect(primary).toContainText("Advance to Tournament");
  await primary.click();
  await page.evaluate(() => {
    let randomIndex = 0;
    Math.random = () => {
      const value = ((randomIndex * 37) % 997) / 997;
      randomIndex += 1;
      return value * 0.5;
    };
  });

  let eventCompleted = false;
  for (let round = 0; round < 10; round += 1) {
    const quickSim = page.getByRole("button", { name: "Quick Sim" });
    await expect(quickSim).toBeEnabled();
    await quickSim.click();
    await expect(page).toHaveURL(/\/match\/result/);
    await expect(page.getByText("MATCH WON")).toBeVisible();
    const completedBracket = page.getByRole("button", {
      name: "View Completed Bracket",
    });
    if (await completedBracket.isVisible()) {
      eventCompleted = true;
      break;
    }
    await page.getByRole("button", { name: /Continue Tournament/ }).click();
    await expect(page).toHaveURL(/\/tournaments\/hub/);
  }

  expect(eventCompleted).toBe(true);
  await page.getByRole("button", { name: "Continue to match review", exact: true }).click();
  await expect(page.getByText(/Final/).first()).toBeVisible();
  await expect(page.getByText("Sponsor Bonus")).toBeVisible();
  await expect(page.getByText("Equipment Wear")).toBeVisible();
  await page.getByRole("button", { name: "View Completed Bracket" }).click();
  await expect(page).toHaveURL(/\/tournaments\/draw\?tournament=/);
  await expect(
    page.getByRole("heading", { name: "Completed Bracket" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back to Dashboard" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: "Enter Tournament", exact: true })).toBeVisible();
  await page.getByRole("navigation").getByRole("link", { name: /^Inbox/ }).click();
  await expect(
    page.getByRole("button", {
      name: new RegExp(`Champion: ${eliteTournament.name}`),
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Invitation:/ }).first(),
  ).toBeVisible();
});

test("live match is a score, tactics, and statistics workspace", async ({
  page,
}) => {
  const career = buyTipState(
    buyChalkState(
      buyCueState(
        createNewCareerState({
          age: 25,
          startingLevelId: "start-top-16",
        } as Parameters<typeof createNewCareerState>[0]),
        cueMarketplaceCatalog[0].id,
      ),
      chalkCatalog[0].id,
    ),
    tipCatalog[0].id,
  );
  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    { key: ACTIVE_SAVE_KEY, value: JSON.stringify(career) },
  );
  await page.goto("/");
  await page.getByRole("button", { name: /Continue Career/ }).click();
  await page.getByRole("link", { name: "Tournament Hub" }).click();
  const primary = page
    .getByRole("button", {
      name: /Enter Tournament|Book Travel|Advance to Tournament|Play Next Match/,
    })
    .first();
  await primary.click();
  await primary.click();
  await page.getByRole("button", { name: "Confirm Travel" }).first().click();
  await expect(page).toHaveURL(/\/tournament\/preparation/);
  await page.getByRole("button", { name: "Confirm plan" }).click();
  await expect(page).toHaveURL(/\/match\/preview/);
  await page.getByRole("link", { name: "Tournament Hub" }).click();
  await expect(page).toHaveURL(/\/tournaments\/hub/);
  await page.getByRole("button", { name: "Advance to Tournament" }).click();
  await page.getByRole("button", { name: "Play Next Match" }).click();
  await expect(page).toHaveURL(/\/match\/preview/);
  await page.getByRole("button", { name: "Start Match" }).click();
  await expect(page).toHaveURL(/\/match\/live/);
  await expect(page.getByTestId("live-match-score-centre")).toBeVisible();
  await expect(page.getByTestId("frame-tactics")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Frame Statistics" }),
  ).toBeVisible();
  await expect(page.getByRole("tab", { name: "Match Stats" })).toBeVisible();
  await expect(page.locator('[title="Red"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Auto Play/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Sim Frame/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Sim Match/ })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Play Shot|Play Safe|Build Break/ }),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Safety", exact: true }).click();
  await page.getByRole("button", { name: "Deliberate", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Safety", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Deliberate", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByText("Defensive bias; good potting chances are still taken."),
  ).toBeVisible();

  await page.getByRole("button", { name: /^Auto Play/ }).click();
  await expect(
    page.getByRole("button", { name: /^Pause Auto Play/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect.poll(async () => {
    const liveMatch = (await readCareerSave(page)).liveMatch;
    return Boolean(liveMatch && liveMatch.playerStats.visits + liveMatch.opponentStats.visits > 0);
  }).toBe(true);
  await page.getByRole("button", { name: /^Pause Auto Play/ }).click();
  await expect(page.getByTestId("frame-log-current-break")).toBeVisible();

  await page.getByRole("button", { name: "Attack", exact: true }).click();
  await page.getByRole("button", { name: "Confident", exact: true }).click();
  await page.getByRole("button", { name: "Quick", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Attack", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Confident", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Quick", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: /^Sim Frame/ }).click();
  await expect
    .poll(() =>
      page
        .getByTestId("frame-log")
        .evaluate(
          (element) =>
            element.scrollHeight - element.scrollTop - element.clientHeight,
        ),
    )
    .toBeLessThanOrEqual(1);
  await page.getByRole("tab", { name: "Frames" }).click();
  await expect(
    page.getByText("Attack · Confident · Quick").first(),
  ).toBeVisible();
  await expect.poll(async () => {
    const liveMatch = (await readCareerSave(page)).liveMatch;
    return Boolean(liveMatch && liveMatch.playerStats.visits + liveMatch.opponentStats.visits > 0);
  }).toBe(true);
});
