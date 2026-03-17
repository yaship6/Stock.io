"use client"

import { useEffect, useState } from "react"
import axios from "axios"

export default function NewsSection() {

  const [articles,setArticles] = useState([])

  useEffect(() => {

    const fetchNews = async () => {
      const res = await axios.get("/api/news")
      setArticles(res.data.articles)
    }

    fetchNews()

    const interval = setInterval(fetchNews,5000)

    return () => clearInterval(interval)

  },[])

  return (

    <div style={container}>

      <h2 style={title}>📰 Market News</h2>

      {articles.slice(0,6).map((article,index)=>(

        <div key={index} style={newsCard}>

          {article.urlToImage && (
            <img
              src={article.urlToImage}
              style={newsImage}
            />
          )}

          <div>

            <p style={source}>{article.source?.name}</p>

            <p style={headline}>
              {article.title}
            </p>

            <a href={article.url} target="_blank" style={readMore}>
              Read →
            </a>

          </div>

        </div>

      ))}

    </div>

  )
}
const container = {
  background:"#0f172a",
  padding:"20px",
  borderRadius:"12px",
  height:"100%",
  overflowY:"auto"
}

const title = {
  fontSize:"20px",
  marginBottom:"20px"
}

const newsCard = {
  display:"flex",
  gap:"15px",
  marginBottom:"15px",
  paddingBottom:"15px",
  borderBottom:"1px solid rgba(255,255,255,0.05)"
}

const newsImage = {
  width:"120px",
  height:"80px",
  objectFit:"cover",
  borderRadius:"8px"
}

const source = {
  fontSize:"12px",
  color:"#94a3b8"
}

const headline = {
  fontSize:"14px",
  fontWeight:"600"
}

const readMore = {
  fontSize:"12px",
  color:"#00ffae",
  textDecoration:"none"
}