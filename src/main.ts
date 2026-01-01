/**
 * Kružić SDK Demo
 *
 * Ovaj fajl pokazuje kako se koristi @kruzic/game-sdk paket
 * za komunikaciju sa Kružić platformom.
 */

import { KruzicClient } from "@kruzic/game-sdk/client";

// Inicijalizuj SDK klijent
const sdk = new KruzicClient();

// DOM elementi
const $ = (id: string) => document.getElementById(id)!;
const dot = $("dot");
const status = $("status");
const signedIn = $("signedIn");
const userId = $("userId");
const userName = $("userName");
const keyInput = $("key") as HTMLInputElement;
const valueInput = $("value") as HTMLInputElement;
const dataList = $("dataList");
const logEl = $("log");

// Pomoćna funkcija za logovanje
function log(type: "call" | "success" | "error", msg: string) {
  const time = new Date().toLocaleTimeString();
  const entry = document.createElement("div");
  entry.className = "log-entry";
  entry.innerHTML = `<span class="time">${time}</span><span class="${type}">[${type}]</span> ${msg}`;
  logEl.insertBefore(entry, logEl.firstChild);
}

// Osveži info o korisniku
async function refreshUser() {
  log("call", "Učitavam podatke o korisniku...");

  try {
    const isSignedInResult = await sdk.isSignedIn();
    signedIn.textContent = isSignedInResult ? "Da" : "Ne";
    log("success", `isSignedIn() = ${isSignedInResult}`);

    const id = await sdk.getUserId();
    userId.textContent = id || "null";
    log("success", `getUserId() = ${id}`);

    const details = await sdk.getUserDetails();
    userName.textContent = details?.name || "null";
    log("success", `getUserDetails() = ${JSON.stringify(details)}`);

    dot.className = "dot ok";
    status.textContent = "Povezan sa SDK-om";
  } catch (err) {
    log("error", `Greška: ${err instanceof Error ? err.message : err}`);
    dot.className = "dot err";
    status.textContent = "Greška";
  }
}

// Osveži listu podataka
async function refreshData() {
  try {
    const keys = await sdk.listData();
    log("success", `listData() = [${keys.join(", ")}]`);

    dataList.innerHTML = "";
    if (keys.length === 0) {
      dataList.innerHTML = '<span style="color:#666">Nema sačuvanih podataka</span>';
      return;
    }

    for (const key of keys) {
      const value = await sdk.getData(key);
      const item = document.createElement("div");
      item.className = "data-item";
      item.innerHTML = `<span>${key}: ${JSON.stringify(value)}</span><button class="red" data-key="${key}">×</button>`;
      item.querySelector("button")?.addEventListener("click", async () => {
        await sdk.deleteData(key);
        log("success", `Obrisan ključ "${key}"`);
        await refreshData();
      });
      dataList.appendChild(item);
    }
  } catch (err) {
    log("error", `listData greška: ${err instanceof Error ? err.message : err}`);
  }
}

// Sačuvaj podatak
async function setData() {
  const key = keyInput.value.trim();
  const raw = valueInput.value.trim();
  if (!key) return log("error", "Ključ je obavezan");

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    value = raw;
  }

  log("call", `setData("${key}", ${JSON.stringify(value)})`);
  try {
    await sdk.setData(key, value);
    log("success", `Sačuvano: ${key}`);
    await refreshData();
  } catch (err) {
    log("error", `setData greška: ${err instanceof Error ? err.message : err}`);
  }
}

// Učitaj podatak
async function getData() {
  const key = keyInput.value.trim();
  if (!key) return log("error", "Ključ je obavezan");

  log("call", `getData("${key}")`);
  try {
    const value = await sdk.getData(key);
    log("success", `getData("${key}") = ${JSON.stringify(value)}`);
    if (value !== null) {
      valueInput.value = typeof value === "string" ? value : JSON.stringify(value);
    }
  } catch (err) {
    log("error", `getData greška: ${err instanceof Error ? err.message : err}`);
  }
}

// Obriši podatak
async function deleteData() {
  const key = keyInput.value.trim();
  if (!key) return log("error", "Ključ je obavezan");

  log("call", `deleteData("${key}")`);
  try {
    await sdk.deleteData(key);
    log("success", `Obrisano: ${key}`);
    await refreshData();
  } catch (err) {
    log("error", `deleteData greška: ${err instanceof Error ? err.message : err}`);
  }
}

// Pokreni sve testove
async function runTests() {
  log("call", "Pokrećem sve testove...");
  const testKey = `test_${Date.now()}`;
  const testValue = { broj: 42, tekst: "test" };

  try {
    await sdk.setData(testKey, testValue);
    log("success", "✓ setData");

    const retrieved = await sdk.getData(testKey);
    if (JSON.stringify(retrieved) === JSON.stringify(testValue)) {
      log("success", "✓ getData - vrednosti se poklapaju");
    } else {
      log("error", "✗ getData - vrednosti se ne poklapaju");
    }

    const keys = await sdk.listData();
    if (keys.includes(testKey)) {
      log("success", "✓ listData - ključ pronađen");
    } else {
      log("error", "✗ listData - ključ nije pronađen");
    }

    await sdk.deleteData(testKey);
    const afterDelete = await sdk.getData(testKey);
    if (afterDelete === null) {
      log("success", "✓ deleteData - ključ obrisan");
    } else {
      log("error", "✗ deleteData - ključ još postoji");
    }

    log("success", "Svi testovi završeni!");
    await refreshData();
  } catch (err) {
    log("error", `Test greška: ${err instanceof Error ? err.message : err}`);
  }
}

// Event listeneri
$("btnSet").addEventListener("click", setData);
$("btnGet").addEventListener("click", getData);
$("btnDel").addEventListener("click", deleteData);
$("btnList").addEventListener("click", refreshData);
$("btnTest").addEventListener("click", runTests);
$("btnRefresh").addEventListener("click", refreshUser);
$("btnClear").addEventListener("click", () => (logEl.innerHTML = ""));

// Inicijalizacija
async function init() {
  log("call", "Inicijalizujem SDK...");

  // Obavesti platformu da je igra spremna
  sdk.ready();
  log("success", "sdk.ready() pozvan");

  await refreshUser();
  await refreshData();
}

init();
