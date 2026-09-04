import { useState, type ComponentType } from "react";
import {
  BedDouble,
  BriefcaseBusiness,
  Clock3,
  Plane,
  Train,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProgressBar } from "../components/ui/ProgressBar";
import { useGame } from "../context/useGame";
import { hotelOptionCatalog, travelOptionCatalog } from "../data/catalogs";
import { getNextEligibleTournament } from "../hooks/useGameState";
import type { HotelOption, TravelOption } from "../types/game";
import { formatMoney } from "../utils/formatters";

const iconMap: Record<
  TravelOption["icon"],
  ComponentType<{ className?: string }>
> = {
  Plane,
  Clock3,
  BriefcaseBusiness,
  Train,
};

function fatigueTone(label: TravelOption["fatigueLabel"]) {
  if (label === "High") return "red" as const;
  if (label === "Medium") return "amber" as const;
  return "green" as const;
}

function moneyHealth(value: number) {
  if (value >= 5000) return "text-green-400";
  if (value >= 2500) return "text-amber-400";
  return "text-red-400";
}

function formatArrivalTime(
  eventStartDate: string | undefined,
  catalogArrivalTime: string,
) {
  if (!eventStartDate) return catalogArrivalTime;
  const arrivalDate = new Date(`${eventStartDate}T12:00:00`);
  if (Number.isNaN(arrivalDate.getTime())) return catalogArrivalTime;
  arrivalDate.setDate(arrivalDate.getDate() - 1);
  const dateLabel = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(arrivalDate);
  const timeLabel = catalogArrivalTime.split("•")[1]?.trim() ?? "12:00";
  return `${dateLabel} · ${timeLabel}`;
}

function CompactSelectors({
  selectedTravel,
  selectedHotel,
  onTravelChange,
  onHotelChange,
  className = "",
}: {
  selectedTravel: TravelOption;
  selectedHotel: HotelOption;
  onTravelChange: (id: string) => void;
  onHotelChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={`grid gap-3 ${className}`}>
      <label className="min-w-0">
        <span className="metric-label">Travel option</span>
        <select
          aria-label="Travel option"
          className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-surface-light px-3 text-xs text-white"
          value={selectedTravel.id}
          onChange={(event) => onTravelChange(event.target.value)}
        >
          {travelOptionCatalog.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name} · {formatMoney(option.cost)} · {option.fatigueLabel}{" "}
              fatigue
            </option>
          ))}
        </select>
      </label>
      <label className="min-w-0">
        <span className="metric-label">Hotel option</span>
        <select
          aria-label="Hotel option"
          className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-surface-light px-3 text-xs text-white"
          value={selectedHotel.id}
          onChange={(event) => onHotelChange(event.target.value)}
        >
          {hotelOptionCatalog.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name} · {formatMoney(option.cost)} ·{" "}
              {option.preparationLabel} prep
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function TravelPlannerPage() {
  const { gameState } = useGame();
  const activeEvent = getNextEligibleTournament(gameState);
  const existingBooking = activeEvent
    ? gameState.travel.bookings[activeEvent.id]
    : undefined;

  return (
    <TravelPlannerContent
      key={`${activeEvent?.id ?? "none"}-${existingBooking?.travelOptionId ?? "none"}-${existingBooking?.hotelOptionId ?? "none"}`}
    />
  );
}

