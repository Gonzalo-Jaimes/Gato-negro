const PDFDocument = require('pdfkit');

/**
 * Generador de PDF para el ERP Gato Negro
 * Centraliza el diseño y la creación de documentos de marca.
 */
class GatoNegroPDF {
    
    /**
     * Genera una factura de producción para un fabriquín (operario).
     * @param {Object} data - Objeto con datos del empleado, producción y deudas.
     * @returns {Promise<Buffer>} - Buffer del PDF generado.
     */
    static async generarFactura(data) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50, size: 'A4' });
                let buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => resolve(Buffer.concat(buffers)));

                // --- ENCABEZADO (LOGO Y TÍTULO) ---
                doc.rect(0, 0, doc.page.width, 100).fill('#111111');
                doc.fillColor('#FFFFFF')
                   .fontSize(24)
                   .font('Helvetica-Bold')
                   .text('GATO NEGRO ERP', 50, 35);
                
                doc.fontSize(10)
                   .font('Helvetica')
                   .text('CONTROL DE PRODUCCIÓN Y DEPÓSITO', 50, 65);

                doc.fontSize(10)
                   .text(`Fecha: ${data.fecha || new Date().toLocaleDateString()}`, 400, 45, { align: 'right' });
                doc.text(`Documento: #INV-${data.id || 'NUEVO'}`, 400, 60, { align: 'right' });

                // --- DATOS DEL EMPLEADO ---
                doc.fillColor('#000000').moveDown(4);
                doc.fontSize(16).font('Helvetica-Bold').text('DETALLES DEL FABRIQUÍN');
                doc.rect(50, 145, 500, 2).fill('#EEEEEE');
                
                doc.fillColor('#333333').fontSize(12).font('Helvetica').moveDown(0.5);
                doc.text(`Nombre: ${data.empleado_nombre || 'Desconocido'}`);
                doc.text(`Código: ${data.empleado_codigo || 'N/A'}`);
                doc.text(`Ubicación: Planta Principal / Ibagué`);

                // --- TABLA DE PRODUCCIÓN ---
                doc.moveDown(2);
                doc.fillColor('#111111').fontSize(14).font('Helvetica-Bold').text('RESUMEN DE PRODUCCIÓN SEMANAL');
                doc.moveDown(0.5);

                // Cabecera de tabla
                const tableTop = 270;
                doc.fontSize(10).font('Helvetica-Bold');
                doc.text('Día', 50, tableTop);
                doc.text('Cestas', 150, tableTop);
                doc.text('Tabacos', 250, tableTop);
                doc.text('Estado', 400, tableTop);
                doc.text('Subtotal', 500, tableTop, { width: 50, align: 'right' });

                doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke('#CCCCCC');

                // Filas de días
                let y = tableTop + 25;
                const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                const produccion = data.produccion || {};
                
                dias.forEach((dia, i) => {
                    const d = dia.toLowerCase().substring(0, 3);
                    const cant = produccion[`${d}_tabacos`] || 0;
                    const cest = produccion[`${d}_cestas`] || 0;
                    
                    doc.font('Helvetica').fontSize(10).fillColor('#444444');
                    doc.text(dia, 50, y);
                    doc.text(cest.toString(), 150, y);
                    doc.text(cant.toString(), 250, y);
                    doc.text('Entregado', 400, y);
                    doc.text(`$ ${(cant * 0).toFixed(0)}`, 500, y, { align: 'right' }); // Precio placeholder
                    
                    y += 20;
                });

                // Totales de Producción
                doc.moveTo(50, y).lineTo(550, y).stroke('#111111');
                y += 10;
                doc.font('Helvetica-Bold').fillColor('#111111');
                doc.text('TOTAL SEMANA:', 50, y);
                doc.text(data.total_tabacos || '0', 250, y);
                doc.fontSize(12).text(`$ ${data.total_ganado || '0'}`, 500, y, { align: 'right' });

                // --- SECCIÓN DE DEUDAS Y TABACADOS ---
                y += 60;
                doc.fontSize(14).font('Helvetica-Bold').text('ESTADO DE CUENTA (DEPÓSITO)');
                doc.moveDown(0.5);
                
                doc.rect(50, y + 5, 500, 80).fill('#F9F9F9');
                doc.fillColor('#333333').font('Helvetica').fontSize(11);
                
                const boxY = y + 20;
                doc.text('Tabacos pendientes de entrega:', 70, boxY);
                doc.font('Helvetica-Bold').text(data.deuda_tabacos || '0', 300, boxY);
                
                doc.font('Helvetica').text('Saldo en deudas financieras:', 70, boxY + 20);
                doc.font('Helvetica-Bold').text(`$ ${data.deuda_dinero || '0'}`, 300, boxY + 20);
                
                doc.font('Helvetica').text('Material en custodia:', 70, boxY + 40);
                doc.text('Capa / Capote / Picadura (Verificado)', 300, boxY + 40);

                // --- PIE DE PÁGINA ---
                const bottom = doc.page.height - 100;
                doc.fontSize(10).font('Helvetica-Oblique').fillColor('#999999')
                   .text('Este documento es un comprobante interno generado por Gato Negro ERP.', 50, bottom, { align: 'center' });
                
                doc.fontSize(8).font('Helvetica').text('Ibagué, Tolima - Colombia | Autogenerado', 50, bottom + 15, { align: 'center' });

                doc.end();
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Genera una ficha técnica para una máquina. (Esqueleto para expansión)
     */
    static async generarFichaMaquina(maquina) {
        // Implementación similar en el futuro
    }
}

module.exports = GatoNegroPDF;
