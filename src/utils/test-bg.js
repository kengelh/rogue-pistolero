import { Jimp } from "jimp";
import fs from "fs";
import path from "path";

const SRC_DIR = 'src/assets/images';
const files = [
    'fhero_rider.png',
    'mhero_rider.png',
    'gravedigger.png',
    'coach.png',
    'pianoman.png',
    'mhero.png',
    'fhero.png',
    'bandit.02.06.png'
];

function isGrey(r, g, b) {
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    return (max - min) < 15 && r > 40 && r < 210;
}

function isBlueish(r, g, b) {
    // 65bacd -> 101, 186, 205
    return r < 130 && g > 150 && b > 165 && b >= g && g > r;
}

function getRGBA(img, x, y) {
    const hex = img.getPixelColor(x, y);
    return {
        r: (hex >> 24) & 255,
        g: (hex >> 16) & 255,
        b: (hex >> 8) & 255,
        a: hex & 255
    };
}

async function removeBackground() {
    for (const file of files) {
        const filepath = path.join(SRC_DIR, file);
        if (!fs.existsSync(filepath)) continue;
        
        try {
            const img = await Jimp.read(filepath);
            console.log("Processing", file);
            
            // Check top-left pixel to guess the type of background
            const tl = getRGBA(img, 0, 0);
            const isChecker = (Math.abs(tl.r - tl.g) < 10 && Math.abs(tl.g - tl.b) < 10);
            
            // Flood fill from edges
            const width = img.bitmap.width;
            const height = img.bitmap.height;
            const visited = new Set();
            const queue = [];
            
            function addQueue(x, y) {
                const key = x + "," + y;
                if (!visited.has(key)) {
                    visited.add(key);
                    queue.push({x, y});
                }
            }
            
            for (let x = 0; x < width; x++) {
                addQueue(x, 0);
                addQueue(x, height - 1);
            }
            for (let y = 0; y < height; y++) {
                addQueue(0, y);
                addQueue(width - 1, y);
            }
            
            const toClear = [];
            
            while(queue.length > 0) {
                const {x, y} = queue.shift();
                const color = getRGBA(img, x, y);
                
                // Determine if this pixel is background
                let isBg = false;
                if (isChecker) {
                    isBg = isGrey(color.r, color.g, color.b);
                } else {
                    isBg = isBlueish(color.r, color.g, color.b);
                }
                
                if (isBg || color.a < 255) {
                    toClear.push({x, y});
                    // Explore neighbors
                    const neighbors = [
                        {nx: x+1, ny: y}, {nx: x-1, ny: y},
                        {nx: x, ny: y+1}, {nx: x, ny: y-1}
                    ];
                    for (const {nx, ny} of neighbors) {
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            addQueue(nx, ny);
                        }
                    }
                }
            }
            
            console.log("Found", toClear.length, "background pixels to clear.");
            for (const {x, y} of toClear) {
                img.setPixelColor(0x00000000, x, y);
            }
            
            await img.write(filepath);
        } catch (e) {
            console.error("Error processing", file, e.message);
        }
    }
}

removeBackground();
