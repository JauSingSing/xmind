const express = require('express');
const app = express();
const router = require("./router/router.js")
app.use(express.json())
app.use('/api', router)

app.listen(2333)
