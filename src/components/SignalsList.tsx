import { databaseMode } from "../lib/supabase";
import type { Signal, SignalStatus } from "../types/signal";
import type { FetchResult } from "../lib/database";

const STATUS_LABEL: Record<SignalStatus, string> = {
  active: "Active",
  degraded: "Degraded",
  offline: "Offline",
};


function timeAgo(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function SignalRow({ signal }: { signal: Signal }) {
  const recorded = new Date(signal.recorded_at);
  const boundedIntensity = Math.max(0, Math.min(100, signal.intensity));

  return (
    <tr>
      <td className="signal-name" scope="row">
        {signal.name}
      </td>
      <td className="muted">{signal.origin}</td>
      <td>
        <span
          className={`status-chip status-chip--${signal.status}`}
          aria-label={`Status: ${STATUS_LABEL[signal.status]}`}
        >
          {STATUS_LABEL[signal.status]}
        </span>
      </td>
      <td className="num">
        <div className="intensity">
          <div
            className="intensity__bar"
            role="progressbar"
            aria-valuenow={boundedIntensity}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Intensity level for ${signal.name}: ${boundedIntensity}%`}
          >
            <div
              className="intensity__fill"
              style={{ width: `${boundedIntensity}%` }}
            />
          </div>
          <span>{signal.intensity}</span>
        </div>
      </td>
      <td className="muted">
        <time dateTime={recorded.toISOString()} title={recorded.toLocaleString()}>
          {timeAgo(recorded)}
        </time>
      </td>
    </tr>
  );
}


export function SignalsList({
  result,
  loading,
  lastUpdated,
}: {
  result: FetchResult | null;
  loading: boolean;
  lastUpdated: Date | null;
}) {
  return (
    <section className="card" aria-labelledby="signals-heading">
          <div className="signals__head">
            <h2 id="signals-heading" className="card__title">Signals</h2>
            <span className="signals__source">
              {databaseMode === "live" && (
                <span className="live-pulse" aria-hidden="true" />
              )}
              {result?.isMock ? "source: mock dataset" : "source: supabase"}
              {lastUpdated && (
                <span className="signals__updated">
                  · updated{" "}
                  <time dateTime={lastUpdated.toISOString()}>
                    {timeAgo(lastUpdated)}
                  </time>
                </span>
              )}
            </span>
          </div>
          {loading ? (
            <p className="muted" role="status" aria-live="polite">
              Loading signals data…
            </p>
          ) : (
            <div className="table-wrap">
              <table aria-label="Database Signals">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Origin</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="num">Intensity</th>
                    <th scope="col">Recorded</th>
                  </tr>
                </thead>
                <tbody>
                  {result?.signals.map((s) => (
                    <SignalRow key={s.id} signal={s} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
  );
}
