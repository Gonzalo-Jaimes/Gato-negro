-- ==========================================================
-- GATO NEGRO - SCRIPT DE MIGRACIÓN V3.1.0 (PRE-DEPLOY)
-- Ejecutar en el SQL Editor de Supabase
-- ==========================================================

-- 1. Crear la Tabla de Auditoría (Trazabilidad Absoluta)
CREATE TABLE IF NOT EXISTS public.auditoria_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT timezone('america/bogota', now()),
    usuario TEXT NOT NULL, -- Ej: 'SISTEMA', 'ADMIN', o codigo
    modulo TEXT NOT NULL,  -- Ej: 'DESPACHO', 'NOMINA', 'BODEGA'
    accion TEXT NOT NULL,  -- Descripción clara del evento
    detalles JSONB,        -- Para guardar objetos de contexto opcionales
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS si aplica (por seguridad)
ALTER TABLE public.auditoria_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir insertar" ON public.auditoria_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir leer" ON public.auditoria_logs FOR SELECT USING (true); -- o restringir solo admin

-- ==========================================================
-- 2. Funciones RPC (Migración del lado Cliente al Servidor)
-- ==========================================================

-- NOTA: Dado que la aplicación maneja alta integración cruzada (Inventarios, Deudas, Nomina), 
-- mantendremos el flujo crítico usando las transacciones nativas desde Node.js en `/facturar_recepcion`
-- y `/entregar_sacos` en lugar de portear todo a PL/pgSQL, lo cual dividiría la lógica y haría el mantenimiento muy difícil.
-- La mejora radicará en hacer un 'Promise.all' robusto en Node.js que insertará de forma atomizada.
