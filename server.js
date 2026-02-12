console.log('========== 1. DÉMARRAGE ==========');

try {
  console.log('2. Loading dotenv...');
  require('dotenv').config({ debug: true });
  console.log('3. Dotenv loaded ✅');
  
  console.log('4. Checking env vars...');
  console.log('   MONGO_URI:', process.env.MONGO_URI ? '✅' : '❌');
  console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅' : '❌');
  
  console.log('5. Loading express...');
  const express = require('express');
  console.log('6. Express loaded ✅');
  
  console.log('7. Loading path...');
  const path = require('path');
  console.log('8. Path loaded ✅');
  
  console.log('9. Loading cookieParser...');
  const cookieParser = require('cookie-parser');
  console.log('10. CookieParser loaded ✅');
  
  console.log('11. Loading helmet...');
  const helmet = require('helmet');
  console.log('12. Helmet loaded ✅');
  
  console.log('13. Loading cors...');
  const cors = require('cors');
  console.log('14. Cors loaded ✅');
  
  console.log('15. Loading rate-limit...');
  const rateLimit = require('express-rate-limit');
  console.log('16. Rate-limit loaded ✅');
  
  console.log('17. Loading csrf...');
  const csrf = require('csurf');
  console.log('18. CSRF loaded ✅');
  
  console.log('19. Loading logger...');
  const { logRequest, businessLogger } = require('./Backend/config/logger');
  console.log('20. Logger loaded ✅');
  
  console.log('21. Loading envValidators...');
  const { validateEnv } = require('./Backend/config/envValidators');
  console.log('22. EnvValidators loaded ✅');
  
  console.log('23. Validating env...');
  validateEnv();
  console.log('24. Env validated ✅');
  
  console.log('25. Loading MongoConnection...');
  const MyMongoConnection = require('./Backend/DataBase/MongoConnection');
  console.log('26. MongoConnection loaded ✅');
  
  console.log('27. Loading User model...');
  const User = require('./Backend/Models/User');
  console.log('28. User model loaded ✅');
  
  console.log('29. Loading routes...');
  const authenticationRoute = require('./Backend/Routes/authenticationRoute');
  console.log('30. authenticationRoute loaded ✅');
  const panelRoutes = require('./Backend/Routes/panelRoutes');
  console.log('31. panelRoutes loaded ✅');
  const authMiddleware = require('./Backend/Middleware/authenticationMiddlware');
  console.log('32. authMiddleware loaded ✅');
  const adminRoutes = require('./Backend/Routes/adminRoutes');
  console.log('33. adminRoutes loaded ✅');
  const clientrisquestRouter = require('./Backend/Routes/clientRoutes');
  console.log('34. clientRoutes loaded ✅');
  const paymentProofRoutes = require('./Backend/Routes/paymentProofRoutes');
  console.log('35. paymentProofRoutes loaded ✅');
  const notificationRoutes = require('./Backend/Routes/notificationRoutes');
  console.log('36. notificationRoutes loaded ✅');
  const profileRoutes = require('./Backend/Routes/userProfilrRoutes');
  console.log('37. profileRoutes loaded ✅');
  const agenceRoutes = require('./Backend/Routes/agenceRoutes');
  console.log('38. agenceRoutes loaded ✅');
  
  console.log('39. ALL MODULES LOADED ✅✅✅');
  console.log('40. Connecting to MongoDB...');
  
  MyMongoConnection().then(() => {
    console.log('41. MongoDB connected ✅');
    
    const app = express();
    const port = process.env.PORT || 3000;
    
    app.get('/', (req, res) => {
      res.send('Server is running!');
    });
    
    app.listen(port, () => {
      console.log('========== SERVER STARTED ✅ ==========');
      console.log(`Port: ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log('=======================================');
    });
    
  }).catch(error => {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
  
} catch (error) {
  console.error('========== ❌ CRASH ❌ ==========');
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
  console.error('================================');
  process.exit(1);
}
