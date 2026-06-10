/**
 * Perbaikan untuk static export Next 16:
 *
 * Saat prefetch/navigasi client-side, Next meminta payload segment dengan
 * nama file DATAR, mis. `/transactions/__next.transactions.__PAGE__.txt`.
 * Namun `next build` (output: "export") menulisnya sebagai FOLDER:
 * `out/transactions/__next.transactions/__PAGE__.txt` — sehingga setiap
 * prefetch berakhir 404 dan navigasi jatuh ke full page load.
 *
 * Script ini membuat salinan datar (pemisah folder → ".") untuk setiap file
 * di dalam folder `__next.*` agar URL yang diminta client benar-benar ada.
 * Dijalankan otomatis lewat npm "postbuild".
 */
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "out");
let copied = 0;

function flatten(dir, prefix, targetDir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      flatten(full, `${prefix}.${entry.name}`, targetDir);
    } else {
      fs.copyFileSync(full, path.join(targetDir, `${prefix}.${entry.name}`));
      copied++;
    }
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    if (entry.name.startsWith("__next.")) {
      flatten(full, entry.name, dir);
    } else {
      walk(full);
    }
  }
}

if (!fs.existsSync(OUT)) {
  console.error("flatten-rsc-export: folder out/ tidak ditemukan — jalankan setelah next build");
  process.exit(1);
}

walk(OUT);
console.log(`flatten-rsc-export: ${copied} file payload segment disalin ke bentuk datar`);
