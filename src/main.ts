import './cinematic.css';
// Se prepara el reloj antes de que Inicio lo active con un gesto explícito del usuario.
import './modules/rhythm-player/rhythm-audio-entry';
import './modules/art-vfx-ui/MainMenuEntry';

const opening = required<HTMLElement>('opening-cinematic');
const menuRoot = required<HTMLElement>('main-menu-root');
const gameShell = required<HTMLElement>('game-shell');
const openingStatus = required<HTMLElement>('opening-status');
const playButton = required<HTMLButtonElement>('opening-play');
const audioButton = required<HTMLButtonElement>('opening-audio');
const skipButton = required<HTMLButtonElement>('opening-skip');
const videos = [
  required<HTMLVideoElement>('opening-video-first'),
  required<HTMLVideoElement>('opening-video-second'),
];

let currentVideo = 0;
let muted = true;

function updateAudioButton(): void {
  audioButton.textContent = muted ? 'Activar sonido' : 'Silenciar sonido';
  audioButton.setAttribute('aria-pressed', String(!muted));
  for (const video of videos) video.muted = muted;
}

function playCurrentVideo(): void {
  const video = videos[currentVideo];
  video.hidden = false;
  video.currentTime = 0;
  openingStatus.textContent = `Cinemática · Parte ${currentVideo + 1} de ${videos.length}`;
  playButton.hidden = true;
  void video.play().catch(() => {
    openingStatus.textContent = 'El navegador necesita que inicies la reproducción.';
    playButton.hidden = false;
  });
}

function showMainMenu(): void {
  for (const video of videos) video.pause();
  opening.hidden = true;
  menuRoot.hidden = false;
}

videos.forEach((video, index) => {
  video.addEventListener('playing', () => {
    if (index === currentVideo) playButton.hidden = true;
  });
  video.addEventListener('ended', () => {
    if (index !== currentVideo) return;
    currentVideo += 1;
    if (currentVideo < videos.length) {
      videos[index].hidden = true;
      updateAudioButton();
      playCurrentVideo();
      return;
    }
    showMainMenu();
  });
  video.addEventListener('error', () => {
    if (index !== currentVideo) return;
    openingStatus.textContent = `No se pudo cargar la parte ${index + 1} de la cinemática. Puedes omitirla.`;
    playButton.hidden = true;
  });
});

audioButton.addEventListener('click', () => {
  muted = !muted;
  updateAudioButton();
});
playButton.addEventListener('click', playCurrentVideo);
skipButton.addEventListener('click', showMainMenu);

// Reiniciar la partida inicia de nuevo el flujo completo de cinemática y menú.
gameShell.addEventListener('click', (event: MouseEvent) => {
  if (!(event.target instanceof Element) || !event.target.closest('#restart')) return;
  event.preventDefault();
  event.stopPropagation();
  window.location.reload();
}, true);

updateAudioButton();
audioButton.disabled = false;
skipButton.disabled = false;
playCurrentVideo();

function required<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLElement)) throw new Error(`Falta el elemento #${id}`);
  return element as T;
}
