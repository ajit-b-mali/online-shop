### **7. Admin Panel**
### **8. User Dashboard**
### **1. Project Setup**

```bash
npm install express mongoose dotenv bcryptjs jsonwebtoken multer cookie-parser express-session passport ejs cors method-override multer-s3 sequelize mysql2 connect-flash
```

### **2. Database Design (MongoDB)**
- **Users** (name, email, password, role)
- **Products** (title, description, price, images, stock, category)
- **Orders** (user, items, total price, payment status)
- **Cart** (user, products, quantity)

### **3. Authentication & Authorization**
- JWT-based authentication (`jsonwebtoken`)
- Express sessions for maintaining login state
- Role-based access (Admin, Customer)

### **4. Product Management**
- Admin routes for CRUD operations
- Image uploads (Multer + local storage or Cloudinary)

### **5. Cart & Order System**
- Add/remove items from cart
- Checkout with order creation

### **6. Payment Integration**
- Razorpay or Stripe integration
- Payment status handling via webhooks

### **7. Views & Templates**
- `views/partials/` for reusable EJS components (header, footer)
- `views/pages/` for main pages:
  - `index.ejs` (Home)
  - `product.ejs` (Product details)
  - `cart.ejs` (Shopping cart)
  - `checkout.ejs` (Checkout)
  - `admin.ejs` (Admin panel)

### **8. Deployment**
- Backend on **Railway/Render**
- MongoDB Atlas for database
- Host static assets via **CDN or Express static middleware**

```
ecommerce-app/
│── node_modules/         # Installed dependencies
│── public/               # Static assets (CSS, JS, images)
│   ├── css/              # Stylesheets
│   ├── js/               # Client-side JavaScript
│   ├── images/           # Product images
│── views/                # EJS templates
│   ├── partials/         # Reusable components (header, footer, etc.)
│   │   ├── header.ejs
│   │   ├── footer.ejs
│   │   ├── navbar.ejs
│   ├── pages/            # Main pages
│   │   ├── index.ejs
│   │   ├── login.ejs
│   │   ├── register.ejs
│   │   ├── product.ejs
│   │   ├── cart.ejs
│   │   ├── checkout.ejs
│   │   ├── order-success.ejs
│   ├── admin/            # Admin panel views
│   │   ├── dashboard.ejs
│   │   ├── add-product.ejs
│   │   ├── manage-orders.ejs
│── routes/               # Express route handlers
│   ├── index.js          # Main routes (home, product, etc.)
│   ├── auth.js           # Authentication routes (login, register)
│   ├── admin.js          # Admin panel routes
│   ├── cart.js           # Shopping cart routes
│   ├── order.js          # Order processing routes
│── models/               # Mongoose models
│   ├── index.js          # Sequelize instance   
│   ├── User.js
│   ├── Product.js
│   ├── Order.js
│   ├── Cart.js
│── controllers/          # Business logic for routes
│   ├── authController.js
│   ├── productController.js
│   ├── cartController.js
│   ├── orderController.js
│   ├── adminController.js
│── middlewares/          # Middleware functions
│   ├── authMiddleware.js  # Protect routes
│── config/               # Configuration files
│   ├── database.js             # MongoDB connection
│   ├── passport.js       # Passport authentication setup (if used)
│── uploads/              # Uploaded product images
│── .env                  # Environment variables
│── .gitignore            # Ignore unnecessary files
│── package.json          # Dependencies & scripts
│── server.js             # Entry point (Express server setup)
```

```

- Setup `.env` file:
  ```
  PORT=3000
  DB_NAME=ecommerce
  DB_USER=root
  DB_PASS=yourpassword
  DB_HOST=localhost
  SESSION_SECRET=your_secret
  ```

---

## **🔗 Phase 3: Database & Models**
### **1️⃣ Configure Sequelize (`config/database.js`)**
```javascript
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false, 
});

module.exports = sequelize;
```

### **2️⃣ Initialize Models (`models/index.js`)**
```javascript
const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

