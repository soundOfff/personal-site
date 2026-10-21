const films = new Map([...document.querySelectorAll('.film')].map(panel => [panel.classList[1], { panel, reveal: panel.querySelector('.reveal'), trigger: panel.querySelector('[data-reveal]') }]));
let activeFilm = 'parasite';
const explored = new Set();

function closeScene(id) {
  const film = films.get(id);
  film.reveal.hidden = true;
  film.trigger.setAttribute('aria-expanded', 'false');
}

document.querySelectorAll('.bench button').forEach(button => button.addEventListener('click', () => {
  closeScene(activeFilm);
  activeFilm = button.dataset.film;
  document.body.dataset.film = activeFilm;
  films.forEach(({ panel }, id) => { panel.hidden = id !== activeFilm; });
  document.querySelectorAll('.bench button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  document.querySelector('#status').textContent = `Propuesta ${button.textContent.trim()} seleccionada.`;
}));

document.querySelectorAll('[data-reveal]').forEach(button => button.addEventListener('click', () => {
  explored.add(button.dataset.reveal);
  const film = films.get(button.dataset.reveal);
  film.reveal.hidden = false;
  button.setAttribute('aria-expanded', 'true');
  film.reveal.tabIndex = -1;
  film.reveal.focus({ preventScroll: true });
  document.querySelector('#status').textContent = 'A second shot is open. Press Escape to return.';
}));

document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => {
  const id = button.dataset.close;
  closeScene(id);
  films.get(id).trigger.focus({ preventScroll: true });
}));

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const film = films.get(activeFilm);
  if (!film.reveal.hidden) {
    closeScene(activeFilm);
    film.trigger.focus({ preventScroll: true });
  }
});

const marginNote = document.querySelector('#margin-note');
document.querySelector('[data-evidence]').addEventListener('click', () => {
  document.querySelector('#margin-kicker').textContent = explored.has('blade') ? 'YOU FOLLOWED THE SIGNAL / DEX' : 'DEX / THE SECOND LOOK';
  marginNote.showModal();
});
document.querySelector('.close-note').addEventListener('click', () => marginNote.close());
