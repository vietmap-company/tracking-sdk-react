import { useState } from "react";
import {
  DashboardController,
  LiveMapController,
} from "@vietmap/fleetwork-tracking-sdk-react";

/* ─── Shared helpers ───────────────────────────────────────── */

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          borderBottom: open ? "1px solid #e2e8f0" : "none",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
              {subtitle}
            </div>
          )}
        </div>
        <span style={{ fontSize: 11, color: "#94a3b8" }}>
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && <div style={{ padding: 14 }}>{children}</div>}
    </div>
  );
}

function ResultView({
  result,
  error,
  loading,
}: {
  result: unknown;
  error: string | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div
        style={{
          padding: 10,
          background: "#fef9c3",
          border: "1px solid #fde68a",
          borderRadius: 6,
          fontSize: 12,
          color: "#92400e",
        }}
      >
        Loading…
      </div>
    );
  }
  if (error) {
    return (
      <div
        style={{
          padding: 10,
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: 6,
          fontSize: 12,
          color: "#b91c1c",
        }}
      >
        {error}
      </div>
    );
  }
  if (result === null || result === undefined) return null;
  return (
    <pre
      style={{
        margin: 0,
        padding: 10,
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 6,
        fontSize: 11,
        lineHeight: 1.6,
        overflowX: "auto",
        maxHeight: 260,
        overflowY: "auto",
      }}
    >
      {JSON.stringify(result, null, 2)}
    </pre>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "5px 8px",
  border: "1px solid #cbd5e1",
  borderRadius: 5,
  fontSize: 12,
  outline: "none",
};

function SmallButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "5px 12px",
        fontSize: 12,
        background: disabled ? "#94a3b8" : "#0f172a",
        color: "white",
        border: "none",
        borderRadius: 5,
        cursor: disabled ? "not-allowed" : "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        flexWrap: "wrap",
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

/* ─── DashboardController sections ────────────────────────── */

function GetSummaryCards() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function call() {
    setLoading(true);
    setError(null);
    try {
      const data = await DashboardController.getSummaryCards();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Row>
        <SmallButton onClick={call} disabled={loading}>
          Call getSummaryCards()
        </SmallButton>
      </Row>
      <ResultView result={result} error={error} loading={loading} />
    </>
  );
}

function GetMemberReport() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function call() {
    setLoading(true);
    setError(null);
    try {
      const data = await DashboardController.getMemberReport(Date.now(), {
        page,
        pageSize,
      });
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Row>
        <Label>page</Label>
        <input
          type="number"
          value={page}
          onChange={(e) => setPage(Math.max(1, Number(e.target.value)))}
          style={{ ...inputStyle, width: 60 }}
          min={1}
        />
        <Label>pageSize</Label>
        <input
          type="number"
          value={pageSize}
          onChange={(e) => setPageSize(Math.max(1, Number(e.target.value)))}
          style={{ ...inputStyle, width: 60 }}
          min={1}
        />
        <SmallButton onClick={call} disabled={loading}>
          Call getMemberReport()
        </SmallButton>
      </Row>
      <ResultView result={result} error={error} loading={loading} />
    </>
  );
}

function GetActivityHeatmap() {
  const [days, setDays] = useState(14);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function call() {
    setLoading(true);
    setError(null);
    try {
      const now = Date.now();
      const data = await DashboardController.getActivityHeatmap(
        now - days * 86_400_000,
        now,
      );
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Row>
        <Label>last N days</Label>
        <input
          type="number"
          value={days}
          onChange={(e) => setDays(Math.max(1, Number(e.target.value)))}
          style={{ ...inputStyle, width: 70 }}
          min={1}
        />
        <SmallButton onClick={call} disabled={loading}>
          Call getActivityHeatmap()
        </SmallButton>
      </Row>
      <ResultView result={result} error={error} loading={loading} />
    </>
  );
}

function GetFuelTracking() {
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("month");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function call() {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const from = new Date(now.getFullYear(), 0, 1).getTime();
      const to = new Date(now.getFullYear(), 11, 31, 23, 59, 59).getTime();
      const data = await DashboardController.getFuelTracking(from, to, {
        groupBy,
      });
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Row>
        <Label>groupBy</Label>
        {(["day", "week", "month"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setGroupBy(v)}
            style={{
              padding: "4px 10px",
              fontSize: 12,
              borderRadius: 5,
              border: "1px solid #cbd5e1",
              background: groupBy === v ? "#0f172a" : "white",
              color: groupBy === v ? "white" : "#475569",
              cursor: "pointer",
            }}
          >
            {v}
          </button>
        ))}
        <SmallButton onClick={call} disabled={loading}>
          Call getFuelTracking()
        </SmallButton>
      </Row>
      <ResultView result={result} error={error} loading={loading} />
    </>
  );
}

