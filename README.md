# Kružić SDK Demo

Ovo je demo projekat koji pokazuje kako koristiti [`@kruzic/game-sdk`](https://github.com/kruzic/game-sdk) paket za integraciju igara sa [Kružić](https://kruzic.rs) platformom.

## Šta je Kružić SDK?

Kružić SDK omogućava igrama koje se pokreću unutar Kružić platforme da:

- Provere da li je korisnik prijavljen
- Dobiju informacije o korisniku (ID, ime, slika)
- Sačuvaju i učitaju podatke specifične za korisnika (npr. rezultati, napredak)

## Instalacija

```bash
npm install @kruzic/game-sdk
# ili
pnpm add @kruzic/game-sdk
```

## Osnovna upotreba

```typescript
import { KruzicClient } from "@kruzic/game-sdk/client";

// Kreiraj SDK klijent
const sdk = new KruzicClient();

// Obavesti platformu da je igra spremna
sdk.ready();
```

## API Referenca

### `sdk.ready()`

Obaveštava Kružić platformu da je igra učitana i spremna. Pozovi ovu funkciju čim se igra učita.

```typescript
sdk.ready();
```

### `sdk.isSignedIn()`

Proverava da li je korisnik prijavljen na platformu.

```typescript
const prijavljen = await sdk.isSignedIn();
if (prijavljen) {
  console.log("Korisnik je prijavljen");
} else {
  console.log("Korisnik je gost");
}
```

### `sdk.getUserId()`

Vraća ID prijavljenog korisnika ili `null` ako korisnik nije prijavljen.

```typescript
const userId = await sdk.getUserId();
console.log("User ID:", userId);
```

### `sdk.getUserDetails()`

Vraća detalje o korisniku (ID, ime, slika profila).

```typescript
const korisnik = await sdk.getUserDetails();
if (korisnik) {
  console.log("Ime:", korisnik.name);
  console.log("Slika:", korisnik.image);
}
```

**Tip povratne vrednosti:**

```typescript
interface UserDetails {
  id: string;
  name: string | null;
  image: string | null;
}
```

### `sdk.getData(key)`

Učitava sačuvanu vrednost za dati ključ.

```typescript
const rezultat = await sdk.getData("highscore");
console.log("Najbolji rezultat:", rezultat);
```

### `sdk.setData(key, value)`

Čuva vrednost pod datim ključem. Vrednost može biti bilo koji JSON-serializabilan tip.

```typescript
// Sačuvaj broj
await sdk.setData("highscore", 1000);

// Sačuvaj objekat
await sdk.setData("progress", {
  level: 5,
  coins: 250,
  achievements: ["first_win", "speed_run"]
});

// Sačuvaj niz
await sdk.setData("inventory", ["sword", "shield", "potion"]);
```

### `sdk.deleteData(key)`

Briše sačuvanu vrednost za dati ključ.

```typescript
await sdk.deleteData("temp_data");
```

### `sdk.listData()`

Vraća listu svih ključeva koje je igra sačuvala za trenutnog korisnika.

```typescript
const kljucevi = await sdk.listData();
console.log("Sačuvani ključevi:", kljucevi);
// Primer: ["highscore", "progress", "settings"]
```

## Dev Mode

Kada razvijaš igru lokalno (van Kružić iframe-a), SDK automatski prelazi u dev mode:

- Koristi `localStorage` umesto komunikacije sa platformom
- Simulira prijavljenog korisnika sa ID-jem "dev-user"
- Sve funkcije rade normalno za testiranje

```typescript
// Eksplicitno uključi dev mode
const sdk = new KruzicClient({
  devMode: true,
  gameId: "moja-igra"  // Koristi se za localStorage ključeve
});
```

## Primer: Čuvanje rezultata

```typescript
import { KruzicClient } from "@kruzic/game-sdk/client";

const sdk = new KruzicClient();

interface GameStats {
  highscore: number;
  gamesPlayed: number;
  totalTime: number;
}

// Učitaj statistiku
async function loadStats(): Promise<GameStats> {
  const stats = await sdk.getData<GameStats>("stats");
  return stats ?? {
    highscore: 0,
    gamesPlayed: 0,
    totalTime: 0
  };
}

// Sačuvaj novu statistiku posle igre
async function saveGame(score: number, time: number) {
  const stats = await loadStats();

  stats.gamesPlayed++;
  stats.totalTime += time;

  if (score > stats.highscore) {
    stats.highscore = score;
  }

  await sdk.setData("stats", stats);
}

// Inicijalizacija
sdk.ready();
```

## Primer: Prikaz korisnika

```typescript
import { KruzicClient } from "@kruzic/game-sdk/client";

const sdk = new KruzicClient();

async function showUserInfo() {
  const signedIn = await sdk.isSignedIn();

  if (!signedIn) {
    console.log("Igraš kao gost. Prijavi se da sačuvaš napredak!");
    return;
  }

  const user = await sdk.getUserDetails();
  if (user) {
    console.log(`Dobrodošao, ${user.name}!`);

    if (user.image) {
      // Prikaži sliku profila
      const img = document.createElement("img");
      img.src = user.image;
      document.body.appendChild(img);
    }
  }
}

sdk.ready();
showUserInfo();
```

## Build i Upload

1. Izbildaj igru:

```bash
pnpm build
```

2. Sadržaj `dist/` foldera zipuj i upload-uj na Kružić platformu.

3. Igra mora imati `index.html` kao ulaznu tačku.

## Struktura projekta

```
sdk-demo/
├── index.html      # HTML sa CSS-om
├── src/
│   └── main.ts     # TypeScript kod
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Česta pitanja

### Šta se dešava sa podacima gostiju?

Podaci gostiju (neprijavljenih korisnika) se čuvaju u `localStorage` browsera. Ako se korisnik prijavi, njegovi podaci se čuvaju na serveru i dostupni su sa bilo kog uređaja.

### Da li mogu da koristim SDK bez TypeScript-a?

Da! SDK radi i sa čistim JavaScript-om:

```javascript
import { KruzicClient } from "@kruzic/game-sdk/client";

const sdk = new KruzicClient();
sdk.ready();

sdk.isSignedIn().then(signedIn => {
  console.log("Prijavljen:", signedIn);
});
```

### Koji bundleri su podržani?

SDK radi sa svim modernim bundlerima: Vite, webpack, Rollup, esbuild, itd.

## Razvoj

```bash
# Instaliraj zavisnosti
pnpm install

# Pokreni dev server
pnpm dev

# Izbildaj za produkciju
pnpm build
```
