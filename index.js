const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const AuthRoutes = require('./AuthRoutes');
const Routes = require('./Routes');
const AdminRoutes = require('./AdminRoutes');
const GuideRoutes = require('./GuideRoutes');
const VendorsRoutes = require('./VendorsRoutes'); 
const PaymentRoutes = require('./PaymentRoutes'); 
const RecommendRoutes = require('./RecommendRoutes'); 


// Use routes
app.use('/api/authRoutes', AuthRoutes);
app.use('/api/routes', Routes);
app.use('/api/adminRoutes', AdminRoutes);
app.use('/api/guideRoutes', GuideRoutes);
app.use('/api/vendorsRoutes', VendorsRoutes);
app.use('/api/PaymentRoutes', PaymentRoutes);
app.use('/api/RecommendRoutes', RecommendRoutes);



app.listen(8000, () => {
    console.log(`Server is running on port 8000`);
});
