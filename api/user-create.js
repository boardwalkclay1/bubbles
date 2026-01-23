import fs from "fs";
import path from "path";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const filePath = path.join(process.cwd(), "data", "users.json");
  const users = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const body = JSON.parse(req.body);

  const exists = users.find(u => u.email === body.email);
  if (exists) return res.status(400).json({ error: "Email already exists" });

  const newUser = {
    id: Date.now(),
    email: body.email,
    password: body.password,
    role: body.role,
    name: body.name
  };

  users.push(newUser);
  fs.writeFileSync(filePath, JSON.stringify(users, null, 2));

  res.status(200).json({ ok: true, user: newUser });
}
