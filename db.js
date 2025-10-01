import pg from "pg";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
console.warn("DATABASE_URL não definida; usando apenas memória até configurar o Render.");
}

export const pool = connectionString
? new Pool({
connectionString,
ssl: { rejectUnauthorized: false }, // necessário no Render Free
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
}