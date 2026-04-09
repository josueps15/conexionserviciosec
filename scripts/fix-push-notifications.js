import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'node_modules', '@capacitor', 'push-notifications', 'android', 'build.gradle');

if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes("proguard-android.txt")) {
        console.log("Fixing @capacitor/push-notifications build.gradle Proguard reference...");
        content = content.replace(/proguard-android\.txt/g, "proguard-android-optimize.txt");
        fs.writeFileSync(filePath, content);
        console.log("Fix applied successfully.");
    } else {
        console.log("@capacitor/push-notifications build.gradle already fixed or using different reference.");
    }
} else {
    console.log("@capacitor/push-notifications build.gradle not found. Skipping fix.");
}
