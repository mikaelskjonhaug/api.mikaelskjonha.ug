import {
    createServer,
    type IncomingMessage,
    type ServerResponse,
} from "node:http";

export function handler(
    _request: IncomingMessage,
    response: ServerResponse,
): void {
    response.writeHead(200, {
        "content-type": "application/json; charset=utf-8",
    });
    response.end(JSON.stringify({ status: "ok" }));
}

if (import.meta.main) {
    createServer(handler).listen(3000, "127.0.0.1", () => {
        console.log("Listening on http://127.0.0.1:3000");
    });
}