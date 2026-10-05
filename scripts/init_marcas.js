const { supabase } = require('../src/lib/shared');

async function init() {
    const items = [
        { material: 'Anillos (Gato)', categoria: 'Materia Prima', cantidad: 500, unidad_medida: 'Paquetes', stock_minimo: 50 },
        { material: 'Anillos (Intabaca)', categoria: 'Materia Prima', cantidad: 500, unidad_medida: 'Paquetes', stock_minimo: 50 },
        { material: 'Tabacos Anillados (Gato)', categoria: 'Producto en Proceso', cantidad: 0, unidad_medida: 'Unidades', stock_minimo: 1000 },
        { material: 'Tabacos Anillados (Intabaca)', categoria: 'Producto en Proceso', cantidad: 0, unidad_medida: 'Unidades', stock_minimo: 1000 },
        { material: 'Tabacos Envueltos (Gato)', categoria: 'Producto en Proceso', cantidad: 0, unidad_medida: 'Unidades', stock_minimo: 1000 },
        { material: 'Tabacos Envueltos (Intabaca)', categoria: 'Producto en Proceso', cantidad: 0, unidad_medida: 'Unidades', stock_minimo: 1000 },
        { material: 'Bultos de 25 (Gato)', categoria: 'Producto Terminado', cantidad: 0, unidad_medida: 'Bultos', stock_minimo: 5 },
        { material: 'Bultos de 25 (Intabaca)', categoria: 'Producto Terminado', cantidad: 0, unidad_medida: 'Bultos', stock_minimo: 5 },
        { material: 'Bultos de 50 (Gato)', categoria: 'Producto Terminado', cantidad: 0, unidad_medida: 'Bultos', stock_minimo: 5 },
        { material: 'Bultos de 50 (Intabaca)', categoria: 'Producto Terminado', cantidad: 0, unidad_medida: 'Bultos', stock_minimo: 5 }
    ];

    for (const item of items) {
        // Verificar si existe
        const { data } = await supabase.from('inventario').select('*').eq('material', item.material).single();
        if (!data) {
            console.log(`Creando ${item.material}...`);
            await supabase.from('inventario').insert([item]);
        } else {
            console.log(`${item.material} ya existe.`);
        }
    }
    console.log('Finalizado.');
}

init();
