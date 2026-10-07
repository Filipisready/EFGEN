export const metadata = { title: 'Zásady ochrany soukromí · EFGEN' }

export default function Page() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-10 leading-relaxed">
      <h1 className="text-3xl font-bold">Zásady ochrany soukromí</h1>
      <p>EFGEN (efgen.pro) je osobní nekomerční projekt. Správcem osobních údajů je Filip Šulc, kontakt: sulc.filip@gmail.com.</p>
      <h2 className="pt-2 text-xl font-semibold">Jaké údaje ukládáme</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li>E-mailovou adresu a heslo (heslo je uloženo pouze v zašifrované podobě).</li>
        <li>Volitelně zobrazované jméno.</li>
        <li>Tréninky, které si v aplikaci vytvoříte a uložíte, a záznam o odeslaných e-mailech (čas odeslání, kvůli denním limitu).</li>
      </ul>
      <h2 className="pt-2 text-xl font-semibold">Proč je ukládáme</h2>
      <p>Abyste se mohli přihlásit, měli vlastní historii tréninků a mohli si trénink poslat e-mailem. Údaje nepoužíváme k reklamě a nepředáváme je třetím stranám k jejich vlastním účelům.</p>
      <h2 className="pt-2 text-xl font-semibold">Kdo údaje zpracovává</h2>
      <p>Technické zpracování zajišťují poskytovatelé služeb: Supabase (databáze a přihlášení), Vercel (hosting) a Resend (odesílání e-mailů).</p>
      <h2 className="pt-2 text-xl font-semibold">Jak dlouho údaje uchováváme</h2>
      <p>Po dobu existence účtu. Po smazání účtu odstraníme i vaše tréninky.</p>
      <h2 className="pt-2 text-xl font-semibold">Vaše práva</h2>
      <p>Můžete požádat o přístup k údajům, jejich opravu nebo smazání účtu a všech dat. Napište na sulc.filip@gmail.com, účet smažeme.</p>
    </main>
  )
}
