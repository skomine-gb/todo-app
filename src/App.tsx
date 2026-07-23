import { useState } from "react";
import typescriptLogo from "./assets/typescript.svg";
import viteLogo from "./assets/vite.svg";
import heroImg from "./assets/hero.png";

export function App() {
  const [count, setCount] = useState(0);

  return (
    <section id="center">
      <div className="hero">
        <img src={heroImg} className="base" width={170} height={179} />
        <img src={typescriptLogo} className="framework" alt="TypeScript logo" />
        <img src={viteLogo} className="vite" alt="Vite logo" />
      </div>
      <div>
        <h1>Get started</h1>
        <p>
          Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
        </p>
      </div>
      <button id="counter" type="button" className="counter" onClick={() => setCount((c) => c + 1)}>
        Count is {count}
      </button>
    </section>
  );
}
