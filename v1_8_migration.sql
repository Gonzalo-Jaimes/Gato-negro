-- ===================================================================
-- 🔥 MIGRACIÓN GATO NEGRO - VERSIÓN 1.8 🔥
-- ===================================================================
-- Instrucciones: Copia y pega todo este código en el SQL Editor de Supabase y dale a "Run".

-- 1. CREACIÓN DE LA TABLA DE EMPLEADOS (Reemplaza a los usuarios de fabriquin)
CREATE TABLE IF NOT EXISTS empleados_fabriquines (
    id SERIAL PRIMARY KEY,
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    cedula TEXT,
    deuda_tabacos INTEGER DEFAULT 0, -- Rastreará el "saldo anterior"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. CREACIÓN DE LA PLANILLA DE RECEPCIÓN SEMANAL (El día a día rotativo)
CREATE TABLE IF NOT EXISTS recepcion_diaria (
    id SERIAL PRIMARY KEY,
    empleado_id INTEGER REFERENCES empleados_fabriquines(id) ON DELETE CASCADE,
    semana_inicio DATE NOT NULL,
    
    -- Control diario de entregas
    lun_cestas INTEGER DEFAULT 0, lun_tabacos INTEGER DEFAULT 0,
    mar_cestas INTEGER DEFAULT 0, mar_tabacos INTEGER DEFAULT 0,
    mie_cestas INTEGER DEFAULT 0, mie_tabacos INTEGER DEFAULT 0,
    jue_cestas INTEGER DEFAULT 0, jue_tabacos INTEGER DEFAULT 0,
    vie_cestas INTEGER DEFAULT 0, vie_tabacos INTEGER DEFAULT 0,
    sab_cestas INTEGER DEFAULT 0, sab_tabacos INTEGER DEFAULT 0,
    
    -- Los pesos extra del sábado o la semana
    recorte_kg NUMERIC DEFAULT 0,
    vena_kg NUMERIC DEFAULT 0,
    extra_tabacos INTEGER DEFAULT 0,
    
    -- Estado de la hoja
    estado TEXT DEFAULT 'pendiente', -- Al liquidar los sabados pasa a 'liquidado'
    total_ganado NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. MIGRAR LOS EMPLEADOS DEL EXCEL DIRECTAMENTE A LA BASE DE DATOS
INSERT INTO empleados_fabriquines (codigo, nombre, cedula) VALUES 
('F01', 'ALCIDES CORREA', 'CC-88.193.514'),
('F03', 'BLANCA ALVARADO', 'CC-60.402.510'),
('F06', 'ELVIRA LOPEZ', 'V-29.664.726'),
('F07', 'ERNESTO REYES', 'CC-5.535.335'),
('F08', 'GUILLERMO ZAMBRANO', 'V-5.642.663'),
('F09', 'HUGO ALMEIDA', 'V-8.998.550'),
('F10', 'HILDA SERRANO', 'CC-60.413.802'),
('F11', 'JOSE EBLAN GIRON', 'V-9.130.173'),
('F12', 'JOSE JURADO', 'V-8986394'),
('F13', 'LUZ MERY ABAUNZA', 'CC-60.407.054'),
('F15', 'LUIS ROJAS', 'CC-79.336.610'),
('F16', 'LUIS VALDERRAMA', 'V-23.095.033'),
('F17', 'LILIANA VEGA', 'V-11.021.605'),
('F22', 'SULAY ALMEIDA', 'V-11.021.593')
ON CONFLICT (codigo) DO NOTHING;
