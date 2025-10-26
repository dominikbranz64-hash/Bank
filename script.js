// ======================
// Dane kont i historii
// ======================
let konta = JSON.parse(localStorage.getItem('konta')) || {
  glowne: { saldo: 0, historia: [], historiaSalda: [] },
  oszczednosciowe: { saldo: 0, historia: [], historiaSalda: [] }
};
let aktualneKonto = 'glowne';
let zalogowany = false;
let wykres = null;

// ======================
// Funkcje pomocnicze
// ======================
function zapisz() {
  localStorage.setItem('konta', JSON.stringify(konta));
}

function aktualizujWidok() {
  const konto = konta[aktualneKonto];
  document.getElementById('saldo').textContent = konto.saldo.toFixed(2) + ' zł';

  const lista = document.getElementById('historia');
  lista.innerHTML = '';
  konto.historia.slice().reverse().forEach(item => {
    const li = document.createElement('li');
    li.className = item.kwota >= 0 ? 'plus' : 'minus';
    li.innerHTML = `<strong>${item.typ}</strong><br>${item.kwota.toFixed(2)} zł <small>${item.data}</small>`;
    lista.appendChild(li);
  });

  zapisz();
  aktualizujWykres();
}

function dodajDoHistorii(typ, kwota) {
  const konto = konta[aktualneKonto];
  konto.historia.push({ typ, kwota, data: new Date().toLocaleString() });
  konto.historiaSalda.push({ czas: new Date().toLocaleTimeString(), saldo: konto.saldo });
  zapisz();
}

// ======================
// Transakcje
// ======================
function wplata() {
  const kwota = parseFloat(prompt('Podaj kwotę wpłaty (zł):'));
  if (kwota > 0) {
    konta[aktualneKonto].saldo += kwota;
    dodajDoHistorii('Wpłata', kwota);
    aktualizujWidok();
  }
}

function wyplata() {
  const kwota = parseFloat(prompt('Podaj kwotę wypłaty (zł):'));
  if (kwota > 0 && kwota <= konta[aktualneKonto].saldo) {
    konta[aktualneKonto].saldo -= kwota;
    dodajDoHistorii('Wypłata', -kwota);
    aktualizujWidok();
  } else {
    alert('Nieprawidłowa kwota lub za mało środków!');
  }
}

function przelew() {
  const odbiorca = prompt('Nazwa odbiorcy:');
  const kwota = parseFloat(prompt('Kwota przelewu (zł):'));
  if (odbiorca && kwota > 0 && kwota <= konta[aktualneKonto].saldo) {
    konta[aktualneKonto].saldo -= kwota;
    dodajDoHistorii(`Przelew do ${odbiorca}`, -kwota);
    aktualizujWidok();
  } else {
    alert('Błąd w danych przelewu!');
  }
}

function przelewMiedzy() {
  const z = aktualneKonto;
  const doKonta = z === 'glowne' ? 'oszczednosciowe' : 'glowne';
  const kwota = parseFloat(prompt(`Kwota przelewu z ${z} do ${doKonta} (zł):`));
  if (kwota > 0 && kwota <= konta[z].saldo) {
    konta[z].saldo -= kwota;
    konta[doKonta].saldo += kwota;
    konta[z].historia.push({ typ: `Przelew do ${doKonta}`, kwota: -kwota, data: new Date().toLocaleString() });
    konta[doKonta].historia.push({ typ: `Przelew z ${z}`, kwota: kwota, data: new Date().toLocaleString() });
    konta[z].historiaSalda.push({ czas: new Date().toLocaleTimeString(), saldo: konta[z].saldo });
    konta[doKonta].historiaSalda.push({ czas: new Date().toLocaleTimeString(), saldo: konta[doKonta].saldo });
    zapisz();
    aktualizujWidok();
  } else {
    alert('Nieprawidłowa kwota lub brak środków!');
  }
}

function resetKonta() {
  if (confirm('Czy na pewno chcesz wyczyścić dane wszystkich kont?')) {
    localStorage.clear();
    konta = {
      glowne: { saldo: 0, historia: [], historiaSalda: [] },
      oszczednosciowe: { saldo: 0, historia: [], historiaSalda: [] }
    };
    aktualizujWidok();
  }
}

function zmienKonto() {
  aktualneKonto = document.getElementById('kontoSelect').value;
  aktualizujWidok();
}

// ======================
// Logowanie i wykres
// ======================
function zaloguj() {
  const pin = prompt('Podaj PIN (domyślnie 1234):');
  if (pin === '1234') {
    zalogowany = true;
    document.getElementById('panel').style.display = 'block';
    document.getElementById('logowanie').style.display = 'none';
    aktualizujWidok();
  } else {
    alert('Niepoprawny PIN!');
  }
}

function aktualizujWykres() {
  const konto = konta[aktualneKonto];
  const dane = konto.historiaSalda;

  const ctx = document.getElementById('wykres').getContext('2d');
  if (wykres) wykres.destroy();

  wykres = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dane.map(d => d.czas),
      datasets: [{
        label: 'Saldo (zł)',
        data: dane.map(d => d.saldo),
        borderWidth: 2,
        fill: false
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}
