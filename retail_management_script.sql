CREATE DATABASE pccoe;
use pccoe;

CREATE TABLE Supplier(
supp_id INT PRIMARY KEY,
supp_name VARCHAR(100) NOT NULL,
supp_email VARCHAR(100) UNIQUE,
supp_address VARCHAR(200)
);

CREATE TABLE Supplier_Mobile(
supp_id INT,
mobile_number VARCHAR(15),
PRIMARY KEY (supp_id, mobile_number),
FOREIGN KEY (supp_id) REFERENCES Supplier(supp_id)
);

CREATE TABLE Product(
pro_id INT PRIMARY KEY,
pro_name VARCHAR(100) NOT NULL,
pro_price DECIMAL(10,2) NOT NULL,
pro_description TEXT,
pro_type VARCHAR(50),
stock_quantity INT DEFAULT 0,
supp_id INT,
FOREIGN KEY (supp_id) REFERENCES Supplier(supp_id)
);

INSERT INTO Supplier VALUES
(101, 'Tech Supplies Ltd', 'techsupplies@gmail.com', 'Pune, Maharashtra'),
(102, 'Global Electronics', 'globalelec@gmail.com', 'Mumbai, Maharashtra'),
(103, 'Office Mart', 'officemart@gmail.com', 'Delhi, India');

INSERT INTO Supplier_Mobile VALUES
(101, '9876543210'),
(101, '9123456780'),
(102, '9988776655'),
(103, '9090909090'),
(103, '8080808080');

INSERT INTO Product VALUES
(1, 'Gaming Laptop', 75000.00, 'High performance laptop with 16GB RAM and 1TB SSD', 'Electronics', 15, 101),
(2, 'Wireless Mouse', 599.00, 'Ergonomic wireless mouse with USB receiver', 'Electronics', 50, 101),
(3, 'LED Monitor', 12000.00, '24 inch full HD LED monitor', 'Electronics', 20, 102),
(4, 'Office Chair', 4500.00, 'Comfortable revolving office chair', 'Furniture', 30, 103);

SELECT * from Supplier;
SELECT * from Product;
SELECT * from Supplier_Mobile;

SELECT p.pro_name, s.supp_name
FROM Product p
JOIN Supplier s ON p.supp_id = s.supp_id;

CREATE TABLE Store(
    store_id INT PRIMARY KEY,
    store_name VARCHAR(100),
    contact_number VARCHAR(15)
);

DROP TABLE Employee;

CREATE TABLE Employee(
    emp_id INT PRIMARY KEY,
    f_name VARCHAR(50) NOT NULL,
    l_name VARCHAR(50) NOT NULL,
    designation VARCHAR(50) NOT NULL,
    hire_date DATE NOT NULL,
    emp_salary DECIMAL(10,2) NOT NULL,
    store_id INT NOT NULL,
    FOREIGN KEY (store_id) REFERENCES Store(store_id)
);

INSERT INTO Store VALUES
(1, 'Pune Central Store', '0201234567'),
(2, 'Mumbai Retail Hub', '0229876543'),
(3, 'Delhi Super Mart', '0115566778');

INSERT INTO Employee VALUES
(101, 'Rahul', 'Sharma', 'Manager', '2022-05-10', 55000.00, 1),
(102, 'Sneha', 'Patil', 'Cashier', '2023-01-15', 25000.00, 1),
(103, 'Amit', 'Verma', 'Sales Executive', '2021-09-20', 30000.00, 2),
(104, 'Priya', 'Singh', 'HR', '2020-03-12', 40000.00, 3);

SELECT * FROM Store;
SELECT * FROM Employee;

SELECT e.emp_id, e.f_name, e.l_name, e.designation, s.store_name
FROM Employee e
JOIN Store s ON e.store_id = s.store_id;

SELECT s.store_name, COUNT(e.emp_id) AS total_employees
FROM Store s
LEFT JOIN Employee e ON s.store_id = e.store_id
GROUP BY s.store_name;




-- =====================
-- PRODUCT TABLE
-- =====================
CREATE TABLE Product(
    pro_id INT PRIMARY KEY,
    pro_name VARCHAR(100) NOT NULL,
    pro_price DECIMAL(10,2) NOT NULL,
    pro_description TEXT,
    pro_type VARCHAR(50),
    stock_quantity INT DEFAULT 0,
    supp_id INT,
    FOREIGN KEY (supp_id) REFERENCES Supplier(supp_id)
);

