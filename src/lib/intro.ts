/**
 * Logo intro settings (Content → Website settings → Logo intro).
 * Timeline for a total of T seconds:
 *   0 → about 1.1 s × pace   logo draws, name and tagline rise
 *   … hold                   finished logo stays on screen
 *   T − 0.7 s                name and tagline fade out (0.2 s), background still solid
 *   T − 0.5 s                background fades and the logo glides into the header (0.5 s)
 *   T                        intro removed; the page has already started to appear
 */
export type IntroSettings = { show: boolean; seconds: number; replayMinutes: number };

export const defaultIntro: IntroSettings = { show: true, seconds: 2.5, replayMinutes: 30 };

export function introSettings(raw?: Partial<IntroSettings> | null): IntroSettings {
  const seconds = Number(raw?.seconds);
  const replay = Number(raw?.replayMinutes);
  return {
    show: raw?.show !== false,
    seconds: Number.isFinite(seconds) && seconds > 0 ? Math.min(5, Math.max(1.8, seconds)) : defaultIntro.seconds,
    replayMinutes: Number.isFinite(replay) && replay >= 0 ? Math.min(1440, replay) : defaultIntro.replayMinutes,
  };
}

/** CSS custom properties set on <html>: total length and drawing pace. */
export function introStyle(s: IntroSettings): Record<string, string> {
  const pace = Math.min(1.5, Math.max(1, s.seconds / 2));
  return { "--intro-total": `${s.seconds}s`, "--intro-pace": pace.toFixed(3) };
}

/**
 * Runs in <head> before first paint: marks that JavaScript is on (for scroll
 * reveals) and decides whether the intro plays, so it never flashes.
 * ?intro=1 on any address always plays it.
 */
export function introScript(s: IntroSettings) {
  const replayMs = Math.round(s.replayMinutes * 60000);
  return `(function(){var d=document.documentElement;d.dataset.js="";try{if(location.search.indexOf("intro=1")>=0)return;${
    s.show ? "" : 'd.dataset.intro="skip";return;'
  }var t=+localStorage.getItem("es-intro")||0;if(${replayMs}>0&&Date.now()-t<${replayMs})d.dataset.intro="skip"}catch(e){}})()`;
}
