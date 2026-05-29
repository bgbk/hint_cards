import './style.css';
import { init } from './render';
import type { Data } from './types';

async function main() {
  try {
    const res  = await fetch('cards.json');
    const data = await res.json() as Data;
    init(data);
  } catch {
    const area = document.getElementById('cardArea');
    if (area) area.innerHTML =
      '<div class="state-msg">⚠ cards.json konnte nicht geladen werden.<br>Stelle sicher, dass die Datei im selben Ordner liegt.</div>';
  }
}

main();
