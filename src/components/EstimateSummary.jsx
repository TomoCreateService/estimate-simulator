import prices from "../config/prices.json";
import { formatYen, withTax } from "../utils/calculateEstimate.js";

export default function EstimateSummary({
  estimate,
  taxIncluded,
  recipient,
  onRecipientChange,
  onPrint,
}) {
  const money = (amount) => formatYen(taxIncluded ? withTax(amount) : amount);
  const canProceed = estimate.items.length > 0 || estimate.monthly > 0;
  return (
    <aside className="p-summary" aria-labelledby="summary-heading">
      <p className="p-summary__eyebrow">YOUR ESTIMATE</p>
      <h2 id="summary-heading">お見積もりの目安</h2>
      <div className="p-summary__total" aria-live="polite" aria-atomic="true">
        <p>
          初期費用 <span>（{taxIncluded ? "税込" : "税別"}）</span>
        </p>
        <div className="p-summary__amount">
          <span>¥</span>
          <strong data-testid="initial-total">{money(estimate.initial)}</strong>
          {estimate.from && <span>〜</span>}
        </div>
        <p className="p-summary__tax" data-testid="initial-tax">
          {taxIncluded
            ? `（うち消費税 ${formatYen(estimate.initialWithTax - estimate.initial)}円）`
            : `消費税${prices.taxRatePercent}%：${formatYen(estimate.initialWithTax - estimate.initial)}円`}
        </p>
        <p className="p-summary__monthly">
          月額費用{" "}
          <strong data-testid="monthly-total">
            ¥{money(estimate.monthly)}
            {estimate.monthly && prices.maintenance.from ? "〜" : ""}
          </strong>
          <span>／月</span>
        </p>
        <p
          className="p-summary__tax p-summary__tax--monthly"
          data-testid="monthly-tax"
        >
          {taxIncluded
            ? `（うち消費税 ${formatYen(estimate.monthlyWithTax - estimate.monthly)}円）`
            : `消費税${prices.taxRatePercent}%：${formatYen(estimate.monthlyWithTax - estimate.monthly)}円`}
        </p>
      </div>
      <div className="p-summary__breakdown">
        <h3>お見積もり内訳</h3>
        {estimate.items.length ? (
          <ul>
            {estimate.items.map((item) => (
              <li key={item.id}>
                <span>
                  {item.label}
                  {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                </span>
                <span>
                  ¥{money(item.amount)}
                  {item.from ? "〜" : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-summary__empty">
            制作内容・オプションをお選びください。
          </p>
        )}
        {estimate.monthly > 0 && (
          <p className="p-summary__maintenance">
            <span>月次保守（別途月額）</span>
            <span>¥{money(estimate.monthly)}〜</span>
          </p>
        )}
      </div>
      {estimate.consultation && (
        <p className="p-summary__consultation">
          Webアプリ開発は要相談です。機能・規模を伺い、個別にお見積もりします。
        </p>
      )}
      <p className="p-summary__notice">
        この金額は概算です。内容・仕様により変わります。正式なお見積もりは、ご相談後にご案内します。
      </p>
      <label className="p-summary__recipient" htmlFor="recipient">
        見積書の宛名 <span>任意・PDF用</span>
        <input
          id="recipient"
          type="text"
          maxLength="100"
          placeholder="例：株式会社〇〇"
          value={recipient}
          onChange={(event) => onRecipientChange(event.target.value)}
        />
      </label>
      <a
        className="c-button c-button--primary"
        href="https://tomo-cs.com/#contact"
      >
        この内容で相談する <span aria-hidden="true">↗</span>
      </a>
      <button
        className="c-button c-button--outline"
        type="button"
        disabled={!canProceed}
        onClick={onPrint}
      >
        PDFで保存 <span aria-hidden="true">↓</span>
      </button>
      <p className="p-summary__footnote">
        印刷画面で「PDFに保存」を選択してください。
        <br />
        相談時は保存した見積書を添えるとスムーズです。
      </p>
    </aside>
  );
}
