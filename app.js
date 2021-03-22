const express = require('express');
const Jimp = require('jimp');
const paint = require('./paint');
const cors = require('cors');

const app = express();
app.use(cors()); 

const port = process.env.PORT || 3000;

app.get('/', async (req, res) => {
    try {
        res.setHeader('Content-Type', 'image/png');

        const inspiration = req.query.inspiration || '1';
        const text = req.query.text;
        const useRandom = req.query.useRandom === 'true';
        const probability = parseFloat(req.query.probability);
        const createBackgroundMosaic = req.query.createBackgroundMosaic === 'true';
        const useRandomOpacity = req.query.useRandomOpacity === 'true';
        const useWall = req.query.useWall === 'true';
        const wallType = process.env.ALLOW_CHANGE_WALL === 'true' ? req.query.wallType : '';

        const base = await paint({
            inspiration,
            text,
            useRandom,
            probability,
            createBackgroundMosaic,
            useRandomOpacity,
            useWall,
            wallType,
        });

        const buffer = await new Promise((resolve, reject) => {
            base.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
                if (err) {
                    reject(err);
                }

                resolve(buffer);
            });
        });

        res.end(buffer);
    } catch (e) {
        console.log(e);
        res.send({ e });
    }
});

app.listen(port, function () {
    console.log('Ready');
});