export async function generateEmbedding(text: string): Promise<number[]> {
  const config = useRuntimeConfig()

  const response = await $fetch<{ data: { embedding: number[] }[] }>(
    'https://api.openai.com/v1/embeddings',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: {
        model: 'text-embedding-3-small',
        input: text.slice(0, 8000)
      }
    }
  )

  const embedding = response.data[0]?.embedding
  if (!embedding) throw new Error('No embedding returned from OpenAI')
  return embedding
}

export function buildMovieEmbeddingText(title: string, overview: string): string {
  return `${title}. ${overview}`.trim()
}
