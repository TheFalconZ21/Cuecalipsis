/// <reference types="vite/client" />

import { MainMenuUI } from './MainMenuUI';
import './main-menu.css';

const root = document.querySelector<HTMLElement>('#main-menu-root');
const gameShell = document.querySelector<HTMLElement>('#game-shell');
if (!root || !gameShell) throw new Error('Falta el contenedor del menú o de la partida.');

const loadRhythmAudio = import.meta.glob('../rhythm-player/rhythm-audio-entry.ts');
const menu = new MainMenuUI({
  root,
  onPlay: async () => {
    root.hidden = true;
    gameShell.hidden = false;
    try {
      await Object.values(loadRhythmAudio)[0]?.();
      await import('../combat-hordes/preview');
      menu.dispose();
    } catch (error) {
      gameShell.hidden = true;
      root.hidden = false;
      throw error;
    }
  },
});
