"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var localesDir = path.join(__dirname, 'src/i18n/locales');
var files = fs.readdirSync(localesDir).filter(function (f) { return f.endsWith('.ts') && f !== 'en.ts' && f !== 'ko.ts'; });
var enContent = fs.readFileSync(path.join(localesDir, 'en.ts'), 'utf-8');
function extractBlock(content, blockName) {
    // Looks for `"blockName": {` and finds the matching closing brace.
    var regex = new RegExp("\"".concat(blockName, "\"\\s*:\\s*\\{"));
    var match = regex.exec(content);
    if (!match)
        return null;
    var openBraces = 0;
    var start = match.index;
    var idx = start;
    var foundFirstBrace = false;
    while (idx < content.length) {
        if (content[idx] === '{') {
            openBraces++;
            foundFirstBrace = true;
        }
        else if (content[idx] === '}') {
            openBraces--;
        }
        if (foundFirstBrace && openBraces === 0) {
            return content.substring(start, idx + 1);
        }
        idx++;
    }
    return null;
}
var blocksToSync = ['alert', 'createTrip', 'map', 'match', 'discover', 'chat'];
var blockContents = {};
for (var _i = 0, blocksToSync_1 = blocksToSync; _i < blocksToSync_1.length; _i++) {
    var block = blocksToSync_1[_i];
    var extracted = extractBlock(enContent, block);
    if (extracted) {
        blockContents[block] = extracted;
    }
    else {
        console.warn("Could not extract block ".concat(block, " from en.ts"));
    }
}
for (var _a = 0, files_1 = files; _a < files_1.length; _a++) {
    var file = files_1[_a];
    var filePath = path.join(localesDir, file);
    var content = fs.readFileSync(filePath, 'utf-8');
    for (var _b = 0, blocksToSync_2 = blocksToSync; _b < blocksToSync_2.length; _b++) {
        var block = blocksToSync_2[_b];
        if (!blockContents[block])
            continue;
        var existing = extractBlock(content, block);
        if (existing) {
            content = content.replace(existing, blockContents[block]);
        }
        else {
            // Append it before export default
            content = content.replace(/};\s*export\s+default/, "  },\n  ".concat(blockContents[block], "\n};\nexport default"));
        }
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log("Updated ".concat(file));
}
