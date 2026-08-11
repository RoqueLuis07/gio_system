function xmlEscape(v) {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function celda(valor) {
  if (typeof valor === 'number') {
    return `<Cell><Data ss:Type="Number">${valor}</Data></Cell>`;
  }
  return `<Cell><Data ss:Type="String">${xmlEscape(valor)}</Data></Cell>`;
}

function columnasXml(anchos) {
  if (!anchos) return '';
  return anchos.map((w) => `<Column ss:Width="${w}"/>`).join('');
}

function hojaXml({ nombre, headers, filas, anchos }) {
  const filaHeaders = `<Row ss:StyleID="header">${headers.map((h) => celda(h)).join('')}</Row>`;
  const filasDatos = filas.map((fila) => `<Row>${fila.map((c) => celda(c)).join('')}</Row>`).join('');

  return `<Worksheet ss:Name="${xmlEscape(nombre)}">
    <Table>${columnasXml(anchos)}${filaHeaders}${filasDatos}</Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
      <FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal><TopRowBottomPane>1</TopRowBottomPane>
    </WorksheetOptions>
  </Worksheet>`;
}

// Genera un Excel (formato SpreadsheetML .xls) con una o más hojas, encabezado en
// negrita y columnas con ancho fijo — sin depender de ninguna librería externa.
export function descargarExcel(nombre, hojas) {
  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles>
  <Style ss:ID="header">
    <Font ss:Bold="1" ss:Color="#FFFFFF"/>
    <Interior ss:Color="#1F2A44" ss:Pattern="Solid"/>
    <Alignment ss:Vertical="Center"/>
  </Style>
</Styles>
${hojas.map(hojaXml).join('\n')}
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}
