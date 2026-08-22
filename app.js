const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send(`
    <html>
      <body style="font-family: sans-serif; padding: 40px;">
        <h1>Employee Portal</h1>
        <p>This is a placeholder page running on EC2.</p>
        <p>Server is alive and responding to requests.</p>
      </body>
    </html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});