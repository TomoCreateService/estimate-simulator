import prices from "../config/prices.json";
import { formatYen, withTax } from "../utils/calculateEstimate.js";

export default function EstimateDocument({
  estimate,
  recipient,
  details,
  taxIncluded,
}) {
  const money = (amount) =>
    `¥${formatYen(taxIncluded ? withTax(amount) : amount)}`;
  return (
    <article className="p-document" aria-label="印刷用概算見積書">
      <header className="p-document__header">
        <div>
          <p>TomoCreateService</p>
          <h1>概算見積書</h1>
        </div>
        <dl>
          <div>
            <dt>見積番号</dt>
            <dd>{details.number}</dd>
          </div>
          <div>
            <dt>発行日</dt>
            <dd>{details.date}</dd>
          </div>
          <div>
            <dt>有効期限</dt>
            <dd>{details.expires}</dd>
          </div>
        </dl>
      </header>
      <p className="p-document__recipient">
        {recipient.trim() ? `${recipient.trim()} 様` : "ご相談者 様"}
      </p>
      <p>下記のとおり、概算のお見積もりをご案内いたします。</p>
      <div className="p-document__total">
        <span>初期費用 合計（税込）</span>
        <strong>
          ¥{formatYen(estimate.initialWithTax)}
          {estimate.from ? "〜" : ""}
        </strong>
      </div>
      <h2>初期費用の内訳（{taxIncluded ? "税込" : "税別"}）</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">項目</th>
            <th scope="col">単価</th>
            <th scope="col">数量</th>
            <th scope="col">金額</th>
          </tr>
        </thead>
        <tbody>
          {estimate.items.map((item) => (
            <tr key={item.id}>
              <th scope="row">{item.label}</th>
              <td>
                {money(item.price)}
                {item.from ? "〜" : ""}
              </td>
              <td>{item.quantity}</td>
              <td>
                {money(item.amount)}
                {item.from ? "〜" : ""}
              </td>
            </tr>
          ))}
          {estimate.items.length === 0 && (
            <tr>
              <td colSpan="4">初期費用の項目はありません。</td>
            </tr>
          )}
        </tbody>
      </table>
      <dl className="p-document__totals">
        <div>
          <dt>合計（税別）</dt>
          <dd>¥{formatYen(estimate.initial)}</dd>
        </div>
        <div>
          <dt>消費税（{prices.taxRatePercent}%）</dt>
          <dd>¥{formatYen(estimate.initialWithTax - estimate.initial)}</dd>
        </div>
        <div>
          <dt>合計（税込）</dt>
          <dd>
            ¥{formatYen(estimate.initialWithTax)}
            {estimate.from ? "〜" : ""}
          </dd>
        </div>
      </dl>
      <h2>月額費用（初期費用とは別途）</h2>
      <p>
        {estimate.monthly > 0
          ? `${prices.maintenance.label}：税別 ¥${formatYen(estimate.monthly)}〜／月・税込 ¥${formatYen(estimate.monthlyWithTax)}〜／月`
          : "月次保守の選択なし（月額 ¥0）"}
      </p>
      <section className="p-document__notes">
        <h2>お見積もりについて</h2>
        <p>
          本書は概算見積もりです。「〜」の金額は最低料金の目安であり、内容・仕様・規模により変動します。正式な金額・制作範囲・納期は、ヒアリング後にご案内いたします。
        </p>
        {estimate.consultation && (
          <p>
            Webアプリ開発は要相談です。表示金額での制作を確約するものではありません。
          </p>
        )}
        <p>
          ホームページ制作の基本料金にはTOP＋下層2ページ・レスポンシブ対応・お問い合わせフォーム・基本SEOを含みます。月次保守は別途月額です。
        </p>
      </section>
      <footer className="p-document__footer">
        <strong>TomoCreateService</strong>
        <span>https://tomo-cs.com/</span>
      </footer>
    </article>
  );
}
