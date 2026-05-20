const BASE = '/api'

async function get(path, params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString()
  const url = qs ? `${BASE}${path}?${qs}` : `${BASE}${path}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
  return res.json()
}

export const api = {
  records: (params) => get('/records', params),
  record: (id) => get(`/records/${id}`),
  engagement: (id) => get(`/records/${id}/engagement`),
  portfolio: () => get('/portfolio'),
  kbList: () => get('/knowledge-base'),
  kbDoc: (name) => get(`/knowledge-base/${name}`),
  filterOptions: () => get('/filters/options'),
}
