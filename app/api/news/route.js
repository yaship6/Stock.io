export const dynamic = "force-dynamic"
export async function GET() {
console.log("News API called")
  const res = await fetch(
    "https://newsapi.org/v2/everything?q=stock&sortBy=publishedAt&apiKey=e744d3bb044949479e11e66e7ae01cf6",
    { cache: "no-store" }
  )

  const data = await res.json()

  return Response.json(data)
}