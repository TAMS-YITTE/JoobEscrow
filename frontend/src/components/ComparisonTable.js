import styles from './ComparisonTable.module.css';
import { COMPARISON, COMPARISON_COLUMNS, COMPARISON_NOTE } from '../config/comparison';

// Comparatif JoobEscrow vs plateformes existantes (donnees : config/comparison.js).
export default function ComparisonTable() {
  return (
    <section className={styles.section} id="compare">
      <div className={styles.container}>
        <div className={styles.head}>
          <span className={styles.tag}>WHY JOOBESCROW</span>
          <h2 className={styles.title}>Smart escrow vs the usual options</h2>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th />
                {COMPARISON_COLUMNS.map((c) => <th key={c}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((r) => (
                <tr key={r.name} className={r.highlight ? styles.hl : undefined}>
                  <th scope="row">{r.name}</th>
                  {r.cells.map((c, i) => <td key={i}>{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.note}>{COMPARISON_NOTE}</p>
      </div>
    </section>
  );
}
