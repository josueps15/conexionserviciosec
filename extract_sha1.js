import fs from 'fs';
const content = fs.readFileSync('sha1.txt', 'utf16le');
const match = content.match(/SHA1:\s+([0-9A-F:]+)/i);
if (match) {
    const sha1 = match[1];
    for (let i = 0; i < sha1.length; i += 2) {
        process.stdout.write(sha1.substring(i, i + 2));
    }
    process.stdout.write('\n');
} else {
    console.log('SHA1 not found');
}
