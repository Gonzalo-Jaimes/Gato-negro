/**
 * Script de Ingesta y Análisis No Supervisado:
 * DÍA 7 / EL SÁBADO DE ABASTECIMIENTO GENERAL (La "Receta Áurea" y Calibración de Mezcla)
 * Archivo fuente: documentacion/MOVIMIENTO FABRIQUINES MARZO 2026.xlsx
 * 
 * Evalúa:
 * 1. Detección no supervisada de la relación proporcional de despacho de tabaco.
 * 2. Identificación de la "Receta Áurea" de manufactura (Capa : Capote : Picadura = 1 : 1.8 : 7.0).
 * 3. Detección de anomalías en torcedores que recibieron mezclas desbalanceadas.
 */

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const EXCEL_PATH = path.join(__dirname, '..', 'documentacion', 'MOVIMIENTO FABRIQUINES MARZO   2026.xlsx');

function procesarDia7() {
  console.log('========================================================================');
  console.log('🔬 ANÁLISIS NO SUPERVISADO - DÍA 7 / EL SÁBADO DE ABASTECIMIENTO GENERAL');
  console.log('========================================================================\n');

  if (!fs.existsSync(EXCEL_PATH)) {
    console.error('Error: No se encontró el archivo', EXCEL_PATH);
    return;
  }

  const wb = xlsx.readFile(EXCEL_PATH, { sheetRows: 50 });
  const sheet = wb.Sheets['SEMANA DEL 2 AL 7-3-26'];
  const raw = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  const despachos = [];

  for (let r = 4; r < raw.length; r++) {
    const row = raw[r];
    if (!row || !row[0]) continue;
    const nombre = String(row[0]).trim();
    if (nombre.includes('TOTAL') || nombre.includes('MUESTRAS')) continue;

    const capa = Number(row[17]) || 0;
    const capote = Number(row[18]) || 0;
    const pic = Number(row[19]) || 0;
    const cestas = Number(row[20]) || 0;
    const totalMat = capa + capote + pic;

    if (totalMat > 0) {
      const rCapote = Number((capote / (capa || 1)).toFixed(2));
      const rPic = Number((pic / (capa || 1)).toFixed(2));

      // Verificación de fidelidad a la receta (1 : 1.8 : 7.0)
      const esRecetaAurea = (rCapote === 1.80 && rPic === 7.00);

      despachos.push({
        nombre,
        capa_kg: capa,
        capote_kg: capote,
        picadura_kg: pic,
        total_despachado_kg: Number(totalMat.toFixed(2)),
        cestas,
        ratio_capote_capa: rCapote,
        ratio_picadura_capa: rPic,
        calibracion_receta: esRecetaAurea ? 'RECETA ÁUREA EXACTA' : 'MEZCLA ATÍPICA / DESVIADA'
      });
    }
  }

  despachos.sort((a,b) => b.total_despachado_kg - a.total_despachado_kg);

  const totalCapa = despachos.reduce((a, b) => a + b.capa_kg, 0);
  const totalCapote = despachos.reduce((a, b) => a + b.capote_kg, 0);
  const totalPic = despachos.reduce((a, b) => a + b.picadura_kg, 0);
  const granTotalMateria = despachos.reduce((a, b) => a + b.total_despachado_kg, 0);

  const conformes = despachos.filter(d => d.calibracion_receta === 'RECETA ÁUREA EXACTA');
  const anomalos = despachos.filter(d => d.calibracion_receta !== 'RECETA ÁUREA EXACTA');

  console.log(`📊 Torcedores abastecidos el sábado: ${despachos.length}`);
  console.log(`🌿 Materia prima total entregada: ${granTotalMateria.toFixed(2)} kg`);
  console.log(`   - Capa: ${totalCapa.toFixed(1)} kg (${((totalCapa/granTotalMateria)*100).toFixed(1)}%)`);
  console.log(`   - Capote: ${totalCapote.toFixed(1)} kg (${((totalCapote/granTotalMateria)*100).toFixed(1)}%)`);
  console.log(`   - Picadura: ${totalPic.toFixed(1)} kg (${((totalPic/granTotalMateria)*100).toFixed(1)}%)`);

  console.log(`\n💎 Cumplimiento de la proporción 1 : 1.8 : 7.0: ${conformes.length} / ${despachos.length} (${((conformes.length/despachos.length)*100).toFixed(1)}%)`);
  console.log(`⚠️ Desviaciones detectadas en despacho: ${anomalos.length}`);
  anomalos.forEach(a => {
    console.log(`   • ${a.nombre.padEnd(25)} -> Capa: ${a.capa_kg}k, Capote: ${a.capote_kg}k, Pic: ${a.picadura_kg}k | Ratio: 1 : ${a.ratio_capote_capa} : ${a.ratio_picadura_capa}`);
  });

  // Exportar dataset JSON
  const outPath = path.join(__dirname, 'analisis_dia7_output.json');
  fs.writeFileSync(outPath, JSON.stringify({
    fecha_analisis: new Date().toISOString(),
    total_despachados: despachos.length,
    masa_total_despachada_kg: Number(granTotalMateria.toFixed(2)),
    proporciones_globales: {
      capa_kg: totalCapa,
      capote_kg: totalCapote,
      picadura_kg: totalPic
    },
    conformes_receta: conformes,
    anomalos_receta: anomalos
  }, null, 2), 'utf-8');

  console.log('\n💾 Dataset exportado a: scripts/analisis_dia7_output.json');
}

procesarDia7();
