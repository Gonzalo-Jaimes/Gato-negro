const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://jgvnqumkzfwruhjglics.supabase.co';
const supabaseKey = 'sb_publishable_XXDhaCrrjj_DVUdxh04wFg_9dwm1_jQ';
const supabase = createClient(supabaseUrl, supabaseKey);

const raw_text = `F01 ALCIDES CORREA CC-88.193.514
F03 BLANCA ALVARADO CC-60.402.510
F06 ELVIRA LOPEZ V-29.664.726
F07 ERNESTO REYES CC-5.535.335
F08 GUILLERMO ZAMBRANO V-5.642.663
F09 HUGO ALMEIDA V-8.998.550
F10 ILDA SERRANO CC-60.413.802
F11 JOSE EBLAN GIRON V-9.130.173
F12 JOSE JURADO V-8986394
F13 LUZ MERY ABAUNZA CC-60.407.054
F15 LUIS ROJAS CC-79.336.610
F16 LUIS VALDERRAMA V-23.095.033
F17 LILIANA VEGA V-11.021.605
F22 SULAY ALMEIDA V-11.021.593
F23 RUBIELA MARTINEZ V-60.412.324
F24 ROSMIRA DURAN CC-37.543.611
F25 ROSMIRA REY V-23.165.190
F26 ROSALBA MATAGIRA CC-37.221.293
F27 ROSA CORREA V-15.856.304
F28 LUZ ESTELA REYES SILVA V-11.021.592
F29 TERESA REYES V-27.893.136
F30 SAMUEL BERMUDEZ V
F31 YARIRE ROA V-14.975.665
F33 YOLI BECERRA V-11.017.442
F34 GLORIA RODRIGUEZ V-29.515.312
F35 LUIS ERNESTO ALMEIDA MANTILLA V-13.365.579
F36 RENE HAMILTON GOMEZ ALMEIDA V-21.033.815
F37 MAYERLIN BOLIVAR CAMARGO V-15.774.803
F40 RAMON PARRA V-5.327.891
F43 ELIZABET REYES V-15.956.387
F46 KARINA RINCON SILVA V-17.465.799
F47 HUMBERTO LUNA V-25.344.223
F48 MARIA MEDINA V-22.680.548
F49 PEDRO ALCIRA V-25.955.714
F50 ESPERANZA REY V-22.633.248
F44 MARIA ELENA CORREA CC-84.395.969
F51 RAUL REYES V-11.718.244
F52 LEYDI SERRANO V-15.958.666
F53 PETTER BENAVIDES V-8.991.028
F54 YENDER PADILLA CC-1.092.340.667
F57 ALBA SANABRIA V-20.427.079
F58 SANDRA MILENA MORENO V-18.355.048
F59 SANDRA MILENA ANTOLINES CC 1.102.348.573
F60 MARIELA MARTINEZ E-84.563.031
F61 MANUEL CONTRARAS V-26.156.239
F62 YEFERSON CONTRTERAS V-27.920.999
F63 DAYNER STEVEN ROBLES ANTOLINEZ CC -1.102.349.158
F64 JHONNY ALEXIS ALZATE NIÑO CC-1.149.459.338`;

const lines = raw_text.split('\n');
const records = [];

lines.forEach(line => {
    let parts = line.trim().replace(/\s+/g, ' ').split(' ');
    if(parts.length >= 2) {
        let codigo = parts.shift();
        
        // Parsing de Cédula a lo bruto
        let cedula = "";
        let lastItem = parts[parts.length - 1];
        let secondToLast = parts.length > 1 ? parts[parts.length - 2] : "";
        
        if (lastItem.match(/^[A-Z\-0-9.]+$/i) && (lastItem.includes("-") || lastItem.match(/[0-9]/) || lastItem === 'V')) {
            if (secondToLast === 'CC') {
                cedula = parts.pop();
                cedula = parts.pop() + "-" + cedula;
            } else {
                cedula = parts.pop();
            }
        }
        
        let nombre = parts.join(' ');
        
        records.push({ codigo: codigo, nombre: nombre, cedula: cedula || "S/N", deuda_tabacos: 0 });
    }
});

async function poblar() {
    let cant = 0;
    for (let r of records) {
        const { data: exist } = await supabase.from('empleados_fabriquines').select('*').eq('codigo', r.codigo).single();
        if (!exist) {
            cant++;
            await supabase.from('empleados_fabriquines').insert([r]);
        }
    }
    console.log("¡Se insertaron " + cant + " nuevos fabriquines exitosamente en Supabase!");
}
poblar();
