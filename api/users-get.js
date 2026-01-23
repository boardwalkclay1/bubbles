import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), "data", "users.json");
  const users = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const id = parseInt(req.query.id);
  const user = users.find(u => u.id === id);

  if (!user) return res.status(404).json({ error: "User not found" });

  res.status(200).json(user);
}
