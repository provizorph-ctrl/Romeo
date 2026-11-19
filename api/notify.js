const MAX_BODY_BYTES = 8192;
const MAX_TEXT_LENGTH = 1000;

function sanitizeEnvValue(raw) {
  if (typeof raw !== 'string') return '';
  let cleaned = raw.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

function sanitizeToken(raw) {
  const cleaned = sanitizeEnvValue(raw);
  return /^bot\d+:/i.test(cleaned) ? cleaned.slice(3) : cleaned;
}

function isAllowedOrigin(req) {
  const secFetchSite = req.headers['sec-fetch-site'];
  if (secFetchSite === 'cross-site') {
    return false;
  }

  const originOrReferer = req.headers.origin || req.headers.referer;
  if (!originOrReferer) {
    // Разрешаем запросы без Origin/Referer только если это не cross-site запрос
    return true;
  }

  let reqHostname = '';
  try {
    reqHostname = new URL(String(originOrReferer)).hostname.toLowerCase();
  } catch {
    return false;
  }

  if (reqHostname === 'localhost' || reqHostname === '127.0.0.1') {
    return true;
  }

  const allowedHosts = new Set();
  const hostHeader = typeof req.headers.host === 'string' ? req.headers.host : '';
  if (hostHeader) {
    allowedHosts.add(hostHeader.split(':')[0].toLowerCase());
  }
  if (process.env.VERCEL_URL) {
    allowedHosts.add(String(process.env.VERCEL_URL).toLowerCase());
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    allowedHosts.add(String(process.env.VERCEL_PROJECT_PRODUCTION_URL).toLowerCase());
  }
  if (process.env.APP_URL) {
    try {
      allowedHosts.add(new URL(process.env.APP_URL).hostname.toLowerCase());
    } catch {
      // Игнорируем некорректный APP_URL
    }
  }

  return allowedHosts.has(reqHostname);
}

async function readParsedBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      const serializedSize = Buffer.byteLength(JSON.stringify(req.body), 'utf8');
      if (serializedSize > MAX_BODY_BYTES) {
        return { errorStatus: 413 };
      }
      return { data: req.body };
    }
    const rawStr = Buffer.isBuffer(req.body)
      ? req.body.toString('utf8')
      : String(req.body);
    if (Buffer.byteLength(rawStr, 'utf8') > MAX_BODY_BYTES) {
      return { errorStatus: 413 };
    }
    try {
      return { data: JSON.parse(rawStr) };
    } catch {
      return { errorStatus: 400 };
    }
  }

  return new Promise((resolve) => {
    const chunks = [];
    let totalBytes = 0;
    let settled = false;

    req.on('data', (chunk) => {
      if (settled) return;
      totalBytes += chunk.length;
      if (totalBytes > MAX_BODY_BYTES) {
        settled = true;
        resolve({ errorStatus: 413 });
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (settled) return;
      settled = true;
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) {
        resolve({ errorStatus: 400 });
        return;
      }
      try {
        resolve({ data: JSON.parse(raw) });
      } catch {
        resolve({ errorStatus: 400 });
      }
    });

    req.on('error', () => {
      if (settled) return;
      settled = true;
      resolve({ errorStatus: 400 });
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }

  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ ok: false });
  }

  const contentLengthHeader = Number(req.headers['content-length'] || 0);
  if (Number.isFinite(contentLengthHeader) && contentLengthHeader > MAX_BODY_BYTES) {
    return res.status(413).json({ ok: false });
  }

  const parsed = await readParsedBody(req);
  if (parsed.errorStatus) {
    return res.status(parsed.errorStatus).json({ ok: false });
  }

  const body = parsed.data;
  if (!body || typeof body !== 'object' || typeof body.text !== 'string') {
    return res.status(400).json({ ok: false });
  }

  const text = body.text.trim();
  if (!text || text.length > MAX_TEXT_LENGTH) {
    return res.status(400).json({ ok: false });
  }

  const botToken = sanitizeToken(process.env.TELEGRAM_BOT_TOKEN);
  const chatId = sanitizeEnvValue(process.env.TELEGRAM_CHAT_ID);

  if (!botToken || !chatId || !/^[A-Za-z0-9:_-]+$/.test(botToken)) {
    console.error('Telegram environment variables are missing or invalid.');
    return res.status(500).json({ ok: false });
  }

  try {
    const tgResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
        }),
      }
    );

    const tgData = await tgResponse.json().catch(() => ({}));
    if (!tgResponse.ok || !tgData.ok) {
      console.error('Telegram API error:', tgResponse.status, tgData?.description || 'unknown');
      return res.status(502).json({ ok: false });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Telegram fetch failed:', err instanceof Error ? err.message : err);
    return res.status(502).json({ ok: false });
  }
}
