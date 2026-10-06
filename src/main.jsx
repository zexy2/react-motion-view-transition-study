import { useRef, useState, startTransition, ViewTransition } from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion } from "motion/react";
import "./style.css";

const tabs = [
  { id: "overview", label: "Genel bakış", title: "Özet", body: "Geçişin başlangıç ve bitiş koşullarını burada gözle." },
  { id: "details", label: "Ayrıntılar", title: "Ayrıntılar", body: "İçerik değişimiyle görsel hareketin zamanını ayrı ölç." },
  { id: "notes", label: "Notlar", title: "Notlar", body: "Küçük örneklemden genel performans sonucu çıkarma." },
  { id: "about", label: "Hakkında", title: "Deney sınırı", body: "Programatik tıklama, tek tarayıcı ve yerel demo." },
];

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForMutation(root, targetTab) {
  const started = performance.now();
  const expectedTitle = tabs.find((tab) => tab.id === targetTab)?.title;
  if (!expectedTitle) throw new Error(`Bilinmeyen sekme: ${targetTab}`);

  return new Promise((resolve, reject) => {
    let selectedMs = null;
    let titleMs = null;
    const timeout = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`DOM değişimi 2 saniyede gözlenmedi: ${targetTab}`));
    }, 2000);

    const observer = new MutationObserver(() => {
      if (selectedMs === null) {
        const selected = root.querySelector(`[data-tab-id="${targetTab}"]`);
        if (selected?.getAttribute("data-selected") === "true") {
          selectedMs = performance.now() - started;
        }
      }
      if (titleMs === null) {
        const heading = root.querySelector("[data-panel-title]");
        if (heading?.textContent === expectedTitle) titleMs = performance.now() - started;
      }
      if (selectedMs !== null && titleMs !== null) {
        clearTimeout(timeout);
        observer.disconnect();
        resolve({ selectedMs, titleMs });
      }
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-selected"],
      characterData: true,
      childList: true,
      subtree: true,
    });
    root.querySelector(`[data-tab-id="${targetTab}"]`)?.click();
  });
}

async function waitForViewTransitionFinish(started) {
  if (!("activeViewTransition" in document)) return null;
  let active = document.activeViewTransition;
  for (let frame = 0; !active && frame < 12; frame += 1) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    active = document.activeViewTransition;
  }
  if (!active) return null;
  try {
    await active.finished;
    return performance.now() - started;
  } catch {
    return null;
  }
}

