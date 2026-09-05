import { defineConfig } from 'orval'
export default defineConfig({ forudid: {
  input: '../../docs/openapi.json',
  output: { target: './src/generated/api/forudid.ts', client: 'react-query', httpClient: 'fetch',
    override: { header: false, mutator: { path: './src/lib/api.ts', name: 'apiFetch' },
      fetch: { includeHttpResponseReturnType: false }, query: { useQuery: true, signal: true } },
  },
} })
