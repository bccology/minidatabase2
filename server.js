// Mini Database - zero-dependency Node.js backend
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const PUBLIC_DIR = path.join(__dirname, "public");

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, "[]");

const readDB = () => JSON.parse(fs.readFileSync(DB_FILE, "utf8") || "[]");
const writeDB = (rows) => {
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2));
  fs.renameSync(tmp, DB_FILE);
};

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function send(res, status, body, type = "application/json") {
  res.writeHead(status, { "Content-Type": type });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > 1e5) { reject(new Error("Too large")); req.destroy(); }
    });
    req.on("end", () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch { reject(new Error("Invalid JSON")); }
    });
  });
}

function validate(body) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const age = Number(body.age);
  if (!name || name.length > 100) return { error: "Name is required (max 100 characters)." };
  if (!Number.isInteger(age) || age < 0 || age > 150) return { error: "Age must be a whole number between 0 and 150." };
  return { name, age };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const p = url.pathname;

  try {
    // ---------- API ----------
    if (p === "/api/profiles" && req.method === "GET") {
      return send(res, 200, readDB());
    }
    if (p === "/api/profiles" && req.method === "POST") {
      const v = validate(await readBody(req));
      if (v.error) return send(res, 400, { error: v.error });
      const profile = { id: crypto.randomUUID(), name: v.name, age: v.age, createdAt: new Date().toISOString() };
      const rows = readDB();
      rows.push(profile);
      writeDB(rows);
      return send(res, 201, profile);
    }
    const m = p.match(/^\/api\/profiles\/([\w-]+)$/);
    if (m && req.method === "DELETE") {
      const rows = readDB();
      const next = rows.filter((r) => r.id !== m[1]);
      if (next.length === rows.length) return send(res, 404, { error: "Not found" });
      writeDB(next);
      return send(res, 200, { ok: true });
    }
    if (p.startsWith("/api/")) return send(res, 404, { error: "Not found" });

    // ---------- Static files ----------
    const file = path.normalize(path.join(PUBLIC_DIR, p === "/" ? "index.html" : p));
    if (!file.startsWith(PUBLIC_DIR)) return send(res, 403, "Forbidden", "text/plain");
    fs.readFile(file, (err, buf) => {
      if (err) return send(res, 404, "Not found", "text/plain");
      send(res, 200, buf, MIME[path.extname(file)] || "application/octet-stream");
    });
  } catch (e) {
    send(res, 400, { error: e.message });
  }
});

server.listen(PORT, () => console.log(`Mini Database running on http://localhost:${PORT}`));
