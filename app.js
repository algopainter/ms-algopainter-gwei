const express = require('express');
const Jimp = require('jimp');
const paint = require('./paint');
const cors = require('cors');
const sha256 = require('js-sha256');
const fs = require('fs');

const app = express();
app.use(cors()); 

const port = process.env.PORT || 3000;

app.get('/', async (req, res) => {
    try {
        res.setHeader('Content-Type', 'image/png');

        const inspiration = req.query.inspiration;
        const text = req.query.text;
        const useRandom = req.query.useRandom === 'true';
        const probability = parseFloat(req.query.probability);
        const backgroundGaussian = parseInt(req.query.backgroundGaussian);
        const useRandomOpacity = req.query.useRandomOpacity === 'true';
        const wallType = req.query.wallType;

        const hash = sha256(`${inspiration}-${text}-${useRandom}-${probability}-${wallType}`);

        const outputPath = __dirname + `/output/${hash}.png`;
            
        if (fs.existsSync(outputPath)) {
            console.log(`Sending a cached file: ${outputPath}`);
            res.sendFile(outputPath);
        } else {
            const base = await paint({
                inspiration,
                text,
                useRandom,
                probability,
                backgroundGaussian,
                useRandomOpacity,
                wallType
            });

            base.write(outputPath);

            const buffer = await new Promise((resolve, reject) => {
                base.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
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