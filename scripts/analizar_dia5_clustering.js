/**
 * Script de Ingesta y Análisis No Supervisado:
 * DÍA 5 / CIERRE DE CICLO SEMANAL (Costeo Unitario Real y Dispersión Financiera)
 * Archivo fuente: documentacion/MOVIMIENTO FABRIQUINES MARZO 2026.xlsx
 * 
 * Evalúa:
 * 1. Cruce no supervisado de producción física vs masa salarial liquidada.
 * 2. Segmentación K-Means del Costo Efectivo por Tabaco (COP/unidad).
 * 3. Identificación de sobrecostos por bonos de subproducto, compras y deducciones.
 */

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const EXCEL_PATH = path.join(__dirname, '..', 'documentacion', 'MOVIMIENTO FABRIQUINES MARZO   2026.xlsx');

function procesarDia5() {
  console.log('========================================================================');
  console.log('🔬 ANÁLISIS NO SUPERVISADO - DÍA 5 / EFICIENCIA ECONÓMICA Y COSTO UNITARIO');
  console.log('========================================================================\n');

  if (!fs.existsSync(EXCEL_PATH)) {
    console.error('Error: No se encontró el archivo', EXCEL_PATH);
    return;
  }

  const wb = xlsx.readFile(EXCEL_PATH, { sheetRows: 60 });
  const sheet = wb.Sheets['SEMANA DEL 2 AL 7-3-26'];
  const raw = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  const registros = [];

  for (let r = 4; r < raw.length; r++) {
    const row = raw[r];
    if (!row || !row[0]) continue;
    const nombre = String(row[0]).trim();
    if (nombre.includes('TOTAL') || nombre.includes('MUESTRAS')) continue;

    const tabacos = Number(row[65]) || 0;
    const pagoTabacos = Number(row[86]) || 0;
    const totalLiquidadoPesos = Number(row[107]) || 0;
    const bonoBs = Number(row[103]) || 0;
    const comprasPesos = Number(row[99]) || 0;

    if (tabacos > 0 && totalLiquidadoPesos > 0) {
      const costoUnitarioEfectivo = Number((totalLiquidadoPesos / tabacos).toFixed(2));
      const tarifaBaseUnitario = Number((pagoTabacos / tabacos).toFixed(2));
      const sobrecostoPesos = Number((totalLiquidadoPesos - pagoTabacos).toFixed(2));

      registros.push({
        nombre,
        tabacos_producidos: tabacos,
        pago_base_pesos: pagoTabacos,
        total_liquidado_pesos: totalLiquidadoPesos,
        sobrecosto_adicional_pesos: sobrecostoPesos,
        tarifa_base_unidad: tarifaBaseUnitario,
        costo_efectivo_unidad: costoUnitarioEfectivo,
        bono_subproductos_bs: bonoBs,
        compras: comprasPesos
      });
    }
  }

  registros.sort((a,b) => b.total_liquidado_pesos - a.total_liquidado_pesos);
  const totalTabacos = registros.reduce((a, b) => a + b.tabacos_producidos, 0);
  const totalMasaSalarial = registros.reduce((a, b) => a + b.total_liquidado_pesos, 0);
  const costoMedioPlanta = Number((totalMasaSalarial / totalTabacos).toFixed(2));

  console.log(`📊 Operarios liquidados en el ciclo: ${registros.length}`);
  console.log(`🚬 Volumen total producido: ${totalTabacos.toLocaleString()} tabacos`);
  console.log(`💰 Masa salarial liquidada: $${totalMasaSalarial.toLocaleString('es-CO')} COP`);
  console.log(`📈 Costo medio ponderado de planta: $${costoMedioPlanta} COP / tabaco`);

  // Clustering No Supervisado K-Means por Costo Unitario Efectivo
  let centroides = [78.0, 95.0, 120.0];
  let clusters = [[], [], []];

  for (let iter = 0; iter < 25; iter++) {
    clusters = [[], [], []];
    registros.forEach(p => {
      let mejorDist = Infinity, mejorIdx = 0;
      centroides.forEach((c, i) => {
        const d = Math.abs(p.costo_efectivo_unidad - c);
        if (d < mejorDist) { mejorDist = d; mejorIdx = i; }
      });
      clusters[mejorIdx].push(p);
    });

    centroides = clusters.map(cl => {
      if (cl.length === 0) return 0;
      const suma = cl.reduce((acc, p) => acc + p.costo_efectivo_unidad, 0);
      return Number((suma / cl.length).toFixed(2));
    });
  }

  const nombresClusters = [
    'TARIFA ESTÁNDAR ÓPTIMA (~$80 COP/tabaco)',
    'COSTO MEDIO ALTO CON BONIFICACIONES (~$96 COP/tabaco)',
    'DESVIACIÓN DE COSTO CRÍTICA (~$120 COP/tabaco)'
  ];

  console.log('\n========================================================================');
  console.log('🤖 CLUSTERING NO SUPERVISADO DE COSTO UNITARIO REAL');
  console.log('========================================================================');

  clusters.forEach((cl, idx) => {
    console.log(`\n📌 [GRUPO ${idx + 1}]: ${nombresClusters[idx]} (Centroide: $${centroides[idx]} COP | ${cl.length} operarios)`);
    cl.forEach(p => {
      console.log(`   • ${p.nombre.padEnd(26)} | Tab: ${p.tabacos_producidos.toString().padStart(5)} | Total: $${p.total_liquidado_pesos.toLocaleString().padStart(9)} | Costo: $${p.costo_efectivo_unidad}/u`);
    });
  });

  // Exportar dataset JSON
  const outPath = path.join(__dirname, 'analisis_dia5_output.json');
  fs.writeFileSync(outPath, JSON.stringify({
    fecha_analisis: new Date().toISOString(),
    total_operarios_liquidados: registros.length,
    volumen_total_tabacos: totalTabacos,
    masa_salarial_total_cop: totalMasaSalarial,
    costo_medio_ponderado_cop: costoMedioPlanta,
    centroides,
    clusters
  }, null, 2), 'utf-8');

  console.log('\n💾 Dataset exportado a: scripts/analisis_dia5_output.json');
}

procesarDia5();