INSERT INTO Product VALUES
(1, 'Gaming Laptop', 75000.00, 'High performance laptop with 16GB RAM and 1TB SSD', 'Electronics', 15, 101),
(2, 'Wireless Mouse', 599.00, 'Ergonomic wireless mouse with USB receiver', 'Electronics', 50, 101),
(3, 'LED Monitor', 12000.00, '24 inch full HD LED monitor', 'Electronics', 20, 102),
(4, 'Office Chair', 4500.00, 'Comfortable revolving office chair', 'Furniture', 30, 103),
(5, 'Mechanical Keyboard', 2500.00, 'RGB mechanical keyboard with blue switches', 'Electronics', 40, 102),
(6, 'Desk Lamp', 800.00, 'LED desk lamp with adjustable brightness', 'Furniture', 60, 103);


-- =====================
-- CUSTOMER TABLE
-- =====================
CREATE TABLE Customer(
    cus_id INT PRIMARY KEY,
    f_name VARCHAR(50) NOT NULL,
    l_name VARCHAR(50) NOT NULL,
    cus_number VARCHAR(15)
);

INSERT INTO Customer VALUES
(1, 'Rohan', 'Mehta', '9876512345'),
(2, 'Anjali', 'Desai', '9823456701'),
(3, 'Vikram', 'Joshi', '9012345678'),
(4, 'Pooja', 'Nair', '8899001122'),
(5, 'Arjun', 'Kulkarni', '9765432100'),
(6, 'Neha', 'Tiwari', '9654321009');

-- =====================
-- STORE TABLE
-- =====================
CREATE TABLE Store(
    store_id INT PRIMARY KEY,
    store_name VARCHAR(100),
    contact_number VARCHAR(15)
);

INSERT INTO Store VALUES
(1, 'Pune Central Store', '0201234567'),
(2, 'Mumbai Retail Hub', '0229876543'),
(3, 'Delhi Super Mart', '0115566778');

-- =====================
-- EMPLOYEE TABLE
-- =====================
CREATE TABLE Employee(
    emp_id INT PRIMARY KEY,
    f_name VARCHAR(50) NOT NULL,
    l_name VARCHAR(50) NOT NULL,
    designation VARCHAR(50) NOT NULL,
    hire_date DATE NOT NULL,
    emp_salary DECIMAL(10,2) NOT NULL,
    store_id INT NOT NULL,
    FOREIGN KEY (store_id) REFERENCES Store(store_id)
);

INSERT INTO Employee VALUES
(101, 'Rahul', 'Sharma', 'Manager', '2022-05-10', 55000.00, 1),
(102, 'Sneha', 'Patil', 'Cashier', '2023-01-15', 25000.00, 1),
(103, 'Amit', 'Verma', 'Sales Executive', '2021-09-20', 30000.00, 2),
(104, 'Priya', 'Singh', 'HR', '2020-03-12', 40000.00, 3);

-- =====================
-- ORDERS TABLE
-- =====================
CREATE TABLE Orders(
    order_id INT PRIMARY KEY,
    order_date DATE NOT NULL,
    cus_id INT NOT NULL,
    store_id INT NOT NULL,
    emp_id INT,
    FOREIGN KEY (cus_id) REFERENCES Customer(cus_id),
    FOREIGN KEY (store_id) REFERENCES Store(store_id),
    FOREIGN KEY (emp_id) REFERENCES Employee(emp_id)
);

INSERT INTO Orders VALUES
(1001, '2024-11-01', 1, 1, 101),
(1002, '2024-11-15', 2, 2, 103),
(1003, '2024-12-02', 3, 1, 102),
(1004, '2025-01-10', 4, 3, 104),
(1005, '2025-01-20', 5, 2, 103),
(1006, '2025-02-05', 6, 1, 101);

-- =====================
-- ORDER_ITEMS TABLE
-- =====================
CREATE TABLE Order_Items(
    order_id INT,
    pro_id INT,
    quantity INT NOT NULL DEFAULT 1,
    PRIMARY KEY (order_id, pro_id),
    FOREIGN KEY (order_id) REFERENCES Orders(order_id),
    FOREIGN KEY (pro_id) REFERENCES Product(pro_id)
);

INSERT INTO Order_Items VALUES
(1001, 1, 1),
(1001, 2, 2),
(1002, 3, 1),
(1003, 4, 3),
(1004, 2, 1),
(1005, 5, 2),
(1006, 6, 1);