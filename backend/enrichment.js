export async function enrichEmails(domain,contacts){

 return contacts.map(c=>({

  ...c,
  email: `${c.name.split(" ")[0].toLowerCase()}@${domain}`,
  phone:"(555) 123-4444"

 }))

}