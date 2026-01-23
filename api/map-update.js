import fs from "fs";
import path from "path";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const filePath = path.join(process.cwd(), "data", "map.json");
  const map = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const body = JSON.parse(req.body);

  map.objects = body.objects;

  fs.writeFileSync(filePath, JSON.stringify(map, null, 2));

  res.status(200).json({ ok: true });
}
