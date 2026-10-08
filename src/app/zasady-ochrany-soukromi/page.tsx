export const metadata = { title: 'Zásady ochrany soukromí · EFGEN' }

const H2 = ({ children }: { children: React.ReactNode }) => <h2 className="pt-4 text-xl font-semibold">{children}</h2>

export default function Page() {
  return (
    <main id="obsah" className="mx-auto max-w-2xl space-y-3 px-4 py-10 leading-relaxed">
      <h1 className="text-3xl font-bold">Zásady ochrany soukromí</h1>
      <p className="text-sm text-muted">Platné od 8. 10. 2026</p>
      <p>
        EFGEN (efgen.pro) je osobní nekomerční webová aplikace pro trenéry skupinových lekcí. Tyto zásady vysvětlují, jaké osobní údaje o vás
        zpracováváme, proč a jaká máte práva.
      </p>

      <H2>1. Kdo údaje zpracovává (správce)</H2>
      <p>
        Správcem je Filip Šulc, kontakt: <a className="underline" href="mailto:sulc.filip@gmail.com">sulc.filip@gmail.com</a>. Na tuto adresu se
        také můžete obracet s jakýmkoli dotazem k ochraně soukromí.
      </p>

      <H2>2. Jaké údaje zpracováváme a proč</H2>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          <b>E-mailová adresa a heslo</b> (heslo ukládáme pouze v zašifrované podobě, nikdy ho nevidíme). Slouží k vytvoření a přihlášení k
          účtu, ověření adresy a obnově hesla. Právní základ: plnění smlouvy o poskytování služby (čl. 6 odst. 1 písm. b) GDPR).
        </li>
        <li>
          <b>Zobrazované jméno</b> (nepovinné). Slouží ke zobrazení v aplikaci. Právní základ: váš souhlas, který můžete kdykoli odvolat
          vymazáním jména v profilu.
        </li>
        <li>
          <b>Tréninky, které si uložíte</b> (název, cviky, časy, poznámky, název a velikost skupiny, pokud je zadáte). Slouží k vedení vaší
          historie tréninků. Právní základ: plnění smlouvy.
        </li>
        <li>
          <b>Záznam o odeslaných e-mailech</b> (kdy jste si poslali trénink e-mailem). Slouží k hlídání denního limitu a ochraně služby před
          zneužitím. Právní základ: oprávněný zájem správce (čl. 6 odst. 1 písm. f) GDPR).
        </li>
        <li>
          <b>Technické údaje při návštěvě webu</b> (například IP adresa a čas požadavku) zpracovává poskytovatel hostingu v provozních
          záznamech kvůli bezpečnosti a stabilitě. My je k ničemu dalšímu nepoužíváme.
        </li>
      </ul>
      <p>Údaje nepoužíváme k reklamě, neprodáváme je a nepředáváme je třetím stranám k jejich vlastním účelům. Neprovádíme automatizované rozhodování ani profilování.</p>

      <H2>3. Kdo další se k údajům dostane (zpracovatelé)</H2>
      <p>Aplikaci technicky provozují poskytovatelé, kteří zpracovávají údaje podle našich pokynů:</p>
      <ul className="list-disc space-y-1 pl-6">
        <li><b>Supabase</b> – databáze a přihlašování (uložení účtů a tréninků).</li>
        <li><b>Vercel</b> – hosting aplikace.</li>
        <li><b>Resend</b> – odesílání e-mailů (ověření účtu, obnova hesla, trénink poslaný na vaši adresu).</li>
      </ul>
      <p>
        Data jsou uložena a zpracovávána v Evropské unii: databáze Supabase a odesílání e-mailů přes Resend běží v evropském regionu a
        aplikace na Vercelu ve Frankfurtu. Poskytovatelé jsou však americké společnosti, takže při podpoře či správě služby není vyloučen
        přístup z USA. Ten se řídí odpovídajícími zárukami podle GDPR, například standardními smluvními doložkami nebo rámcem EU–USA pro
        ochranu údajů.
      </p>

      <H2>4. Cookies a úložiště v prohlížeči</H2>
      <p>
        Používáme pouze nezbytné technické cookies, které udržují vaše přihlášení. Bez nich by přihlášení nefungovalo, proto k nim nepotřebujeme
        souhlas. Dále si v úložišti prohlížeče (localStorage) pamatujeme poslední volbu pomůcek, prostředí a úrovně ve formuláři nového
        tréninku, jen ve vašem zařízení. Nepoužíváme reklamní ani analytické cookies.
      </p>

      <H2>5. Jak dlouho údaje uchováváme</H2>
      <p>
        Po dobu existence vašeho účtu. Po smazání účtu odstraníme i vaše tréninky a záznamy o odeslaných e-mailech. Zálohy dat vytvářené
        správcem mohou obsahovat vaše údaje až do přepsání dalšími zálohami.
      </p>

      <H2>6. Vaše práva</H2>
      <p>
        Máte právo na přístup ke svým údajům, jejich opravu, výmaz („právo být zapomenut“), omezení zpracování, přenositelnost a právo vznést
        námitku proti zpracování založenému na oprávněném zájmu. Zobrazované jméno a heslo můžete změnit sami v profilu. Pro smazání účtu
        a všech dat napište na <a className="underline" href="mailto:sulc.filip@gmail.com">sulc.filip@gmail.com</a> z adresy, se kterou jste
        registrováni. Účet smažeme bez zbytečného odkladu.
      </p>
      <p>
        Pokud se domníváte, že zpracováváme vaše údaje v rozporu s právními předpisy, můžete podat stížnost u Úřadu pro ochranu osobních údajů
        (<a className="underline" href="https://www.uoou.gov.cz" rel="noopener noreferrer">uoou.gov.cz</a>).
      </p>

      <H2>7. Změny zásad</H2>
      <p>Tyto zásady můžeme upravit. Aktuální verze je vždy na této stránce a obsahuje datum, od kdy platí.</p>
    </main>
  )
}
