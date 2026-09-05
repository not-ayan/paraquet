function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const str = value instanceof Date ? value.toISOString() : String(value);
  if (/["\n,]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function csvRow(values) {
  return values.map(csvEscape).join(',') + '\r\n';
}

module.exports = { csvEscape, csvRow };
