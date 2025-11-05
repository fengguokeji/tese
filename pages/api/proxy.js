export const config = { api: { bodyParser: false } };


const TEXT_HTML = ["text/html", "application/xhtml+xml"];


/** 将任意 url 规范化为绝对地址 */
function resolveUrl(href, base) {
try {
if (!href) return null;
// 过滤不需要代理的 scheme
const low = href.trim().toLowerCase();
if (low.startsWith("data:") || low.startsWith("mailto:") || low.startsWith("javascript:") || low.startsWith("tel:")) return null;
return new URL(href, base).toString();
} catch { return null; }
}


function toProxy(u, origin) {
return `${origin}/api/proxy?url=${encodeURIComponent(u)}`;
}


function rewriteHtml(html, baseUrl, origin) {
// 处理常见属性：href/src/action
html = html.replace(/\b(href|src|action)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, (m, attr, val) => {
const raw = val.replace(/^['"]|['"]$/g, "");
const abs = resolveUrl(raw, baseUrl);
if (!abs) return m;
const proxied = toProxy(abs, origin);
const quoted = val.startsWith('"') ? `"${proxied}"` : val.startsWith("'") ? `'${proxied}'` : proxied;
return `${attr}=${quoted}`;
});


// 处理 srcset（逗号分隔，带描述符）
html = html.replace(/\bsrcset\s*=\s*("[^"]*"|'[^']*')/gi, (m, qv) => {
const v = qv.slice(1, -1);
const parts = v.split(',').map(s => s.trim()).filter(Boolean).map(item => {
const [urlPart, ...rest] = item.split(/\s+/);
const abs = resolveUrl(urlPart, baseUrl);
if (!abs) return item;
return [toProxy(abs, origin), ...rest].join(' ');
});
const rebuilt = parts.join(', ');
const quote = qv.startsWith('"') ? '"' : "'";
return `srcset=${quote}${rebuilt}${quote}`;
});


// 简单处理内联 <style> 与 style="background:url(...)" 的 url(...)
html = html.replace(/url\(([^)]+)\)/gi, (m, inner) => {
const raw = inner.trim().replace(/^['"]|['"]$/g, "");
const abs = resolveUrl(raw, baseUrl);
if (!abs) return m;
}
