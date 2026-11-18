"use client";

import { useSyncExternalStore } from "react";

/**
 * Hard ceiling on the intro overlay. Nothing in the app may keep the site
 * hidden past this point — the Preloader uses it as a kill switch, and the
 * module-level timer below unlocks scroll reveals even if the Preloader
 * never mounts or throws while setting up its canvas.
 */
export const INTRO_HARD_TIMEOUT_MS = 5000;

let done = false;
const listeners = new Set<() => void>();

export function markIntroDone() {
  if (done) return;
  done = true;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/*
 * The intro's two still beats.
 *
 * Whatever the GPU does for the first time in a visit (drawing the hero's
 * city, compiling the shaders a canvas needs) costs a long frame: the picture
 * stands still for a tenth to a third of a second. Left alone, all of it
 * landed in the second after the intro, and the hero's entrance stuttered.
 * The intro has two moments when nothing on screen moves and its overlay
 * covers the page, so a long frame there shows nothing. The Preloader marks
 * them; whatever wants to prepare listens. A visit without the intro (a
 * refresh) marks neither, and has nothing to hide behind anyway.
 *
 *   settled  the dots have landed and the wordmark stands, grey, a moment
 *            before the shine sets off
 *   calm     the shine has passed and the wordmark holds, until it flies
 */
function beat() {
  const listeners = new Set<() => void>();
  return {
    mark() {
      for (const listener of listeners) listener();
    },
    on(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

const settled = beat();
const calm = beat();

export const markIntroSettled = settled.mark;
export const onIntroSettled = settled.on;
export const markIntroCalm = calm.mark;
export const onIntroCalm = calm.on;

const getSnapshot = () => done;
// Matches the client's state at hydration time, so reveals don't mismatch.
const getServerSnapshot = () => false;

export function useIntroDone() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

if (typeof window !== "undefined") {
  window.setTimeout(markIntroDone, INTRO_HARD_TIMEOUT_MS);
}
