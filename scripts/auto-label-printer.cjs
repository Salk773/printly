const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const { pathToFileURL } = require("url");
const { createClient } = require("@supabase/supabase-js");

const ROOT = path.resolve(__dirname, "..");
const STATE_PATH = path.join(ROOT, ".label-printer-state.json");
const POLL_MS = Number(process.env.LABEL_PRINTER_POLL_MS || 5000);
const STATUS = process.env.LABEL_PRINTER_STATUS || "paid";
const LOOKBACK_HOURS = Number(process.env.LABEL_PRINTER_LOOKBACK_HOURS || 48);

function debugLog(hypothesisId, message, data = {}) {
  // #region agent log
  fetch("http://127.0.0.1:7557/ingest/4c85b0d5-d993-424a-bae9-0fea9b6fa259",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"2eb26c"},body:JSON.stringify({sessionId:"2eb26c",runId:"auto-label-printer",hypothesisId,location:"scripts/auto-label-printer.cjs",message,data,timestamp:Date.now()})}).catch(()=>{});
  // #endregion
}

function loadDotEnv() {
  const file = path.join(ROOT, ".env.local");
  if (!fs.existsSync(file)) return;

  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  } catch {
    return { printedOrderIds: [] };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeItems(items) {
  if (typeof items === "string") {
    try {
      return JSON.parse(items);
    } catch {
      return [];
    }
  }
  return Array.isArray(items) ? items : [];
}

function shipToLines(order) {
  const lines = [];
  if (order.guest_name) lines.push(order.guest_name);
  if (order.phone) lines.push(order.phone);
  if (order.address_line_1) lines.push(order.address_line_1);
  if (order.address_line_2) lines.push(order.address_line_2);
  const tail = [order.city, order.state, order.postal_code].filter(Boolean).join(", ");
  if (tail) lines.push(tail);
  return lines.slice(0, 7);
}

function orderIdentifier(order) {
  return order.order_number ? `Order #${order.order_number}` : `Order ${String(order.id).slice(0, 8)}`;
}

function labelHtml(order) {
  const items = normalizeItems(order.items).slice(0, 10);
  const itemLines = items.map((item) => {
    const name = item?.name || "Item";
    const quantity = typeof item?.quantity === "number" ? item.quantity : 1;
    return `${name} x ${quantity}`;
  });

  const address = shipToLines(order);
  const total = Number(order.total || 0).toFixed(2);
  const created = new Date(order.created_at).toLocaleString();

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(orderIdentifier(order))}</title>
  <style>
    @page { size: 4in 6in; margin: 0; }
    html, body {
      width: 4in;
      height: 6in;
      margin: 0;
      padding: 0;
      background: #fff;
      color: #111;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
    }
    .label {
      width: 4in;
      height: 6in;
      box-sizing: border-box;
      padding: 0.14in;
      overflow: hidden;
      font-size: 12px;
      line-height: 1.28;
    }
    .brand { font-weight: 900; font-size: 15px; letter-spacing: 0.08em; }
    .order { font-weight: 800; font-size: 14px; margin-top: 0.08in; }
    .meta { font-size: 10px; color: #444; margin-top: 0.02in; }
    .section-title {
      font-weight: 900;
      font-size: 11px;
      margin-top: 0.16in;
      border-top: 1px solid #111;
      padding-top: 0.08in;
      letter-spacing: 0.05em;
    }
    .line { margin-top: 0.025in; }
    .items { font-size: 11px; }
    .footer {
      position: absolute;
      left: 0.14in;
      right: 0.14in;
      bottom: 0.14in;
      border-top: 1px solid #111;
      padding-top: 0.08in;
      display: flex;
      justify-content: space-between;
      gap: 0.12in;
      font-weight: 800;
    }
  </style>
</head>
<body>
  <div class="label">
    <div class="brand">PRINTLY</div>
    <div class="order">${escapeHtml(orderIdentifier(order))}</div>
    <div class="meta">${escapeHtml(created)} · ${escapeHtml(order.status)}</div>

    <div class="section-title">SHIP TO</div>
    ${
      address.length
        ? address.map((line) => `<div class="line">${escapeHtml(line)}</div>`).join("")
        : `<div class="line">(No address on file)</div>`
    }

    <div class="section-title">ITEMS</div>
    <div class="items">
      ${
        itemLines.length
          ? itemLines.map((line) => `<div class="line">${escapeHtml(line)}</div>`).join("")
          : `<div class="line">No items listed</div>`
      }
    </div>

    ${
      order.notes
        ? `<div class="section-title">NOTES</div><div class="line">${escapeHtml(String(order.notes).slice(0, 220))}</div>`
        : ""
    }

    <div class="footer">
      <span>${escapeHtml(total)} AED</span>
      <span>${escapeHtml(order.guest_email || "")}</span>
    </div>
  </div>
  <script>
    window.addEventListener("load", () => {
      setTimeout(() => window.print(), 250);
      setTimeout(() => window.close(), 2500);
    });
  </script>
</body>
</html>`;
}

function findBrowserCommand() {
  if (process.env.LABEL_PRINTER_BROWSER_PATH) return process.env.LABEL_PRINTER_BROWSER_PATH;

  const candidates =
    process.platform === "win32"
      ? [
          path.join(process.env["PROGRAMFILES(X86)"] || "", "Microsoft", "Edge", "Application", "msedge.exe"),
          path.join(process.env.PROGRAMFILES || "", "Microsoft", "Edge", "Application", "msedge.exe"),
          path.join(process.env["PROGRAMFILES(X86)"] || "", "Google", "Chrome", "Application", "chrome.exe"),
          path.join(process.env.PROGRAMFILES || "", "Google", "Chrome", "Application", "chrome.exe"),
        ]
      : ["google-chrome", "chromium", "microsoft-edge"];

  return candidates.find((candidate) => candidate && (process.platform !== "win32" || fs.existsSync(candidate)));
}

function printOrder(order) {
  const browser = findBrowserCommand();
  debugLog("L3", "Resolved browser for kiosk printing", {
    hasBrowser: Boolean(browser),
    browserName: browser ? path.basename(browser) : null,
  });
  if (!browser) {
    throw new Error("Could not find Edge or Chrome. Set LABEL_PRINTER_BROWSER_PATH.");
  }

  const tempDir = path.join(os.tmpdir(), "printly-labels");
  fs.mkdirSync(tempDir, { recursive: true });
  const filePath = path.join(tempDir, `label-${order.id}.html`);
  fs.writeFileSync(filePath, labelHtml(order), "utf8");

  const args = [
    "--kiosk-printing",
    "--new-window",
    "--user-data-dir=" + path.join(tempDir, "browser-profile"),
    pathToFileURL(filePath).href,
  ];

  const child = spawn(browser, args, {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
  debugLog("L4", "Launched browser kiosk print process", {
    orderId: order.id,
    orderNumber: order.order_number,
    filePath,
    pid: child.pid,
  });
}

async function pollOnce(supabase, state) {
  const since = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000).toISOString();
  const printed = new Set(state.printedOrderIds || []);
  const data = await fetchOrders(supabase, since);

  debugLog("L1,L2", "Polled orders for auto label printing", {
    status: STATUS,
    lookbackHours: LOOKBACK_HOURS,
    fetchedCount: data.length,
    alreadyPrintedCount: printed.size,
    orderIds: data.map((order) => order.id),
  });

  for (const order of data) {
    if (printed.has(order.id)) {
      debugLog("L2", "Skipped already printed order", {
        orderId: order.id,
        orderNumber: order.order_number,
      });
      continue;
    }
    console.log(`[labels] printing ${orderIdentifier(order)}`);
    printOrder(order);
    printed.add(order.id);
    state.printedOrderIds = Array.from(printed).slice(-500);
    saveState(state);
  }
}

async function fetchOrders(supabase, since) {
  const siteUrl = (process.env.LABEL_PRINTER_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const agentSecret = process.env.LABEL_PRINTER_AGENT_SECRET;

  if (siteUrl && agentSecret) {
    const url = new URL("/api/label-printer/jobs", siteUrl);
    url.searchParams.set("status", STATUS);
    url.searchParams.set("lookbackHours", String(LOOKBACK_HOURS));

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${agentSecret}`,
      },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error || `Label printer API failed (${response.status})`);
    }

    debugLog("L1", "Fetched orders through Printly label-printer API", {
      siteUrl,
      status: STATUS,
      count: Array.isArray(body.orders) ? body.orders.length : 0,
    });
    return Array.isArray(body.orders) ? body.orders : [];
  }

  if (!supabase) {
    throw new Error(
      "Set LABEL_PRINTER_SITE_URL + LABEL_PRINTER_AGENT_SECRET, or provide Supabase env vars."
    );
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("status", STATUS)
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(25);

  if (error) throw error;
  return data || [];
}

