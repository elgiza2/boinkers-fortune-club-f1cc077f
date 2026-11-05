import { useEffect, useState } from "react";
import fallback from "@/assets/holo-splash.jpg";

/** Opening screen: today's AI-made Holo crowd picture (falls back to the built-in one), shown briefly on launch. */
export function Splash() {
  const [show, setShow] = useState(true);
  const [fade, setFade] = useState(false);
  const [src, setSrc] = useState(`/api/public/art/splash?v=${new Date().toISOString().slice(0, 10)}`);
  useEffect(() => {
    const a = setTimeout(() => setFade(true), 1500);
    const b = setTimeout(() => setShow(false), 1900);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  if (!show) return null;
  return (
    <div className={`holo-splash ${fade ? "is-out" : ""}`} aria-hidden>
      <img src={src} alt="" onError={() => setSrc(fallback)} />
      <div className="holo-splash-title"><h1>Holo</h1><span /></div>
    </div>
  );
}
