import { useState } from "react";
import SiteHeader from "./components/SiteHeader.jsx";
import prices from "./config/prices.json";
import ServiceSelector from "./components/ServiceSelector.jsx";
import OptionSelector from "./components/OptionSelector.jsx";
import EstimateSummary from "./components/EstimateSummary.jsx";
import EstimateDocument from "./components/EstimateDocument.jsx";
import {
  calculateEstimate,
  createDocumentDetails,
  normalizeQuantity,
} from "./utils/calculateEstimate.js";

export default function App() {
  const [service, setService] = useState("website");
  const [coding, setCoding] = useState({ top: 1, subpage: 0, lp: 0 });
  const [options, setOptions] = useState({ pages: 0, animation: 0 });
  const [maintenance, setMaintenance] = useState(false);
  const [taxIncluded, setTaxIncluded] = useState(true);
  const [recipient, setRecipient] = useState("");
  const [details] = useState(createDocumentDetails);
  const estimate = calculateEstimate({ service, coding, options, maintenance });
  const changeOption = (id, value) =>
    setOptions((current) => ({
      ...current,
      [id]:
        typeof value === "string" && value !== ""
          ? normalizeQuantity(value)
          : value,
    }));
  const changeService = (id) => {
    setService(id);
    if (id === "website")
      setOptions((current) => ({ ...current, form: false }));
  };
  return (
    <>
      <div className="p-screen">
        <SiteHeader />
        <main className="l-main">
          <section className="p-intro" aria-labelledby="page-title">
            <p className="p-intro__eyebrow">
              <span aria-hidden="true"></span> ESTIMATE SIMULATOR
            </p>
            <h1 id="page-title">
              つくりたいを、
              <br className="p-intro__break" />
              予算から考える。
            </h1>
            <p className="p-intro__description">
              Web制作のお見積もりシミュレーター。
              <br />
              必要なものを選ぶだけで、費用の目安がわかります。
            </p>
            <span className="p-intro__index" aria-hidden="true">
              TCS / TOOLS — 01
            </span>
          </section>
          <div className="p-toolbar">
            <p>選ぶ → 概算を確認 → 気軽に相談</p>
            <div className="p-toolbar__tax">
              <span className="p-toolbar__taxRate">
                消費税{prices.taxRatePercent}%
              </span>
              <fieldset className="c-taxSwitch">
                <legend className="c-visuallyHidden">金額の表示</legend>
                <label>
                  <input
                    type="radio"
                    name="tax"
                    checked={taxIncluded}
                    onChange={() => setTaxIncluded(true)}
                  />
                  <span>税込</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="tax"
                    checked={!taxIncluded}
                    onChange={() => setTaxIncluded(false)}
                  />
                  <span>税別</span>
                </label>
              </fieldset>
            </div>
          </div>
          <div className="l-simulator">
            <div>
              <ServiceSelector
                service={service}
                coding={coding}
                onServiceChange={changeService}
                onCodingChange={(id, value) =>
                  setCoding((current) => ({
                    ...current,
                    [id]: value === "" ? "" : normalizeQuantity(value),
                  }))
                }
                taxIncluded={taxIncluded}
              />
              <OptionSelector
                service={service}
                options={options}
                maintenance={maintenance}
                onOptionChange={changeOption}
                onMaintenanceChange={setMaintenance}
                taxIncluded={taxIncluded}
              />
            </div>
            <EstimateSummary
              estimate={estimate}
              taxIncluded={taxIncluded}
              recipient={recipient}
              onRecipientChange={setRecipient}
              onPrint={() => window.print()}
            />
          </div>
          <section className="p-help">
            <p>まだ、まとまっていなくても大丈夫。</p>
            <span>「こんなことはできる？」から、お気軽にご相談ください。</span>
            <a href="https://tomo-cs.com/#contact">
              まずは相談してみる <span aria-hidden="true">↗</span>
            </a>
          </section>
        </main>
        <footer className="l-footer p-footer">
          <a href="https://tomo-cs.com/">TomoCreateService</a>
          <small>© {new Date().getFullYear()} TomoCreateService</small>
        </footer>
      </div>
      <EstimateDocument
        estimate={estimate}
        recipient={recipient}
        details={details}
        taxIncluded={taxIncluded}
      />
    </>
  );
}
