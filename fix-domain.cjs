const fs = require('fs');
const path = require('path');

// 1. lunaticsgroup.co.kr → lunaticsgroup.com 교체 (UTF-8 보존)
function replaceInDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      replaceInDir(full);
    } else if (/\.(ts|tsx|json|html|txt|xml)$/.test(entry.name)) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('lunaticsgroup.co.kr')) {
        const fixed = content.replaceAll('lunaticsgroup.co.kr', 'lunaticsgroup.com');
        fs.writeFileSync(full, fixed, 'utf8');
        console.log(`✅ ${full.replace(process.cwd(), '')}`);
      }
    }
  }
}

replaceInDir(path.join(__dirname, 'src'));
replaceInDir(path.join(__dirname, 'public'));
console.log('\n🎉 lunaticsgroup.co.kr → lunaticsgroup.com 완료 (UTF-8 보존)');
