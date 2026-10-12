/**
 * Script de Ingesta y Análisis No Supervisado:
 * DÍA 6 / LOGÍSTICA DE RETORNO Y CALIBRACIÓN DE CESTAS (Empaque y Flujo de Envases)
 * Archivo fuente: documentacion/MOVIMIENTO FABRIQUINES MARZO 2026.xlsx
 * 
 * Evalúa:
 * 1. Monitoreo no supervisado del ciclo cerrado de envases físicos (Cestas).
 * 2. Agrupamiento K-Means de densidad de empaque (Tabacos por cesta).
 * 3. Identificación de fugas logísticas y dispersión de envases en talleres externos.
 */

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const EXCEL_PATH = path.join(__dirname, '..', 'documentacion', 'MOVIMIENTO FABRIQUINES MARZO   2026.xlsx');

function procesarDia6() {
  console.log('========================================================================');
  console.log('🔬 ANÁLISIS NO SUPERVISADO - DÍA 6 / LOGÍSTICA DE ENVASES Y DENSIDAD');
  console.log('========================================================================\n');

  if (!fs.existsSync(EXCEL_PATH)) {
    console.error('Error: No se encontró el archivo', EXCEL_PATH);
    return;
  }

  const wb = xlsx.readFile(EXCEL_PATH, { sheetRows: 50 });
  const sheet = wb.Sheets['SEMANA DEL 2 AL 7-3-26'];
  const raw = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  const registros = [];

  for (let r = 4; r < raw.length; r++) {
    const row = raw[r];
    if (!row || !row[0]) continue;
    const nombre = String(row[0]).trim();
    if (nombre.includes('TOTAL') || nombre.includes('MUESTRAS')) continue;

    const tabacos = Number(row[65]) || 0;
    const cestasLlevan = Number(row[20]) || 0;
    const cestasDevueltas = Number(row[36]) || 0;
    const cestasRetenidas = Number(row[52]) || 0;

    if (cestasLlevan > 0 || cestasDevueltas > 0 || cestasRetenidas > 0) {
      const densidad = cestasDevueltas > 0 ? Math.round(tabacos / cestasDevueltas) : 0;
      registros.push({
        nombre,
        tabacos_entregados: tabacos,
        cestas_entregadas: cestasLlevan,
        cestas_devueltas: cestasDevueltas,
        cestas_retenidas: cestasRetenidas,
        densidad_tabacos_por_cesta: densidad,
        estado_envases: cestasRetenidas > 0 ? 'RETENCIÓN' : 'CICLO COMPLETO'
      });
    }
  }

  const totalEntregadas = registros.reduce((a, b) => a + b.cestas_entregadas, 0);
  const totalDevueltas = registros.reduce((a, b) => a + b.cestas_devueltas, 0);
  const totalRetenidas = registros.reduce((a, b) => a + b.cestas_retenidas, 0);

  console.log(`📊 Total de operarios en circuito de envases: ${registros.length}`);
  console.log(`🧺 Cestas entregadas por almacén: ${totalEntregadas}`);
  console.log(`📥 Cestas devueltas con producto: ${totalDevueltas} (Tasa retorno: ${((totalDevueltas/totalEntregadas)*100).toFixed(1)}%)`);
  console.log(`⚠️ Cestas retenidas en talleres: ${totalRetenidas}`);

  // Clustering No Supervisado de Densidad de Empaque (Tabacos / Cesta)
  const conEntrega = registros.filter(r => r.cestas_devueltas > 0);
  let centroides = [1150.0, 1250.0, 1330.0];
  let clusters = [[], [], []];

  for (let iter = 0; iter < 25; iter++) {
    clusters = [[], [], []];
    conEntrega.forEach(p => {
      let mejorDist = Infinity, mejorIdx = 0;
      centroides.forEach((c, i) => {
        const d = Math.abs(p.densidad_tabacos_por_cesta - c);
        if (d < mejorDist) { mejorDist = d; mejorIdx = i; }
      });
      clusters[mejorIdx].push(p);
    });

    centroides = clusters.map(cl => {
      if (cl.length === 0) return 0;
      const suma = cl.reduce((acc, p) => acc + p.densidad_tabacos_por_cesta, 0);
      return Math.round(suma / cl.length);
    });
  }

  const nombresClusters = [
    'DENSIDAD BAJA / SUBAPROVECHAMIENTO (< 1.200 tab/cesta)',
    'ESTÁNDAR DE FÁBRICA CALIBRADO (1.250 tabacos/cesta exactos)',
    'SOBREDENSIDAD / RIESGO DE APLASTAMIENTO (> 1.300 tab/cesta)'
  ];

  console.log('\n========================================================================');
  console.log('🤖 CLUSTERING NO SUPERVISADO DE DENSIDAD DE EMPAQUE EN CESTAS');
  console.log('========================================================================');

  clusters.forEach((cl, idx) => {
    console.log(`\n📌 [GRUPO ${idx + 1}]: ${nombresClusters[idx]} (Centroide: ${centroides[idx]} tab/cesta | ${cl.length} operarios)`);
    cl.forEach(p => {
      console.log(`   • ${p.nombre.padEnd(26)} | ${p.tabacos_entregados.toString().padStart(5)} tabacos en ${p.cestas_devueltas} cestas (${p.densidad_tabacos_por_cesta} u/cesta)`);
    });
  });

  // Guardar archivo JSON
  const outPath = path.join(__dirname, 'analisis_dia6_output.json');
  fs.writeFileSync(outPath, JSON.stringify({
    fecha_analisis: new Date().toISOString(),
    total_operarios_circuito: registros.length,
    cestas_entregadas_total: totalEntregadas,
    cestas_devueltas_total: totalDevueltas,
    cestas_retenidas_total: totalRetenidas,
    centroides_densidad: centroides,
    clusters_densidad: clusters,
    operarios_retencion_cestas: registros.filter(r => r.cestas_retenidas > 0)
  }, null, 2), 'utf-8');

  console.log('\n💾 Dataset exportado a: scripts/analisis_dia6_output.json');
}

procesarDia6();