function TravelPlannerContent() {
  const navigate = useNavigate();
  const { gameState, bookTravel } = useGame();
  const activeEvent = getNextEligibleTournament(gameState);
  const existingBooking = activeEvent
    ? gameState.travel.bookings[activeEvent.id]
    : undefined;
  const [selectedTravelId, setSelectedTravelId] = useState(
    existingBooking?.travelOptionId ??
      travelOptionCatalog.find((option) => option.selected)?.id ??
      travelOptionCatalog[0].id,
  );
  const [selectedHotelId, setSelectedHotelId] = useState(
    existingBooking?.hotelOptionId ??
      hotelOptionCatalog.find((option) => option.selected)?.id ??
      hotelOptionCatalog[0].id,
  );
  const selectedTravel =
    travelOptionCatalog.find((option) => option.id === selectedTravelId) ??
    travelOptionCatalog[0];
  const selectedHotel =
    hotelOptionCatalog.find((option) => option.id === selectedHotelId) ??
    hotelOptionCatalog[0];

  const fixedCosts = 55;
  const totalTripCost = selectedTravel.cost + selectedHotel.cost + fixedCosts;
  const cashRemaining = gameState.player.cash - totalTripCost;
  const readinessScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (100 -
          selectedTravel.fatigueValue +
          selectedHotel.recoveryValue +
          selectedHotel.preparationValue +
          (100 - selectedTravel.delayRisk)) /
          4,
      ),
    ),
  );
  const canConfirm = Boolean(
    activeEvent?.status === "Entered" && cashRemaining >= 0,
  );

  function autoPlan() {
    const autoTravel = travelOptionCatalog
      .slice()
      .sort(
        (left, right) =>
          left.fatigueValue +
          left.delayRisk * 1.2 +
          left.cost / 6 -
          (right.fatigueValue + right.delayRisk * 1.2 + right.cost / 6),
      )[0];
    const autoHotel = hotelOptionCatalog
      .slice()
      .sort(
        (left, right) =>
          right.recoveryValue +
          right.preparationValue -
          right.cost / 3 -
          (left.recoveryValue + left.preparationValue - left.cost / 3),
      )[0];
    setSelectedTravelId(autoTravel.id);
    setSelectedHotelId(autoHotel.id);
  }

  function confirmTravel() {
    if (activeEvent && canConfirm) {
      bookTravel(activeEvent.id, selectedTravel.id, selectedHotel.id);
      navigate("/tournaments/hub");
    }
  }

  const summary = (
    <aside className="card flex min-h-0 flex-col overflow-hidden border-green-600/25">
      <div className="hidden border-b border-border bg-green-600/5 px-4 py-3 sm:block">
        <p className="text-[10px] font-semibold uppercase text-green-400">
          Trip Summary
        </p>
        <h2 className="mt-1 truncate text-sm font-semibold text-white">
          {activeEvent?.name ?? "No active event"}
        </h2>
        <p className="truncate text-[10px] text-gray-400">
          {activeEvent?.location ?? "TBD"} ·{" "}
          {activeEvent?.startDate ?? gameState.currentDate}
        </p>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4">
        <CompactSelectors
          className="md:hidden"
          selectedTravel={selectedTravel}
          selectedHotel={selectedHotel}
          onTravelChange={setSelectedTravelId}
          onHotelChange={setSelectedHotelId}
        />

        <div className="hidden grid-cols-2 gap-2 sm:grid">
          <div className="rounded bg-surface-light/50 p-2.5">
            <p className="metric-label">Travel</p>
            <p className="mt-1 truncate text-xs font-medium text-white">
              {selectedTravel.name}
            </p>
          </div>
          <div className="rounded bg-surface-light/50 p-2.5">
            <p className="metric-label">Hotel</p>
            <p className="mt-1 truncate text-xs font-medium text-white">
              {selectedHotel.name}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 border-t border-border pt-3 text-xs">
          <div className="flex justify-between gap-3">
            <span className="text-gray-400">Travel + hotel</span>
            <span className="text-white">
              {formatMoney(selectedTravel.cost + selectedHotel.cost)}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-400">Transfers + incidentals</span>
            <span className="text-white">{formatMoney(fixedCosts)}</span>
          </div>
          <div className="flex justify-between gap-3 border-t border-border/70 pt-2 font-semibold">
            <span className="text-white">Total</span>
            <span className="text-amber-400">{formatMoney(totalTripCost)}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5 text-center">
          {[
            ["Fresh", `${100 - selectedTravel.fatigueValue}%`],
            ["Delay", `${100 - selectedTravel.delayRisk}%`],
            ["Recover", `${selectedHotel.recoveryValue}%`],
            ["Prep", `${selectedHotel.preparationValue}%`],
          ].map(([label, value]) => (
            <div key={label} className="rounded bg-surface-light/50 px-1 py-2">
              <p className="text-[8px] uppercase text-gray-500">{label}</p>
              <p className="mt-0.5 text-[11px] font-semibold text-white">
                {value}
              </p>
            </div>
          ))}
        </div>

        {existingBooking ? (
          <p className="rounded border border-green-600/20 bg-green-600/10 px-2.5 py-2 text-[10px] text-green-300">
            Booked package: {formatMoney(existingBooking.totalCost)}. Confirm
            again to update it.
          </p>
        ) : null}

        <div className="mt-auto grid grid-cols-4 gap-1.5 sm:grid-cols-3 sm:gap-2">
          <button
            type="button"
            aria-label="Confirm Travel"
            disabled={!canConfirm}
            className="btn-primary min-h-10 justify-center px-2 text-[10px] disabled:cursor-not-allowed disabled:opacity-50 sm:text-xs"
            onClick={confirmTravel}
          >
            <span className="sm:hidden">Confirm</span>
            <span className="hidden sm:inline">Confirm Travel</span>
          </button>
          <button
            type="button"
            aria-label="Match Preview"
            className="btn-secondary min-h-10 justify-center px-2 text-[10px] sm:text-xs"
            onClick={() => navigate("/match/preview")}
          >
            <span className="sm:hidden">Preview</span>
            <span className="hidden sm:inline">Match Preview</span>
          </button>
          <button
            type="button"
            aria-label="Back To Calendar"
            className="btn-secondary min-h-10 justify-center px-2 text-[10px] sm:text-xs"
            onClick={() => navigate("/calendar")}
          >
            Calendar
          </button>
          <button
            type="button"
            aria-label="Finance"
            className="btn-secondary min-h-10 justify-center px-1 text-[10px] sm:hidden"
            onClick={() => navigate("/finance")}
          >
            Finance
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div
      data-testid="travel-planner-viewport"
      className="grid h-full min-h-0 min-w-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-2 overflow-hidden sm:gap-3"
    >
      <header className="flex min-w-0 items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase text-gray-500">
            Tournaments
          </p>
          <h1 className="mt-0.5 text-xl font-bold text-white sm:text-2xl">
            Travel Planner
          </h1>
          <p className="mt-0.5 hidden truncate text-xs text-gray-400 sm:block">
            {activeEvent?.name ?? "Next event"} ·{" "}
            {activeEvent?.location ?? "TBD"}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className="btn-secondary min-h-10 px-3 text-xs"
            onClick={autoPlan}
          >
            Auto Plan
          </button>
          <button
            type="button"
            className="btn-secondary hidden min-h-10 px-3 text-xs sm:flex"
            onClick={() => navigate("/finance")}
          >
            Finance
          </button>
        </div>
      </header>

      <div className="grid shrink-0 grid-cols-3 gap-1.5 sm:gap-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div className="card hidden min-w-0 px-3 py-2 lg:block">
          <p className="metric-label">Event</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-white">
            {activeEvent?.name ?? "No event selected"}
          </p>
        </div>
        {[
          ["Readiness", `${readinessScore}%`, "text-white"],
          ["Trip Cost", formatMoney(totalTripCost), "text-amber-400"],
          ["Cash Left", formatMoney(cashRemaining), moneyHealth(cashRemaining)],
        ].map(([label, value, tone]) => (
          <div
            key={label}
            className="card min-w-0 px-2 py-2 text-center sm:px-3"
          >
            <p className="metric-label truncate">{label}</p>
            <p className={`mt-0.5 truncate text-sm font-bold ${tone}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid min-h-0 min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(270px,0.8fr)] xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)_minmax(290px,0.86fr)]">
        <section className="card hidden min-h-0 flex-col overflow-hidden xl:flex">
          <div className="card-header shrink-0 py-2.5">
            <h2 className="text-xs font-semibold text-white">Travel Options</h2>
            <span className="text-[9px] text-gray-500">
              Cost · fatigue · delay
            </span>
          </div>
          <div className="grid min-h-0 flex-1 grid-rows-5 gap-1.5 p-2">
            {travelOptionCatalog.map((option) => {
              const Icon = iconMap[option.icon];
              const selected = option.id === selectedTravel.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSelectedTravelId(option.id)}
                  className={`grid min-h-0 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition ${selected ? "border-green-500/40 bg-green-600/10" : "border-transparent bg-surface-light/45 hover:bg-surface-light"}`}
                >
                  <Icon
                    className={`h-4 w-4 ${selected ? "text-green-400" : "text-gray-500"}`}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium text-white">
                      {option.name}
                    </span>
                    <span className="block truncate text-[9px] text-gray-500">
                      {formatArrivalTime(
                        activeEvent?.startDate,
                        option.arrivalTime,
                      )}{" "}
                      · {option.comfort}/5 comfort
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-xs font-semibold text-white">
                      {formatMoney(option.cost)}
                    </span>
                    <span
                      className={`text-[9px] ${option.fatigueLabel === "High" ? "text-red-400" : option.fatigueLabel === "Medium" ? "text-amber-400" : "text-green-400"}`}
                    >
                      {option.fatigueLabel} · {option.delayRisk}%
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="card hidden min-h-0 flex-col overflow-hidden xl:flex">
          <div className="card-header shrink-0 py-2.5">
            <h2 className="text-xs font-semibold text-white">Hotel Options</h2>
            <span className="text-[9px] text-gray-500">Recovery · prep</span>
          </div>
          <div className="grid min-h-0 flex-1 grid-rows-4 gap-1.5 p-2">
            {hotelOptionCatalog.map((option) => {
              const selected = option.id === selectedHotel.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSelectedHotelId(option.id)}
                  className={`grid min-h-0 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition ${selected ? "border-green-500/40 bg-green-600/10" : "border-transparent bg-surface-light/45 hover:bg-surface-light"}`}
                >
                  <BedDouble
                    className={`h-4 w-4 ${selected ? "text-green-400" : "text-gray-500"}`}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium text-white">
                      {option.name}
                    </span>
                    <span className="block truncate text-[9px] text-gray-500">
                      {option.distance} · {option.noise}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-xs font-semibold text-white">
                      {formatMoney(option.cost)}
                    </span>
                    <span className="text-[9px] text-green-400">
                      {option.preparationLabel} prep
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="card hidden min-h-0 flex-col overflow-hidden p-4 md:flex xl:hidden">
          <div>
            <p className="text-xs font-semibold text-white">Choose Package</p>
            <p className="mt-1 text-[10px] text-gray-500">
              Every option remains available in the compact selectors.
            </p>
          </div>
          <CompactSelectors
            className="mt-4"
            selectedTravel={selectedTravel}
            selectedHotel={selectedHotel}
            onTravelChange={setSelectedTravelId}
            onHotelChange={setSelectedHotelId}
          />
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <div>
              <div className="mb-1 flex justify-between text-[10px]">
                <span className="text-gray-400">Travel fatigue</span>
                <span>{selectedTravel.fatigueValue}%</span>
              </div>
              <ProgressBar
                value={selectedTravel.fatigueValue}
                tone={fatigueTone(selectedTravel.fatigueLabel)}
                compact
              />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-[10px]">
                <span className="text-gray-400">Hotel preparation</span>
                <span>{selectedHotel.preparationValue}%</span>
              </div>
              <ProgressBar value={selectedHotel.preparationValue} compact />
            </div>
          </div>
        </section>

        {summary}
      </div>
    </div>
  );
}
