const express = require('express');
const Jimp = require('jimp');
const paint = require('./paint');
const cors = require('cors');
const sha256 = require('js-sha256');
const fs = require('fs');

const app = express();
app.use(cors()); 

const port = process.env.PORT || 3000;
const ignoreCache = process.env.IGNORE_CACHE === 'true';

app.get('/', async (req, res) => {
    try {
        res.setHeader('Content-Type', 'image/png');

        const width = parseInt(req.query.width);
        const height = parseInt(req.query.height);
        const inspiration = req.query.inspiration;
        const text = req.query.text;
        const useRandom = req.query.useRandom === 'true';
        const probability = parseFloat(req.query.probability);
        const backgroundGaussian = parseInt(req.query.backgroundGaussian);
        const useRandomOpacity = req.query.useRandomOpacity === 'true';
        const wallType = req.query.wallType;
        const overlay = req.query.overlay;
        const overlayOpacity = parseFloat(req.query.overlayOpacity);

        let params = `${inspiration}-${text}-${useRandom}-${probability}-${wallType}`;

        if (overlay && overlay !== "0") {
            params += `-${overlay}-${overlayOpacity}`;
        }

        const hash = sha256(params);

        const outputPath = __dirname + `/output/${hash}.png`;
            
        if (fs.existsSync(outputPath)) {
            console.log(`Sending a cached file: ${outputPath}`);
            
            const newBase = await new Jimp.read(outputPath);

            if (width && height) {
                console.log(`Resizing to ${width}x${height}`)
                newBase.resize(width, height);
            }

            const buffer = await new Promise((resolve, reject) => {
                newBase.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
                    if (err) {
                        reject(err);
                    }

                    resolve(buffer);
                });
            });

            res.end(buffer);
        } else {
            const base = await paint({
                inspiration,
                text,
                useRandom,
                probability,
                backgroundGaussian,
                useRandomOpacity,
                wallType,
                overlay,
                overlayOpacity,
            });

            if (!ignoreCache) {
                base.write(outputPath);
            }

            const newBase = base.clone();

            if (width && height) {
                console.log(`Resizing to ${width}x${height}`)
                newBase.resize(width, height);
            }

            const buffer = await new Promise((resolve, reject) => {
                newBase.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
                    if (err) {
                        reject(err);
                    }

                    resolve(buffer);
                });
            });

            res.end(buffer);
        }
    } catch (e) {
        console.log(e);
        res.send({ e });
    }
});

app.listen(port, function () {
    console.log('Ready');
});