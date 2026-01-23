import fs from "fs";
import path from "path";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const filePath = path.join(process.cwd(), "data", "users.json");
  const users = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const body = JSON.parse(req.body);

  const user = users.find(
    u => u.email === body.email && u.password === body.password
  );

  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  res.status(200).json({ ok: true, user });
}
