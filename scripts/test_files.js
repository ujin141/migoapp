const { Project } = require("ts-morph");
const project = new Project({ tsConfigFilePath: "tsconfig.json" });
console.log("From tsconfig:", project.getSourceFiles().length);
project.addSourceFilesAtPaths("src/**/*.tsx");
console.log("After addSourceFiles AtPaths:", project.getSourceFiles().length);
