export async function GET() {

  const symbols = ["MRF.BSE","TATASTEEL.BSE","LUPIN.BSE"]

  try {

    const results = await Promise.all(

      symbols.map(async (symbol) => {

        const res = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=CUIV2R67G6YTSO75`
        )

        const data = await res.json()

        return {
          symbol,
          price: data["Global Quote"]?.["05. price"] || "N/A"
        }

      })

    )

    return Response.json(results)

  } catch (error) {

    return Response.json({
      error: "Failed to fetch stock data"
    })

  }

}