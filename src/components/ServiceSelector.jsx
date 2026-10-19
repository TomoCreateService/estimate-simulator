import prices from "../config/prices.json";
import {
  formatYen,
  withTax,
  MAX_QUANTITY,
} from "../utils/calculateEstimate.js";

export default function ServiceSelector({
  service,
  coding,
  onServiceChange,
  onCodingChange,
  taxIncluded,
}) {
  const money = (amount) => formatYen(taxIncluded ? withTax(amount) : amount);
  return (
    <section className="p-step" aria-labelledby="service-heading">
      <div className="p-step__heading">
        <span className="c-stepNumber">01</span>
        <h2 id="service-heading">作りたいものを選ぶ</h2>
      </div>
      <p className="p-step__intro">
        ご検討中の内容に近いものをお選びください。
      </p>
      <fieldset className="p-services">
        <legend className="c-visuallyHidden">制作内容</legend>
        {Object.entries(prices.services).map(([id, item]) => (
          <label className="p-service" key={id}>
            <input
              type="radio"
              name="service"
              value={id}
              checked={service === id}
              onChange={() => onServiceChange(id)}
            />
            <span className="p-service__body">
              <span className="p-service__title">
                {item.label}
                {item.consultation && <span className="c-badge">要相談</span>}
              </span>
              <span className="p-service__description">{item.description}</span>
              <span className="p-service__price">
                {item.price ? (
                  <>
                    ¥{money(item.price)}
                    <small>〜</small>
                  </>
                ) : id === "coding" ? (
                  "ページ構成に応じて計算"
                ) : (
                  "必要な項目を次で選択"
                )}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
      {service === "coding" && (
        <fieldset className="p-coding">
          <legend>コーディングするページ数</legend>
          {Object.entries(prices.coding).map(([id, item]) => (
            <label className="p-coding__row" key={id}>
              <span>
                {item.label}
                <small>
                  ¥{money(item.price)}〜／{item.unit}
                </small>
              </span>
              <input
                className="c-quantity"
                type="number"
                min="0"
                max={MAX_QUANTITY}
                step="1"
                value={coding[id]}
                onChange={(event) => onCodingChange(id, event.target.value)}
                aria-label={`${item.label}の数量`}
              />
            </label>
          ))}
        </fieldset>
      )}
    </section>
  );
}
