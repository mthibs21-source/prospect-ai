import Database from "better-sqlite3"

const db = new Database("saas.db")

db.prepare(`
CREATE TABLE IF NOT EXISTS companies (
 id INTEGER PRIMARY KEY,
 name TEXT,
 domain TEXT,
 category TEXT,
 description TEXT,
 source TEXT
)
`).run()

export function saveCompany(company){

 db.prepare(`
 INSERT INTO companies (name,domain,category,description,source)
 VALUES (?,?,?,?,?)
 `).run(
  company.name,
  company.domain,
  company.category,
  company.description,
  company.source
 )

}

export function searchCompanies(vertical){

 const rows = db.prepare(`
 SELECT * FROM companies
 WHERE category LIKE ?
 LIMIT 10
 `).all(`%${vertical}%`)

 return rows
}