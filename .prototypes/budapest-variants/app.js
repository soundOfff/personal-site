const shots = {
  facade: { eyebrow: 'A portfolio in three acts', edition: 'Vol. 01 / The grand exterior', label: 'EXT. HOTEL · AFTERNOON', caption: 'A quiet exterior. A window with something to say.', alt: 'Hotel alpino rosa visto de frente, con montañas nevadas' },
  corridor: { eyebrow: 'Behind each door, a different problem', edition: 'Vol. 02 / The lateral cut', label: 'INT. FIRST FLOOR · AFTERNOON', caption: 'Three doors. Three different kinds of engineering.', alt: 'Pasillo frontal de hotel con tres puertas borgoña y apliques de bronce' },
  desk: { eyebrow: 'A little order. A little curiosity.', edition: 'Vol. 03 / Personal correspondence', label: 'INT. CONCIERGE DESK · OVERHEAD', caption: 'The register is open. The correspondence is personal.', alt: 'Mesa cenital de conserjería con registro, correspondencia y llave de bronce' },
};
const projects = {
  dex: { title: 'A smaller model. An explicit bar.', body: 'At Dex, prompts are classified and sent to the cheapest model that passes the evals for that class. Harder tasks escalate. The tradeoff lives in how honestly you set that bar.', label: 'Read the Dex case study', href: 'http://127.0.0.1:4322/work/dex', foot: 'Employer work. Written account, no proprietary source.' },
  mint: { title: 'The write that must never lie.', body: 'At Mint Mobile, product pages can show cached stock. Checkout revalidates inventory inside a transaction. Choosing where staleness is allowed is part of the design.', label: 'Read the Mint Mobile case study', href: 'http://127.0.0.1:4322/work/mint', foot: 'Employer work. Written account, no proprietary source.' },
  flagship: { title: 'A question becomes an interface.', body: 'The portfolio agent composes cards, comparisons and timelines through a constrained A2UI catalog. The same catalog defines what the model can emit and what the renderer understands.', label: 'Read the Flagship case study', href: 'http://127.0.0.1:4322/work/flagship', foot: 'Personal project. Public source code available.' },
};
const discoveries = new Set();
const dialog = document.querySelector('#discovery');
const dialogLink = document.querySelector('#discovery-link');
let returnTarget = null;

function showNote({ kicker, title, body, label, href, foot }) {
  returnTarget = document.activeElement;
  document.querySelector('#discovery-kicker').textContent = kicker;
  document.querySelector('#discovery-title').textContent = title;
  document.querySelector('#discovery-body').textContent = body;
  dialogLink.textContent = label;
  dialogLink.href = href;
  document.querySelector('#discovery-foot').textContent = foot;
  dialog.showModal();
}

document.querySelectorAll('.switcher button').forEach(button => {
  button.addEventListener('click', () => {
    const id = button.dataset.shot;
    const shot = shots[id];
    document.body.dataset.shot = id;
    document.querySelectorAll('.switcher button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.querySelectorAll('.props').forEach(item => { item.hidden = !item.classList.contains(`${id}-props`); });
    document.querySelector('#eyebrow').textContent = shot.eyebrow;
    document.querySelector('#edition').textContent = shot.edition;
    document.querySelector('#shot-label').textContent = shot.label;
    document.querySelector('#caption').textContent = shot.caption;
    document.querySelector('#scene-art').setAttribute('aria-label', shot.alt);
    document.querySelector('#status').textContent = `Variante ${button.textContent.trim()} seleccionada.`;
  });
});

document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => {
  showNote({ kicker: 'From the guest register', ...projects[button.dataset.project] });
}));

document.querySelectorAll('[data-discover]').forEach(button => button.addEventListener('click', () => {
  if (button.dataset.discover === 'key') {
    discoveries.add('key');
    document.querySelector('.stamp').classList.add('is-clued');
    showNote({ kicker: 'A note left for the curious', title: 'Not every guest needs the grandest suite.', body: 'The same goes for a model. Somewhere in the work below is a red seal marked E. Take a second look. It holds the decision behind the routing.', label: 'Find the red seal ↓', href: '#dex', foot: 'An optional detour. All projects are available without it.' });
  } else {
    const followedClue = discoveries.has('key');
    discoveries.add('evidence');
    showNote({ kicker: followedClue ? 'The second look / A note from Dex' : 'A note from Dex', title: 'The routing was the easy part.', body: 'The hard part was writing honest evals for each request class. Set the bar too low and you ship silent quality regressions. Set it too high and the smaller model never gets a chance. That tradeoff is what the seal stands for.', label: 'Read Evals are contracts ↗', href: 'http://127.0.0.1:4322/blog/evals-are-contracts', foot: followedClue ? 'You followed the clue. The reward is the engineering decision behind it.' : 'Source material from the existing Dex case study.' });
  }
}));

document.querySelector('.close').addEventListener('click', () => dialog.close());
dialogLink.addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const rect = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
});
dialog.addEventListener('close', () => { if (returnTarget instanceof HTMLElement) returnTarget.focus({ preventScroll: true }); });
