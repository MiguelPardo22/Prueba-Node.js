const fs = require('fs');
const pdfParse = require('pdf-parse');
const multer = require('multer');    
const { createObjectCsvWriter } = require('csv-writer');

//Configurar multer para guardar los archivos
const upload = multer({dest: 'Uploads/'});

exports.upload = upload;

async function extractPdfInfo(pdfBuffer) {
    try {
        const data = await pdfParse(pdfBuffer);

        //Extraer la fecha de fijación
        const dateMatch = data.text.match(/Fecha de Fijación:\s*(\d{2}\/\d{2}\/\d{4})/);
        const fijacionDate = dateMatch ? dateMatch[1] : null;

        //Número de páginas
        const totalPages = data.numpages;

        // Conteo de las filas de la tabla
        const tableRows = extractTableRows(data.text);

        return {
            fijacionDate,
            totalPages,
            tableRows
        };
    } catch (error) {
        throw new Error("Error al procesar el archivo PDF");
    }
}

// Función para extraer el número de filas de la tabla
function extractTableRows(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);

    const tableRows = [];
    const columnPattern = /^\d{11,12}-\d{4,8}/;

    lines.forEach(line => {
        if (columnPattern.test(line)) {
            const columns = line.split(/\s{2,}/);
            const [noProceso, claseProceso, demandante, demandado, descripcionActuacion, fechaAuto, cuadro] = columns;

            // Insertar cada fila en el arreglo de objetos
            tableRows.push({
                noProceso: noProceso || '',
                claseProceso: claseProceso || '',
                demandante: demandante || '',
                demandado: demandado || '',
                descripcionActuacion: descripcionActuacion || '',
                fechaAuto: fechaAuto || '',
                cuadro: cuadro || '',
            });
        }
    });

    return tableRows;
}

//Metodo para obtener la informacion del pdf
exports.information = async (request, response) => {
    try {
        if (!request.file) {
            return sendResponse(response, false, null, "No se ha subido ningún archivo", 400);
        }

        const pdfBuffer = fs.readFileSync(request.file.path);

        // Usar la funcion extractPdfInfo
        const fijacionDate = (await extractPdfInfo(pdfBuffer)).fijacionDate;
        const totalPages = (await extractPdfInfo(pdfBuffer)).totalPages;
        const tableLength = (await extractPdfInfo(pdfBuffer)).tableRows.length;

        const data = {
            fijacionDate: fijacionDate,
            totalPages: totalPages,
            tableLength: tableLength
        };

        // Eliminar el archivo despues de procesarlo
        fs.unlinkSync(request.file.path);

        sendResponse(response, true, data, "Información extraída correctamente", 200);
    } catch (error) {
        console.error(error);
        sendResponse(response, false, null, "Error al procesar el PDF", 500);
    }
};

exports.generateCsv = async (request, response) => {
    try {
        if (!request.file) {
            return sendResponse(response, false, null, "No se ha subido ningún archivo", 400);
        }

        const pdfBuffer = fs.readFileSync(request.file.path);

        // Extraer texto del PDF
        const data = await pdfParse(pdfBuffer);
        const rows = extractTableRows(data.text);

        const headers = Object.keys(rows[0]).map(header => ({ id: header, title: header }));
        const csvWriter = createObjectCsvWriter({
            path: 'uploads/output.csv',
            header: headers,
        });

        // Escribir los datos en el CSV
        await csvWriter.writeRecords(rows);

        fs.unlinkSync(request.file.path);

        sendResponse(response, true, { csvPath: 'uploads/output.csv' }, "CSV generado correctamente", 200);
    } catch (error) {
        console.error(error);
        sendResponse(response, false, null, "Error al procesar el PDF", 500);
    }
};

function sendResponse(response, success, data, message, code) {
    response.status(code).json({
    success: success,
        data: data,
        message: message,
        code: code
    })
}