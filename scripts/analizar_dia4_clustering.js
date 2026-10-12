/**
 * Script de Ingesta y Análisis No Supervisado:
 * DÍA 4 / PERIODO 3 (Auditoría de Retención de Materia Prima y Capital en Custodia)
 * Archivo fuente: documentacion/MOVIMIENTO FABRIQUINES MARZO 2026.xlsx
 * 
 * Evalúa:
 * 1. Detección no supervisada del inventario en proceso (WIP) en manos de torcedores.
 * 2. Segmentación de operarios por nivel de exposición y riesgo de material.
 * 3. Proyección de tabacos represados en planta pendientes de entrega.
 */

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const EXCEL_PATH = path.join(__dirname, '..', 'documentacion', 'MOVIMIENTO FABRIQUINES MARZO   2026.xlsx');

function procesarDia4() {
  console.log('========================================================================');
  console.log('🔬 ANÁLISIS NO SUPERVISADO - DÍA 4 / TERCER CICLO TEMPORAL');
  console.log('========================================================================\n');

  if (!fs.existsSync(EXCEL_PATH)) {
    console.error('Error: No se encontró el archivo', EXCEL_PATH);
    return;
  }

  const wb = xlsx.readFile(EXCEL_PATH, { sheetRows: 60 });
  const sheet = wb.Sheets['SEMANA DEL 14 AL 21 '];
  if (!sheet) {
    console.error('Error: Hoja no encontrada');
    return;
  }

  const raw = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  const operariosCustodia = [];

  for (let r = 4; r < raw.length; r++) {
    const row = raw[r];
    if (!row || !row[0]) continue;
    const nombre = String(row[0]).trim();
    if (nombre.includes('TOTAL') || nombre.includes('MUESTRAS')) continue;

    const capa = Number(row[1]) || 0;
    const capote = Number(row[2]) || 0;
    const pic = Number(row[3]) || 0;
    const cestas = Number(row[4]) || 0;
    const totalMat = capa + capote + pic;

    if (totalMat > 0) {
      // Rendimiento esperado promedio: 98 tabacos por kg de hoja
      const tabacosEstimados = Math.round(totalMat * 98);
      operariosCustodia.push({
        nombre,
        capa_kg: capa,
        capote_kg: capote,
        picadura_kg: pic,
        total_retenido_kg: Number(totalMat.toFixed(2)),
        cestas,
        tabacos_pendientes_estimados: tabacosEstimados
      });
    }
  }

  operariosCustodia.sort((a,b) => b.total_retenido_kg - a.total_retenido_kg);
  const totalKilos = operariosCustodia.reduce((acc, x) => acc + x.total_retenido_kg, 0);
  const totalTabacosRepresados = operariosCustodia.reduce((acc, x) => acc + x.tabacos_pendientes_estimados, 0);

  console.log(`📊 Operarios con custodia de material: ${operariosCustodia.length}`);
  console.log(`📦 Masa total de hoja en talleres externos: ${totalKilos.toFixed(2)} kg`);
  console.log(`🔮 Volumen de producción en espera: ~${totalTabacosRepresados.toLocaleString()} tabacos`);

  // Agrupamiento No Supervisado K-Means (Exposición de Inventario)
  let centroides = [9.0, 40.0, 102.0];
  let clusters = [[], [], []];

  for (let iter = 0; iter < 25; iter++) {
    clusters = [[], [], []];
    operariosCustodia.forEach(p => {
      let mejorDist = Infinity, mejorIdx = 0;
      centroides.forEach((c, i) => {
        const d = Math.abs(p.total_retenido_kg - c);
        if (d < mejorDist) { mejorDist = d; mejorIdx = i; }
      });
      clusters[mejorIdx].push(p);
    });

    centroides = clusters.map(cl => {
      if (cl.length === 0) return 0;
      const suma = cl.reduce((acc, p) => acc + p.total_retenido_kg, 0);
      return Number((suma / cl.length).toFixed(2));
    });
  }

  const nombresNiveles = [
    'NIVEL RESIDUAL / MÍNIMO (Saldos Menores)',
    'NIVEL MODERADO (1 Lote en Proceso)',
    'NIVEL CRÍTICO (Alta Exposición de Inventario / ~100 kg en Taller)'
  ];

  console.log('\n========================================================================');
  console.log('🤖 CLUSTERING NO SUPERVISADO DE EXPOSICIÓN DE CAPITAL');
  console.log('========================================================================');

  clusters.forEach((cl, idx) => {
    console.log(`\n📌 [GRUPO ${idx + 1}]: ${nombresNiveles[idx]} (Centroide: ${centroides[idx]} kg | ${cl.length} operarios)`);
    cl.forEach(p => {
      console.log(`   • ${p.nombre.padEnd(26)} | Retenido: ${p.total_retenido_kg.toString().padStart(6)} kg | Cestas: ${p.cestas} | Proy: ~${p.tabacos_pendientes_estimados.toLocaleString()} tab`);
    });
  });

  // Guardar archivo JSON
  const outPath = path.join(__dirname, 'analisis_dia4_output.json');
  fs.writeFileSync(outPath, JSON.stringify({
    fecha_analisis: new Date().toISOString(),
    total_operarios_custodia: operariosCustodia.length,
    total_kilos_en_talleres: Number(totalKilos.toFixed(2)),
    total_tabacos_proyectados: totalTabacosRepresados,
    centroides,
    clusters
  }, null, 2), 'utf-8');

  console.log('\n💾 Dataset exportado a: scripts/analisis_dia4_output.json');
}

procesarDia4();
