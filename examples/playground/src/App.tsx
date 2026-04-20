import {
  FleetworkProvider,
  type Locale,
} from "@vietmap/fleetwork-tracking-sdk-react";
import "@vietmap/fleetwork-tracking-sdk-react/styles.css";
import { useEffect, useState } from "react";
import { ControllersExample } from "./examples/ControllersExample";
import { DashboardExample } from "./examples/DashboardExample";
import { HooksExample } from "./examples/HooksExample";
import { LiveMapExample } from "./examples/LiveMapExample";
import { WidgetsExample } from "./examples/WidgetsExample";

const TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "livemap", label: "LiveMap" },
  { key: "widgets", label: "Widgets" },
  { key: "hooks", label: "Hooks" },
  { key: "controllers", label: "Controllers" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const STORAGE_KEY = "fleetwork-playground-apikey";

export default function App() {
  const envKey = import.meta.env.VITE_FLEETWORK_API_KEY as string | undefined;
  const envBaseUrl = import.meta.env.VITE_FLEETWORK_BASE_URL as
    | string
    | undefined;

  const [apiKey, setApiKey] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? envKey ?? "",
  );
  const [keyDraft, setKeyDraft] = useState(apiKey);
  const [locale, setLocale] = useState<Locale>("vi");
  const [tab, setTab] = useState<TabKey>("dashboard");

  useEffect(() => {
    if (apiKey) localStorage.setItem(STORAGE_KEY, apiKey);
  }, [apiKey]);

  if (!apiKey) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f8fafc",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            width: 420,
            padding: 24,
            background: "white",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          }}
        >
          <h1
            style={{
              fontSize: 18,
              fontWeight: 600,
              margin: 0,
              marginBottom: 6,
            }}
          >
            Fleetwork SDK Playground
          </h1>
          <p
            style={{
              margin: 0,
              marginBottom: 16,
              fontSize: 13,
              color: "#64748b",
            }}
          >
            Enter your API key to start exploring.
          </p>
          <input
            value={keyDraft}
            onChange={(e) => setKeyDraft(e.target.value)}
            placeholder="Your Fleetwork API key"
            style={{
              width: "100%",
              padding: "8px 10px",
              border: "1px solid #cbd5e1",
              borderRadius: 6,
              fontSize: 13,
              outline: "none",
            }}
          />
          <button
            onClick={() => keyDraft.trim() && setApiKey(keyDraft.trim())}
            style={{
              marginTop: 12,
              width: "100%",
              padding: "9px 12px",
              background: "#0f172a",
              color: "white",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Continue
          </button>
          <p
            style={{
              margin: 0,
              marginTop: 10,
              fontSize: 11,
              color: "#94a3b8",
            }}
          >
            Tip: set <code>VITE_FLEETWORK_API_KEY</code> in{" "}
            <code>.env.local</code> to skip this step.
          </p>
        </div>
      </div>
    );
  }

  return (
    <FleetworkProvider apiKey={apiKey} baseUrl={envBaseUrl} locale={locale}>
      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "12px 20px",
            background: "white",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14 }}>Fleetwork SDK</div>
          <nav style={{ display: "flex", gap: 4, flex: 1 }}>
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  fontSize: 13,
                  border: "none",
                  background: tab === t.key ? "#0f172a" : "transparent",
                  color: tab === t.key ? "white" : "#475569",
                  cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            style={{
              padding: "6px 10px",
              border: "1px solid #cbd5e1",
              borderRadius: 6,
              fontSize: 12,
            }}
          >
            <option value="vi">VI</option>
            <option value="en">EN</option>
          </select>

          <button
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              setApiKey("");
              setKeyDraft("");
            }}
            style={{
              padding: "6px 10px",
              border: "1px solid #cbd5e1",
              borderRadius: 6,
              fontSize: 12,
              background: "white",
              color: "#475569",
              cursor: "pointer",
            }}
          >
            Change key
          </button>
        </header>

        <main style={{ padding: 20 }}>
          {tab === "dashboard" && <DashboardExample />}
          {tab === "livemap" && <LiveMapExample />}
          {tab === "widgets" && <WidgetsExample />}
          {tab === "hooks" && <HooksExample />}
          {tab === "controllers" && <ControllersExample />}
        </main>
      </div>
    </FleetworkProvider>
  );
}