// Import models
const User = require('./User')(sequelize);
const Product = require('./Product')(sequelize);
const Order = require('./Order')(sequelize);
const Cart = require('./Cart')(sequelize);

// Define relationships
User.hasMany(Order);
Order.belongsTo(User);

User.hasOne(Cart);
Cart.belongsTo(User);

Cart.belongsToMany(Product, { through: 'CartItems' });
Product.belongsToMany(Cart, { through: 'CartItems' });

Order.belongsToMany(Product, { through: 'OrderItems' });
Product.belongsToMany(Order, { through: 'OrderItems' });

sequelize.sync({ alter: true })
    .then(() => console.log('Database synced'))
    .catch(err => console.error(err));

module.exports = { sequelize, User, Product, Order, Cart };
```

### **3️⃣ Define Models (`models/User.js`, etc.)**
- **User Model**
```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('User', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: false, unique: true },
        password: { type: DataTypes.STRING, allowNull: false },
        role: { type: DataTypes.ENUM('admin', 'customer'), defaultValue: 'customer' }
    });
};
```

---

## **🛠️ Phase 4: Authentication System**
### **1️⃣ Setup Routes (`routes/auth.js`)**
```javascript
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const router = express.Router();

router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await User.create({ name, email, password: hashedPassword });
        res.redirect('/login');
    } catch (err) {
        res.status(400).send('User already exists');
    }
});

module.exports = router;
```

---

## **🛒 Phase 5: Product & Cart System**
### **1️⃣ Product Route (`routes/product.js`)**
```javascript
const express = require('express');
const upload = require('../middlewares/upload');
const { Product } = require('../models');

const router = express.Router();

router.post('/add', upload.single('image'), async (req, res) => {
    const { name, description, price, stock } = req.body;
    const product = await Product.create({
        name, description, price, stock, image: req.file.filename
    });
    res.redirect('/admin/products');
});

module.exports = router;
```

### **2️⃣ File Uploads with Multer (`middlewares/upload.js`)**
```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

module.exports = upload;
```

---

## **📦 Phase 6: Orders & Checkout**
### **1️⃣ Order Route (`routes/order.js`)**
```javascript
const express = require('express');
const { Order, Product } = require('../models');

const router = express.Router();

router.post('/checkout', async (req, res) => {
    const { userId, productIds } = req.body;

    try {
        const order = await Order.create({ userId });
        await order.addProducts(productIds);
        res.json({ message: 'Order placed successfully' });
    } catch (error) {
        res.status(500).send('Error processing order');
    }
});

module.exports = router;
```

---

## **🚀 Phase 7: Start the Server**
### **1️⃣ `server.js`**
```javascript
const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const sequelize = require('./config/database');

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: true }));

app.set('view engine', 'ejs');

app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/products', require('./routes/product'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await sequelize.authenticate();
    console.log('Database connected');
});
```

---

### **1. Install Dependencies**
```bash
npm install express ejs dotenv sequelize mysql2 bcryptjs jsonwebtoken multer express-session
```

- `express` – Web framework  
- `ejs` – Template engine  
- `dotenv` – Environment variable management  
- `sequelize` – ORM for MySQL  
- `mysql2` – MySQL driver  
- `bcryptjs` – Password hashing  
- `jsonwebtoken` – Authentication  
- `multer` – File uploads  
- `express-session` – Session handling  

---

### **2. Folder Structure**


---

### **3. Configure Database (`config/database.js`)**
```javascript
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql', 
    logging: false,  // Disable logging SQL queries
});

module.exports = sequelize;
```

**`.env` File**
```
DB_NAME=ecommerce
DB_USER=root
DB_PASS=yourpassword
DB_HOST=localhost
```

---

### **4. Initialize Sequelize in `models/index.js`**
```javascript
const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

// Import models
const User = require('./User')(sequelize);
const Product = require('./Product')(sequelize);
const Order = require('./Order')(sequelize);
const Cart = require('./Cart')(sequelize);

// Define relationships
User.hasMany(Order);
Order.belongsTo(User);

