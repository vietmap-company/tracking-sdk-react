import { useState } from "react";
import {
  useSummaryCards,
  useMemberReport,
  useActivityHeatmap,
  useFuelTracking,
  useMonthlyExpenses,
  useMembers,
  useMember,
  useHistoryRoute,
} from "@vietmap/fleetwork-tracking-sdk-react";

/* ─── Shared helpers ───────────────────────────────────────── */

function Section({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
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
        <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{title}</span>
        {badge && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              padding: "2px 8px",
              background: "#f1f5f9",
              color: "#64748b",
              borderRadius: 20,
            }}
          >
            {badge}
          </span>
        )}
        <span style={{ fontSize: 11, color: "#94a3b8" }}>
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && <div style={{ padding: 14 }}>{children}</div>}
    </div>
  );
}

function StatusRow({
  isLoading,
  isFetching,
  error,
}: {
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
}) {
  return (
    <div
      style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}
    >
      <Chip color={isLoading ? "#f59e0b" : "#10b981"}>
        {isLoading ? "loading…" : "ready"}
      </Chip>
      {isFetching && !isLoading && <Chip color="#6366f1">fetching</Chip>}
      {error && <Chip color="#ef4444">error: {error.message}</Chip>}
    </div>
  );
}

function Chip({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 500,
        padding: "2px 8px",
        borderRadius: 20,
        background: color + "1a",
        color,
        border: `1px solid ${color}33`,
      }}
    >
      {children}
    </span>
  );
}

function JsonView({ data }: { data: unknown }) {
  if (data === undefined || data === null) {
    return (
      <span style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>
        no data
      </span>
    );
  }
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
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

/* ─── useSummaryCards ──────────────────────────────────────── */

function SummaryCardsHook() {
  const [pollInterval, setPollInterval] = useState(0);
  const { data, isLoading, isFetching, error, refetch } = useSummaryCards({
    pollInterval: pollInterval || undefined,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label style={{ fontSize: 12, color: "#64748b" }}>
          pollInterval (ms)
        </label>
        <input
          type="number"
          value={pollInterval}
          onChange={(e) => setPollInterval(Number(e.target.value))}
          style={inputStyle}
          min={0}
          step={5000}
          placeholder="0 = disabled"
        />
        <SmallButton onClick={() => refetch()}>Refetch</SmallButton>
      </div>
      <StatusRow isLoading={isLoading} isFetching={isFetching} error={error} />
      <JsonView data={data} />
    </div>
  );
}

/* ─── useMemberReport ──────────────────────────────────────── */

function MemberReportHook() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const { data, isLoading, isFetching, error, refetch } = useMemberReport({
    page,
    pageSize,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <label style={{ fontSize: 12, color: "#64748b" }}>page</label>
        <input
          type="number"
          value={page}
          onChange={(e) => setPage(Math.max(1, Number(e.target.value)))}
          style={{ ...inputStyle, width: 60 }}
          min={1}
        />
        <label style={{ fontSize: 12, color: "#64748b" }}>pageSize</label>
        <input
          type="number"
          value={pageSize}
          onChange={(e) => setPageSize(Math.max(1, Number(e.target.value)))}
          style={{ ...inputStyle, width: 60 }}
          min={1}
        />
        <SmallButton onClick={() => refetch()}>Refetch</SmallButton>
      </div>
      <StatusRow isLoading={isLoading} isFetching={isFetching} error={error} />
      {data && (
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
          Page {data.pagination.page}/{data.pagination.totalPages} —{" "}
          {data.pagination.totalItems} total members
        </div>
      )}
      <JsonView data={data} />
    </div>
  );
}

/* ─── useActivityHeatmap ───────────────────────────────────── */

function ActivityHeatmapHook() {
  const [days, setDays] = useState(14);
  const now = Date.now();
  const from = now - days * 24 * 60 * 60 * 1000;

  const { data, isLoading, isFetching, error, refetch } = useActivityHeatmap({
    from,
    to: now,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label style={{ fontSize: 12, color: "#64748b" }}>last N days</label>
        <input
          type="number"
          value={days}
          onChange={(e) => setDays(Math.max(1, Number(e.target.value)))}
          style={{ ...inputStyle, width: 70 }}
          min={1}
        />
        <SmallButton onClick={() => refetch()}>Refetch</SmallButton>
      </div>
      <StatusRow isLoading={isLoading} isFetching={isFetching} error={error} />
      {data && (
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
          {data.cells.length} cells — metric: {data.metric}
        </div>
      )}
      <JsonView data={data} />
    </div>
  );
}

/* ─── useFuelTracking ──────────────────────────────────────── */

function FuelTrackingHook() {
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("month");
  const { data, isLoading, isFetching, error, refetch } = useFuelTracking({
    groupBy,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label style={{ fontSize: 12, color: "#64748b" }}>groupBy</label>
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
        <SmallButton onClick={() => refetch()}>Refetch</SmallButton>
      </div>
      <StatusRow isLoading={isLoading} isFetching={isFetching} error={error} />
      {data && (
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
          {data.series.length} periods — avg efficiency:{" "}
          {data.totals.avgEfficiencyKmPerL.toFixed(1)} km/L
        </div>
      )}
      <JsonView data={data} />
    </div>
  );
}

/* ─── useMonthlyExpenses ───────────────────────────────────── */

function MonthlyExpensesHook() {
  const [currency, setCurrency] = useState("VND");
  const { data, isLoading, isFetching, error, refetch } = useMonthlyExpenses({
    currency,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label style={{ fontSize: 12, color: "#64748b" }}>currency</label>
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
              color: currency === v ? "#475569" : "white",
              cursor: "pointer",
            }}
          >
            {v}
          </button>
        ))}
        <SmallButton onClick={() => refetch()}>Refetch</SmallButton>
      </div>
      <StatusRow isLoading={isLoading} isFetching={isFetching} error={error} />
      {data && (
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
          {data.months.length} months — grand total:{" "}
          {data.totals.grandTotal.toLocaleString()} {data.currency}
        </div>
      )}
      <JsonView data={data} />
    </div>
  );
}