function Tabs({ activeId, onSelect, label }) {
  return (
    <div className="tabs" role="group" aria-label={label}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          data-tab-id={tab.id}
          data-selected={activeId === tab.id}
          aria-pressed={activeId === tab.id}
          onClick={() => onSelect(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function Panel({ tab, animated = false }) {
  const content = (
    <article className="panel">
      <span className="eyebrow">AKTİF PANEL</span>
      <h3 data-panel-title>{tab.title}</h3>
      <p>{tab.body}</p>
    </article>
  );
  return animated ? <ViewTransition>{content}</ViewTransition> : content;
}

function MotionDemo() {
  const [activeId, setActiveId] = useState(tabs[0].id);
  const activeTab = tabs.find((tab) => tab.id === activeId);
  return (
    <section className="demo" id="motion-demo" aria-labelledby="motion-heading">
      <div className="demo-heading">
        <div><span className="eyebrow">ÇIKIŞ / GİRİŞ SIRASI</span><h2 id="motion-heading">Motion <code>wait</code></h2></div>
        <span className="version">Motion 13.5.0</span>
      </div>
      <Tabs activeId={activeId} onSelect={setActiveId} label="Motion demo sekmeleri" />
      <div className="panel-stage">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <Panel tab={activeTab} />
          </motion.div>
        </AnimatePresence>
      </div>
      <MeasurementControls demoId="motion-demo" transitionKind="motion" />
    </section>
  );
}

function ReactDemo() {
  const [activeId, setActiveId] = useState(tabs[0].id);
  const activeTab = tabs.find((tab) => tab.id === activeId);
  const choose = (id) => startTransition(() => setActiveId(id));
  return (
    <section className="demo" id="react-demo" aria-labelledby="react-heading">
      <div className="demo-heading">
        <div><span className="eyebrow">REACT TRANSITION + TARAYICI GEÇİŞİ</span><h2 id="react-heading">React <code>&lt;ViewTransition&gt;</code></h2></div>
        <span className="version">React 19.3.0</span>
      </div>
      <Tabs activeId={activeId} onSelect={choose} label="React demo sekmeleri" />
      <div className="panel-stage">
        <Panel tab={activeTab} animated />
      </div>
      <MeasurementControls demoId="react-demo" transitionKind="react" />
    </section>
  );
}

function MeasurementControls({ demoId, transitionKind }) {
  const [rows, setRows] = useState([]);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState("");
  const indexRef = useRef(0);

  async function runSamples() {
    const root = document.getElementById(demoId);
    if (!root || running) return;
    setRunning(true);
    setRows([]);
    try {
      const samples = [];
      const currentTab = root.querySelector('[data-tab-id][aria-pressed="true"]')?.dataset.tabId;
      indexRef.current = Math.max(0, tabs.findIndex((tab) => tab.id === currentTab));
      setPhase("Isınma tıklaması…");
      indexRef.current = (indexRef.current + 1) % tabs.length;
      const warmupTab = tabs[indexRef.current];
      const warmupStart = performance.now();
      await waitForMutation(root, warmupTab.id);
      if (transitionKind === "react") await waitForViewTransitionFinish(warmupStart);
      await pause(350);
      for (let run = 0; run < 6; run += 1) {
        setPhase(`Ölçüm ${run + 1}/6…`);
        indexRef.current = (indexRef.current + 1) % tabs.length;
        const target = tabs[indexRef.current];
        const started = performance.now();
        const dom = await waitForMutation(root, target.id);
        const finishedMs = transitionKind === "react"
          ? await waitForViewTransitionFinish(started)
          : null;
        const result = {
          run: run + 1,
          selectedMs: Number(dom.selectedMs.toFixed(1)),
          titleMs: Number(dom.titleMs.toFixed(1)),
          finishedMs: finishedMs === null ? null : Number(finishedMs.toFixed(1)),
        };
        samples.push(result);
        setRows([...samples]);
        await pause(350);
      }
    } catch (error) {
      setRows((current) => [...current, { error: error.message }]);
    } finally {
      setRunning(false);
      setPhase("");
    }
  }

  function downloadCsv() {
    if (!rows.length) return;
    const lines = ["run,selected_dom_ms,panel_title_dom_ms,view_transition_finished_ms"];
    for (const row of rows) {
      if (row.error) continue;
      lines.push(`${row.run},${row.selectedMs},${row.titleMs},${row.finishedMs ?? ""}`);
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${transitionKind}-timings.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="measurement">
      <div className="actions">
        <button type="button" className="run-button" onClick={runSamples} disabled={running}>
          {running ? phase : "1 ısınma + 6 ölçüm"}
        </button>
        <button type="button" className="download-button" onClick={downloadCsv} disabled={!rows.length || running}>
          CSV indir
        </button>
      </div>
      <p className="measure-note">Önce kayda girmeyen bir ısınma tıklaması, sonra altı ölçüm. Sayaç tıklama öncesi başlar; React satırında <code>finished</code> tarayıcı geçişini bekler.</p>
      {rows.length > 0 && (
        <div className="table-scroll">
          <table>
            <thead><tr><th>Deneme</th><th>Seçili sekme DOM</th><th>Panel başlığı DOM</th>{transitionKind === "react" && <th>Geçiş bitti</th>}</tr></thead>
            <tbody>{rows.map((row, i) => row.error
              ? <tr key={`error-${i}`}><td colSpan="4" className="error">{row.error}</td></tr>
              : <tr key={row.run}><td>{row.run}</td><td>{row.selectedMs} ms</td><td>{row.titleMs} ms</td>{transitionKind === "react" && <td>{row.finishedMs === null ? "yakalanamadı" : `${row.finishedMs} ms`}</td>}</tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function App() {
  const [environment] = useState(() => `${navigator.userAgent} · ${window.innerWidth}×${window.innerHeight} · DPR ${window.devicePixelRatio}`);
  return (
    <main className="page">
      <header className="hero">
        <span className="eyebrow">BAĞIMSIZ MİNİ DENEY</span>
        <h1>Sekme geçişinde<br /><em>iki ayrı saat</em></h1>
        <p>DOM güncellemesi ile tarayıcı animasyonunun bitişini ayrı ölç. Bu araç performans benchmark'ı değil; küçük, tekrarlanabilir bir davranış demosu.</p>
      </header>
      <div className="notice"><strong>Önemli:</strong> Ölçümler sentetik <code>HTMLElement.click()</code> çağrısı kullanır. Gerçek fare/klavye gecikmesini veya kullanıcı algısını ölçmez.</div>
      <div className="demos"><MotionDemo /><ReactDemo /></div>
      <footer>
        <p>{environment || "Tarayıcı bilgisi alınıyor…"}</p>
        <p>React 19.3.0 · React DOM 19.3.0 · Motion 13.5.0 · Vite 8.3.3</p>
      </footer>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
