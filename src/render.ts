import type { Card, Data } from './types';

const VERSION = 'v0.2.0';

const state = {
  data:  {} as Data,
  lf:    null as string | null,
  topic: null as string | null,
  idx:   0,
};

const el  = (id: string) => document.getElementById(id)!;

// Escapes user-supplied strings before inserting them into innerHTML.
const esc = (s: string) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export function init(data: Data) {
  state.data = data;
  el('footerAuthor').innerHTML =
    `Bg &nbsp;<span style="opacity:0.5;font-size:10px;">${VERSION}</span>`;
  renderLF();
}

function renderLF() {
  const tabs = el('lfTabs');
  tabs.innerHTML = '';

  for (const [lf, val] of Object.entries(state.data)) {
    const hasContent = Object.keys(val.topics).length > 0;
    const btn = document.createElement('button');
    btn.className  = 'lf-btn' + (lf === state.lf ? ' active' : '') + (!hasContent ? ' empty' : '');
    btn.textContent = lf;
    btn.title       = val.label;
    btn.setAttribute('aria-pressed', String(lf === state.lf));

    if (hasContent) {
      btn.addEventListener('click', () => {
        state.lf = lf; state.topic = null; state.idx = 0;
        renderLF(); renderLabel(); renderTopics(); renderCard();
      });
    }
    tabs.appendChild(btn);
  }
}

function renderLabel() {
  el('lfLabel').textContent = state.lf ? state.data[state.lf].label : '';
}

function renderTopics() {
  const nav = el('topicNav');
  nav.innerHTML = '';
  if (!state.lf) return;

  for (const topic of Object.keys(state.data[state.lf].topics)) {
    const btn = document.createElement('button');
    btn.className   = 'topic-btn' + (topic === state.topic ? ' active' : '');
    btn.textContent = topic;
    btn.setAttribute('aria-pressed', String(topic === state.topic));
    btn.addEventListener('click', () => {
      state.topic = topic; state.idx = 0;
      renderTopics(); renderCard();
    });
    nav.appendChild(btn);
  }
}

function cardBody(card: Card): string {
  let html = card.text ? `<div class="card-text">${esc(card.text)}</div>` : '';

  if (card.image) {
    html += `<img class="card-img" src="${esc(card.image)}" alt="${esc(card.image_caption ?? '')}" onerror="this.style.display='none'">`;
    if (card.image_caption) html += `<div class="img-caption">${esc(card.image_caption)}</div>`;
  }
  if (card.code) html += `<pre class="card-code">${esc(card.code)}</pre>`;
  if (card.link) html += `<a class="card-link" href="${esc(card.link)}" target="_blank" rel="noopener">↗ Weiterführender Link</a>`;

  return html;
}

function renderDots(total: number, cur: number): string {
  return '<div class="progress">' +
    Array.from({ length: total }, (_, i) =>
      `<div class="dot${i < cur ? ' revealed' : ''}${i === cur ? ' current' : ''}"></div>`
    ).join('') +
  '</div>';
}

function renderCard() {
  const area = el('cardArea');

  if (!state.lf) {
    area.innerHTML = '<div class="state-msg">Wähle oben ein Lernfeld.</div>';
    return;
  }
  if (!state.topic) {
    const count = Object.keys(state.data[state.lf].topics).length;
    area.innerHTML = count
      ? '<div class="state-msg">Wähle ein Thema.</div>'
      : '<div class="state-msg">Für dieses Lernfeld sind noch keine Hilfekarten hinterlegt.</div>';
    return;
  }

  const cards = state.data[state.lf].topics[state.topic];
  const total = cards.length;

  if (state.idx >= total) {
    area.innerHTML = `
      <div class="finished">
        <div class="check">✓</div>
        <strong>Alle Hilfekarten aufgedeckt</strong>
        Du hast alle ${total} Karten zu diesem Thema gesehen.
        <br><br>
        <button class="btn-reset">↩ Nochmal von vorne</button>
      </div>`;
    area.querySelector('.btn-reset')!.addEventListener('click', resetCards);
    return;
  }

  const card      = cards[state.idx];
  const remaining = total - state.idx;
  const ghosts    = (remaining > 2 ? '<div class="ghost ghost-2"></div>' : '')
                  + (remaining > 1 ? '<div class="ghost ghost-1"></div>' : '');
  const btnLabel  = state.idx < total - 1 ? 'Nächste Hilfekarte aufdecken' : 'Letzte Karte – fertig';
  const hintText  = remaining === 1 ? 'Letzte Karte' : `${remaining} Karten übrig`;

  area.innerHTML = `
    <div class="stack-hint">${hintText}</div>
    <div class="card-wrapper">
      ${ghosts}
      <div class="card flip-in">
        <div class="card-number">Hilfe ${state.idx + 1} von ${total}</div>
        <div class="card-title">${esc(card.title)}</div>
        ${cardBody(card)}
      </div>
    </div>
    ${renderDots(total, state.idx)}
    <div class="btns">
      <button class="btn-next">${btnLabel}</button>
      <button class="btn-reset">↩ Reset</button>
    </div>`;

  area.querySelector('.btn-next')!.addEventListener('click', nextCard);
  area.querySelector('.btn-reset')!.addEventListener('click', resetCards);
}

function nextCard() {
  const card = document.querySelector<HTMLElement>('.card');
  if (!card) return;

  // CSS animations (forwards fill) take priority over transitions on the same
  // properties. Remove flip-in first, force a reflow, then apply flip-out so
  // the transition actually runs and transitionend fires.
  card.classList.remove('flip-in');
  void card.offsetHeight;
  card.classList.add('flip-out');

  card.addEventListener('transitionend', (e) => {
    if (e.propertyName !== 'opacity') return;
    state.idx++;
    renderCard();
  });
}

function resetCards() {
  state.idx = 0;
  renderCard();
}
