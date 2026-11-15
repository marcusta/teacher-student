# Veckoschema för stall och hästar

API och webb implementerade 2026-11-15. Native iOS återstår som separat leverans.

Leverera ett gemensamt veckoschema med stallrutiner överst och en horisontell rad per häst under. Båda schemana har samma måndag till söndag-kolumner. Behåll filtren, aktivitetspanelen, kopieringen, veckomallarna och hästloggen.

Första leveransen omfattar API och webb. iOS kan därefter använda samma API i en separat leverans. Steg 1 till 7 nedan utgör tillsammans hela webbimplementationen.

## Föreslagna produktregler

### Stall och medlemskap

- Ett stall har namn, tidszon, medlemmar och uttryckligen anslutna hästar. Första standardtidszonen är `Europe/Stockholm`.
- En användare kan vara medlem i flera stall. Schemat visar ett valt stall åt gången. Stallväljaren visas när användaren har flera stall.
- Den som skapar stallet blir stallansvarig. Roller i stallet är `admin` och `member`.
- Stallansvarig skapar schemat, hanterar aktivitetstyper och mallar samt tilldelar medlemmar.
- Medlemmar ser stallets schema och delade hästlogg. De kan rapportera sina tilldelade aktiviteter och registrera genomförda händelser kring anslutna hästar.
- Medlemmar får också planera hästaktiviteter som de själva ansvarar för. Bara stallansvariga kan tilldela arbete till andra och ändra stallrutiner.
- En medlem kan ta en otilldelad aktivitet genom att tilldela den till sig själv. Den ändringen måste ske atomiskt.
- Stallansvarig kan rapportera genomförande åt andra. Sparad information skiljer på registrerande användare och faktiska utförare.
- Stallinbjudningar kräver mottagarens acceptans. De skapar ett stallmedlemskap och använder en egen modell, skild från lärarens elevinbjudningar.
- Visa stallinbjudningar i Inkorg. Efter registrering kan mottagaren acceptera en väntande inbjudan som matchar kontots e-postadress.
- Borttaget medlemskap spärrar stallåtkomst omedelbart. Befintliga uppgifter behåller sin historiska tilldelning, men nya tilldelningar får bara använda aktiva medlemmar.
- Den sista stallansvarige kan inte lämna stallet utan att först utse en annan.

### Hästar och åtkomst

`horses.student_id` behåller sitt nuvarande ägande. Lägg till en separat koppling mellan stall och häst. Hästägaren ansluter sin häst och godkänner därmed att stallmedlemmar får se hästens namn, schemalägga arbete och läsa stallets aktivitetslogg för hästen.

Stallkopplingen ger inte tillgång till befintliga privata träningspass, mål eller anteckningar. Stallansvarig hanterar schemat; hästägaren behåller rätten att ändra och arkivera själva hästen.

Hästägaren eller stallansvarig kan avsluta stallkopplingen. Genomförd historik ligger kvar i det stall där arbetet registrerades. Nya aktiviteter kräver en aktiv koppling. Befintliga framtida aktiviteter för en bortkopplad eller arkiverad häst markeras för åtgärd och kan ställas in.

Stallets hästlogg omfattar händelser i det aktuella stallet. En eventuell sammanställning över flera stall måste kontrollera läsarens åtkomst till varje källa.

### Aktiviteter och genomförande

- En aktivitet gäller antingen hela stallet eller exakt en häst.
- Varje aktivitet har typ, rubrik, datum, valfri tid, instruktion och noll eller flera ansvariga.
- Förvalda stallrutiner är morgonfodring, utsläpp, lunchfodring, insläpp och kvällsfodring. Stallansvarig kan lägga till egna typer.
- Hästaktiviteter omfattar skötsel, träning, veterinär, hovslagare och egna aktiviteter. Veterinär och hovslagare får datum, tid och anteckningar i denna leverans.
- Status är `planned`, `completed` eller `cancelled`. En passerad tid ändrar aldrig status automatiskt.
- Ett genomförande gäller hela aktiviteten, även om flera personer ansvarar för den.
- Instruktion inför arbetet och resultatanteckning efteråt är separata fält.
- Genomförandet sparar faktisk händelsetid, utförare och vem som registrerade uppgiften. Registreringstid sparas separat.
- En användare kan registrera en genomförd hästhändelse direkt, utan föregående planering.
- Återöppning tar bort aktiviteten från genomförd aktivitetslogg. Den skapar ingen ny schemapost och raderar inga länkade träningspass.

## Alla filter och deras beteende

