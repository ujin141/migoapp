const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const write = (file, contents) => fs.writeFileSync(path.join(root, file), contents);

const bumpPatch = (version) => {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) {
    throw new Error(`Expected semver like 1.0.8, got ${version}`);
  }
  parts[2] += 1;
  return parts.join(".");
};

const requestedVersion = process.argv[2];
const packageJson = JSON.parse(read("package.json"));
const currentVersion = packageJson.version;
const nextVersion = requestedVersion || bumpPatch(currentVersion);

packageJson.version = nextVersion;
write("package.json", `${JSON.stringify(packageJson, null, 2)}\n`);

const packageLock = JSON.parse(read("package-lock.json"));
packageLock.version = nextVersion;
if (packageLock.packages?.[""]) {
  packageLock.packages[""].version = nextVersion;
}
write("package-lock.json", `${JSON.stringify(packageLock, null, 2)}\n`);

const infoPlistPath = "ios/App/App/Info.plist";
let infoPlist = read(infoPlistPath);
const currentBundleVersion = Number(
  infoPlist.match(/<key>CFBundleVersion<\/key>\s*<string>(\d+)<\/string>/)?.[1] || 0,
);

const projectPath = "ios/App/App.xcodeproj/project.pbxproj";
let project = read(projectPath);
const projectBuildNumbers = [...project.matchAll(/CURRENT_PROJECT_VERSION = (\d+);/g)].map((match) =>
  Number(match[1]),
);
const nextBuildNumber = Math.max(currentBundleVersion, ...projectBuildNumbers, 0) + 1;

infoPlist = infoPlist
  .replace(
    /(<key>CFBundleShortVersionString<\/key>\s*<string>)([^<]+)(<\/string>)/,
    `$1${nextVersion}$3`,
  )
  .replace(/(<key>CFBundleVersion<\/key>\s*<string>)(\d+)(<\/string>)/, `$1${nextBuildNumber}$3`);
write(infoPlistPath, infoPlist);

project = project
  .replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${nextVersion};`)
  .replace(/CURRENT_PROJECT_VERSION = \d+;/g, `CURRENT_PROJECT_VERSION = ${nextBuildNumber};`);
write(projectPath, project);

const androidGradlePath = "android/app/build.gradle";
if (fs.existsSync(path.join(root, androidGradlePath))) {
  let androidGradle = read(androidGradlePath);
  if (androidGradle.includes(`versionName = "${currentVersion}"`)) {
    androidGradle = androidGradle
      .replace(/versionName = "[^"]+"/, `versionName = "${nextVersion}"`)
      .replace(/versionCode = (\d+)/, (_, code) => `versionCode = ${Number(code) + 1}`);
    write(androidGradlePath, androidGradle);
  }
}

console.log(`Bumped ${currentVersion} -> ${nextVersion} (iOS build ${nextBuildNumber})`);
