export default async function handler(req, res) {

const originalURL =
"https://lbgo.bozztv.com/ssh101/ssh101/albanianusa/chunks.m3u8?lb_backend_hint=7";

const requestedURL = req.query.url || originalURL;

try {

const response = await fetch(requestedURL);

if (!response.ok) {
res.status(response.status).send("Stream error");
return;
}

const contentType =
response.headers.get("content-type") || "";

const buffer = await response.arrayBuffer();

res.setHeader("Access-Control-Allow-Origin", "*");
res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

/*
* Nëse është playlist HLS, ndryshojmë adresat
* e segmenteve që edhe ato të kalojnë përmes proxy-t.
*/
if (
contentType.includes("mpegurl") ||
requestedURL.includes(".m3u8")
) {

const text = new TextDecoder().decode(buffer);

const baseURL = new URL(requestedURL);

const lines = text.split("\n");

const rewritten = lines.map(line => {

const trimmed = line.trim();

if (
trimmed &&
!trimmed.startsWith("#")
) {

try {

const absoluteURL =
new URL(trimmed, baseURL).href;

return "/api/proxy?url=" +
encodeURIComponent(absoluteURL);

} catch (e) {

return line;
}
}

return line;

}).join("\n");

res.setHeader(
"Content-Type",
"application/vnd.apple.mpegurl"
);

res.status(200).send(rewritten);

} else {

/*
* Segment video/audio
*/
res.setHeader(
"Content-Type",
contentType || "video/mp2t"
);

res.status(200).send(Buffer.from(buffer));
}

} catch (error) {

res.status(500).send(
"Proxy error: " + error.message
);

}
}
