import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://nfgzyqpznacqbqklgpsw.supabase.co', 'sb_publishable_WE0BxJ9xD12ayXibLBYLlg_DfLc3W0i');
const { data, error } = await supabase.from('skills').select('id, name, skill_progress(counter)').limit(3);
console.log('DATA:', JSON.stringify(data, null, 2));
if (error) console.log('ERROR:', error);
