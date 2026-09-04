import { useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  Clock3,
  Mail,
  MailOpen,
  MapPin,
  Trophy,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/useGame";
import type { InboxMessage } from "../types/game";

type InboxFilter = "All" | "Unread" | "High Priority" | "Staff" | "Events";

function priorityClass(priority: InboxMessage["priority"]) {
  if (priority === "High") return "bg-red-600/20 text-red-300";
  if (priority === "Medium") return "bg-amber-600/20 text-amber-300";
  return "bg-sky-600/20 text-sky-300";
}

function summaryToneClass(
  tone: NonNullable<InboxMessage["summary"]>[number]["tone"],
) {
  if (tone === "positive")
    return "border-green-500/35 bg-green-500/10 text-green-300";
  if (tone === "negative")
    return "border-red-500/35 bg-red-500/10 text-red-300";
  if (tone === "warning")
    return "border-amber-500/35 bg-amber-500/10 text-amber-300";
  return "border-sky-500/25 bg-sky-500/5 text-sky-300";
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
    `${message.sender} ${message.subject}`,
  );
}

function isEventMessage(message: InboxMessage) {
  return /tournament|event|tour|travel|league|championship|open/i.test(
    `${message.sender} ${message.subject} ${message.preview}`,
  );
}

export function InboxPage() {
  const navigate = useNavigate();
  const {
    gameState,
    enterTournament,
    withdrawTournament,
    markInboxMessageRead,
    markAllInboxRead,
  } = useGame();
  const [categoryFilter, setCategoryFilter] = useState<InboxFilter>("All");
  const [showActionableOnly, setShowActionableOnly] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(
    gameState.inbox[0]?.id ?? "",
  );

  const filteredInbox = useMemo(
    () =>
      gameState.inbox.filter((message) => {
        if (showActionableOnly && !message.actionRoute) return false;
        if (categoryFilter === "Unread") return !message.read;
        if (categoryFilter === "High Priority")
          return message.priority === "High";
        if (categoryFilter === "Staff") return isStaffMessage(message);
        if (categoryFilter === "Events") return isEventMessage(message);
        return true;
      }),
    [categoryFilter, gameState.inbox, showActionableOnly],
  );

  const selectedMessage =
    filteredInbox.find((message) => message.id === selectedMessageId) ??
    filteredInbox[0] ??
    null;
  const selectedSummary = getMessageSummary(selectedMessage);
  const selectedText = selectedMessage
    ? `${selectedMessage.subject} ${selectedMessage.preview}`.toLowerCase()
    : "";
  const relatedTournament = gameState.tournaments.find((tournament) =>
    selectedText.includes(tournament.name.toLowerCase()),
  );
  const relatedTravel = relatedTournament
    ? gameState.travel.bookings[relatedTournament.id]
    : null;
  const isCompletedEventReport = Boolean(
    selectedMessage?.subject.startsWith("Post-event report:") ||
      relatedTournament?.status === "Completed",
  );
  const equipmentReady = Boolean(
    gameState.equipment.currentCueId &&
    gameState.equipment.currentChalkId &&
    gameState.equipment.currentTipId,
  );
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

      <section className="card grid min-h-0 min-w-0 flex-1 grid-rows-[minmax(9rem,0.8fr)_minmax(11rem,1.2fr)] overflow-hidden md:grid-cols-[minmax(260px,0.85fr)_minmax(0,1.5fr)] md:grid-rows-1">
        <div className="flex min-h-0 flex-col overflow-hidden border-b border-border md:border-b-0 md:border-r">
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
            <p className="text-xs font-semibold text-white">Messages</p>
            <span className="text-[10px] text-gray-500">
              {gameState.inbox.filter((message) => !message.read).length} unread
            </span>
          </div>
          <div className="scrollbar-thin min-h-0 flex-1 divide-y divide-border overflow-y-auto overscroll-contain" aria-label="Inbox messages">
            {filteredInbox.length ? (
              filteredInbox.map((message) => (
                <button
                  key={message.id}
                  type="button"
                  onClick={() => openMessage(message)}
                  className={`flex min-h-[88px] w-full items-start gap-3 border-l-2 p-3 text-left transition-colors ${selectedMessage?.id === message.id ? "border-l-green-400 bg-green-600/10" : "border-l-transparent hover:bg-surface-light/50"} ${message.read ? "opacity-60" : ""}`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${message.read ? "bg-transparent" : "bg-green-400"}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="min-w-0 truncate text-sm font-medium text-white">
                        {message.subject}
                      </span>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] ${priorityClass(message.priority)}`}
                      >
                        {message.priority}
                      </span>
                    </span>
                    <span className="mt-1 block truncate text-xs text-gray-400">
                      {message.preview}
                    </span>
                    <span className="mt-1.5 block text-[10px] text-gray-500">
                      {message.sender} · {message.date}
                    </span>
                  </span>
                </button>
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

        <article className="flex min-h-0 min-w-0 flex-col overflow-hidden p-4 sm:p-5">
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
              <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
                {selectedMessage.subject}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-5 text-gray-300">
                {selectedMessage.preview}
              </p>

              {selectedSummary.length ? (
                <div className="mt-3 max-w-3xl shrink-0 rounded-lg border border-border bg-background/30">
                  <div className="border-b border-border px-4 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                      Report summary
                    </p>
                  </div>
                  <ul className="divide-y divide-border/70">
                    {selectedSummary.map((item, index) => (
                      <li
                        key={`${item.label}-${index}`}
                        className="grid gap-1 px-4 py-1.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-300">
                            {item.label}
                          </p>
                          {item.detail ? (
                            <p className="mt-0.5 truncate text-[10px] text-gray-500">
                              {item.detail}
                            </p>
                          ) : null}
                        </div>
                        <span
                          className={`w-fit rounded-md border px-2.5 py-1 text-xs font-bold ${summaryToneClass(item.tone)}`}
                        >
                          {item.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {relatedTournament ? (
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
              </div>

              <div data-testid="inbox-message-actions" className="mt-3 flex shrink-0 flex-wrap gap-2 border-t border-border bg-surface pt-3">
                {relatedTournament?.status === "Available" ? (
                  <button
                    type="button"
                    className="btn-primary min-h-10 text-xs"
                    onClick={() =>
                      equipmentReady
                        ? enterTournament(relatedTournament.id)
                        : navigate("/equipment/cues")
                    }
                  >
                    {equipmentReady ? "Enter Tournament" : "Prepare Equipment"}{" "}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                ) : selectedMessage.actionRoute &&
                  selectedMessage.actionLabel ? (
                  <button
                    type="button"
                    className="btn-primary min-h-10 text-xs"
                    onClick={() =>
                      runMessageAction(selectedMessage.actionRoute!)
                    }
                  >
                    {selectedMessage.actionLabel}{" "}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                ) : null}

                {relatedTournament &&
                selectedMessage.actionRoute !== "/tournaments/hub" ? (
                  <button
                    type="button"
                    className="btn-secondary min-h-10 text-xs"
                    onClick={() => runMessageAction("/tournaments/hub")}
                  >
                    <Trophy className="h-3.5 w-3.5" /> Tournament Hub
                  </button>
                ) : null}
                {relatedTournament &&
                selectedMessage.actionRoute !== "/calendar" ? (
                  <button
                    type="button"
                    className="btn-secondary min-h-10 text-xs"
                    onClick={() => runMessageAction("/calendar")}
                  >
                    View Calendar
                  </button>
                ) : null}
                {relatedTournament?.status === "Entered" ? (
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
