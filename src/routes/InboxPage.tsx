import { PlayerNames } from '../components/game/PlayerNames';
import { pendingStory } from '../game/careerDepth/shared';
import { SeasonLifeInbox } from '../components/career/SeasonLifePanels';
import { InboxReportSummary } from '../components/game/InboxReportSummary';
import { captureVictoryMessages, victoryMessageTitle, victoryMessagePreview } from '../game/victoryInbox';
import { qualificationReportForMessage } from '../game/qualificationReport';
import { formatInboxConfidence, formatInboxTrainingReport } from '../utils/inboxFormatting';
import { SeasonTourChangesReport } from '../components/game/SeasonTourChangesReport';
import { TournamentHistoryBriefing } from '../components/game/TournamentHistoryBriefing';
import { seasonStartReportForMessage } from '../game/seasonStartReport';
import { SeasonStartReport } from '../components/game/SeasonStartReport';
import { ActionBlockerNotice } from '../components/game/ActionBlockerNotice';
import { getTournamentEntryAccess, tournamentEntryBlocker } from '../hooks/useGameState';
import { seasonReportForMessage } from '../game/seasonEndReport';
import { SeasonEndReport } from '../components/game/SeasonEndReport';
import { financialReportForMessage } from '../game/eventFinancialReport';
import { PostEventReport } from '../components/game/PostEventReport';
import { useMemo, useState } from "react";
import { StoryDecisionPanel } from "../components/career/CareerDepthPanels";
import { WorldDigestPanel } from '../components/career/RealismPanels';
import {
  Check,
  ChevronRight,
  Clock3,
  Mail,
  MailOpen,
  MapPin,
  Trophy,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGame } from "../context/useGame";
import type { InboxMessage } from "../types/game";

type InboxFilter = "All" | "Unread" | "High Priority" | "Staff" | "Events";

function priorityClass(priority: InboxMessage["priority"]) {
  if (priority === "High") return "bg-red-600/20 text-red-300";
  if (priority === "Medium") return "bg-amber-600/20 text-amber-300";
  return "bg-sky-600/20 text-sky-300";
}

