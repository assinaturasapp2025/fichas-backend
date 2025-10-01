import express from "express";
import morgan from "morgan";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan("dev"));
app.use(express.json({ limit: "5mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log("API on :" + PORT));

