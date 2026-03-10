import axios from "axios"

export async function detectSignals(company){

 try{

  const news = await axios.get(`https://news.google.com/search?q=${company}`)

  if(news.data.includes("funding")) return "recent funding"

  if(news.data.includes("hiring")) return "hiring growth"

 }catch(e){}

 return "product expansion"

}