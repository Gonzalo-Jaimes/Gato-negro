// Cálculo único de la liquidación semanal de un fabriquín.
// Lo usan: la liquidación (/liquidar_semana), el comprobante (/imprimir_nomina_v18) y la lista de Nómina,
// para que el monto que se guarda, el que se imprime y el que se paga sean el mismo.

const VALOR_TABACO = 85;
const VALOR_RECORTE = 6500;
const VALOR_VENA = 3500;
const VALOR_EXTRA = 230;
const DIAS = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
const TABACOS_POR_CESTA = 1250;

const sumaDias = (reg, sufijo) => DIAS.reduce((s, d) => s + (parseInt(reg[`${d}_${sufijo}`]) || 0), 0);

async function calcularLiquidacion(supabase, reg) {
    const total_tabacos = sumaDias(reg, 'tabacos');
    const total_cestas = sumaDias(reg, 'cestas');
    const recorte = parseFloat(reg.recorte_kg) || 0;
    const vena = parseFloat(reg.vena_kg) || 0;
    const extras = parseInt(reg.extra_tabacos) || 0;

    const pago_tabacos = total_tabacos * VALOR_TABACO;
    const pago_recorte = recorte * VALOR_RECORTE;
    const pago_vena = vena * VALOR_VENA;
    const pago_extras = extras * VALOR_EXTRA;
    const total_bruto = pago_tabacos + pago_recorte + pago_vena + pago_extras;

    // Descuentos: abonos a préstamo y descuentos de sueldo registrados desde el inicio de la semana
    let descuentos = 0;
    const desglose_descuentos = [];
    try {
        const { data: abonos } = await supabase.from('abonos_prestamo')
            .select('monto_abono, tipo, nota, fecha_abono')
            .eq('empleado_id', reg.empleado_id).gte('fecha_abono', reg.semana_inicio);
        (abonos || []).forEach(a => {
            const monto = parseFloat(a.monto_abono || 0);
            const tipo = a.tipo || 'abono';
            if (monto > 0 && (tipo === 'abono' || tipo === 'descuento_sueldo')) {
                descuentos += monto;
                desglose_descuentos.push({ tipo, monto, nota: a.nota, fecha: a.fecha_abono });
            }
        });
    } catch (e) { /* sin descuentos si la consulta falla: el comprobante muestra el bruto */ }

    return {
        total_tabacos, total_cestas,
        pago_tabacos, pago_recorte, pago_vena, pago_extras,
        total_bruto, descuentos, desglose_descuentos,
        total_neto: Math.max(0, total_bruto - descuentos),
        valor_tabaco: VALOR_TABACO, valor_recorte: VALOR_RECORTE, valor_vena: VALOR_VENA, valor_extra: VALOR_EXTRA
    };
}

// Cestas que el fabriquín aún debe devolver.
// Prestadas = cestas de los despachos entregados más recientes que componen su deuda de tabacos vigente
// (la deuda solo baja al liquidar, así que equivale a los despachos posteriores a la última liquidación).
// Faltantes = prestadas − las que ya devolvió en la hoja abierta.
async function cestasPrestadasPorEmpleado(supabase, empleados) {
    const mapa = {};
    const conDeuda = (empleados || []).filter(e => (parseInt(e.deuda_tabacos) || 0) > 0);
    if (conDeuda.length === 0) return mapa;
    const { data: despachos } = await supabase.from('despachos_registro')
        .select('id, empleado_id, meta_tabacos, cestas_cant, color_cesta')
        .eq('estado', 'entregado').in('empleado_id', conDeuda.map(e => e.id))
        .order('id', { ascending: false });
    conDeuda.forEach(emp => {
        let restante = parseInt(emp.deuda_tabacos) || 0;
        let prestadas = 0, color = null;
        for (const d of (despachos || []).filter(x => x.empleado_id === emp.id)) {
            if (restante <= 0) break;
            const meta = parseInt(d.meta_tabacos) || 0;
            if (meta <= 0) continue;
            const tomado = Math.min(meta, restante);
            const cestas = parseInt(d.cestas_cant) || Math.ceil(meta / TABACOS_POR_CESTA);
            prestadas += tomado >= meta ? cestas : Math.ceil(cestas * tomado / meta);
            if (!color) color = d.color_cesta || null;
            restante -= tomado;
        }
        // Deuda sin despachos registrados (datos anteriores al sistema): 1 cesta por cada 1.250 tabacos
        if (restante > 0) prestadas += Math.ceil(restante / TABACOS_POR_CESTA);
        mapa[emp.id] = { prestadas, color };
    });
    return mapa;
}

module.exports = { calcularLiquidacion, cestasPrestadasPorEmpleado, VALOR_TABACO, VALOR_RECORTE, VALOR_VENA, VALOR_EXTRA, TABACOS_POR_CESTA };
