-- v3.2_migration.sql
-- Ejecutar en el SQL Editor de Supabase
-- ==========================================

-- 1. Permisos para que podamos usar UUID (en caso de no tenerlo activo)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Crear tabla `tareas_anilladores`
CREATE TABLE IF NOT EXISTS public.tareas_anilladores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    anillador_id UUID,
    anillador_nombre TEXT NOT NULL,
    fabriquin_origen TEXT NOT NULL,
    cantidad_cestas NUMERIC NOT NULL,
    precio_cesta NUMERIC NOT NULL DEFAULT 11000.0,
    total_ganado NUMERIC NOT NULL,
    estado TEXT DEFAULT 'pendiente', -- 'pendiente' o 'validada'
    fecha_validacion TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.tareas_anilladores ENABLE ROW LEVEL SECURITY;

-- Política pública para insertar/ver tareas en el sistema
CREATE POLICY "Permitir todo a anon_tareas" ON public.tareas_anilladores
FOR ALL USING (true);