function GetMonthlyExpenses() {
  const [currency, setCurrency] = useState("VND");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function call() {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const from = new Date(now.getFullYear(), 0, 1).getTime();
      const to = new Date(now.getFullYear(), 11, 31, 23, 59, 59).getTime();
      const data = await DashboardController.getMonthlyExpenses(from, to, {
        currency,
      });
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Row>
        <Label>currency</Label>
        {["VND", "USD"].map((v) => (
          <button
            key={v}
            onClick={() => setCurrency(v)}
            style={{
              padding: "4px 10px",
              fontSize: 12,
              borderRadius: 5,
              border: "1px solid #cbd5e1",
              background: currency === v ? "#0f172a" : "white",
              color: currency === v ? "white" : "#475569",
              cursor: "pointer",
            }}
          >
            {v}
          </button>
        ))}
        <SmallButton onClick={call} disabled={loading}>
          Call getMonthlyExpenses()
        </SmallButton>
      </Row>
      <ResultView result={result} error={error} loading={loading} />
    </>
  );
}

/* ─── LiveMapController sections ──────────────────────────── */

function GetMembers() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function call() {
    setLoading(true);
    setError(null);
    try {
      const data = await LiveMapController.getMembers();
      setResult(data.slice(0, 20));
      if (data.length > 20) {
        console.log(
          `[LiveMapController.getMembers] ${data.length} total (showing 20)`,
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Row>
        <SmallButton onClick={call} disabled={loading}>
          Call getMembers()
        </SmallButton>
        <span style={{ fontSize: 11, color: "#94a3b8" }}>
          (first 20 shown; all logged to console)
        </span>
      </Row>
      <ResultView result={result} error={error} loading={loading} />
    </>
  );
}

function GetMember() {
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function call() {
    const id = userId.trim();
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await LiveMapController.getMember(id);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Row>
        <Label>userId</Label>
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter a member userId"
          style={{ ...inputStyle, width: 220 }}
        />
        <SmallButton onClick={call} disabled={loading || !userId.trim()}>
          Call getMember()
        </SmallButton>
      </Row>
      <ResultView result={result} error={error} loading={loading} />
    </>
  );
}

function GetLastLocation() {
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function call() {
    const id = userId.trim();
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await LiveMapController.getLastLocation(id);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Row>
        <Label>userId</Label>
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter a member userId"
          style={{ ...inputStyle, width: 220 }}
        />
        <SmallButton onClick={call} disabled={loading || !userId.trim()}>
          Call getLastLocation()
        </SmallButton>
      </Row>
      <ResultView result={result} error={error} loading={loading} />
    </>
  );
}

function GetAllLastLocations() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function call() {
    setLoading(true);
    setError(null);
    try {
      const data = await LiveMapController.getAllLastLocations();
      setResult(Array.isArray(data) ? data.slice(0, 20) : data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Row>
        <SmallButton onClick={call} disabled={loading}>
          Call getAllLastLocations()
        </SmallButton>
        <span style={{ fontSize: 11, color: "#94a3b8" }}>(first 20 shown)</span>
      </Row>
      <ResultView result={result} error={error} loading={loading} />
    </>
  );
}

function GetHistoryRoute() {
  const [vehicleId, setVehicleId] = useState("");
  const [hoursAgo, setHoursAgo] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function call() {
    const id = vehicleId.trim();
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const now = Date.now();
      const data = await LiveMapController.getHistoryRoute(
        id,
        now - hoursAgo * 3600_000,
        now,
      );
      setResult(data.slice(0, 20));
      console.log(
        `[LiveMapController.getHistoryRoute] ${data.length} GPS points`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Row>
        <Label>vehicleId</Label>
        <input
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          placeholder="Enter vehicle ID"
          style={{ ...inputStyle, width: 200 }}
        />
        <Label>last N hours</Label>
        <input
          type="number"
          value={hoursAgo}
          onChange={(e) => setHoursAgo(Math.max(0.1, Number(e.target.value)))}
          style={{ ...inputStyle, width: 70 }}
          min={0.1}
          step={0.5}
        />
        <SmallButton onClick={call} disabled={loading || !vehicleId.trim()}>
          Call getHistoryRoute()
        </SmallButton>
      </Row>
      <ResultView result={result} error={error} loading={loading} />
    </>
  );
}

/* ─── Main export ──────────────────────────────────────────── */

export function ControllersExample() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p
        style={{
          margin: 0,
          fontSize: 12,
          color: "#64748b",
          padding: "8px 12px",
          background: "#f1f5f9",
          borderRadius: 6,
        }}
      >
        Controllers are plain async functions — usable outside React (Node
        scripts, server-side, etc.). They use the global HTTP client initialized
        by <code>FleetworkProvider</code> unless you pass a custom{" "}
        <code>client</code> option.
      </p>

      <div
        style={{
          fontWeight: 600,
          fontSize: 13,
          color: "#0f172a",
          padding: "4px 0",
          borderBottom: "2px solid #e2e8f0",
        }}
      >
        DashboardController
      </div>

      <Section
        title="getSummaryCards()"
        subtitle="DashboardController.getSummaryCards(options?)"
      >
        <GetSummaryCards />
      </Section>

      <Section
        title="getMemberReport(date, options?)"
        subtitle="DashboardController.getMemberReport(date, { page, pageSize })"
      >
        <GetMemberReport />
      </Section>

      <Section
        title="getActivityHeatmap(from, to)"
        subtitle="DashboardController.getActivityHeatmap(from, to)"
      >
        <GetActivityHeatmap />
      </Section>

      <Section
        title="getFuelTracking(from, to, options?)"
        subtitle="DashboardController.getFuelTracking(from, to, { groupBy })"
      >
        <GetFuelTracking />
      </Section>

      <Section
        title="getMonthlyExpenses(from, to, options?)"
        subtitle="DashboardController.getMonthlyExpenses(from, to, { currency })"
      >
        <GetMonthlyExpenses />
      </Section>

      <div
        style={{
          fontWeight: 600,
          fontSize: 13,
          color: "#0f172a",
          padding: "4px 0",
          borderBottom: "2px solid #e2e8f0",
          marginTop: 8,
        }}
      >
        LiveMapController
      </div>

      <Section
        title="getMembers()"
        subtitle="LiveMapController.getMembers(options?)"
      >
        <GetMembers />
      </Section>

      <Section
        title="getMember(userId)"
        subtitle="LiveMapController.getMember(userId, options?)"
      >
        <GetMember />
      </Section>

      <Section
        title="getLastLocation(userId)"
        subtitle="LiveMapController.getLastLocation(userId, options?)"
      >
        <GetLastLocation />
      </Section>

      <Section
        title="getAllLastLocations()"
        subtitle="LiveMapController.getAllLastLocations(options?)"
      >
        <GetAllLastLocations />
      </Section>

      <Section
        title="getHistoryRoute(vehicleId, startTime, endTime)"
        subtitle="LiveMapController.getHistoryRoute(vehicleId, startTime, endTime, options?)"
      >
        <GetHistoryRoute />
      </Section>
    </div>
  );
}
