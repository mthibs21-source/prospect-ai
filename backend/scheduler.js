import cron from "node-cron"
import { discoverCompanies } from "./crawler.js"

const verticals=[
 "field service software",
 "construction software",
 "dental software",
 "restaurant software",
 "fitness software"
]

cron.schedule("0 7 * * *", async ()=>{

 console.log("Running daily SaaS discovery")

 for(const v of verticals){

  await discoverCompanies(v)

 }

})