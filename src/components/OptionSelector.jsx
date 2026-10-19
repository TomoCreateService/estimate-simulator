import prices from "../config/prices.json";
import {
  formatYen,
  withTax,
  MAX_QUANTITY,
} from "../utils/calculateEstimate.js";

export default function OptionSelector({
  service,
  options,
  maintenance,
  onOptionChange,
  onMaintenanceChange,
  taxIncluded,
}) {
  const money = (amount) => formatYen(taxIncluded ? withTax(amount) : amount);
  return (
    <>
      <section className="p-step" aria-labelledby="options-heading">
        <div className="p-step__heading">
          <span className="c-stepNumber">02</span>
          <h2 id="options-heading">必要な機能をプラス</h2>
          <span className="p-step__optional">任意</span>
        </div>
        <p className="p-step__intro">
          迷う項目は、相談のときに一緒に決められます。
        </p>
        <div className="p-options">
          {Object.entries(prices.options).map(([id, item]) => {
            const included = id === "form" && service === "website";
            const enabled = Boolean(options[id]);
            return (
              <div className="p-option" key={id}>
                <label className="p-option__label">
                  <input
                    type="checkbox"
                    checked={included || enabled}
                    disabled={included}
                    onChange={(event) =>
                      onOptionChange(
                        id,
                        item.quantity
                          ? Number(event.target.checked)
                          : event.target.checked,
                      )
                    }
                  />
                  <span>
                    <span className="p-option__name">{item.label}</span>
                    <small>
                      {included
                        ? "ホームページ制作の基本料金に含まれます"
                        : item.description ||
                          (item.quantity
                            ? `必要な${item.unit}数を指定できます。`
                            : "必要に応じて追加できます。")}
                    </small>
                  </span>
                </label>
                <div className="p-option__value">
                  {included ? (
                    <span className="c-badge">追加料金なし</span>
                  ) : (
                    <span>
                      ¥{money(item.price)}
                      {item.from ? "〜" : ""}
                      <small>{item.unit ? `／${item.unit}` : ""}</small>
                    </span>
                  )}
                  {item.quantity && (
                    <label className="p-option__quantity">
                      <span className="c-visuallyHidden">
                        {item.label}の数量
                      </span>
                      <input
                        aria-label={`${item.label}の数量`}
                        className="c-quantity"
                        type="number"
                        min="0"
                        max={MAX_QUANTITY}
                        step="1"
                        value={options[id] ?? 0}
                        onChange={(event) =>
                          onOptionChange(id, event.target.value)
                        }
                      />
                      <small>{item.unit}</small>
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <section className="p-step" aria-labelledby="maintenance-heading">
        <div className="p-step__heading">
          <span className="c-stepNumber">03</span>
          <h2 id="maintenance-heading">公開後のサポート</h2>
          <span className="p-step__optional">任意</span>
        </div>
        <label className="p-maintenance">
          <input
            type="checkbox"
            checked={maintenance}
            onChange={(event) => onMaintenanceChange(event.target.checked)}
          />
          <span>
            <strong>{prices.maintenance.label}</strong>
            <small>{prices.maintenance.description}</small>
          </span>
          <span className="p-maintenance__price">
            ¥{money(prices.maintenance.price)}〜<small>／月</small>
          </span>
        </label>
        <p className="p-step__note">月額費用は初期費用と分けて表示します。</p>
      </section>
    </>
  );
}
