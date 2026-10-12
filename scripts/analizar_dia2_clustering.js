/**
 * Script de Ingesta y Agrupamiento No Supervisado: DÍA 2 (Lunes 2 de Marzo de 2026)
 * Archivo fuente: documentacion/MOVIMIENTO FABRIQUINES MARZO 2026.xlsx
 * 
 * Este script procesa UN SOLO DÍA a ciegas (sin etiquetas preconcebidas) para observar:
 * 1. Comportamiento volumétrico de entradas y salidas.
 * 2. Agrupamiento no supervisado (K-Means Clustering) basado en dispersión de subproductos (recorte + vena).
 * 3. Identificación de anomalías operativas (operarios con retención de material sin entrega el mismo día).
 */

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const EXCEL_PATH = path.join(__dirname, '..', 'documentacion', 'MOVIMIENTO FABRIQUINES MARZO   2026.xlsx');

function procesarDia2() {
  console.log('========================================================================');
  console.log('🔬 ANÁLISIS NO SUPERVISADO - DÍA 2 (LUNES 2 DE MARZO DE 2026)');
  console.log('========================================================================\n');

  if (!fs.existsSync(EXCEL_PATH)) {
    console.error('Error: No se encontró el archivo', EXCEL_PATH);
    return;
  }

  const wb = xlsx.readFile(EXCEL_PATH);
  const sheet = wb.Sheets['SEMANA DEL 2 AL 7-3-26'];
  if (!sheet) {
    console.error('Error: No se encontró la hoja SEMANA DEL 2 AL 7-3-26');
    return;
  }

  const raw = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  const registros = [];

  for (let r = 4; r < raw.length; r++) {
    const row = raw[r];
    if (!row || !row[0]) continue;
    const nombre = String(row[0]).trim();
    if (nombre.includes('TOTAL') || nombre.includes('MUESTRAS')) continue;

    // Datos del Día 2 (Entrega inicial y liquidación)
    const capa = Number(row[17]) || 0;
    const capote = Number(row[18]) || 0;
    const picadura = Number(row[19]) || 0;
    const cestas = Number(row[20]) || 0;
    const totalMat = capa + capote + picadura;

    const tabacos = Number(row[65]) || 0;
    const recorte = Number(row[101]) || 0;
    const vena = Number(row[102]) || 0;
    const subproductos = recorte + vena;

    if (totalMat > 0 || tabacos > 0) {
      const pctSubprod = totalMat > 0 ? Number(((subproductos / totalMat) * 100).toFixed(2)) : 0;
      const tabacosPorKg = totalMat > 0 ? Number((tabacos / totalMat).toFixed(1)) : 0;

      registros.push({
        nombre,
        capa_kg: capa,
        capote_kg: capote,
        picadura_kg: picadura,
        total_material_kg: Number(totalMat.toFixed(2)),
        cestas,
        tabacos_entregados: tabacos,
        recorte_kg: recorte,
        vena_kg: vena,
        subproductos_total_kg: Number(subproductos.toFixed(2)),
        pct_subproductos: pctSubprod,
        rendimiento_tab_por_kg: tabacosPorKg
      });
    }
  }

  console.log(`📊 Operarios procesados en el Día 2: ${registros.length}`);

  // 1. Detección no supervisada de anomalías de flujo (Entrega sin salida)
  const operariosRetencion = registros.filter(r => r.total_material_kg > 0 && r.tabacos_entregados === 0);
  const operariosCompletos = registros.filter(r => r.tabacos_entregados > 0);

  console.log(`\n🔍 Hallazgo 1 (Flujo de Producción):`);
  console.log(`   - Operarios con ciclo completo el mismo día: ${operariosCompletos.length}`);
  console.log(`   - Operarios con retención de materia prima (sin entrega de tabaco hoy): ${operariosRetencion.length}`);
  operariosRetencion.forEach(op => {
    console.log(`     ⚠️ ${op.nombre.padEnd(25)} -> Recibió ${op.total_material_kg} kg de hoja, 0 tabacos entregados hoy.`);
  });

  // 2. K-Means Clustering No Supervisado sobre operarios activos
  let centroides = [7.0, 13.0, 20.0];
  let clusters = [[], [], []];

  for (let iter = 0; iter < 25; iter++) {
    clusters = [[], [], []];
    operariosCompletos.forEach(p => {
      let mejorDist = Infinity, mejorIdx = 0;
      centroides.forEach((c, i) => {
        const d = Math.abs(p.pct_subproductos - c);
        if (d < mejorDist) { mejorDist = d; mejorIdx = i; }
      });
      clusters[mejorIdx].push(p);
    });

    centroides = clusters.map(cl => {
      if (cl.length === 0) return 0;
      const suma = cl.reduce((acc, p) => acc + p.pct_subproductos, 0);
      return Number((suma / cl.length).toFixed(2));
    });
  }

  console.log('\n========================================================================');
  console.log('🤖 RESULTADOS DEL CLUSTERING K-MEANS NO SUPERVISADO (3 PERFILES)');
  console.log('========================================================================');

  const nombresPerfiles = [
    'PERFIL ALTO RENDIMIENTO (Baja Merma)',
    'PERFIL ESTÁNDAR DE PLANTA (Merma Media)',
    'PERFIL EN ATENCIÓN (Alta Merma / Mayor Desperdicio de Hoja)'
  ];

  clusters.forEach((cl, idx) => {
    console.log(`\n📌 [GRUPO ${idx + 1}]: ${nombresPerfiles[idx]}`);
    console.log(`   Centroide Natural: ${centroides[idx]}% subproductos | Integrantes: ${cl.length}`);
    cl.forEach(p => {
      console.log(`   • ${p.nombre.padEnd(26)} | Mat: ${p.total_material_kg.toString().padStart(5)} kg | Tabacos: ${p.tabacos_entregados.toString().padStart(5)} | Subprod: ${p.pct_subproductos}% (Recorte: ${p.recorte_kg}k, Vena: ${p.vena_kg}k)`);
    });
  });

  // Exportar resultado a JSON en el directorio de scripts para persistencia
  const outputPath = path.join(__dirname, 'analisis_dia2_output.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    fecha_analisis: '2026-03-02',
    total_operarios: registros.length,
    anomalias_retencion: operariosRetencion,
    centroides,
    clusters
  }, null, 2), 'utf-8');

  console.log(`\n💾 Datos exportados correctamente a: scripts/analisis_dia2_output.json`);
}

procesarDia2();
