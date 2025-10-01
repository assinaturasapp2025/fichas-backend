import pg from "pg";

const { Pool } = pg;

function hasValidDatabaseUrl() {
const s = process.env.DATABASE_URL;
return typeof s === "string" && /^postgres(ql)?:///i.test(s.trim());
}

export const pool = hasValidDatabaseUrl()
? new Pool({
connectionString: process.env.DATABASE_URL,
ssl: { rejectUnauthorized: false },
})
: null;

export async function query(sql, params = []) {
if (!pool) throw new Error("Sem conexão com o banco (DATABASE_URL ausente).");
const res = await pool.query(sql, params);
return res;
}

export async function ensureSchema() {
if (!pool) return;
await pool.query( CREATE TABLE IF NOT EXISTS empregados ( uid TEXT PRIMARY KEY, nome TEXT NOT NULL, setor TEXT NOT NULL, email TEXT NOT NULL, assinatura_url TEXT, updated_at BIGINT NOT NULL ); );
await pool.query( CREATE INDEX IF NOT EXISTS idx_empregados_updated_at ON empregados (updated_at DESC); );
}