User.hasOne(Cart);
Cart.belongsTo(User);

Cart.belongsToMany(Product, { through: 'CartItems' });
Product.belongsToMany(Cart, { through: 'CartItems' });

Order.belongsToMany(Product, { through: 'OrderItems' });
Product.belongsToMany(Order, { through: 'OrderItems' });

// Sync database
sequelize.sync({ alter: true })
    .then(() => console.log('Database synced'))
    .catch(err => console.error(err));

module.exports = { sequelize, User, Product, Order, Cart };
```

---

### **5. User Model (`models/User.js`)**
```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: false, unique: true },
        password: { type: DataTypes.STRING, allowNull: false },
        role: { type: DataTypes.ENUM('admin', 'customer'), defaultValue: 'customer' }
    });

    return User;
};
```

---

### **6. Product Model (`models/Product.js`)**
```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Product = sequelize.define('Product', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: false },
        price: { type: DataTypes.FLOAT, allowNull: false },
        stock: { type: DataTypes.INTEGER, allowNull: false },
        image: { type: DataTypes.STRING }
    });

    return Product;
};
```

---

### **7. Auth Route (`routes/auth.js`)**
```javascript
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const router = express.Router();

// User registration
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await User.create({ name, email, password: hashedPassword });
        res.redirect('/login');
    } catch (err) {
        res.status(400).send('User already exists');
    }
});

module.exports = router;
```

---

### **8. File Uploads with Multer (`middlewares/upload.js`)**
```javascript
const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

module.exports = upload;
```

Usage in **Product Route (`routes/product.js`)**:
```javascript
const express = require('express');
const upload = require('../middlewares/upload');
const { Product } = require('../models');

const router = express.Router();

// Upload a new product
router.post('/add', upload.single('image'), async (req, res) => {
    try {
        const { name, description, price, stock } = req.body;
        const product = await Product.create({
            name, description, price, stock, image: req.file.filename
        });
        res.redirect('/admin/products');
    } catch (err) {
        res.status(500).send('Error adding product');
    }
});

module.exports = router;
```

---

### **9. Run Server (`server.js`)**
```javascript
const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const sequelize = require('./config/database');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'ecommerce-secret', resave: false, saveUninitialized: true }));

// View Engine
app.set('view engine', 'ejs');

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/products', require('./routes/product'));

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await sequelize.authenticate();
    console.log('Database connected');
});
```

---

### **3. Database Configuration (`config/database.js`)**
```javascript
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql', // Change to 'postgres' for PostgreSQL
    logging: false,  // Disable logging SQL queries
});

module.exports = sequelize;
```

---

### **4. Initialize Sequelize in `models/index.js`**
```javascript
const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

// Import models
const User = require('./User')(sequelize);
const Product = require('./Product')(sequelize);
const Order = require('./Order')(sequelize);
const Cart = require('./Cart')(sequelize);

// Define associations
User.hasMany(Order);
Order.belongsTo(User);

User.hasOne(Cart);
Cart.belongsTo(User);

Cart.belongsToMany(Product, { through: 'CartItems' });
Product.belongsToMany(Cart, { through: 'CartItems' });

Order.belongsToMany(Product, { through: 'OrderItems' });
Product.belongsToMany(Order, { through: 'OrderItems' });

sequelize.sync({ alter: true }) // Sync database
    .then(() => console.log('Database synced'))
    .catch(err => console.error(err));

module.exports = { sequelize, User, Product, Order, Cart };
```

---

### **5. Example User Model (`models/User.js`)**
```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: false, unique: true },
        password: { type: DataTypes.STRING, allowNull: false },
        role: { type: DataTypes.ENUM('admin', 'customer'), defaultValue: 'customer' }
    });

    return User;
};
```

---

### **6. Using Sequelize in a Route (`routes/auth.js`)**
```javascript
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const router = express.Router();

// User registration
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await User.create({ name, email, password: hashedPassword });
        res.redirect('/login');
    } catch (err) {
        res.status(400).send('User already exists');
    }
});

module.exports = router;
```

---