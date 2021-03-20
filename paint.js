const Jimp = require('jimp');
const crypto = require('crypto');
const seedrandom = require('seedrandom');
 
module.exports = async ({
    inspiration,
    text,
    useRandom,
    probability,
    createBackgroundMosaic,
    useRandomOpacity,
    useWall,
    wallType,
}) => {
    const size = 51;

    const firstHash = crypto.createHash("sha256")
        .update(text)
        .digest('hex');
    
    const secondHash = crypto.createHash("sha256")
        .update(firstHash)
        .digest('hex');
    
    const hash = `${firstHash}${secondHash}`;
    
    const keys = [];

    const width = size * 8;
    const height = size * 8;

    const base = new Jimp(width, height, 'white');
    
    for (i = 0; i < hash.length; i += 2) {
        const hex = hash.substr(i, 2)
        const int = parseInt(hex, 16)
        keys.push(int);
    }

    let src = null;
    let part = null;

    var rng = seedrandom(text);

    for (i = 0; i < 8; i++) {
        for (j = 0; j < 8; j++) {
            continuos = ((i * 8) + j);
            part = keys[continuos];

            let currentInspiration = inspiration === '-1' ? parseInt(rng() * 721 % 5) + 1 : inspiration;

            if (currentInspiration >= 6) currentInspiration = 6;
            if (currentInspiration <= 0) currentInspiration = 1;

            src = await Jimp.read(`./inspirations/${currentInspiration}/${part}.png`);

            const r = rng();
            const p = 1 - probability;
            if (useRandom && rng() >= (1 - probability)) {
                src.invert();
            }

            base.composite(src, i * size, j * size);
        }
    }
    const finalWidth = size * 14;
    const finalHeight = size * 14;

    if (useWall) {
        const final = new Jimp(finalWidth, finalHeight, 'white');

        let background = null;
        
        if (wallType === 'silver') {
            background = await new Jimp.read('./inspirations/silver-wall.png');
        } else if (wallType === 'golden') {
            background = await new Jimp.read('./inspirations/golden-wall.png');
        } else {
            background = await new Jimp.read('./inspirations/wall.png');
        }
        final.composite(background, 0, 0);
        final.composite(base, 152, 153);
        return final;
    } else {
        const final = new Jimp(finalWidth, finalHeight, 'white');
    
        const background = base.clone();
        background.resize(finalWidth, finalHeight);
        background.gaussian(5);
        final.composite(background, 0, 0);
    
        if (createBackgroundMosaic) {
            const startPoint = useRandomOpacity ? rng() * 100 % 3 * 0.1 : 0;
    
            final.composite(base, size * 3, 0);
            
            let x1 = 2.5;
            let y1 = 0.5;
            let x2 = 3.5;
            let y2 = 0.5;
        
            const factor = 0.5;
        
            for (i = 0; i < 6; i++) {
                const newBase = base.clone();
                newBase.opacity(1 - startPoint - (i * 0.1));
    
                if (rng() > 0.5) {
                    newBase.invert();
                }
        
                final.composite(newBase, size * x1, y1 * size);
                final.composite(newBase, size * x2, y2 * size);
        
                x1 -= factor;
                x2 += factor;
                y1 += factor;
                y2 += factor;
            }
        
            for (i = 0; i < 6; i++) {
                const newBase = base.clone();
                newBase.opacity(1 - startPoint - (i * 0.1));
                
                if (rng() < 0.5) {
                    newBase.invert();
                }
        
                final.composite(newBase, size * x1, y1 * size);
                final.composite(newBase, size * x2, y2 * size);
        
                x1 += factor;
                x2 -= factor;
                y1 += factor;
                y2 += factor;
            }
        }
    
        const final2 = base.clone();
        const finalBackground = base.clone();
        finalBackground.invert();
        finalBackground.blur(3);
        final.composite(finalBackground, size * 2.5, size * 3.5);
        final.composite(finalBackground, size * 2.6, size * 3.4);
        final.composite(finalBackground, size * 2.7, size * 3.3);
        final.composite(finalBackground, size * 2.8, size * 3.2);
        final.composite(finalBackground, size * 2.9, size * 3.1);
        
    
        const rec = await Jimp.read(`./inspirations/rec.png`);
        final.composite(final2, size * 3, size * 3);
        final.composite(rec, size * 3 - 4, size * 3);
    
        return final;
    }
}