import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import test from "node:test";

import { handler } from "../src/server.ts";

test("GET /hello reports that the server is running", async () => {
    const server = createServer(handler);

    server.listen(0, "127.0.0.1");
    await once(server, "listening");

    try {
        const address = server.address();
        assert(address && typeof address !== "string");

        const response = await fetch(
            `http://127.0.0.1:${address.port}/hello`,
        );

        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), { status: "ok" });
    } finally {
        await new Promise<void>((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
        });
    }
});

test("API responses allow the website origin", async () => {
    const server = createServer(handler);

    server.listen(0, "127.0.0.1");
    await once(server, "listening");

    try {
        const address = server.address();
        assert(address && typeof address !== "string");

        const response = await fetch(
            `http://127.0.0.1:${address.port}/hello`,
            { headers: { Origin: "https://mikaelskjonha.ug" } },
        );

        assert.equal(
            response.headers.get("access-control-allow-origin"),
            "https://mikaelskjonha.ug",
        );
    } finally {
        await new Promise<void>((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
        });
    }
});

test("/GET unknown route returns 404", async () => {
    const server = createServer(handler);

    server.listen(0, "127.0.0.1");
    await once(server, "listening");

    try {
        const address = server.address();
        assert(address && typeof address !== "string");

        const response = await fetch(
            `http://127.0.0.1:${address.port}/missing`,
        );

        assert.equal(response.status, 404);
        assert.deepEqual(await response.json(), { error: "Not found" });
    } finally {
        await new Promise<void>((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
        });
    }
});
