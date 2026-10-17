import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  fetchFacts,
  insertFact,
  subscribeToFacts,
  getFactSession,
  signInForFacts,
  signOutFromFacts,
  onAuthStateChange,
  type FactsFetchResult,
} from "../lib/facts";
import { databaseMode } from "../lib/supabase";
import type { PkoFact } from "../types/fact";

/**
 * PKO Facts panel — renders the `pko_facts` knowledge store from Supabase.
 *
 * Access model: `pko_facts` is readable/writable by authenticated users only,
 * so in live mode the panel gates on a Supabase Auth session. In mock mode it
 * shows labelled demo data with writes disabled.
 */
export function FactsPanel() {
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [result, setResult] = useState<FactsFetchResult | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [filter, setFilter] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [topic, setTopic] = useState("");
  const [summary, setSummary] = useState("");
  const [keyPointsText, setKeyPointsText] = useState("");
  const [sourcesText, setSourcesText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  // Request generation counter. Signed-out state must never render facts from
  // a stale in-flight fetch: every load() is tagged, and results from an older
  // generation (e.g. started before sign-out) are ignored.
  const requestGenRef = useRef(0);

  // Establish the auth session first — pko_facts requires `authenticated`,
  // and a signed-out SELECT can silently return [] instead of an error.
  useEffect(() => {
    let mounted = true;
    getFactSession().then((s) => {
      if (!mounted) return;
      setSession(s);
      setAuthChecked(true);
    });
    const unsubscribeAuth = onAuthStateChange((s) => {
      setSession(s);
    });
    return () => {
      mounted = false;
      unsubscribeAuth();
    };
  }, []);

  const load = useCallback((manual = false) => {
    const gen = ++requestGenRef.current;
    if (manual) setIsRefreshing(true);
    fetchFacts().then((r) => {
      if (gen !== requestGenRef.current) return; // stale request — ignore
      setResult(r);
      if (manual) setIsRefreshing(false);
    });
  }, []);

  // Fetch + subscribe only when there is a session (or in mock mode, which
  // needs no session). Facts are cleared on sign-out and in-flight requests
  // from the previous session are invalidated.
  useEffect(() => {
    if (databaseMode === "mock" || session) {
      load();
      const unsubscribe = subscribeToFacts(load);
      return () => {
        requestGenRef.current++; // invalidate any in-flight fetch
        unsubscribe();
      };
    }
    setResult(null);
  }, [load, session]);

  const handleRefreshClick = () => {
    load(true);
  };

  const handleSignOut = async () => {
    await signOutFromFacts();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    setSignInError(null);
    const { error } = await signInForFacts(email.trim(), password);
    if (error) {
      setSignInError(error);
    }
    setSigningIn(false);
  };

  const handleAddFact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !summary.trim()) {
      setSubmitError("Topic and summary are required.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    const { error } = await insertFact({
      topic: topic.trim(),
      summary: summary.trim(),
      key_points: splitLines(keyPointsText),
      sources: splitLines(sourcesText),
    });
    setSubmitting(false);
    if (error) {
      setSubmitError(error);
      return;
    }
    setTopic("");
    setSummary("");
    setKeyPointsText("");
    setSourcesText("");
    setShowAddForm(false);
    load();
  };

  const loading = result === null;
  const canShowFacts = databaseMode === "mock" || !!session;
  const facts = useMemo(() => {
    if (!result || !canShowFacts) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return result.facts;
    return result.facts.filter(
      (f) =>
        f.topic.toLowerCase().includes(q) ||
        f.summary.toLowerCase().includes(q) ||
        f.key_points.some((p) => p.toLowerCase().includes(q)),
    );
  }, [result, filter, canShowFacts]);

  return (
    <section className="card facts-card" aria-labelledby="facts-heading">
      <div className="facts__head">
        <h2 id="facts-heading" className="card__title">
          PKO Facts
        </h2>
        <span className="facts__meta">
          {databaseMode === "live" && (
            <span className="live-pulse" aria-hidden="true" />
          )}
          {result?.mode === "mock" || databaseMode === "mock"
            ? "source: demo data"
            : "source: supabase"}
        </span>
        <div className="facts__actions">
          {canShowFacts && (
            <button
              type="button"
              className="btn-icon"
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              aria-label="Refresh facts data"
              title="Refresh facts"
            >
              <svg
                className={isRefreshing ? "spin" : ""}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M21.5 2v6h-6M2.5 22v-6h6" />
                <path d="M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
              </svg>
            </button>
          )}
          {databaseMode === "live" && session && (
            <>
              <button
                type="button"
                className="facts__add-btn"
                onClick={() => setShowAddForm((prev) => !prev)}
                aria-expanded={showAddForm}
              >
                {showAddForm ? "Close form" : "Add fact"}
              </button>
              <button
                type="button"
                className="facts__add-btn"
                onClick={handleSignOut}
                title={session.user.email}
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </div>

      {databaseMode === "mock" && (
        <p className="facts__notice">
          Showing labelled demo data — add Supabase credentials to{" "}
          <code>.env</code> to connect the live fact store.
        </p>
      )}

      {databaseMode === "live" && !authChecked && (
        <p className="muted">Checking session…</p>
      )}

      {databaseMode === "live" && authChecked && !session && (
        <form className="facts__auth" onSubmit={handleSignIn}>
          <p className="muted">
            The fact store is restricted to authenticated users. Sign in with
            an account created in the Supabase dashboard (Authentication →
            Users).
          </p>
          <div className="facts__auth-fields">
            <label>
              <span className="muted">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              <span className="muted">Password</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          </div>
          {signInError && (
            <p className="facts__error" role="alert">
              {signInError}
            </p>
          )}
          <button type="submit" className="facts__add-btn" disabled={signingIn}>
            {signingIn ? "Signing in…" : "Sign in"}
          </button>
        </form>
      )}

      {showAddForm && databaseMode === "live" && session && (
        <form className="facts__form" onSubmit={handleAddFact}>
          <label>
            <span className="muted">Topic *</span>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. PrimordiaOS Task Claiming"
            />
          </label>
          <label>
            <span className="muted">Summary *</span>
            <textarea
              required
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Concise factual summary"
            />
          </label>
          <label>
            <span className="muted">Key points (one per line)</span>
            <textarea
              rows={3}
              value={keyPointsText}
              onChange={(e) => setKeyPointsText(e.target.value)}
              placeholder={"First point\nSecond point"}
            />
          </label>
          <label>
            <span className="muted">Sources (one per line)</span>
            <textarea
              rows={2}
              value={sourcesText}
              onChange={(e) => setSourcesText(e.target.value)}
              placeholder="https://example.com/source"
            />
          </label>
          {submitError && (
            <p className="facts__error" role="alert">
              {submitError}
            </p>
          )}
          <button type="submit" className="facts__add-btn" disabled={submitting}>
            {submitting ? "Saving…" : "Save fact"}
          </button>
        </form>
      )}

      {databaseMode === "live" && session && (
        <input
          type="search"
          className="facts__filter"
          placeholder="Filter the latest 100 facts…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter facts"
        />
      )}

      {databaseMode !== "mock" && session && loading && (
        <p className="muted">Loading facts…</p>
      )}

      {result?.error && (
        <div className="card alert-card" role="alert">
          <strong>Live facts query failed.</strong>
          <p>{result.error}</p>
        </div>
      )}

      {canShowFacts && !loading && !result?.error && facts.length === 0 && (
        <p className="muted">
          No facts yet.{" "}
          {filter
            ? "Try clearing the filter."
            : "Use the Knowledge Oracle or the Add fact form to populate the store."}
        </p>
      )}

      {canShowFacts && facts.length > 0 && (
        <p className="muted facts__count" aria-live="polite">
          Showing {facts.length}
          {filter ? ` matching "${filter}"` : ""}
          {result && result.facts.length > facts.length
            ? ` of ${result.facts.length}`
            : ""}{" "}
          of the latest 100 facts
        </p>
      )}

      {canShowFacts && (
        <ul className="facts__list">
          {facts.map((fact) => (
            <FactCard key={fact.id} fact={fact} />
          ))}
        </ul>
      )}
    </section>
  );
}

function FactCard({ fact }: { fact: PkoFact }) {
  const created = useMemo(() => new Date(fact.created_at), [fact.created_at]);

  return (
    <li className="fact">
      <div className="fact__head">
        <span className="fact__topic">{fact.topic}</span>
        <time
          className="fact__time"
          dateTime={created.toISOString()}
          title={created.toLocaleString()}
        >
          {timeAgo(created)}
        </time>
      </div>
      <p className="fact__summary">{fact.summary}</p>
      {fact.key_points.length > 0 && (
        <ul className="fact__points">
          {fact.key_points.map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
      )}
      {fact.sources.length > 0 && (
        <ul className="fact__sources">
          {fact.sources.map((source, i) =>
            isHttpUrl(source) ? (
              <li key={i}>
                <a href={source} target="_blank" rel="noopener noreferrer">
                  {source}
                </a>
              </li>
            ) : (
              <li key={i}>{source}</li>
            ),
          )}
        </ul>
      )}
    </li>
  );
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function splitLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function timeAgo(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
