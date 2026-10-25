const fs = require("fs");
const http = require("http");
const path = require("path");

const outputDirectory = path.resolve(__dirname, "..", "out");
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

if (!fs.existsSync(outputDirectory)) {
  console.error('Static export not found. Run "npm run build" first.');
  process.exit(1);
}

const server = http.createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end("Method not allowed");
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname
    );
  } catch (error) {
    response.writeHead(400);
    response.end("Invalid URL");
    return;
  }

  const relativePath = path.normalize(pathname.replace(/^[/\\]+/, ""));
  const targetPath = path.resolve(outputDirectory, relativePath || "index.html");
  const relativeTarget = path.relative(outputDirectory, targetPath);

  if (
    relativeTarget === ".." ||
    relativeTarget.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeTarget)
  ) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  const candidates = [targetPath];
  if (!path.extname(targetPath)) {
    candidates.push(
      pathname.endsWith("/")
        ? path.join(targetPath, "index.html")
        : `${targetPath}.html`,
      path.join(targetPath, "index.html")
    );
  }

  let file;
  for (const candidate of candidates) {
    try {
      const stats = await fs.promises.stat(candidate);
      const resolvedCandidate = stats.isDirectory()
        ? path.join(candidate, "index.html")
        : candidate;
      file = await fs.promises.readFile(resolvedCandidate);
      pathname = resolvedCandidate;
      break;
    } catch (error) {
      if (error.code !== "ENOENT" && error.code !== "ENOTDIR") {
        console.error("Static file read failed:", error);
        response.writeHead(500);
        response.end("Unable to read requested file");
        return;
      }
    }
  }

  if (!file) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Length": file.length,
    "Content-Type":
      contentTypes[path.extname(pathname).toLowerCase()] ||
      "application/octet-stream",
  });
  response.end(request.method === "HEAD" ? undefined : file);
});

const port = Number(process.env.PORT || 3000);
server.listen(port, () => {
  console.log(`ElitePay static export available at http://localhost:${port}`);
});
