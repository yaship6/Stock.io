"use client"

import { useEffect, useState } from "react"

export default function StocksSection(){

  const [stocks,setStocks] = useState([])

  useEffect(()=>{

    const fetchStocks = async () => {

      const res = await fetch("/api/stocks")
      const data = await res.json()

      setStocks(data)

    }

    fetchStocks()

    const interval = setInterval(fetchStocks,30000)

    return ()=>clearInterval(interval)

  },[])

  return(

    <div>

      {stocks.map((stock,index)=>(
        <div key={index} style={stockCard}>

          <div>
            <h3>{stock.symbol}</h3>
            <p style={{color:"#94a3b8"}}>{stock.company}</p>
          </div>

          <div style={{textAlign:"right"}}>
            <h3>{stock.price}</h3>
          </div>

        </div>
      ))}

    </div>

  )

}

const stockCard = {
  display:"flex",
  justifyContent:"space-between",
  alignItems:"center",
  background:"rgba(30,41,59,0.6)",
  padding:"25px",
  borderRadius:"18px",
  marginBottom:"20px",
  border:"1px solid rgba(255,255,255,0.05)"
}