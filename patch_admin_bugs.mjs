import fs from 'fs';

// 1. Update AdminDashboard.tsx
let dashboard = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');
dashboard = dashboard.replace(
  /setRecentUsers\(users\.slice\(/,
  'setRecentUsers((users || []).slice('
);
dashboard = dashboard.replace(
  /setRecentReports\(reports\.filter\(/,
  'setRecentReports((reports || []).filter('
);
dashboard = dashboard.replace(
  /setAnnouncements\(anns\);/,
  'setAnnouncements(anns || []);'
);
dashboard = dashboard.replace(
  /const validAds = \(ads as any\[\]\)\.filter\(/g,
  'const validAds = ((ads || []) as any[]).filter('
); // just in case it exists here, though actually fetchAds is in adService.ts

fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', dashboard, 'utf8');

// 2. Update AdminUsers.tsx
let adminUsers = fs.readFileSync('src/pages/admin/AdminUsers.tsx', 'utf8');
adminUsers = adminUsers.replace(
  /setUsers\(dbUsers\);/,
  'setUsers(dbUsers || []);'
);
fs.writeFileSync('src/pages/admin/AdminUsers.tsx', adminUsers, 'utf8');

// 3. Update vite.config.ts to drop console
let vite = fs.readFileSync('vite.config.ts', 'utf8');
if (!vite.includes('esbuild: {')) {
  vite = vite.replace(
    /server: \{/,
    'esbuild: {\n    drop: ["console", "debugger"],\n  },\n  server: {'
  );
  fs.writeFileSync('vite.config.ts', vite, 'utf8');
}

console.log('Admin fallbacks patched and console dropped in vite config.');
