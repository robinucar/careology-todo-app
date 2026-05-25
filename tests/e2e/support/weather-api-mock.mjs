import { createServer } from 'node:http'

const port = Number(process.env.E2E_WEATHER_API_PORT ?? 4100)

const toTitleCase = (value) => {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(' ')
}

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    'content-type': 'application/json',
  })
  response.end(JSON.stringify(payload))
}

const createCondition = () => {
  return {
    icon: '//cdn.weatherapi.com/weather/64x64/day/113.png',
    text: 'Sunny',
  }
}

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host}`)

  if (url.pathname === '/health') {
    sendJson(response, 200, { ok: true })
    return
  }

  if (!url.pathname.startsWith('/v1/')) {
    sendJson(response, 404, { error: { message: 'Not found' } })
    return
  }

  const query = url.searchParams.get('q') ?? ''
  const city = query ? toTitleCase(query) : 'London'

  if (url.pathname.endsWith('/forecast.json')) {
    sendJson(response, 200, {
      forecast: {
        forecastday: [
          {
            day: {
              avgtemp_c: city.toLowerCase() === 'paris' ? 25 : 18,
              condition: createCondition(),
            },
          },
        ],
      },
      location: {
        name: city,
      },
    })
    return
  }

  if (url.pathname.endsWith('/current.json')) {
    sendJson(response, 200, {
      current: {
        condition: createCondition(),
        temp_c: city.toLowerCase() === 'paris' ? 23 : 22,
      },
      location: {
        name: city,
      },
    })
    return
  }

  sendJson(response, 404, { error: { message: 'Not found' } })
})

server.listen(port, '127.0.0.1')

const shutdown = () => {
  server.close(() => {
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
