export async function GET() {

  const symbols = [
    {symbol:"MRF.BSE", name:"MRF Limited"},
    {symbol:"TATASTEEL.BSE", name:"Tata Steel"},
    {symbol:"LUPIN.BSE", name:"Lupin Ltd"},
    {symbol:"RELIANCE.BSE", name:"Reliance Industries"},
    {symbol:"INFY.BSE", name:"Infosys"},
    {symbol:"HDFCBANK.BSE", name:"HDFC Bank"}
  ]

  try {

    const results = await Promise.all(

      symbols.map(async(stock)=>{

        const res = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${stock.symbol}&apikey=CUIV2R67G6YTSO75`
        )

        const data = await res.json()

        const quote = data["Global Quote"]

        return {
          symbol:stock.symbol,
          name:stock.name,
          price:quote?.["05. price"],
          change:quote?.["09. change"],
          percent:quote?.["10. change percent"]
        }

      })

    )

    return Response.json(results)

  } catch {

    return Response.json({error:"Failed to fetch stocks"})

  }

}