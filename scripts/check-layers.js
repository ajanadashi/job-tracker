// Fails (exit 1) if the 4-layer rules are broken:
//   api -> services -> data -> models, each layer only calls the one below it
//   SQL only in data, `pg` only in data, `express` only in api, `resend` only in services
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const ALLOWED = { api: ['services', 'models'], services: ['data', 'models'], data: ['models'], models: [], worker: ['services'] };
const PKG_OWNER = { pg: ['data'], express: ['api'], resend: ['services'] };
const SQL = /\b(SELECT\s[\s\S]{0,300}?\sFROM\s|INSERT\s+INTO\s|UPDATE\s+\w+\s+SET\s|DELETE\s+FROM\s)/;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.js') ? [path.join(dir, e.name)] : []
  );
}

const violations = [];
for (const file of walk(SRC)) {
  const rel = path.relative(SRC, file);
  const layer = rel.split(path.sep)[0];
  if (!ALLOWED[layer]) continue; // entry points (app.js, server.js, config.js)
  const code = fs.readFileSync(file, 'utf8');

  if (layer !== 'data' && SQL.test(code)) violations.push(`${rel}: SQL outside the data layer`);

  for (const [, spec] of code.matchAll(/require\((['"])([^'"]+)\1\)/g)) {
    if (spec.startsWith('.')) {
      const target = path.relative(SRC, path.resolve(path.dirname(file), spec)).split(path.sep)[0];
      if (ALLOWED[target] && target !== layer && !ALLOWED[layer].includes(target)) {
        violations.push(`${rel}: ${layer} must not call ${target} (${spec})`);
      }
    } else {
      const pkg = spec.split('/')[0];
      if (PKG_OWNER[pkg] && !PKG_OWNER[pkg].includes(layer)) violations.push(`${rel}: '${pkg}' is not allowed in the ${layer} layer`);
    }
  }
}

if (violations.length) {
  console.error('Layer violations:\n - ' + violations.join('\n - '));
  process.exit(1);
}
console.log('Layer check passed: api -> services -> data -> models');
