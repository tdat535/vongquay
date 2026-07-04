export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url } = req.body || {}
  if (!url) {
    return res.status(400).json({ error: 'Missing url' })
  }

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'text/csv,text/plain,*/*' },
    })

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Google returned HTTP ${response.status}`,
      })
    }

    const text = await response.text()
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    return res.status(200).send(text)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
