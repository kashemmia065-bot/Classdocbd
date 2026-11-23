export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  const { password, data } = req.body || {};
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD)
    return res.status(401).json({ ok: false, error: 'ভুল পাসওয়ার্ড' });
  if (data && data.verify) return res.status(200).json({ ok: true });
  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(500).json({ ok: false, error: 'Server-এ GitHub token বসানো নেই' });
  if (!data || !Array.isArray(data.offers)) return res.status(400).json({ ok: false, error: 'দামের তথ্য পাওয়া যায়নি' });

  const owner = 'kashemmia065-bot';
  const repo = 'Classdocbd';
  const path = 'prices.json';
  const api = 'https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + path;
  const headers = { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'User-Agent': 'classdoc-admin' };

  const current = await fetch(api, { headers });
  if (!current.ok) return res.status(502).json({ ok: false, error: 'GitHub থেকে বর্তমান file পড়া যায়নি' });
  const curJson = await current.json();

  const content = Buffer.from(JSON.stringify(data, null, 2) + '\n').toString('base64');
  const put = await fetch(api, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Update prices via admin panel', content, sha: curJson.sha })
  });
  if (!put.ok) {
    const t = await put.text();
    return res.status(502).json({ ok: false, error: 'GitHub-এ save হয়নি (' + put.status + ')' });
  }
  return res.status(200).json({ ok: true });
}
