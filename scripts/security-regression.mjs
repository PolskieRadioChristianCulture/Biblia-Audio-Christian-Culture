import assert from 'node:assert/strict';
import fs from 'node:fs';

const server = fs.readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
const publish = fs.readFileSync(new URL('../src/components/Step8ExportPublish.tsx', import.meta.url), 'utf8');

assert.equal(server.includes('execSync('), false, 'Nie wolno uruchamiać FFmpeg przez składane polecenie powłoki.');
assert.equal(server.includes("execFileSync(binary, args"), true, 'FFmpeg musi otrzymywać osobne argumenty.');
assert.equal(server.includes('SCRIPTURE_INTEGRITY_MISMATCH'), true, 'Brakuje Strażnika Słowa.');
assert.equal(publish.includes('mockId'), false, 'Panel YouTube nie może generować fikcyjnego identyfikatora.');
assert.equal(publish.includes('Autoryzacja YouTube Studio aktywna'), false, 'Panel nie może deklarować nieistniejącej autoryzacji.');

console.log('Security regression checks passed.');
