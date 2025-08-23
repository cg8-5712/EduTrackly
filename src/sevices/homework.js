// src/sevices/homework.js
import db from "../utils/db/db_connector.js";

export async function getHomeworkList() {
    const result = await db.query("SELECT * FROM homework ORDER BY created_at DESC");
    return result.rows;
}
