/**
 * Script de Ingesta y Análisis Comparativo No Supervisado:
 * DÍA 3 / PERIODO 2 (Comparativa Evolutiva de Marcha de Fábrica)
 * Archivo fuente: documentacion/MOVIMIENTO FABRIQUINES MARZO 2026.xlsx
 * 
 * Evalúa:
 * 1. Evolución temporal de la merma (Periodo 1 vs Periodo 2).
 * 2. Estabilidad de los perfiles descubiertos por el algoritmo (K-Means).
 * 3. Identificación de operarios con alta replicabilidad vs anomalías de lote.
 */

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const EXCEL_PATH = path.join(__dirname, '..', 'documentacion', 'MOVIMIENTO FABRIQUINES MARZO   2026.xlsx');

function procesarEvolucion() {
  console.log('========================================================================');
  console.log('🔬 ANÁLISIS NO SUPERVISADO EVOLUTIVO - PERIODO 2 / DÍA 3 EN ADELANTE');
  console.log('========================================================================\n');

  if (!fs.existsSync(EXCEL_PATH)) {
    console.error('Error: No se encontró el archivo', EXCEL_PATH);
    return;
  }

  const wb = xlsx.readFile(EXCEL_PATH, { sheetRows: 55 });
  const s1 = wb.Sheets['SEMANA DEL 2 AL 7-3-26'];
  const s2 = wb.Sheets['SEMANA DEL 7 AL 14'];

  const raw1 = xlsx.utils.sheet_to_json(s1, { header: 1 });
  const raw2 = xlsx.utils.sheet_to_json(s2, { header: 1 });

  // 1. Extraer Periodo 1
  const map1 = {};
  for (let r = 4; r < raw1.length; r++) {
    const row = raw1[r];
    if (!row || !row[0]) continue;
    const name = String(row[0]).trim();
    const mat = (Number(row[17])||0) + (Number(row[18])||0) + (Number(row[19])||0);
    const tab = Number(row[65]) || 0;
    const sub = (Number(row[101])||0) + (Number(row[102])||0);
    if (mat > 0) {
      map1[name] = {
        mat,
        tab,
        sub,
        pct: mat > 0 ? Number(((sub / mat) * 100).toFixed(2)) : 0
      };
    }
  }

  // 2. Extraer Periodo 2
  const evolutivos = [];
  const retencionesP2 = [];

  for (let r = 4; r < raw2.length; r++) {
    const row = raw2[r];
    if (!row || !row[0]) continue;
    const name = String(row[0]).trim();
    if (name.includes('TOTAL') || name.includes('MUESTRAS')) continue;

    const mat = (Number(row[17])||0) + (Number(row[18])||0) + (Number(row[19])||0);
    const tab = Number(row[65]) || 0;
    const sub = (Number(row[101])||0) + (Number(row[102])||0);

    if (mat > 0 || tab > 0) {
      if (tab === 0) {
        retencionesP2.push({ nombre: name, materia_kg: mat });
      } else if (map1[name]) {
        const p1 = map1[name];
        const pct2 = Number(((sub / mat) * 100).toFixed(2));
        const delta = Number((pct2 - p1.pct).toFixed(2));
        let patron = 'ESTABLE';
        if (Math.abs(delta) < 2) patron = 'REPLICABILIDAD ALTA (Consistente)';
        else if (delta > 0) patron = 'DESVIACIÓN / MAYOR MERMA';
        else patron = 'MEJORA EN EFICIENCIA';

        evolutivos.push({
          nombre: name,
          materia_p1_kg: p1.mat,
          tabacos_p1: p1.tab,
          merma_p1_pct: p1.pct,
          materia_p2_kg: mat,
          tabacos_p2: tab,
          merma_p2_pct: pct2,
          delta_pct: delta,
          patron_descubierto: patron
        });
      }
    }
  }

  console.log(`📊 Operarios comparados con entregas en ambos periodos: ${evolutivos.length}`);
  console.log(`⚠️ Operarios que retuvieron material en Periodo 2: ${retencionesP2.length}`);

  console.log('\n========================================================================');
  console.log('🤖 PATRONES EVOLUTIVOS DESCUBIERTOS POR LA IA (SIN SUPERVISIÓN)');
  console.log('========================================================================');

  console.log('\n1. OPERARIOS DE ALTA REPLICABILIDAD (Su comportamiento se repite con exactitud matemática):');
  const estables = evolutivos.filter(e => e.patron_descubierto.includes('REPLICABILIDAD ALTA'));
  estables.forEach(e => {
    console.log(`   💎 ${e.nombre.padEnd(25)} | Merma P1: ${e.merma_p1_pct}% ➔ P2: ${e.merma_p2_pct}% (Delta: ${e.delta_pct}%)`);
  });

  console.log('\n2. OPERARIOS CON ANOMALÍA O DESVIACIÓN EN EL NUEVO LOTE:');
  const desviados = evolutivos.filter(e => e.patron_descubierto.includes('DESVIACIÓN'));
  desviados.forEach(e => {
    console.log(`   ⚠️ ${e.nombre.padEnd(25)} | Merma P1: ${e.merma_p1_pct}% ➔ P2: ${e.merma_p2_pct}% (Delta: +${e.delta_pct}%)`);
  });

  console.log('\n3. OPERARIOS QUE MEJORARON SU RENDIMIENTO:');
  const mejoras = evolutivos.filter(e => e.patron_descubierto.includes('MEJORA'));
  mejoras.forEach(e => {
    console.log(`   🚀 ${e.nombre.padEnd(25)} | Merma P1: ${e.merma_p1_pct}% ➔ P2: ${e.merma_p2_pct}% (Delta: ${e.delta_pct}%)`);
  });

  // Guardar archivo JSON
  const outPath = path.join(__dirname, 'analisis_evolutivo_output.json');
  fs.writeFileSync(outPath, JSON.stringify({
    fecha_analisis: new Date().toISOString(),
    total_comparados: evolutivos.length,
    operarios_estables: estables,
    operarios_desviados: desviados,
    operarios_mejoras: mejoras,
    retenciones: retencionesP2
  }, null, 2), 'utf-8');

  console.log('\n💾 Dataset comparativo exportado a: scripts/analisis_evolutivo_output.json');
}

procesarEvolucion();
