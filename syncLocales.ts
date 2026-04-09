import * as fs from 'fs';
import * as path from 'path';

const localesDir = path.join(process.cwd(), 'src/i18n/locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.ts') && f !== 'en.ts' && f !== 'ko.ts');

const enContent = fs.readFileSync(path.join(localesDir, 'en.ts'), 'utf-8');

function extractBlock(content: string, blockName: string): string | null {
    // Looks for `"blockName": {` and finds the matching closing brace.
    const regex = new RegExp(`"${blockName}"\\s*:\\s*\\{`);
    const match = regex.exec(content);
    if (!match) return null;

    let openBraces = 0;
    let start = match.index;
    let idx = start;
    let foundFirstBrace = false;

    while (idx < content.length) {
        if (content[idx] === '{') {
            openBraces++;
            foundFirstBrace = true;
        } else if (content[idx] === '}') {
            openBraces--;
        }

        if (foundFirstBrace && openBraces === 0) {
            return content.substring(start, idx + 1);
        }
        idx++;
    }
    return null;
}

const blocksToSync = ['alert', 'createTrip', 'map', 'match', 'discover', 'chat'];
const blockContents: Record<string, string> = {};

for (const block of blocksToSync) {
    const extracted = extractBlock(enContent, block);
    if (extracted) {
        blockContents[block] = extracted;
    } else {
        console.warn(`Could not extract block ${block} from en.ts`);
    }
}

for (const file of files) {
    const filePath = path.join(localesDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    for (const block of blocksToSync) {
        if (!blockContents[block]) continue;
        
        const existing = extractBlock(content, block);
        if (existing) {
            content = content.replace(existing, blockContents[block]);
        } else {
            // Append it before export default
            content = content.replace(/};\s*export\s+default/, `  },\n  ${blockContents[block]}\n};\nexport default`);
        }
    }
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${file}`);
}
