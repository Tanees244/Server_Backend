const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(bodyParser.json());

const AuthRoutes = require('./AuthRoutes');
const Routes = require('./Routes');
const AdminRoutes = require('./AdminRoutes');
const GuideRoutes = require('./GuideRoutes');
const VendorsRoutes = require('./VendorsRoutes'); // Import VendorsRoutes

// Use routes
app.use('/api/authRoutes', AuthRoutes);
app.use('/api/routes', Routes);
app.use('/api/adminRoutes', AdminRoutes);
app.use('/api/guideRoutes', GuideRoutes);
app.use('/api/vendorsRoutes', VendorsRoutes);

app.listen(8000, () => {
    console.log(`Server is running on port 8000`);
});
