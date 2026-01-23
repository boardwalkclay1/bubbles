import fs from "fs";
import path from "path";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const filePath = path.join(process.cwd(), "data", "signals.json");
  const signals = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const body = JSON.parse(req.body);

  const existing = signals.find(s => s.id === body.id);

  const signal = {
    id: body.id,
    role: body.role,
    lat: body.lat,
    lng: body.lng,
    updated: Date.now()
  };

  if (existing) {
    Object.assign(existing, signal);
  } else {
    signals.push(signal);
  }

  fs.writeFileSync(filePath, JSON.stringify(signals, null, 2));

  res.status(200).json({ ok: true });
}
