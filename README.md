# 🛒 Retail Management System

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap_5.3-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)

A full-stack web application to manage retail operations — including suppliers, products, customers, stores, employees, and orders. Built with a REST API backend and a static HTML frontend as a DBMS mini project.

---

## 🌐 Live Demo

🔗 **[https://retail-system.up.railway.app](https://retail-system.up.railway.app)**

> Deployed on **Railway** — Node.js hosting + managed MySQL database.

---

## ✨ Features

- 🏭 **Supplier Management** — Add/edit/delete suppliers with multiple mobile numbers support
- 📦 **Product Management** — Manage products with pricing, stock, type, and supplier linking
- 👤 **Customer Management** — Store and manage customer details and contact info
- 🏬 **Store Management** — Track stores with city and address information
- 👨‍💼 **Employee Management** — Manage employees with designation, salary, and store assignment
- 🧾 **Order Management** — Handle orders with items, linked to customer, employee, and store
- 📊 **Analytics Dashboard** — Live overview with 6 stat cards + 3 Chart.js charts (Products per Type, Employees per Store, Revenue per Store)
- 🚨 **Low Stock Alerts** — Products with `stock = 0` highlighted red with **Out of Stock** badge; stock 1–4 shows **Low Stock** badge
- 📈 **Live Stats on Home Page** — Hero section fills the full viewport; scrolling reveals a count-up animated stats section pulling live counts from the DB
- 🔍 **Search & Filter** — Live search and filter available on all pages
- 🔔 **Toast Notifications** — Success/error feedback on every action
- 🗑️ **2-Click Delete Confirmation** — Prevents accidental deletions

---

## 🗂️ Project Structure

```
retail-system/
├── public/                  # Frontend — HTML pages, CSS, and JS
│   ├── home.html            # Landing page with hero + live stats
│   ├── dashboard.html       # Analytics dashboard (charts + stat cards)
│   ├── suppliers.html
│   ├── products.html        # Includes low-stock row highlighting
│   ├── customers.html
│   ├── stores.html
│   ├── employees.html
│   ├── orders.html
│   ├── css/
│   │   └── styles.css       # Global styles incl. hero, stat cards, live stats
│   └── js/
│       ├── api.js           # Shared fetch helpers
│       ├── ui.js            # Shared UI utilities (toast, debounce, etc.)
│       ├── dashboard.js     # Dashboard chart & stat card logic
│       └── ...              # Per-page CRUD logic
├── routes/                  # Express REST API route handlers
│   ├── suppliers.js
│   ├── products.js
│   ├── customers.js
│   ├── stores.js
│   ├── employees.js
│   ├── orders.js
│   └── dashboard.js         # Read-only analytics endpoints
├── db.js                    # Shared MySQL connection module
├── server.js                # Express app entry point
├── retail_management_script.sql  # Database schema + seed data
├── railway.json             # Railway deployment configuration
├── nixpacks.toml            # Nixpacks build configuration
├── .env                     # Environment variables (not committed)
└── package.json
```

---

## 🛠️ Tech Stack

| Layer      | Technology                                              |
|------------|---------------------------------------------------------|
| Frontend   | HTML5, Bootstrap 5.3, Bootstrap Icons, Vanilla JS       |
| Charts     | [Chart.js 4.4](https://www.chartjs.org/) (CDN)          |
| Backend    | Node.js, Express.js                                     |
| Database   | MySQL 8                                                 |
| Hosting    | Railway (Node.js + MySQL)                               |

---

## 🗄️ Database Schema

The database contains **8 tables**:

| Table             | Description                                               |
|-------------------|-----------------------------------------------------------|
| `supplier`        | Core supplier info — name, email, address                 |
| `supplier_mobile` | Multiple mobile numbers per supplier (multi-valued attr.) |
| `product`         | Products with price, stock quantity, type, and supplier FK |
| `customer`        | Customer details — name and contact number               |
| `store`           | Store records with name, city, and address               |
| `employee`        | Employee info with designation, salary, hire date, store FK |
| `orders`          | Orders linked to a customer, employee, and store         |
| `order_items`     | Junction table mapping orders to products with quantity  |

---

## ⚙️ Local Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- MySQL Server running locally
- MySQL Workbench (recommended for importing the database)

### 1. Clone the repository

```bash
git clone https://github.com/ManthanMarathe223/retail-system.git
cd retail-system
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up the database

Open **MySQL Workbench**, connect to your local server, and run the provided SQL script:

> `retail_management_script.sql`

This will create the `pccoe` database with all tables and seed data.

### 4. Configure environment variables

Create a `.env` file in the project root:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=pccoe
PORT=3000
```

### 5. Run the application

```bash
npm start
```

Open your browser and go to `http://localhost:3000`.

---

## 📡 API Endpoints

All entities follow the same RESTful pattern:

| Method   | Endpoint           | Description            |
|----------|--------------------|------------------------|
| `GET`    | `/suppliers`       | Get all suppliers      |
| `POST`   | `/suppliers`       | Create a new supplier  |
| `PUT`    | `/suppliers/:id`   | Update a supplier      |
| `DELETE` | `/suppliers/:id`   | Delete a supplier      |

> The same pattern applies for `/products`, `/customers`, `/stores`, `/employees`, and `/orders`.

### 📊 Dashboard Endpoints (read-only)

| Method | Endpoint                          | Description                                    |
|--------|-----------------------------------|------------------------------------------------|
| `GET`  | `/dashboard/stats`                | Total count of all 6 entities                  |
| `GET`  | `/dashboard/products-by-type`     | Product count grouped by `pro_type`            |
| `GET`  | `/dashboard/employees-by-store`   | Employee count grouped by store name           |
| `GET`  | `/dashboard/revenue-by-store`     | Revenue (`quantity × price`) grouped by store  |

---

## ☁️ Deployment on Railway

This project is deployed on **[Railway](https://railway.app)**, which handles both the **Node.js app hosting** and the **managed MySQL database**.

---

### Environment Variables (Railway Dashboard)

Set these in the **Variables** tab of your Railway project:

| Variable      | Description                        |
|---------------|------------------------------------|
| `DB_HOST`     | Railway MySQL hostname             |
| `DB_PORT`     | MySQL port (usually `3306`)        |
| `DB_USER`     | MySQL username                     |
| `DB_PASSWORD` | MySQL password                     |
| `DB_NAME`     | Database name                      |
| `PORT`        | Auto-injected by Railway           |

> **Database import:** The MySQL database was imported using **MySQL Workbench** connected to the Railway MySQL instance via the provided host, port, and credentials.

---

## 👨‍💻 Author

**Manthan Marathe**
🎓 PCCOE, Pune — Second Year CSE (2025–26)
🔗 [GitHub](https://github.com/ManthanMarathe223)

---

## 📄 License

This project is licensed under the **ISC License**.
