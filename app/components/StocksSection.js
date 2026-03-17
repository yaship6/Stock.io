"use client"

import {useEffect,useState} from "react"
import {LineChart,Line} from "recharts"

export default function StockSection(){

  const [stocks,setStocks] = useState([])

  const fakeChartData = [
    {v:1},{v:3},{v:2},{v:4},{v:5},{v:3},{v:6}
  ]

  useEffect(()=>{

    const fetchStocks = async ()=>{

      const res = await fetch("/api/stocks")
      const data = await res.json()

      setStocks(data)

    }

    fetchStocks()

    const interval = setInterval(fetchStocks,10000)

    return ()=>clearInterval(interval)

  },[])

  return(

    <div style={container}>

      <h2 style={title}>📈 Live Market</h2>

      {stocks.map((stock,index)=>{

        const positive = stock.change?.includes("-") === false

        return(

          <div key={index} style={card}>

            <div>

              <p style={symbol}>{stock.symbol}</p>
              <p style={company}>{stock.name}</p>

            </div>

            <LineChart width={80} height={40} data={fakeChartData}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={positive ? "#22c55e":"#ef4444"}
                dot={false}
                strokeWidth={2}
              />
            </LineChart>

            <div style={priceBox}>

              <p style={price}>
                ₹ {Number(stock.price).toLocaleString()}
              </p>

              <p style={{
                color:positive ? "#22c55e":"#ef4444",
                fontSize:"12px"
              }}>
                {stock.percent}
              </p>

            </div>

          </div>

        )

      })}

    </div>

  )

}const container = {
  background:"#0f172a",
  padding:"25px",
  borderRadius:"16px",
  height:"100%"
}

const title = {
  marginBottom:"20px",
  fontSize:"20px"
}

const card = {
  display:"flex",
  justifyContent:"space-between",
  alignItems:"center",
  padding:"18px",
  marginBottom:"15px",
  borderRadius:"14px",
  background:"linear-gradient(90deg,#0f172a,#1e293b)",
  border:"1px solid rgba(255,255,255,0.05)"
}

const symbol = {
  fontWeight:"600",
  fontSize:"15px"
}

const company = {
  fontSize:"12px",
  color:"#94a3b8"
}

const priceBox = {
  textAlign:"right"
}

const price = {
  fontSize:"18px",
  fontWeight:"600"
} 