async function main() {
  loadDotEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const siteUrl = process.env.LABEL_PRINTER_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  const agentSecret = process.env.LABEL_PRINTER_AGENT_SECRET;

  const canUseApi = Boolean(siteUrl && agentSecret);
  const canUseSupabase = Boolean(url && key);
  if (!canUseApi && !canUseSupabase) {
    throw new Error(
      "Set LABEL_PRINTER_SITE_URL + LABEL_PRINTER_AGENT_SECRET, or NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  console.log("[labels] Printly auto label printer started");
  console.log(`[labels] Watching status="${STATUS}" every ${POLL_MS}ms`);
  console.log(`[labels] Source: ${canUseApi ? "Printly label-printer API" : "Supabase direct"}`);
  console.log("[labels] Set your Windows default printer to the 4x6 label printer.");
  debugLog("L0", "Auto label printer started", {
    status: STATUS,
    pollMs: POLL_MS,
    lookbackHours: LOOKBACK_HOURS,
    source: canUseApi ? "api" : "supabase",
    hasSiteUrl: Boolean(siteUrl),
    hasAgentSecret: Boolean(agentSecret),
    hasSupabaseUrl: Boolean(url),
    hasServiceKey: Boolean(key),
  });

  const supabase = canUseSupabase ? createClient(url, key) : null;
  const state = loadState();

  await pollOnce(supabase, state);
  setInterval(() => {
    pollOnce(supabase, state).catch((error) => {
      console.error("[labels] poll failed:", error.message);
    });
  }, POLL_MS);
}

main().catch((error) => {
  console.error("[labels] fatal:", error.message);
  process.exit(1);
});
