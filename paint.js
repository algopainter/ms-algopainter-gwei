const Jimp = require('jimp');
const crypto = require('crypto');
const seedrandom = require('seedrandom');
 
module.exports = async ({
    inspiration,
    text,
    useRandom,
    probability,
    useRandomOpacity,
    wallType,
    overlay,
    overlayOpacity,
}) => {
    const size = 190;

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

            let currentInspiration = inspiration === '0' ? parseInt(rng() * 721 % 5) + 1 : inspiration;

            if (currentInspiration >= 6) currentInspiration = 6;
            if (currentInspiration <= 0) currentInspiration = 1;

            src = await Jimp.read(`./inspirations/${currentInspiration}/${part}.png`);

            const r = rng();
            const p = 1 - probability;
            if (useRandom && rng() >= (1 - probability)) {
                src.invert();
            }

            console.log(`Compositing ${i}-${j}`)
            base.composite(src, i * size, j * size);
        }
    }

    if (rng() > 0.5) {
        base.contrast(0.2);
    }

    if (rng() > 0.9) {
        base.posterize(rng() % 3 + 5);
    }

    const colorChange = rng();

    if (colorChange >= 0.99) {
        base.sepia();
    } else if (colorChange > 0.95) {
        base.greyscale();
    }

    if (overlay > 0) {
        console.log(`Using overlay ${overlay}`);
        const overlayLayer = await Jimp.read(`./overlays/overlay-${overlay}.png`);
        overlayLayer.resize(width, height);
        base.composite(overlayLayer, 0, 0, {
            mode: Jimp.BLEND_EXCLUSION,
            opacityDest: 1,
            opacitySource: overlayOpacity
         });
    }
    
    const signature = await Jimp.read(`./inspirations/gwei-signature.png`);
    base.composite(signature, 1180, 1220);

    if (wallType === '0') {
        return base;
    } else if(wallType === '7') {
        const finalWidth = size * 14;
        const finalHeight = size * 14;
        const final = new Jimp(finalWidth, finalHeight, 'white');
    
        console.log('Creating the background image');
        const background = base.clone();
        background.resize(finalWidth * 0.25, finalHeight * 0.25);
        //background.gaussian(3);
        background.resize(finalWidth, finalHeight);
        final.composite(background, 0, 0);
        console.log('Background image created');
    
        console.log(`Creating the mosaic`);
        const startPoint = useRandomOpacity ? rng() * 100 % 3 * 0.1 : 0;

        final.composite(base, size * 3, 0);
        
        let x1 = 2.5;
        let y1 = 0.5;
        let x2 = 3.5;
        let y2 = 0.5;
    
        const factor = 0.5;
    
        for (i = 0; i < 6; i++) {
            console.log(`Creating base ${i}`);
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

        const final2 = base.clone();
        const finalBackground = base.clone();
        finalBackground.invert();
        finalBackground.blur(3);
        final.composite(finalBackground, size * 2.5, size * 3.5);
        final.composite(finalBackground, size * 2.6, size * 3.4);
        final.composite(finalBackground, size * 2.7, size * 3.3);
        final.composite(finalBackground, size * 2.8, size * 3.2);
        final.composite(finalBackground, size * 2.9, size * 3.1);

        let frame = await new Jimp.read(`./inspirations/silver-frame.png`);
        
        final.composite(final2, size * 3, size * 3);
        final.composite(frame, 0, 0);
        
        return final;
    } else {
        let background = await new Jimp.read(`./walls/wall${wallType}.jpg`);
        const newPainting = base.clone();

        if (wallType === '1') {
            newPainting.resize(1159, 1155);
            background.composite(newPainting, 632, 618);
        }

        if (wallType === '2') {
            newPainting.resize(1519, 1519);
            background.composite(newPainting, 485, 520);
        }

        if (wallType === '3') {
            newPainting.resize(912, 933);
            background.composite(newPainting, 307, 546);
        }

        if (wallType === '4') {
            newPainting.resize(659, 659);
            background.composite(newPainting, 915, 955);
        }

        if (wallType === '5') {
            newPainting.resize(926, 1016);
            background.composite(newPainting, 755, 635);
        }

        if (wallType === '6') {
            newPainting.resize(665, 615);
            background.composite(newPainting, 1904, 907);
        }

        return background;
    }
}