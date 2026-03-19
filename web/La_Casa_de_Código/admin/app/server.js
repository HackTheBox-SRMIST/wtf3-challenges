const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const { db, professorId } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/api', require('./routes/auth'));

app.use('/api/support', require('./routes/support'));

app.use('/api', require('./routes/account'));

app.use('/api', require('./routes/settings'));

app.use('/mint', require('./routes/mint'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n Banco de España Digital is running on port ${PORT}`);
  console.log(` prof uuid: ${professorId} \n`);
});
