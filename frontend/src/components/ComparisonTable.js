import styles from './ComparisonTable.module.css';
import { COMPARISON, COMPARISON_COLUMNS, COMPARISON_NOTE } from '../config/comparison';

// Comparatif JoobEscrow vs plateformes existantes (donnees : config/comparison.js).
// Une colonne par plateforme, une ligne par critere : JoobEscrow en premiere colonne, mis en avant.
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
                <th className={styles.corner} />
                {COMPARISON.map((p) => (
                  <th key={p.name} scope="col" className={p.highlight ? styles.hl : undefined}>{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_COLUMNS.map((criterion, i) => (
                <tr key={criterion}>
                  <th scope="row" className={styles.criterion}>{criterion}</th>
                  {COMPARISON.map((p) => (
                    <td key={p.name} className={p.highlight ? styles.hl : undefined}>{p.cells[i]}</td>
                  ))}
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
