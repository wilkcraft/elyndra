require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const app = express();
const cors = require("cors");

// ---- Configuración desde .env (con valores por defecto de respaldo) ----
const PORT = parseInt(process.env.PORT, 10) || 8080;
const HOST = process.env.HOST || "0.0.0.0";
const DATA_FILE = path.join(__dirname, process.env.DATA_FILE || "ideas.json");
const MAX_NAME_LENGTH = parseInt(process.env.MAX_NAME_LENGTH, 10) || 40;
const MAX_IDEA_LENGTH = parseInt(process.env.MAX_IDEA_LENGTH, 10) || 300;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

app.use(express.json());
app.use(cors({ origin: "https://elyndra.wilkcraft.work" }));

// Cola simple para serializar escrituras y evitar corromper el JSON
let writeQueue = Promise.resolve();
function readIdeas() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch (err) {
    return [];
  }
}
function saveIdeas(ideas) {
  writeQueue = writeQueue.then(() =>
    fs.promises.writeFile(DATA_FILE, JSON.stringify(ideas, null, 2), "utf-8"),
  );
  return writeQueue;
}

// Notifica la nueva idea en Discord vía webhook
async function notifyDiscord(idea) {
  if (!DISCORD_WEBHOOK_URL) {
    console.warn(
      "DISCORD_WEBHOOK_URL no está definida en .env, no se enviará notificación.",
    );
    return;
  }
  const isAnonymous =
    !idea.name ||
    idea.name.toLowerCase() === "anónimo" ||
    idea.name.toLowerCase() === "anonimo";
  const authorLine = isAnonymous ? "Anónimo" : idea.name;
  const payload = {
    embeds: [
      {
        title: "💡 Nueva idea propuesta",
        color: 0xe3b23c, // dorado, a juego con la web
        fields: [
          { name: "Autor", value: authorLine, inline: true },
          { name: "Idea", value: idea.idea },
        ],
        timestamp: idea.createdAt,
      },
    ],
  };
  try {
    const res = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(
        "Discord webhook respondió con error:",
        res.status,
        await res.text(),
      );
    }
  } catch (err) {
    console.error("Error enviando notificación a Discord:", err);
  }
}

// Listar ideas, ordenadas por votos descendente
app.get("/api/ideas", (req, res) => {
  const ideas = readIdeas().sort((a, b) => b.votes - a.votes);
  res.json(ideas);
});

// Crear una idea nueva
app.post("/api/ideas", async (req, res) => {
  let { name, idea } = req.body || {};
  if (typeof idea !== "string" || idea.trim().length === 0) {
    return res.status(400).json({ error: "La idea no puede estar vacía." });
  }
  idea = idea.trim().slice(0, MAX_IDEA_LENGTH);
  name = (typeof name === "string" ? name.trim() : "").slice(
    0,
    MAX_NAME_LENGTH,
  );
  if (!name) name = "Anónimo";
  const ideas = readIdeas();
  const newIdea = {
    id: crypto.randomUUID(),
    name,
    idea,
    votes: 1,
    createdAt: new Date().toISOString(),
  };
  ideas.push(newIdea);
  await saveIdeas(ideas);
  res.status(201).json(newIdea);

  // No bloqueamos la respuesta al usuario por el envío a Discord
  notifyDiscord(newIdea);
});

// Votar una idea
app.post("/api/ideas/:id/vote", async (req, res) => {
  const { id } = req.params;
  const ideas = readIdeas();
  const target = ideas.find((i) => i.id === id);
  if (!target) {
    return res.status(404).json({ error: "Idea no encontrada." });
  }
  target.votes += 1;
  await saveIdeas(ideas);
  res.json(target);
});

// Quitar el voto de una idea
app.post("/api/ideas/:id/unvote", async (req, res) => {
  const { id } = req.params;
  const ideas = readIdeas();
  const target = ideas.find((i) => i.id === id);
  if (!target) {
    return res.status(404).json({ error: "Idea no encontrada." });
  }
  target.votes = Math.max(0, target.votes - 1);
  await saveIdeas(ideas);
  res.json(target);
});

app.listen(PORT, HOST, () => {
  console.log(`Servidor de ideas escuchando en http://${HOST}:${PORT}`);
});
