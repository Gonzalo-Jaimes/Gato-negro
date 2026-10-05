const { supabase } = require('./src/lib/shared.js');

async function checkData() {
    console.log("Checking empleados_anilladores...");
    const { data: eA, error: eAerr } = await supabase.from('empleados_anilladores').select('*');
    if (eAerr) console.error("Error eA:", eAerr.message);
    else console.log(eA);

    console.log("Checking empleados_envolvedoras...");
    const { data: eEnv, error: eEnverr } = await supabase.from('empleados_envolvedoras').select('*');
    if (eEnverr) console.error("Error eEnv:", eEnverr.message);
    else console.log(eEnv);

    console.log("Checking empleados_empacadores...");
    const { data: eEmp, error: eEmperr } = await supabase.from('empleados_empacadores').select('*');
    if (eEmperr) console.error("Error eEmp:", eEmperr.message);
    else console.log(eEmp);
}

checkData();
