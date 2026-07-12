import fs from "node:fs/promises";
import path from "node:path";
import nodemailer from "nodemailer";

const STATUS_URL = process.env.STATUS_URL;
const ALERT_FILE = path.join(".alert-state.json");
const COOLDOWN_HOURS = 24;

async function readLastAlert() {
  try {
    const raw = await fs.readFile(ALERT_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeLastAlert(iso) {
  await fs.writeFile(ALERT_FILE, JSON.stringify({ lastAlertAt: iso }, null, 2));
}

function shouldAlert(lastAlertAt) {
  if (!lastAlertAt) return true;
  const elapsed = Date.now() - new Date(lastAlertAt).getTime();
  return elapsed >= COOLDOWN_HOURS * 60 * 60 * 1000;
}

async function sendEmail(subject, text) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.ALERT_EMAIL_FROM,
    to: process.env.ALERT_EMAIL_TO,
    subject,
    text,
  });
}

async function sendSlack(text) {
  if (!process.env.SLACK_WEBHOOK_URL) return;
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

async function main() {
  const res = await fetch(STATUS_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Status fetch failed: ${res.status}`);
  const data = await res.json();

  if (data.state !== "down") {
    return;
  }

  const lastAlert = await readLastAlert();
  if (!shouldAlert(lastAlert?.lastAlertAt)) {
    return;
  }

  const downServices = (data.services || [])
    .filter((s) => s.state === "down")
    .map((s) => s.name);

  const subject = `rjmlaird status: DOWN`;
  const text = [
    `The status page reports downtime.`,
    ``,
    `Overall state: ${data.state}`,
    `Down services: ${downServices.length ? downServices.join(", ") : "unknown"}`,
    `Checked at: ${data.checkedAt}`,
    ``,
    `Status page: ${STATUS_URL.replace("/api/status.json", "/status")}`,
  ].join("\n");

  await sendEmail(subject, text);
  await sendSlack(text);
  await writeLastAlert(new Date().toISOString());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
