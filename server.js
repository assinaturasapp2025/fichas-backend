import express from "express";
import morgan from "morgan";

const app = express();
const PORT = 3000;

// “Banco” em memória (perde ao reiniciar; apenas para validar fluxo)
const empregados = new Map(); // chave: uid

app.use(morgan("dev"));
app.use(express.json({ limit: "5mb" }));

// Rota de saúde (teste se servidor está online)
app.get("/health", (_req, res) => res.json({ ok: true }));

// Listar empregados
app.get("/api/empregados", (req, res) => {
  const list = Array.from(empregados.values()).sort(
    (a, b) => b.updatedAt - a.updatedAt
  );
  res.json(list);
});

// Criar/atualizar empregado
app.post("/api/empregados", (req, res) => {
  const { uid, nome, setor, email, assinatura_url } = req.body || {};
  if (!uid || !nome || !setor || !email) {
    return res
      .status(400)
      .json({ error: "Campos obrigatórios: uid, nome, setor, email" });
  }
  const updatedAt = Date.now();
  const reg = {
    uid,
    nome,
    setor,
    email,
    assinatura_url: assinatura_url || null,
    updatedAt,
  };
  empregados.set(uid, reg);
  res.json(reg);
});

// Inicializar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