| Filter | Urval |
| --- | --- |
| Allt | Stallaktiviteter och hästaktiviteter i valt stall och vald vecka. |
| Stallet | Aktiviteter utan hästkoppling. |
| Hästarna | Aktiviteter för alla anslutna hästar. |
| En viss häst | Aktiviteter med den hästens ID. Hästnamnet används bara som etikett. |
| Mina | Aktiviteter där den inloggade användaren är ansvarig. Skaparen avgör inte urvalet. |
| Alla statusar | Planerade, genomförda och inställda aktiviteter. |
| Återstående | Planerade aktiviteter, även om den planerade tiden har passerat. |
| Genomförda | Aktiviteter med status `completed`. |
| Utan ansvarig | Aktiviteter utan tilldelning, med undantag för inställda aktiviteter. |

Allt, Stallet, Hästarna och en viss häst är alternativa omfattningar. Mina, status och Utan ansvarig kombineras med vald omfattning genom AND. Mina tillsammans med Utan ansvarig ger därför ett tomt resultat.

Behåll filterval när användaren byter vecka, öppnar eller stänger en aktivitet och uppdaterar sidan. Spara val i `sessionStorage`, med namnrymd för användare och stall. Rensa dem vid utloggning och validera sparade häst-ID:n mot aktuell åtkomst.

Veckans två räknare gäller hela den hämtade veckan före filtrering. Visa detta med etiketterna "Genomförda denna vecka" och "Utan ansvarig denna vecka". Antal i en hästrad gäller däremot radens synliga aktiviteter.

I grundvyerna Allt och Hästarna finns även tomma hästrader, så att nästa aktivitet kan planeras. Mina, status och Utan ansvarig kan dölja rader utan träffar. En uttryckligen vald häst behåller sin rad även när urvalet är tomt.

Filtrering ändrar aldrig data. En tom vy visar vilka filter som är aktiva och erbjuder att återställa dem.

## Datamodell

Veckan är ett datumintervall över aktiviteter. Den behöver ingen separat tabell för varje vecka. Återanvändbara veckomallar har däremot egna poster.

| Modell | Innehåll |
| --- | --- |
| `stables` | Namn, tidszon och skapare. |
| `stable_members` | Stall, användare, roll och tid för avslutat medlemskap. |
| `stable_invitations` | Stall, mottagare, avsändare, status och utgångstid. |
| `stable_horses` | Uttrycklig stallkoppling, godkännande av hästägaren och tid för avslutad koppling. |
| `stable_activity_types` | Stall, stabilt typ-ID, kategori, namn, standardtid, radordning och arkivering. |
| `stable_activities` | Stall, typ, eventuell häst, rubrik, planerat datum och tid, instruktion, status, resultatanteckning, genomförandefält, skapare och versionsnummer. |
| `stable_activity_assignees` | En rad per planerat ansvarig användare. Unik kombination av aktivitet och användare. |
| `stable_activity_performers` | En rad per faktisk utförare vid genomförande. |
| `schedule_templates` | Stall, namn och skapare. |
| `schedule_template_items` | Veckodag, typ, eventuell häst, rubrik, tid, instruktion och ordning. Valfria ansvariga lagras i en kopplingstabell. |
| `schedule_operations` | Unikt request-ID per stall för skapande, kopiering och tillämpning av mall. Sparar resultatet för säkra återförsök. |
| Katalogkopplingar | Program och ordnade övningar knutna till en träningsaktivitet, med innehåll kopierat vid planeringen. Tillkommer i steg 6. |

Spara planerat datum som `YYYY-MM-DD` och valfri lokal tid som `HH:mm`, med stallets tidszon. Spara faktiska tidpunkter som ISO-tidsstämplar i UTC. Kalenderberäkningar ska använda lokala kalenderdagar, inte addera 24 timmar mellan dygn. Validera datum och hantera sommartidsövergångar uttryckligt.

Aktiviteten behåller sin rubrik även om aktivitetstypen senare byter namn. Gruppera stallrutiner med typ-ID. Visa standardtiden i radhuvudet och eventuella avvikelser i respektive cell. Flera tillfällen av samma typ får förekomma samma dag.

Använd främmande nycklar och index för stall och datum, häst och händelsetid samt ansvarig användare. Kontrollera även att kopplade hästar, typer och medlemmar tillhör rätt stall. Arkivering och avslutade medlemskap ska bevara historiska referenser.

Varje aktivitet har ett versionsnummer. Uppdatering med en gammal version ger `409 Conflict`. UI hämtar den nya versionen och låter användaren behålla sin osparade text medan konflikten löses.

