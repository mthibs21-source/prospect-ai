import axios from "axios";
import * as cheerio from "cheerio";

export async function findLinkedIn(name, company) {
  const query = `${name} ${company} linkedin`;

  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

  const res = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    },
  });

  const $ = cheerio.load(res.data);

  let linkedin = null;

  $("a").each((_, el) => {
    const href = $(el).attr("href");

    if (href && href.includes("linkedin.com/in/")) {
      linkedin = href.split("&")[0].replace("/url?q=", "");
    }
  });

  return linkedin;
}