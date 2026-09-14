import type {
  AnalyzeRequest,
  AnalyzeResponse,
  GPSPoint,
  LocationResult,
  OCRResponse,
  ProductEstimateRequest,
  ProductEstimateResponse,
  ProductInfo,
  QuoteCompareRequest,
  QuoteComparisonResponse,
  QuoteExtractResponse,
  RoofGPSResponse,
} from '../utils/types'

// Same-domain reverse proxy (local dev, or backend proxied under the
// frontend's own domain) needs nothing set. When the frontend and backend
// are deployed on different domains (e.g. frontend on Netlify, backend on
// a separate host), set VITE_API_BASE_URL to the backend's full origin —
// see README "Deployment" section.
const BASE = import.meta.env.VITE_API_BASE_URL || '/api'

class ApiError extends Error {}

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = `Request failed (${response.status})`
    try {
      const body = await response.json()
      if (body?.detail) detail = body.detail
    } catch {
      // response had no JSON body
    }
    throw new ApiError(detail)
  }
  return response.json() as Promise<T>
}

export async function reverseGeocode(lat: number, lon: number): Promise<LocationResult> {
  const response = await fetch(`${BASE}/location/reverse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lon }),
  })
  return handle<LocationResult>(response)
}

export async function estimateGpsRoofArea(points: GPSPoint[]): Promise<RoofGPSResponse> {
  const response = await fetch(`${BASE}/roof/gps-area`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points }),
  })
  return handle<RoofGPSResponse>(response)
}

export async function ocrBillImage(file: File): Promise<OCRResponse> {
  const form = new FormData()
  form.append('file', file)
  const response = await fetch(`${BASE}/electricity/ocr`, {
    method: 'POST',
    body: form,
  })
  return handle<OCRResponse>(response)
}

export async function analyze(request: AnalyzeRequest): Promise<AnalyzeResponse> {
  const response = await fetch(`${BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  return handle<AnalyzeResponse>(response)
}

export async function downloadPdfReport(analysis: AnalyzeResponse): Promise<Blob> {
  const response = await fetch(`${BASE}/report/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(analysis),
  })
  if (!response.ok) {
    throw new ApiError(`Could not generate PDF report (${response.status})`)
  }
  return response.blob()
}

export async function listProducts(): Promise<ProductInfo[]> {
  const response = await fetch(`${BASE}/products`)
  return handle<ProductInfo[]>(response)
}

export async function estimateWithProduct(
  request: ProductEstimateRequest
): Promise<ProductEstimateResponse> {
  const response = await fetch(`${BASE}/products/estimate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  return handle<ProductEstimateResponse>(response)
}

export async function extractQuoteImage(file: File): Promise<QuoteExtractResponse> {
  const form = new FormData()
  form.append('file', file)
  const response = await fetch(`${BASE}/quote/extract`, {
    method: 'POST',
    body: form,
  })
  return handle<QuoteExtractResponse>(response)
}

export async function compareQuote(request: QuoteCompareRequest): Promise<QuoteComparisonResponse> {
  const response = await fetch(`${BASE}/quote/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  return handle<QuoteComparisonResponse>(response)
}

export { ApiError }
