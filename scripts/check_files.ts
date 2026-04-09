import { Project } from "ts-morph";
const project = new Project({ tsConfigFilePath: "tsconfig.json" });
console.log("From tsconfig:", project.getSourceFiles().length);
project.addSourceFilesAtPaths("src/**/*.tsx");
project.addSourceFilesAtPaths("src/**/*.ts");
console.log("After addSourceFiles:", project.getSourceFiles().length);
