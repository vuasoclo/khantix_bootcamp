"use strict";
// Generic CSV parser — converts a CSV string into an array of typed objects.
// Assumes the first row is the header row.
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCsv = parseCsv;
function parseCsv(raw, transform) {
    const lines = raw.trim().split('\n');
    if (lines.length < 2)
        return [];
    const headers = lines[0].split(',').map((h) => h.trim());
    return lines.slice(1)
        .filter((line) => line.trim().length > 0)
        .map((line) => {
        // Handle quoted fields (e.g. "['kw1', 'kw2']")
        const values = [];
        let current = '';
        let inQuotes = false;
        for (const char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
                continue;
            }
            if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
                continue;
            }
            current += char;
        }
        values.push(current.trim());
        const row = {};
        headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
        return transform ? transform(row) : row;
    });
}
