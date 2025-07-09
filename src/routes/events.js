const express = require("express");
const pool = require("../db/pool");
const verifyApiKey = require("../middleware/verfiyApiKey");
const router = express.Router();

// Get all events (with pagination)
router.get("/", verifyApiKey, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const result = await pool.query(
      "SELECT * FROM redact_event ORDER BY created_at DESC LIMIT $1 OFFSET $2",
      [limit, offset]
    );

    res.json({
      events: result.rows,
      limit,
      offset,
      total: result.rowCount,
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get event by ID
router.get("/:id", verifyApiKey, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM redact_event WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new event
router.post("/", verifyApiKey, async (req, res) => {
  try {
    const { type, sender, content, event_id, room_id } = req.body;

    // Basic validation
    if (!type || !sender) {
      return res.status(400).json({ error: "Type and sender are required" });
    }

    const result = await pool.query(
      "INSERT INTO redact_event (type, sender, content, event_id, room_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [type, sender, content, event_id, room_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update event
router.put("/:id", verifyApiKey, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, sender, content, event_id, room_id } = req.body;

    const result = await pool.query(
      "UPDATE redact_event SET type = $1, sender = $2, content = $3, event_id = $4, room_id = $5 WHERE id = $6 RETURNING *",
      [type, sender, content, event_id, room_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete event
router.delete("/:id", verifyApiKey, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM redact_event WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json({ message: "Event deleted successfully", event: result.rows[0] });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get events by room
router.get("/room/:roomId", verifyApiKey, async (req, res) => {
  try {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const result = await pool.query(
      "SELECT * FROM redact_event WHERE room_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
      [roomId, limit, offset]
    );

    res.json({
      events: result.rows,
      room_id: roomId,
      limit,
      offset,
      total: result.rowCount,
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