## API och klientstruktur

Föreslagna API-grupper är `stables.api.ts`, `stable-activities.api.ts` och `schedule-templates.api.ts`. Följ befintliga TypeBox-kontrakt och servicebaserade behörighetskontroller.

| Anrop | Ansvar |
| --- | --- |
| `GET/POST /stables` | Lista egna medlemskap och skapa stall. |
| `/stables/:id/members` och `/stables/:id/invitations` | Hantera medlemskap och inbjudningar. |
| `/stables/:id/horses` | Lista anslutna hästar och hantera uttrycklig stallkoppling. |
| `/stables/:id/activity-types` | Lista, skapa, ändra och arkivera aktivitetstyper. |
| `GET /stables/:id/week?startDate=YYYY-MM-DD` | Hämta en måndag och de följande sex dagarna. Returnera behöriga aktiviteter, medlemmar, hästar, typer och räknare. |
| `POST /stables/:id/activities` | Skapa planerad aktivitet eller direktregistrerad händelse. |
| `GET/PATCH /stables/:id/activities/:activityId` | Läsa och ändra en aktivitet med versionskontroll. |
| `POST .../complete`, `.../reopen`, `.../cancel` | Utföra explicita statusövergångar. |
| `POST /stables/:id/copy-day` och `.../copy-week` | Förhandsgranska och genomföra kopiering. |
| `/stables/:id/templates` | Spara, läsa och tillämpa veckomallar. |
| `GET /stables/:id/horses/:horseId/log` | Läsa hästens logg med datumintervall och paginering. |

Veckoanropet hämtar hela den behöriga veckan. En gemensam, testbar filterfunktion i webbklienten styr båda schemana. Frontendfiltrering används aldrig som åtkomstkontroll. API kontrollerar medlemskap och objektkopplingar vid varje läsning och skrivning.

Stallets hästprojektion innehåller de uppgifter som schemat behöver. Befintliga ägarbegränsade hästendpoints behåller sina regler.

Ny webbmodul är `web/schedule/`, med service, filterfunktioner, veckokolumner, stallmatris, hästrader och aktivitetspanel. Hästloggen ligger i `web/horse-log/`. Generera API-klienterna med `bun run generate` och anslut dem i `web/api.ts`.

Föreslagna webbvägar är `/veckoschema/:stableId` och `/hastlogg/:stableId/:horseId`. Basvägarna visar stallval eller introduktion. Stallinställningar ligger under veckoschemats väg. Uppdatera appens route-map, route-guard, sidtitlar och navigationsprov tillsammans.

## Leveranssteg

### 1. Stall med medlemmar och hästar

Lägg till migrationer, `StableService`, stallinbjudningar och servicekontroller för medlemskap och hästkoppling. Koppla in dem genom `server/services/index.ts` och `server/main.ts`.

Bygg en introduktion där användaren skapar ett stall, bjuder in medlemmar och ansluter egna hästar. Befintliga användare och hästar migreras inte automatiskt till ett gemensamt stall.

Klart när två inloggade medlemmar kan välja samma stall, se dess hästar och förlora åtkomsten när medlemskapet avslutas. En användare utan medlemskap kan inte läsa stallet genom att ändra URL eller ID.

### 2. Aktiviteter med beständig lagring

Inför aktivitetstyper, aktiviteter, ansvariga och utförare. Skapa standardtyper idempotent för nya stall. Implementera veckoanrop, aktivitetspanel och statusövergångar.

Spara aktivitet, tilldelningar och genomförande i transaktioner. Kontrollera användarens version och behörighet innan ändringar skrivs. Klienten spärrar dubbla klick, och API hanterar återförsök utan dubbla poster.

Klart när en stallansvarig kan skapa en rutin, tilldela två medlemmar och få ett sparat genomförande med anteckning. Uppdatering av sidan ska återläsa samma uppgifter.

### 3. Veckovy med stallmatris och hästrader

Bygg vyn med en gemensam kolumndefinition för båda tabellerna. Stallmatrisen har en rad per aktivitetstyp. Hästschemat har en rad per häst och staplar flera aktiviteter inom samma dag.

Plusknappen i en hästruta förväljer häst och datum. Aktiviteter utan tid sorteras efter de tidsatta. Använd tydliga statusmarkeringar med text eller form, även i mörkt läge.

Implementera samtliga filter enligt tabellen ovan. Behåll val genom redigering, omladdning och veckobyte. Inför separata lägen för laddning, tom vecka, tomt filterresultat, läsfel och sparfel.

