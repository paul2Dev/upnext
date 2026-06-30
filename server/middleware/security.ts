export default defineEventHandler((event) => {
  setResponseHeaders(event, {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': [
      'default-src \'self\'',
      'script-src \'self\' \'unsafe-inline\' \'unsafe-eval\'',
      'style-src \'self\' \'unsafe-inline\'',
      'img-src \'self\' data: blob: https://image.tmdb.org https://lh3.googleusercontent.com',
      'font-src \'self\' data:',
      'connect-src \'self\' https://*.supabase.co wss://*.supabase.co https://api.themoviedb.org https://api.openai.com',
      'media-src \'self\' https://www.youtube.com',
      'frame-src https://www.youtube.com',
      'object-src \'none\''
    ].join('; ')
  })
})
