import express from "express";
import morgan from "morgan";

const app = express();
const PORT = process.env.PORT || 3000;

// “Banco” em memória (perde ao reiniciar; apenas para validar fluxo)
const empregados = new Map(); // chave: uid

app.use(morgan("dev"));
app.use(express.json({ limit: "5mb" }));

// CORS simples (opcional)
app.use((req, res, next) => {
res.setHeader("Access-Control-Allow-Origin", "*");
res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
if (req.method === "OPTIONS") return res.sendStatus(204);
next();
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/api/empregados", (req, res) => {
const list = Array.from(empregados.values()).sort((a, b) => b.updatedAt - a.updatedAt);
res.json(list);
});

app.get("/api/empregados/:uid", (req, res) => {
const { uid } = req.params;
const reg = empregados.get(uid);
if (!reg) return res.status(404).json({ error: "Não encontrado" });
res.json(reg);
});

app.post("/api/empregados", (req, res) => {
const { uid, nome, setor, email, assinatura_url } = req.body || {};
if (!uid || !nome || !setor || !email) {
return res.status(400).json({ error: "Campos obrigatórios: uid, nome, setor, email" });
}
const updatedAt = Date.now();
const reg = { uid, nome, setor, email, assinatura_url: assinatura_url || null, updatedAt };
empregados.set(uid, reg);
res.json(reg);
});

app.delete("/api/empregados/:uid", (req, res) => {
const { uid } = req.params;
if (!empregados.has(uid)) return res.status(404).json({ error: "Não encontrado" });
empregados.delete(uid);
res.json({ ok: true });
});

app.listen(PORT, () => console.log('API on :${PORT}'));