Använd innehållsbredden för att avgöra när sju kolumner får plats. Vid smalare bredd används en dagväljare, stallrutiner för vald dag och separata grupper per häst. Behåll alla filter och plusknappar. Ta hänsyn till appens befintliga sidomeny på 240 px när tabellens brytpunkt väljs.

Klart när kolumnerna linjerar och alla filter ger samma urval i vecko- och dagsvyn. Vyn ska fungera med tangentbord, textförstoring och mobilbredder på 320 och 375 px.

### 4. Kopiering och veckomallar

Implementera kopiering av en dag till valda dagar, föregående vecka till vald vecka och sparande av en vecka som mall. Lägg även till snabbstart med valda stallrutiner varje dag.

Kopieringsdialogen visar omfattning, antal aktiviteter och om ansvariga ska följa med. Den kopierar uttryckligen hela källdagens eller källveckans planering, oberoende av tillfälliga visningsfilter. Befintliga målaktiviteter behålls.

Kopiera datumjusterad planering och instruktioner. Kopiera aldrig status, genomförandetid, utförare, resultatanteckning eller länk till ett genomfört träningspass. Ändringar i en mall påverkar bara nya tillämpningar.

Förhandsvalidera aktiva hästar, medlemmar, typer och katalogbehörigheter. Vid fel ska användaren korrigera valet innan någon aktivitet skapas. Skriv sedan hela kopieringen i en transaktion. Ett upprepat request-ID återger samma resultat.

Klart när en kopierad vecka innehåller nya planerade aktiviteter och ett återförsök inte dubblar dem. Historiska genomföranden ska ligga kvar oförändrade.

### 5. Hästlogg

Läs genomförda hästaktiviteter från samma aktivitetsposter som schemat använder. Sortera efter faktisk händelsetid. Visa utförare, registrerande användare och resultatanteckning.

Lägg till direktregistrering av observation, skötsel eller besök. Länken i varje hästrad öppnar rätt häst och stall. Stallgemensam fodring skapar ingen post på varje häst.

Klart när avbockning ger en loggpost och omladdning eller upprepad avbockning inte skapar flera. En genomförd aktivitet kan öppnas från både schema och logg.

### 6. Träning och befintlig katalog

En träningsaktivitet kan ha en huvudutövare och flera medhjälpare. Huvudutövaren är den användare som kan registrera det personliga träningspasset. Behåll skillnaden mellan återanvändbart Program och daterat Training Session.

Programväljaren måste kontrollera både planerarens och huvudutövarens katalogåtkomst. Ett lärarägt program får inte bli ett gemensamt stallbibliotek genom stallmedlemskap. API lämnar bara ut programinnehåll till läsare som har rätt att se det. Andra stallmedlemmar ser aktivitetens egna instruktioner och en neutral markering om kopplat program.

Kopiera valt övningsinnehåll vid planeringen. Senare programändringar ska inte skriva om aktiviteten. När huvudutövaren registrerar passet används detta planerade innehåll, med möjlighet att ange vad som faktiskt genomfördes.

Nuvarande `TrainingSessionService` kräver att användaren äger hästen. Lägg till en avgränsad väg för träningspass från schemat. Den tillåter en annans häst endast när användaren är aktivitetens huvudutövare och har aktivt medlemskap samt rätt stall- och hästkoppling. Befintliga fristående ägarkontroller ska fortsätta fungera.

Huvudutövaren kan skapa och länka ett pass eller länka ett befintligt eget pass för samma häst. En unik koppling mellan aktivitet och träningspass hindrar dubbelregistrering. Spara nytt pass, koppling och genomförande i samma transaktion. Refaktorera gemensam transaktionskod vid behov.

Stallansvarig kan markera aktiviteten som genomförd utan att skapa ett privat pass åt någon annan. Huvudutövaren kan komplettera med sitt pass senare. Återöppning eller inställning raderar aldrig ett sparat pass, och en ny registrering ska återanvända befintlig koppling.

Aktiviteten äger planeringen och stallanteckningen. Träningspasset äger personliga träningsuppgifter, övningsutfall och befintlig lärardelning. UI skiljer uttryckligen den delade stallanteckningen från passets privata sammanfattning.

Hästloggen visar den länkade aktiviteten en gång. En eventuell läsmodell som även tar med befintliga träningspass måste kontrollera varje läsares befintliga rättigheter och deduplicera den länkade händelsen.