/* ─── useMembers ───────────────────────────────────────────── */

function MembersHook() {
  const [pollInterval, setPollInterval] = useState(0);
  const { data, isLoading, isFetching, error, refetch } = useMembers({
    pollInterval: pollInterval || undefined,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label style={{ fontSize: 12, color: "#64748b" }}>
          pollInterval (ms)
        </label>
        <input
          type="number"
          value={pollInterval}
          onChange={(e) => setPollInterval(Number(e.target.value))}
          style={inputStyle}
          min={0}
          step={5000}
          placeholder="0 = disabled"
        />
        <SmallButton onClick={() => refetch()}>Refetch</SmallButton>
      </div>
      <StatusRow isLoading={isLoading} isFetching={isFetching} error={error} />
      {data && (
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
          {data.length} members
        </div>
      )}
      <JsonView data={data?.slice(0, 5)} />
      {data && data.length > 5 && (
        <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
          …and {data.length - 5} more (showing first 5)
        </p>
      )}
    </div>
  );
}

/* ─── useMember ────────────────────────────────────────────── */

function MemberHook() {
  const [userId, setUserId] = useState("");
  const [submittedId, setSubmittedId] = useState("");
  const { data, isLoading, isFetching, error, refetch } = useMember(
    submittedId,
    { enabled: !!submittedId },
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label style={{ fontSize: 12, color: "#64748b" }}>userId</label>
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter a member userId"
          style={{ ...inputStyle, width: 220 }}
        />
        <SmallButton
          onClick={() => {
            setSubmittedId(userId.trim());
          }}
        >
          Lookup
        </SmallButton>
        {submittedId && (
          <SmallButton onClick={() => refetch()}>Refetch</SmallButton>
        )}
      </div>
      {submittedId && (
        <>
          <StatusRow
            isLoading={isLoading}
            isFetching={isFetching}
            error={error}
          />
          <JsonView data={data} />
        </>
      )}
      {!submittedId && (
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: "#94a3b8",
            fontStyle: "italic",
          }}
        >
          Enter a userId above and click Lookup.
        </p>
      )}
    </div>
  );
}

