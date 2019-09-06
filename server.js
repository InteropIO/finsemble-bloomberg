const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

const corsOptions = {
    origin: 'http://fpe-staging.finsemble.com',
    credentials: true
};
app.use(cors(corsOptions));
app.use(express.static('./src/examples/components/BloombergBridge/bin'));
app.use(express.static('./src/examples/components/SimpleWindowExample/bin'));
app.get('/manifest-local.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'manifest-local.json'));
});
app.get('/config-examples.json', (req, res) => {
    console.log('config request');
    res.sendFile(path.join(__dirname, 'config', 'config-examples.json'));
});

app.listen(8000, () => console.log('Express server is hosting on port 8000'));