const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFile, spawnSync } = require("child_process");
const { URL } = require("url");

const HOST = "0.0.0.0";
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const BIN_DIR = path.join(ROOT, "bin");
const SOURCE_FILE = path.join(ROOT, "c_core", "student_system.c");
const EXECUTABLE = path.join(BIN_DIR, process.platform === "win32" ? "student_core.exe" : "student_core");

function ensureCoreBuilt() {
    fs.mkdirSync(BIN_DIR, { recursive: true });

    const result = spawnSync("gcc", ["-std=c11", "-O2", SOURCE_FILE, "-o", EXECUTABLE], {
        cwd: ROOT,
        encoding: "utf8"
    });

    if (result.status !== 0) {
        console.error("C core build failed:");
        console.error(result.stderr || result.stdout);
        process.exit(1);
    }
}

function readRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";

        req.on("data", (chunk) => {
            body += chunk;
            if (body.length > 1024 * 1024) {
                reject(new Error("Request body too large"));
            }
        });

        req.on("end", () => resolve(body));
        req.on("error", reject);
    });
}

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
    });
    res.end(JSON.stringify(payload));
}

function sendFile(res, filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const typeMap = {
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".txt": "text/plain; charset=utf-8",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".svg": "image/svg+xml"
    };

    fs.readFile(filePath, (err, data) => {
        if (err) {
            sendJson(res, 404, { success: false, message: "File not found" });
            return;
        }

        res.writeHead(200, {
            "Content-Type": typeMap[ext] || "application/octet-stream"
        });
        res.end(data);
    });
}

function buildPayload(data = {}) {
    return Object.entries(data)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${key}=${String(value)}`)
        .join("\n");
}

function runCore(args, payload = "") {
    return new Promise((resolve, reject) => {
        const child = execFile(EXECUTABLE, args, { cwd: ROOT, encoding: "utf8" }, (error, stdout, stderr) => {
            if (stderr) {
                console.error(stderr);
            }

            if (error) {
                reject(error);
                return;
            }

            try {
                resolve(JSON.parse(stdout || "{}"));
            } catch (parseError) {
                reject(new Error(`Failed to parse C core output: ${stdout}`));
            }
        });

        if (payload) {
            child.stdin.write(payload, "utf8");
        }
        child.stdin.end();
    });
}

function parseJsonBody(body) {
    if (!body) return {};
    return JSON.parse(body);
}

async function handleApi(req, res, url) {
    const { pathname, searchParams } = url;

    try {
        if (req.method === "GET" && pathname === "/health") {
            return sendJson(res, 200, { success: true, message: "ok" });
        }

        if (req.method === "GET" && pathname === "/api/students") {
            return sendJson(res, 200, await runCore(["list"]));
        }

        if (req.method === "GET" && pathname === "/api/students/search") {
            const type = searchParams.get("type") || "id";
            const keyword = searchParams.get("keyword") || "";
            return sendJson(res, 200, await runCore(["query", type], buildPayload({ keyword })));
        }

        if (req.method === "POST" && pathname === "/api/students") {
            const body = parseJsonBody(await readRequestBody(req));
            return sendJson(
                res,
                200,
                await runCore(["add"], buildPayload({
                    id: body.id,
                    name: body.name,
                    math: body.math,
                    english: body.english,
                    c_language: body.cLanguage
                }))
            );
        }

        if (req.method === "DELETE" && pathname.startsWith("/api/students/")) {
            const id = decodeURIComponent(pathname.split("/").pop());
            return sendJson(res, 200, await runCore(["delete"], buildPayload({ id })));
        }

        if (req.method === "PUT" && pathname.startsWith("/api/students/")) {
            const originalId = decodeURIComponent(pathname.split("/").pop());
            const body = parseJsonBody(await readRequestBody(req));
            return sendJson(
                res,
                200,
                await runCore(["update"], buildPayload({
                    id: originalId,
                    field: body.field,
                    value: body.value
                }))
            );
        }

        if (req.method === "GET" && pathname === "/api/stats") {
            return sendJson(res, 200, await runCore(["stats"]));
        }

        if (req.method === "GET" && pathname === "/api/ranking") {
            return sendJson(res, 200, await runCore(["ranking"]));
        }

        if (req.method === "GET" && pathname === "/api/distribution") {
            return sendJson(res, 200, await runCore(["distribution"]));
        }

        if (req.method === "GET" && pathname === "/api/failing") {
            return sendJson(res, 200, await runCore(["failing"]));
        }

        if (req.method === "OPTIONS") {
            res.writeHead(204, {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            });
            res.end();
            return;
        }

        sendJson(res, 404, { success: false, message: "API not found" });
    } catch (error) {
        sendJson(res, 500, { success: false, message: error.message });
    }
}

function handleStatic(req, res, url) {
    const requested = url.pathname === "/" ? "/index.html" : url.pathname;
    const safePath = path.normalize(requested).replace(/^(\.\.[/\\])+/, "");
    const filePath = path.join(PUBLIC_DIR, safePath);

    if (!filePath.startsWith(PUBLIC_DIR)) {
        sendJson(res, 403, { success: false, message: "Forbidden" });
        return;
    }

    sendFile(res, filePath);
}

ensureCoreBuilt();

function getLanAddresses() {
    const interfaces = os.networkInterfaces();
    const addresses = [];

    Object.values(interfaces).forEach((entries) => {
        (entries || []).forEach((entry) => {
            if (entry.family === "IPv4" && !entry.internal) {
                addresses.push(entry.address);
            }
        });
    });

    return addresses;
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === "/health" || url.pathname.startsWith("/api/")) {
        handleApi(req, res, url);
        return;
    }

    handleStatic(req, res, url);
});

server.listen(PORT, HOST, () => {
    console.log(`Student system is running at http://localhost:${PORT}`);
    getLanAddresses().forEach((address) => {
        console.log(`LAN access: http://${address}:${PORT}`);
    });
});