/* ─── useHistoryRoute ──────────────────────────────────────── */

function HistoryRouteHook() {
  const [vehicleId, setVehicleId] = useState("");
  const [hoursAgo, setHoursAgo] = useState(1);
  const [submittedId, setSubmittedId] = useState("");
  const [submittedRange, setSubmittedRange] = useState<[number, number]>([
    0, 0,
  ]);

  const { data, isLoading, isFetching, error, refetch } = useHistoryRoute({
    vehicleId: submittedId,
    startTime: submittedRange[0],
    endTime: submittedRange[1],
    enabled: !!submittedId,
  });

  function submit() {
    const id = vehicleId.trim();
    if (!id) return;
    const now = Date.now();
    setSubmittedId(id);
    setSubmittedRange([now - hoursAgo * 3600_000, now]);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <label style={{ fontSize: 12, color: "#64748b" }}>vehicleId</label>
        <input
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          placeholder="Enter vehicle ID"
          style={{ ...inputStyle, width: 200 }}
        />
        <label style={{ fontSize: 12, color: "#64748b" }}>last N hours</label>
        <input
          type="number"
          value={hoursAgo}
          onChange={(e) => setHoursAgo(Math.max(0.1, Number(e.target.value)))}
          style={{ ...inputStyle, width: 70 }}
          min={0.1}
          step={0.5}
        />
        <SmallButton onClick={submit}>Fetch</SmallButton>
        {submittedId && (
          <SmallButton onClick={() => refetch()}>Refetch</SmallButton>
        )}
      </div>
      {submittedId && (
        <>
          <StatusRow
            isLoading={isLoading}
            isFetching={isFetching}
            error={error}
          />
          {data && (
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
              {data.length} GPS points
            </div>
          )}
          <JsonView data={data?.slice(0, 10)} />
          {data && data.length > 10 && (
            <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
              …and {data.length - 10} more (showing first 10)
            </p>
          )}
        </>
      )}
      {!submittedId && (
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: "#94a3b8",
            fontStyle: "italic",
          }}
        >
          Enter a vehicle ID above and click Fetch.
        </p>
      )}
    </div>
  );
}

/* ─── Micro-components ─────────────────────────────────────── */

const inputStyle: React.CSSProperties = {
  padding: "5px 8px",
  border: "1px solid #cbd5e1",
  borderRadius: 5,
  fontSize: 12,
  outline: "none",
  width: 100,
};

function SmallButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 10px",
        fontSize: 12,
        background: "#0f172a",
        color: "white",
        border: "none",
        borderRadius: 5,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

/* ─── Main export ──────────────────────────────────────────── */

export function HooksExample() {
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
        All hooks consume <code>FleetworkProvider</code> context automatically.
        Each section shows live state (<em>isLoading</em>, <em>isFetching</em>,{" "}
        <em>error</em>) and the raw response data.
      </p>

      <Section title="useSummaryCards" badge="dashboard">
        <SummaryCardsHook />
      </Section>

      <Section title="useMemberReport" badge="dashboard">
        <MemberReportHook />
      </Section>

      <Section title="useActivityHeatmap" badge="dashboard">
        <ActivityHeatmapHook />
      </Section>

      <Section title="useFuelTracking" badge="dashboard">
        <FuelTrackingHook />
      </Section>

      <Section title="useMonthlyExpenses" badge="dashboard">
        <MonthlyExpensesHook />
      </Section>

      <Section title="useMembers" badge="livemap">
        <MembersHook />
      </Section>

      <Section title="useMember" badge="livemap">
        <MemberHook />
      </Section>

      <Section title="useHistoryRoute" badge="livemap">
        <HistoryRouteHook />
      </Section>
    </div>
  );
}
