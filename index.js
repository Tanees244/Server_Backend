const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(bodyParser.json());

const AuthRoutes = require('./AuthRoutes');
app.use('/api/authRoutes', AuthRoutes);
const Routes = require('./Routes');
app.use('/api/routes', Routes);
const AdminRoutes = require('./AdminRoutes');
app.use('/api/adminRoutes', AdminRoutes);

app.listen(8000, () => {
    console.log(`Server is running on port 8000`);
});