Klart när ett planerat pass med program kan genomföras och länkas utan dubbla pass eller loggposter. Testa särskilt en huvudutövare som inte äger hästen och en stallmedlem som saknar katalogåtkomst.

### 7. Integration och verifiering

Utöka `scripts/dev-seed.ts` med ett stall, Anna, Lisa och Maja som medlemmar, två hästar, standardrutiner och flera aktiviteter samma dag för en häst. Ta med otilldelade och inställda aktiviteter. Behåll befintliga Hem-fixtures och skriptens produktionsspärrar.

Uppdatera `INFORMATION_ARCHITECTURE.md`, `UBIQUITOUS_LANGUAGE.md` och relevanta delar av `SCOPE.md` när implementationens regler är fastställda. Lägg Veckoschema och Hästlogg i gruppen Planering & stall och behåll appens fyra navigationsgrupper.

Använd befintliga design tokens, Lora 500, Open Sans, språkfiler och formulärrecept. Bygg veckovyn med projektets komponenter och services. Eventuella ändringar i `@basics/core` följer projektets releaseflöde.

Verifiera UI med riktiga sessioner genom `bun run dev:seed` och `bun run dev:session -- anna@example.com`. Använd samma väg för de andra fixtures-användarna. Automatisera inte inloggningsformuläret.

## Tester och färdigkriterier

Serverprov ska täcka medlemskap, rollskillnader, hästägarens godkännande, åtkomst mellan stall, arkiverade hästar och avslutade medlemskap. Testa transaktioner, samtidiga ändringar, att ta en otilldelad aktivitet samt idempotent skapande och kopiering.

Klientprov ska täcka filterkombinationer, stabila häst-ID:n, bevarade filter, vecko- och årsskiften, sommartid, tidlösa aktiviteter och flera aktiviteter i samma cell. DOM-prov ska kontrollera panelens förvalda datum och häst, felhantering och navigationsregistrering.

Integrationstester följer ett helt flöde med två användare: skapa vecka, tilldela arbete, ändra ansvarig, genomföra med anteckning, öppna hästlogg och kopiera till nästa vecka. Lägg till fall för katalogåtkomst och träning på en annan medlems häst.

Följande kontroller körs under implementationen och före leverans:

```bash
bun run generate
bun run check:client
bun run check:server
bun run check:test
bun run check:i18n
bun run test
bun run build
```

`bun run test` behåller kontrollen att ramverket inte är länkat. Bygget ska följa projektets befintliga leverans av `public/`.

Leveransen är klar när alla filter fungerar efter omladdning, båda schemana visar samma vecka, genomföranden syns en gång i rätt hästlogg och behörighetsproven passerar. Genomför också visuell kontroll av dator, mobil, mörkt läge och textförstoring.

Avancerade återkommande regler, pushnotiser, externa kalenderkopplingar, journalmallar för veterinär och hovslagare samt samtidig redigering i realtid ligger utanför denna leverans. Daglig snabbstart, veckomallar och kopiering ingår.


## Genomförande och verifiering

Steg 1 till 7 är implementerade i API och webb. Migrationerna `030_stable_schedule` och `031_scheduled_training_snapshots` lägger till stallplanering och bevarat träningsinnehåll. API-klienter och produktionsbygget i `public/` är genererade.

Verifierat 2026-11-15:

- `bun run generate`, samtliga tre typkontroller, `check:i18n` och `build` passerade.
- `bun run test` passerade med 1 105 tester, 0 fel och 9 420 kontroller i 50 filer.
- Webbläsarkontroll med riktiga utvecklingssessioner för Anna och Lisa omfattade skapande, två ansvariga, två utförare, avbockning, hästlogg och filter efter omladdning.
- Veckomall och förhandsgranskad dagkopiering skapade nya planerade aktiviteter utan genomföranden eller resultatanteckningar.
- Träning på en annan medlems häst skapade ett privat pass. En annan stallmedlem fick 404 vid direkt åtkomst till passet.
- Dagvyn kontrollerades vid 320 och 375 px, i mörkt läge och vid 200 procents förstoring.
- Tillfälliga QA-poster togs bort. Den ordinarie demonstrationsveckan har 45 aktiviteter för två hästar och stallrutiner.

Dokumentationen i `INFORMATION_ARCHITECTURE.md`, `UBIQUITOUS_LANGUAGE.md` och `SCOPE.md` beskriver den implementerade modellen. Veterinär och hovslagare är aktiviteter med tid och anteckningar. Medicinska journaler och påminnelser ingår inte.
