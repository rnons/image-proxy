const http = require("http");
const URL = require("url");
const util = require("util");
const streamPipeline = util.promisify(require("stream").pipeline);

const fetch = require("node-fetch");

const server = http.createServer(async (req, res) => {
  const { query } = URL.parse(req.url, true);
  const url = query && query.q;
  if (!url) return;

  log(`fetching ${url}`);

  const reqHeaders = { ...req.headers, accept: "image/*" };
  ["host", "cookie"].forEach(name => delete reqHeaders[name]);
  const response = await fetch(url, {
    headers: reqHeaders
  });
  log(`fetched ${url} ${response.status}`);

  const contentType = response.headers.get("Content-Type");
  if (
    response.status === 200 &&
    !(contentType && contentType.startsWith("image/"))
  ) {
    return res.end();
  }

  for (let [name, value] of response.headers) {
    res.setHeader(name, value);
  }
  res.statusCode = response.status;
  if (response.ok) {
    await streamPipeline(response.body, res);
  }
  res.end();
});

const log = str => console.log(`${new Date().toISOString()} ${str}`);

const port = process.env.PORT || 8000;

server.listen(port, () => {
  log(`Server started on ${port}`);
});
