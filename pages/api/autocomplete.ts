// pages/api/autocomplete.ts
import type { NextApiRequest, NextApiResponse } from 'next'

type Prediction = {
  description: string
  place_id: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ predictions: Prediction[] } | { error: string }>
) {
  const { input } = req.query
  if (typeof input !== 'string' || !input) {
    return res.status(400).json({ error: 'Missing input query parameter' })
  }

  const apiKey = process.env.GOOGLE_PLACES_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing server API key' })
  }

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
    input
  )}&key=${apiKey}`

  try {
    const r = await fetch(url)
    const data = await r.json()
    if (data.error_message) {
      return res.status(500).json({ error: data.error_message })
    }
    return res.status(200).json({ predictions: data.predictions })
  } catch (err: any) {
    console.error('Places API error:', err)
    return res.status(500).json({ error: 'Places API request failed' })
  }
}
