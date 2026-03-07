export async function GET() {

  const res = await fetch(
    "https://newsapi.org/v2/everything?q=stock+market&sortBy=publishedAt&apiKey=e744d3bb044949479e11e66e7ae01cf6"
  )

  const data = await res.json()

  return Response.json(data)
}