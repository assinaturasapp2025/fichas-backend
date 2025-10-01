import express from "express";
import morgan from "morgan";
import { pool, query, ensureSchema } from "./db.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Fallback em memória caso DATABASE_URL não esteja configurada
const memoria = new Map(); // chave: uid

app.use(morgan("dev"));
app.use(express.json({ limit: "5mb" }));

// CORS simples
app.use((req, res, next) => {
res.setHeader("Access-Control-Allow-Origin", "*");
res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
if (req.method === "OPTIONS") return res.sendStatus(204);
next();
});

app.get("/health", (_req, res) => res.json({ ok: true }));

// Inicialização do schema ao subir
(async () => {
try {
if (pool) {
await ensureSchema();
console.log("PostgreSQL pronto (schema verificado).");
} else {
console.log("Sem DATABASE_URL: rodando em memória.");
}
} catch (e) {
console.error("Erro ao preparar banco:", e.message);
}
})();

// Helpers de persistência (DB se disponível; caso contrário, memória)
async function upsertEmpregado(reg) {
const updatedAt = Date.now();
const final = { ...reg, updatedAt };
if (pool) {
await query(
INSERT INTO empregados (uid, nome, setor, email, assinatura_url, updated_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (uid) DO UPDATE SET nome = EXCLUDED.nome, setor = EXCLUDED.setor, email = EXCLUDED.email, assinatura_url = EXCLUDED.assinatura_url, updated_at = EXCLUDED.updated_at,
[final.uid, final.nome, final.setor, final.email, final.assinatura_url || null, final.updatedAt]
);
return final;
} else {
memoria.set(final.uid, final);
return final;
}
}

async function listEmpregados() {
if (pool) {
const r = await query(
"SELECT uid, nome, setor, email, assinatura_url, updated_at AS "updatedAt" FROM empregados ORDER BY updated_at DESC"
);
return r.rows;
} else {
return Array.from(memoria.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}
}

async function getEmpregado(uid) {
if (pool) {
const r = await query(
"SELECT uid, nome, setor, email, assinatura_url, updated_at AS "updatedAt" FROM empregados WHERE uid = $1",
[uid]
);
return r.rows || null;
} else {
return memoria.get(uid) || null;
}
}

async function deleteEmpregado(uid) {
if (pool) {
const r = await query("DELETE FROM empregados WHERE uid = $1", [uid]);
return r.rowCount > 0;
} else {
const existed = memoria.has(uid);
memoria.delete(uid);
return existed;
}
}

// Rotas
app.get("/api/empregados", async (_req, res) => {
try {
const list = await listEmpregados();
res.json(list);
} catch (e) {
console.error(e);
res.status(500).json({ error: "Erro ao listar" });
}
});

app.get("/api/empregados/:uid", async (req, res) => {
try {
const reg = await getEmpregado(req.params.uid);
if (!reg) return res.status(404).json({ error: "Não encontrado" });
res.json(reg);
} catch (e) {
console.error(e);
res.status(500).json({ error: "Erro ao buscar" });
}
});

app.post("/api/empregados", async (req, res) => {
try {
const { uid, nome, setor, email, assinatura_url } = req.body || {};
if (!uid || !nome || !setor || !email) {
return res.status(400).json({ error: "Campos obrigatórios: uid, nome, setor, email" });
}
const saved = await upsertEmpregado({ uid, nome, setor, email, assinatura_url });
res.json(saved);
} catch (e) {
console.error(e);
res.status(500).json({ error: "Erro ao salvar" });
}
});

app.delete("/api/empregados/:uid", async (req, res) => {
try {
const ok = await deleteEmpregado(req.params.uid);
if (!ok) return res.status(404).json({ error: "Não encontrado" });
res.json({ ok: true });
} catch (e) {
console.error(e);
res.status(500).json({ error: "Erro ao excluir" });
}
});

app.listen(PORT, () => console.log(`🚀 API rodando na porta ${PORT}`));