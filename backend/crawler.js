import axios from "axios"
import * as cheerio from "cheerio"
import google from "googlethis"
import { saveCompany } from "./database.js"

function normalize(name){
 return name.toLowerCase().replace(/\s+/g,"")
}

async function googleDiscovery(vertical){

 const query = `${vertical} software`

 const results = await google.search(query)

 const companies = []

 for(const r of results.results){

  if(!r.title) continue

  const company = {
   name:r.title,
   domain:normalize(r.title)+".com",
   category:vertical,
   description:`${r.title} operates in ${vertical} SaaS`,
   source:"google"
  }

  companies.push(company)
  saveCompany(company)

 }

 return companies
}

async function capterraDiscovery(vertical){

 const url=`https://www.capterra.com/search/?query=${encodeURIComponent(vertical)}`

 const {data}=await axios.get(url,{
  headers:{ "User-Agent":"Mozilla/5.0"}
 })

 const $=cheerio.load(data)

 const companies=[]

 $(".ProductCard__title").each((i,el)=>{

  const name=$(el).text().trim()

  if(name){

   const company={
    name,
    domain:normalize(name)+".com",
    category:vertical,
    description:`${name} listed on Capterra`,
    source:"capterra"
   }

   companies.push(company)
   saveCompany(company)

  }

 })

 return companies
}

export async function discoverCompanies(vertical){

 const googleResults = await googleDiscovery(vertical)
 const capterraResults = await capterraDiscovery(vertical)

 return [...googleResults,...capterraResults].slice(0,5)

}