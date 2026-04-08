-- ===================================================================
-- 🔥 MIGRACIÓN GATO NEGRO - VERSIÓN 3.3 (BLACK CAT BOT) 🔥
-- ===================================================================
-- Instrucciones: Ejecuta este código en el SQL Editor de Supabase.

-- 1. ASEGURAR QUE LA TABLA DE MANTENIMIENTO TIENE SOPORTE PARA FOTOS
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mantenimiento' AND column_name='foto_url') THEN
        ALTER TABLE mantenimiento ADD COLUMN foto_url TEXT;
    END IF;
END $$;

-- 2. CREACIÓN DE LA TABLA DE HISTORIAL (Opcional, si queremos separar estados operativos)
-- Por ahora usaremos la tabla 'mantenimiento' existente pero con el campo de foto.

-- 3. BUCKET DE STORAGE (REQUERIDO):
-- IMPORTANTE: Debes crear manualmente un Bucket llamado 'evidencia-maquinaria' en la sección de Storage de Supabase.
-- Configúralo como PUBLIC para que el bot pueda generar URLs de previsualización.

-- 4. POLÍTICAS DE ACCESO (RLS) PARA EL STORAGE
-- Permite que service_role (el bot) suba y lea archivos.
-- (Esto se suele configurar por UI, pero lo dejo como referencia).
