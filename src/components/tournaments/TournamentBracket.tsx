type BracketPlayer = {
  name: string;
  rank: number;
  nation: string;
  score?: number;
  highlighted?: boolean;
};

type BracketMatch = {
  id: string;
  top: BracketPlayer;
  bottom: BracketPlayer;
  placeholder?: boolean;
};

type BracketRound = {
  label: string;
  matches: BracketMatch[];
};

type TournamentBracketProps = {
  rounds: BracketRound[];
  playerName: string;
  currentRound?: string | null;
  dense?: boolean;
};

function participantClass(player: BracketPlayer, playerName: string) {
  return player.highlighted || player.name === playerName
    ? "bg-green-600/15 font-semibold text-green-300"
    : "text-gray-200";
}

export function TournamentBracket({
  rounds,
  playerName,
  currentRound,
  dense = false,
}: TournamentBracketProps) {
  if (rounds.length === 0) {
    return (
      <div className="grid h-full min-h-40 place-items-center text-sm text-gray-500">
        The draw will appear after entry is confirmed.
      </div>
    );
  }

  const columnWidth = dense ? 146 : 190;
  const finalMatch = rounds.at(-1)?.matches[0];
  const champion =
    finalMatch &&
    typeof finalMatch.top.score === "number" &&
    typeof finalMatch.bottom.score === "number"
      ? finalMatch.top.score > finalMatch.bottom.score
        ? finalMatch.top.name
        : finalMatch.bottom.name
      : null;

  return (
    <div
      className="scrollbar-thin h-full min-h-0 overflow-auto"
      data-testid="tournament-bracket"
    >
      <div
        className="grid h-full min-h-max gap-2 pr-1"
        style={{
          gridTemplateColumns: `repeat(${rounds.length}, minmax(${columnWidth}px, 1fr))`,
          minWidth: `${rounds.length * columnWidth}px`,
        }}
      >
        {rounds.map((round) => {
          const isCurrent = round.label === currentRound;
          return (
            <section
              key={round.label}
              className="flex min-h-0 flex-col"
              aria-label={`${round.label} bracket`}
            >
              <div className="mb-2 flex shrink-0 items-center justify-between gap-2 px-1">
                <h4
                  className={`truncate text-[10px] font-semibold uppercase tracking-[0.12em] ${isCurrent ? "text-amber-400" : "text-gray-500"}`}
                >
                  {round.label}
                </h4>
                {isCurrent ? (
                  <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase text-amber-300">
                    Now
                  </span>
                ) : null}
              </div>
              <div
                className={`flex min-h-0 flex-1 flex-col justify-around ${dense ? "gap-1" : "gap-2"}`}
              >
                {round.matches.map((match) => {
                  const containsPlayer =
                    match.top.name === playerName ||
                    match.bottom.name === playerName;
                  return (
                    <div
                      key={match.id}
                      className={`shrink-0 rounded-lg border ${dense ? "p-1" : "p-1.5"} ${containsPlayer ? "border-green-500/50 bg-green-600/10" : match.placeholder ? "border-dashed border-border bg-surface-light/25" : "border-border bg-surface-light/45"}`}
                    >
                      {[match.top, match.bottom].map((player, index) => (
                        <div
                          key={`${match.id}-${index}-${player.name}`}
                          className={`flex min-w-0 items-center justify-between gap-2 rounded px-1.5 ${dense ? "py-0.5 text-[9px]" : "py-1 text-xs"} ${player.name === champion ? "bg-amber-500/15 font-semibold text-amber-300" : participantClass(player, playerName)}`}
                        >
                          <span className="truncate">
                            {player.rank > 0 ? `[${player.rank}] ` : ""}
                            {player.name}
                          </span>
                          <span className="flex shrink-0 items-center gap-1 text-gray-400">
                            {player.name === champion ? (
                              <span className="text-[8px] font-semibold uppercase text-amber-400">
                                Champion
                              </span>
                            ) : null}
                            {player.score ?? "–"}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
