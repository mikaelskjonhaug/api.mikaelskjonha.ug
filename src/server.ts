import {
    createServer,
    type IncomingMessage,
    type ServerResponse,
} from "node:http";

import { pool } from "./db.ts";
import { fetchActivity } from "./github.ts";

// Request body stream to JSON
function readBody(request: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
        let data = "";
        request.on(
            "data",
            (chunk) => { data += chunk; }
        );
        request.on("end", () => {
            resolve(data);
        });
        request.on("error", (err) => {
            reject(err);
        });
    });
}

async function readJson(request: IncomingMessage): Promise<any> {
    return JSON.parse(await readBody(request));
}

// ROUTER
export async function handler(
    request: IncomingMessage,
    response: ServerResponse,
): Promise<void> {
    response.setHeader(
        "content-type",
        "application/json; charset=utf-8",
    );
    // Sanity test 
    if (request.url === "/hello") {
        response.statusCode = 200;
        response.end(JSON.stringify({ status: "ok" }));
        return;
    }
    // ### GITHUB ACTIVITY ###
    if (request.method === "GET" && request.url === "/activity") {
        try {
            const result = await fetchActivity();
            response.statusCode = 200;
            response.end(JSON.stringify(result))
            return;
        } catch (error) {
            console.error(error);
            response.statusCode = 500;
            response.end(JSON.stringify({
                error: "GITHUB API ERROR"
            }))
            return;
        }
    }
    // ### GUESTBOOK ###
    // Get guestbook list
    if (request.method === "GET" && request.url === "/guestbook") {
        try {
            const result = await pool.query(
                `SELECT *
                FROM guestbook
                ORDER BY created_at DESC;`,
            );
            response.statusCode = 200;
            response.end(JSON.stringify(result.rows));
            return
        } catch (error) {
            console.error(error)
            response.statusCode = 500;
            response.end(JSON.stringify({
                error: "DATABASE ERROR",
            }));
            return;
        }
    }

    // Create new guestbook entry
    if (request.method === "POST" && request.url === "/guestbook") {
        const body = await readJson(request);
        if (typeof (body.entry) !== "string" || !body.entry.trim()) {
            response.statusCode = 400;
            response.end(JSON.stringify({ error: "Invalid entry" }));
            return;
        }
        const name = typeof (body.name) === "string" ? body.name.trim() : null;
        try {
            const result = await pool.query(
                'INSERT INTO guestbook (entry, name) VALUES ($1, $2)',
                [body.entry.trim(), name],
            );
            response.statusCode = 204;
            response.end();
            return;
        } catch (error) {
            console.error(error)
            response.statusCode = 500;
            response.end(JSON.stringify({
                error: "Database error",
            }));
            return;
        }
    }
    response.statusCode = 404;
    response.end(JSON.stringify({ error: "Not found" }));
    return;
}

if (import.meta.main) {
    const port = Number(process.env.PORT) || 3000;
    createServer(handler).listen(port, "0.0.0.0", () => {
        console.log(`Listening on http://0.0.0.0:${port}`);
    });
}
