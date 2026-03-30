const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://jgvnqumkzfwruhjglics.supabase.co', 'sb_publishable_XXDhaCrrjj_DVUdxh04wFg_9dwm1_jQ');
s.from('recepcion_diaria').select('id, estado').then(r => console.log(JSON.stringify(r.data, null, 2)));