function getMessageSummary(message: InboxMessage | null) {
  if (!message) return [];
  if (message.summary?.length) return message.summary;
  if (!message.subject.startsWith("Post-event report:")) return [];

  const finish = message.preview.match(/^(.+?)\.\s+(?:(?:World|Youth|Amateur|Senior|Q Tour|Q School|One Year) Ranking)/)?.[1];
  const ranking = message.preview.match(/((?:World|Youth|Amateur|Senior|Q Tour|Q School|One Year) Ranking) #(\d+) \(([^)]+)\)/);
  const performance = message.preview.match(/Performance:\s*(\d+)% pot success,\s*(\d+)% safety,\s*high break\s*(\d+)/i);
  const finances = message.preview.match(/Finances:\s*£([\d,]+) income,\s*£([\d,]+) costs,\s*([+-])£([\d,]+) net/i);

  return [
    ...(finish
      ? [{ label: "Tournament finish", value: finish, tone: /won|winner/i.test(finish) ? "positive" as const : "negative" as const }]
      : []),
    ...(ranking
      ? [{ label: ranking[1], value: `#${ranking[2]}`, detail: ranking[3], tone: /up/i.test(ranking[3]) ? "positive" as const : /down/i.test(ranking[3]) ? "negative" as const : "neutral" as const }]
      : []),
    ...(performance
      ? [
          { label: "Pot success", value: `${performance[1]}%`, tone: Number(performance[1]) >= 80 ? "positive" as const : "warning" as const },
          { label: "Safety success", value: `${performance[2]}%`, tone: Number(performance[2]) >= 70 ? "positive" as const : "warning" as const },
          { label: "Highest break", value: performance[3], tone: Number(performance[3]) >= 50 ? "positive" as const : "neutral" as const },
        ]
      : []),
    ...(finances
      ? [
          { label: "Event income", value: `£${finances[1]}`, tone: Number(finances[1].replaceAll(",", "")) > 0 ? "positive" as const : "neutral" as const },
          { label: "Event costs", value: `-£${finances[2]}`, tone: "negative" as const },
          { label: "Net finances", value: `${finances[3]}£${finances[4]}`, tone: finances[3] === "+" ? "positive" as const : "negative" as const },
        ]
      : []),
  ];
}

function isStaffMessage(message: InboxMessage) {
  return /coach|staff|medical|psychologist/i.test(
    `${message.sender} ${victoryMessageTitle(message)}`,
  );
}

function isEventMessage(message: InboxMessage) {
  return /tournament|event|tour|travel|league|championship|open/i.test(
    `${message.sender} ${victoryMessageTitle(message)} ${victoryMessagePreview(message)}`,
  );
}

export function InboxPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    gameState,
    enterTournament,
    skipTournament,
    withdrawTournament,
    markInboxMessageRead,
    markAllInboxRead,
  } = useGame();
  const [categoryFilter, setCategoryFilter] = useState<InboxFilter>("All");
  const [showActionableOnly, setShowActionableOnly] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(
    searchParams.get("message") ?? pendingStory(gameState)?.id ?? gameState.inbox[0]?.id ?? "",
  );

  const filteredInbox = useMemo(
    () =>
      captureVictoryMessages(gameState).inbox.map(formatInboxConfidence).map(formatInboxTrainingReport).filter((message) => {
        if (showActionableOnly && !message.actionRoute) return false;
        if (categoryFilter === "Unread") return !message.read;
        if (categoryFilter === "High Priority")
          return message.priority === "High";
        if (categoryFilter === "Staff") return isStaffMessage(message);
        if (categoryFilter === "Events") return isEventMessage(message);
        return true;
      }),
    [categoryFilter, gameState, showActionableOnly],
  );

  const selectedMessage =
    filteredInbox.find((message) => message.id === selectedMessageId) ??
    filteredInbox[0] ??
    null;
  const selectedSummary = getMessageSummary(selectedMessage);
  const eventFinance = financialReportForMessage(gameState, selectedMessage);
  const qualification = qualificationReportForMessage(gameState, selectedMessage, eventFinance ? { id: eventFinance.tournamentId, name: eventFinance.name, startDate: eventFinance.startDate } : undefined);
  const seasonReport = seasonReportForMessage(gameState, selectedMessage);
  const seasonStartReport = seasonStartReportForMessage(gameState, selectedMessage, getTournamentEntryAccess);
  const tourChangesReport = selectedMessage?.tourChangesReport;
  const compactReport = Boolean(eventFinance || seasonReport);
  const selectedText = selectedMessage
    ? `${victoryMessageTitle(selectedMessage)} ${selectedMessage.preview}`.toLowerCase()
    : "";
  const relatedTournament = seasonReport || seasonStartReport || tourChangesReport ? undefined : eventFinance ? gameState.tournaments.find(t=>t.id===eventFinance.tournamentId && t.startDate===eventFinance.startDate) : selectedMessage?.tournamentReference ? gameState.tournaments.find(t=>t.id===selectedMessage.tournamentReference!.id && t.startDate===selectedMessage.tournamentReference!.startDate) : gameState.tournaments.slice().sort((a,b)=>b.name.length-a.name.length).find((tournament) =>
    selectedText.includes(tournament.name.toLowerCase()),
  );
  const relatedTravel = relatedTournament
    ? gameState.travel.bookings[relatedTournament.id]
    : null;
  const isCompletedEventReport = Boolean(
    selectedMessage?.subject.startsWith("Post-event report:") ||
      relatedTournament?.status === "Completed",
  );
  const needsTravel = !isCompletedEventReport && relatedTournament?.status === "Entered" && !relatedTravel;
  const messageAction = needsTravel
    ? { actionLabel: "Book Travel", actionRoute: "/travel" }
    : relatedTournament?.status === "Skipped"
      ? { actionLabel: "View Calendar", actionRoute: "/calendar" }
    : selectedMessage;
  const entryBlocker = relatedTournament?.status === "Available" && !isCompletedEventReport ? tournamentEntryBlocker(gameState, relatedTournament) : null;
  const daysUntilEvent = relatedTournament
    ? Math.max(
        0,
        Math.ceil(
          (new Date(`${relatedTournament.startDate}T00:00:00`).getTime() -
            new Date(`${gameState.currentDate}T00:00:00`).getTime()) /
            86_400_000,
        ),
      )
    : null;

  const tabs = [
    { id: "All", label: "All", count: gameState.inbox.length },
    {
      id: "Unread",
      label: "Unread",
      count: gameState.inbox.filter((message) => !message.read).length,
    },
    {
      id: "High Priority",
      label: "High Priority",
      count: gameState.inbox.filter((message) => message.priority === "High")
        .length,
    },
    {
      id: "Staff",
      label: "Staff",
      count: gameState.inbox.filter(isStaffMessage).length,
    },
    {
      id: "Events",
      label: "Events",
      count: gameState.inbox.filter(isEventMessage).length,
    },
  ] as const;

  function openMessage(message: InboxMessage) {
    setSelectedMessageId(message.id);
    if (!message.read) markInboxMessageRead(message.id);
  }

  function runMessageAction(route: string) {
    if (selectedMessage && !selectedMessage.read)
      markInboxMessageRead(selectedMessage.id);
    navigate(route);
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-2 overflow-hidden">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border">
        <div
          className="-ml-1 flex min-w-0 flex-1 gap-1 overflow-x-auto px-1"
          role="tablist"
          aria-label="Inbox filters"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={categoryFilter === tab.id}
              onClick={() => setCategoryFilter(tab.id)}
              className={`h-9 flex-none whitespace-nowrap rounded-b-none px-2.5 text-[11px] ${categoryFilter === tab.id ? "tab-active" : "tab-inactive"}`}
            >
              {tab.label}{" "}
              <span className="ml-1 rounded bg-surface-light px-1 py-0.5 text-[9px]">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex shrink-0 gap-1.5 pb-1">
          <button
            type="button"
            className="btn-secondary min-h-8 justify-center whitespace-nowrap px-2.5 py-1.5 text-[11px]"
            onClick={markAllInboxRead}
          >
            <Check className="h-3.5 w-3.5" /> Mark All Read
          </button>
          <button
            type="button"
            aria-pressed={showActionableOnly}
            className={`btn-secondary min-h-8 justify-center whitespace-nowrap px-2.5 py-1.5 text-[11px] ${showActionableOnly ? "border-green-500/50 bg-green-600/10 text-green-300" : ""}`}
            onClick={() => setShowActionableOnly((value) => !value)}
          >
            {showActionableOnly ? "Showing Actionable" : "Actionable Only"}
          </button>
        </div>
      </div>

      <section className={"card grid min-h-0 min-w-0 flex-1 overflow-hidden md:grid-rows-1 md:grid-cols-[minmax(240px,0.7fr)_minmax(0,1.5fr)] " + (compactReport ? "grid-rows-1" : "grid-rows-[minmax(9rem,0.8fr)_minmax(11rem,1.2fr)]")}>
        <div className={(compactReport ? "hidden md:flex" : "flex") + " min-h-0 flex-col overflow-hidden border-b border-border md:border-b-0 md:border-r"}>
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
            <p className="text-xs font-semibold text-white">Messages</p>
            <span className="text-[10px] text-gray-500">
              {gameState.inbox.filter((message) => !message.read).length} unread
            </span>
          </div>
          <div className="scrollbar-thin min-h-0 flex-1 divide-y divide-border overflow-y-auto overscroll-contain" aria-label="Inbox messages">
            {filteredInbox.length ? (
              filteredInbox.map((message) => (
                <div
                  key={message.id}
                  onClick={() => openMessage(message)}
                  className={`flex min-h-[88px] w-full items-start gap-3 border-l-2 p-3 text-left transition-colors ${selectedMessage?.id === message.id ? "border-l-green-400 bg-green-600/10" : "border-l-transparent hover:bg-surface-light/50"} ${message.victoryReport ? "bg-amber-500/5" : ""} ${message.read ? "opacity-60" : ""}`}
                >
                  {message.victoryReport ? <Trophy aria-label="Tournament victory" className="mt-1 h-4 w-4 shrink-0 text-amber-300"/> : <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${message.read ? "bg-transparent" : "bg-green-400"}`}
                  />}
                  <span className="min-w-0 flex-1">
                    <span className="flex w-full items-start justify-between gap-2 text-left">
                      <span className="min-w-0 truncate text-sm font-medium text-white">
                        <PlayerNames text={victoryMessageTitle(message)}/>
                      </span>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] ${priorityClass(message.priority)}`}
                      >
                        {message.priority}
                      </span>
                      <button type="button" aria-label={victoryMessageTitle(message)} onClick={event => { event.stopPropagation(); openMessage(message); }} className="shrink-0 rounded px-1 text-[10px] text-green-400 hover:underline focus-visible:outline">Open</button>
                    </span>
                    <span className="mt-1 block truncate text-xs text-gray-400">
                      <PlayerNames text={victoryMessagePreview(message)}/>
                    </span>
                    <span className="mt-1.5 block text-[10px] text-gray-500">
                      {message.sender} · {message.date}
                    </span>
                  </span>
                </div>
              ))
            ) : (
              <div className="flex h-48 flex-col items-center justify-center px-6 text-center">
                <MailOpen className="h-7 w-7 text-gray-600" />
                <p className="mt-3 text-sm font-medium text-white">
                  No messages in this view
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Change the filter to see the rest of your inbox.
                </p>
              </div>
            )}
          </div>
        </div>

        <article className={"flex min-h-0 min-w-0 flex-col overflow-hidden " + (compactReport ? "p-3" : "p-4 sm:p-5")}>
          {compactReport && <label className="mb-2 shrink-0 text-[10px] text-gray-400 md:hidden">Message<select aria-label="Select inbox message" className="mt-1 w-full min-w-0 rounded border border-border bg-surface p-1.5 text-xs text-white" value={selectedMessage?.id} onChange={e=>{const message=filteredInbox.find(m=>m.id===e.target.value);if(message)openMessage(message)}}>{filteredInbox.map(m=><option key={m.id} value={m.id}>{victoryMessageTitle(m)}</option>)}</select></label>}
          {selectedMessage ? (
            <>
              <div data-testid="inbox-message-body" className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
              <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-500">
                <Mail className="h-3.5 w-3.5 text-green-400" />
                <span>{selectedMessage.sender}</span>
                <span>·</span>
                <span>{selectedMessage.date}</span>
                <span
                  className={`rounded px-1.5 py-0.5 ${priorityClass(selectedMessage.priority)}`}
                >
                  {selectedMessage.priority} priority
                </span>
              </div>
              <h2 className={compactReport ? "mt-1 text-base font-semibold leading-5 text-white" : "mt-2 text-xl font-semibold text-white sm:text-2xl"}>
                <PlayerNames text={victoryMessageTitle(selectedMessage)}/>
              </h2>
              {!compactReport && <p className="mt-3 max-w-3xl text-sm leading-5 text-gray-300">
                {seasonStartReport ? 'Your career position, upcoming entries and previous tournament results.' : gameState.realism?.digest.some(d => d.id === selectedMessage.id) ? 'Results and milestones from your simulated tour.' : <PlayerNames text={selectedMessage.preview}/>}
              </p>}
              <StoryDecisionPanel messageId={selectedMessage.id} />
      <SeasonLifeInbox messageId={selectedMessage.id} />
              <WorldDigestPanel messageId={selectedMessage.id} />

              {tourChangesReport ? <SeasonTourChangesReport report={tourChangesReport} /> : seasonStartReport ? <SeasonStartReport report={seasonStartReport} live={seasonStartReport.season === gameState.season} /> : seasonReport ? <SeasonEndReport report={seasonReport} /> : eventFinance ? <PostEventReport finance={eventFinance} summary={selectedSummary} qualification={qualification} rankingSnapshot={selectedMessage.eventRanking} victory={selectedMessage.victoryReport} results={selectedMessage.eventResults} /> : selectedSummary.length ? (
                <InboxReportSummary items={selectedSummary} />
              ) : null}

              {!compactReport && selectedMessage.tournamentBriefings?.length ? <TournamentHistoryBriefing briefings={selectedMessage.tournamentBriefings} /> : null}

              {relatedTournament && !compactReport ? (
                <div className="mt-3 shrink-0 rounded-lg border border-border-light bg-background/40 p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {relatedTournament.name}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-green-400" />
                          {relatedTournament.location}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock3 className="h-3.5 w-3.5 text-green-400" />
                          {isCompletedEventReport
                            ? "Event complete"
                            : `${daysUntilEvent} days`}
                        </span>
                        {!isCompletedEventReport ? (
                          <span>{relatedTournament.status}</span>
                        ) : null}
                      </div>
                    </div>
                    <span
                      className={`w-fit rounded px-2 py-1 text-[10px] font-semibold ${relatedTravel ? "bg-green-600/15 text-green-300" : "bg-amber-600/15 text-amber-300"}`}
                    >
                      {isCompletedEventReport
                        ? "Completed"
                        : relatedTravel
                          ? "Travel booked"
                          : "Travel not booked"}
                    </span>
                  </div>
                </div>
              ) : null}
              {entryBlocker && <ActionBlockerNotice blocker={entryBlocker} />}
              </div>

              <div data-testid="inbox-message-actions" className={(compactReport ? "mt-2 gap-1.5 pt-2 [&>button]:min-h-8 [&>button]:px-2 [&>button]:py-1 [&>button]:text-[11px]" : "mt-3 gap-2 pt-3") + " flex shrink-0 flex-wrap border-t border-border bg-surface"}>
                {tourChangesReport ? <><button type="button" className="btn-primary" onClick={() => runMessageAction("/rankings")}>View Rankings</button><button type="button" className="btn-secondary" onClick={() => runMessageAction("/calendar")}>Tournament Calendar</button></> : seasonStartReport ? <><button type="button" className="btn-primary" onClick={() => runMessageAction("/calendar")}>Plan Season</button><button type="button" className="btn-secondary" onClick={() => runMessageAction("/tournaments/hub")}>Tournament Hub</button></> : !isCompletedEventReport && relatedTournament?.status === "Available" ? (
                  <><button
                    type="button"
                    className="btn-primary min-h-10 text-xs"
                    onClick={() =>
                      entryBlocker
                        ? navigate(entryBlocker.route)
                        : enterTournament(relatedTournament.id)
                    }
                  >
                    {entryBlocker?.label ?? "Enter Tournament"}{" "}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="btn-secondary min-h-10 text-xs"
                    title="Decline and simulate to the next entry window. Normal training and finances continue; required decisions pause advancement."
                    onClick={() => {
                      markInboxMessageRead(selectedMessage.id, true);
                      skipTournament(relatedTournament.id);
                    }}
                  >
                    Skip Tournament
                  </button></>
                ) : messageAction?.actionRoute &&
                  messageAction.actionLabel ? (
                  <button
                    type="button"
                    className="btn-primary min-h-10 text-xs"
                    onClick={() =>
                      runMessageAction(messageAction.actionRoute!)
                    }
                  >
                    {messageAction.actionLabel}{" "}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                ) : null}

                {relatedTournament &&
                messageAction?.actionRoute !== "/tournaments/hub" ? (
                  <button
                    type="button"
                    className="btn-secondary min-h-10 text-xs"
                    onClick={() => runMessageAction("/tournaments/hub")}
                  >
                    <Trophy className="h-3.5 w-3.5" /> Tournament Hub
                  </button>
                ) : null}
                {relatedTournament &&
                messageAction?.actionRoute !== "/calendar" ? (
                  <button
                    type="button"
                    className="btn-secondary min-h-10 text-xs"
                    onClick={() => runMessageAction("/calendar")}
                  >
                    View Calendar
                  </button>
                ) : null}
                {!isCompletedEventReport && relatedTournament?.status === "Entered" ? (
                  <button
                    type="button"
                    className="btn-secondary min-h-10 text-xs text-red-300"
                    onClick={() => withdrawTournament(relatedTournament.id)}
                  >
                    Withdraw Entry
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn-secondary min-h-10 text-xs"
                  onClick={() => markInboxMessageRead(selectedMessage.id, !selectedMessage.read)}
                >
                  {selectedMessage.read ? "Mark Unread" : "Mark Read"}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <MailOpen className="h-9 w-9 text-gray-600" />
              <p className="mt-3 text-sm font-medium text-white">
                Select a message
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Its details and available actions will appear here.
              </p>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
