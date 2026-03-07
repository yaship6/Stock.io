"use client"

import { useEffect, useState } from "react"
import axios from "axios"

export default function NewsPage() {

  const [articles,setArticles] = useState([])

  useEffect(() => {

    const fetchNews = async () => {
      const res = await axios.get("/api/news")
      setArticles(res.data.articles)
    }

    fetchNews()

    const interval = setInterval(fetchNews,60000)

    return () => clearInterval(interval)

  },[])

  return (
    <div style={{padding:"40px"}}>

      <h1>Stocks News</h1>

      {articles.slice(0,10).map((article,index)=>(
  <div key={index} style={newsCard}>

    {article.urlToImage && (
      <img
        src={article.urlToImage}
        style={newsImage}
      />
    )}

    <div>
      <p style={source}>{article.source?.name}</p>

      <h3 style={headline}>
        {article.title}
      </h3>

      <p style={summary}>
        {article.description}
      </p>

      <a href={article.url} target="_blank" style={readMore}>
        Read full article →
      </a>

    </div>

  </div>
))}

    </div>
  )
}
const newsCard = {
  display: "flex",
  gap: "20px",
  padding: "20px",
  borderRadius: "12px",
  background: "rgba(30,41,59,0.6)",
  marginBottom: "20px",
  border: "1px solid rgba(255,255,255,0.05)"
}

const newsImage = {
  width: "200px",
  height: "120px",
  objectFit: "cover",
  borderRadius: "10px"
}

const source = {
  fontSize: "12px",
  color: "#94a3b8"
}

const headline = {
  fontSize: "18px",
  fontWeight: "600",
  margin: "5px 0"
}

const summary = {
  fontSize: "14px",
  color: "#94a3b8"
}

const readMore = {
  color: "#00ffae",
  fontSize: "13px",
  textDecoration: "none"
}