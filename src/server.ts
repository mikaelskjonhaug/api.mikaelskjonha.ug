import {
    createServer,
    type IncomingMessage,
    type ServerResponse,
} from "node:http";

// Request body stream to JSON
function dataStreamToJSON(request: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
        let data = "";
        request.on("data", (chunk) => {
            data += chunk;
        });
        request.on("end", () => {
            resolve(data);
        });
        request.on("error", (err) => {
            reject(err);
        });
    });
}

// ROUTER
export function handler(
    request: IncomingMessage,
    response: ServerResponse,
): void {
    response.setHeader(
        "content-type",
        "application/json; charset=utf-8",
    );

    if (request.url === "/hello") {
        response.statusCode = 200;
        response.end(JSON.stringify({ status: "ok" }));
        return;
    }

    response.statusCode = 404;
    response.end(JSON.stringify({ error: "Not found" }));
}

if (import.meta.main) {
    createServer(handler).listen(3000, "127.0.0.1", () => {
        console.log("Listening on http://127.0.0.1:3000");
    });
}