/// <reference types="vite/client" />

import { MainMenuUI } from './MainMenuUI';
import './main-menu.css';

const root = document.querySelector<HTMLElement>('#main-menu-root');
const gameShell = document.querySelector<HTMLElement>('#game-shell');
if (!root || !gameShell) throw new Error('Falta el contenedor del menú o de la partida.');

const menu = new MainMenuUI({
  root,
  onPlay: async () => {
    const musicButton = document.querySelector<HTMLButtonElement>('#music-toggle');
    if (!musicButton) throw new Error('No se encontró el control de la cueca.');

    gameShell.hidden = false;
    // El bridge de audio ya está listo: se inicia la cueca dentro del gesto del botón Play.
    musicButton.click();
    try {
      await import('../combat-hordes/preview');
      // El primer frame de preview.ts se dibuja antes de retirar el menú.
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      root.hidden = true;
      menu.dispose();
    } catch (error) {
      gameShell.hidden = true;
      root.hidden = false;
      throw error;
    }
  },
});
