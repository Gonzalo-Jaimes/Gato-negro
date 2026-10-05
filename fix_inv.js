const { supabase } = require('./src/lib/shared.js');

async function fixInventory() {
    console.log("Fixing negative inventory...");
    
    const { data: inv } = await supabase.from('inventario').select('*');
    for (const item of inv) {
        if (item.cantidad < 0) {
            console.log(`Resetting ${item.material} from ${item.cantidad} to 0`);
            await supabase.from('inventario').update({ cantidad: 0 }).eq('id', item.id);
        }
    }
    
    // Also delete any "floating" recepcion_diaria_anilladores that are empty?
    // Let's just fix the inventory first.
    console.log("Done.");
}
fixInventory();
