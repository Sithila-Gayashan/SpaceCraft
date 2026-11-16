// Local-only proxy: Expo serves its HTML before Metro's custom middleware.
const http = require("node:http");
const net = require("node:net");

const targetPort = Number(process.env.EXPO_WEB_PORT || 8081);
const server = http.createServer((req, res) => {
  const upstream = http.request({
    hostname: "127.0.0.1", port: targetPort, path: req.url,
    method: req.method, headers: req.headers,
  }, response => {
    res.writeHead(response.statusCode, {
      ...response.headers,
      "cross-origin-opener-policy": "same-origin",
      "cross-origin-embedder-policy": "require-corp",
    });
    response.pipe(res);
  });
  upstream.on("error", () => {
    res.writeHead(502, { "Content-Type": "text/plain" });
    res.end(`Start Expo first: npx expo start --web --port ${targetPort}`);
  });
  req.pipe(upstream);
});

// Forward Metro's live-reload WebSocket without extra dependencies.
server.on("upgrade", (req, socket, head) => {
  const upstream = net.connect(targetPort, "127.0.0.1", () => {
    const headers = req.rawHeaders.reduce((lines, value, index, all) =>
      index % 2 === 0 ? [...lines, `${value}: ${all[index + 1]}`] : lines, []);
    upstream.write(`${req.method} ${req.url} HTTP/${req.httpVersion}\r\n${headers.join("\r\n")}\r\n\r\n`);
    if (head.length) upstream.write(head);
    socket.pipe(upstream).pipe(socket);
  });
  upstream.on("error", () => socket.destroy());
  socket.on("error", () => upstream.destroy());
  socket.on("close", () => upstream.destroy());
});
server.on("error", error => { console.error(error.message); process.exitCode = 1; });
server.listen(8083, "127.0.0.1", () => {
  console.log(`Open http://127.0.0.1:8083 (Expo must run on port ${targetPort})`);
});
