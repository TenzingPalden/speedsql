/**
 * SpeedSQL — Question Bank
 *
 * 15 questions across three difficulty tiers (5 each).
 * Business domains: employees, products, customers, orders, order_items.
 *
 * Each question shape:
 * {
 *   id:             number          — unique, stable identifier
 *   difficulty:     'Easy'|'Medium'|'Hard'
 *   title:          string          — shown in the level sub-header
 *   prompt:         string          — the SQL challenge description
 *   schema:         SchemaTable[]   — one entry per table involved
 *   sampleData:     Record<tableName, object[]>   — representative rows per table
 *   expectedOutput: { columns: string[], rows: string[][] }
 *   correctSql:     string          — the canonical solution (shown on Game Over)
 * }
 */

// ─── Helper type documentation (JSDoc) ───────────────────────────────────────
/**
 * @typedef {{ name: string, type: string, constraint: string }} SchemaColumn
 * @typedef {{ tableName: string, columns: SchemaColumn[] }}     SchemaTable
 */

export const questions = [

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  EASY  —  SELECT · WHERE · ORDER BY · simple aggregates                ║
  // ╚══════════════════════════════════════════════════════════════════════════╝

  // ── E-1 ──────────────────────────────────────────────────────────────────
  {
    id: 1,
    difficulty: 'Easy',
    title: 'Active Engineering Employees',
    prompt:
      "Find all active employees working in the Engineering department. " +
      "Return their first_name, last_name, and salary. " +
      "Order results alphabetically by last_name.",

    schema: [
      {
        tableName: 'employees',
        columns: [
          { name: 'employee_id', type: 'INT',           constraint: 'PK'       },
          { name: 'first_name',  type: 'VARCHAR(50)',   constraint: 'NOT NULL' },
          { name: 'last_name',   type: 'VARCHAR(50)',   constraint: 'NOT NULL' },
          { name: 'department',  type: 'VARCHAR(50)',   constraint: 'NOT NULL' },
          { name: 'salary',      type: 'DECIMAL(10,2)', constraint: 'NOT NULL' },
          { name: 'hire_date',   type: 'DATE',          constraint: 'NOT NULL' },
          { name: 'status',      type: 'VARCHAR(20)',   constraint: 'NOT NULL' },
        ],
      },
    ],

    sampleData: {
      employees: [
        { employee_id: 1, first_name: 'Alice',  last_name: 'Johnson',  department: 'Engineering', salary: 95000.00, hire_date: '2021-03-15', status: 'active'   },
        { employee_id: 2, first_name: 'Bob',    last_name: 'Martinez', department: 'Sales',       salary: 72000.00, hire_date: '2020-07-22', status: 'active'   },
        { employee_id: 3, first_name: 'Carol',  last_name: 'White',    department: 'Engineering', salary: 88000.00, hire_date: '2022-01-10', status: 'inactive' },
        { employee_id: 4, first_name: 'David',  last_name: 'Lee',      department: 'Engineering', salary: 102000.00,hire_date: '2019-11-05', status: 'active'   },
      ],
    },

    expectedOutput: {
      columns: ['first_name', 'last_name', 'salary'],
      rows: [
        ['Alice', 'Johnson', '95000.00'],
        ['David', 'Lee',     '102000.00'],
      ],
    },

    correctSql:
`SELECT first_name, last_name, salary
FROM employees
WHERE department = 'Engineering'
  AND status = 'active'
ORDER BY last_name;`,
  },

  // ── E-2 ──────────────────────────────────────────────────────────────────
  {
    id: 2,
    difficulty: 'Easy',
    title: 'Budget-Friendly Products',
    prompt:
      "Find all products that are available for purchase and priced under $50.00. " +
      "Return the name, category, and price. " +
      "Order results by price from lowest to highest.",

    schema: [
      {
        tableName: 'products',
        columns: [
          { name: 'product_id',     type: 'INT',           constraint: 'PK'       },
          { name: 'name',           type: 'VARCHAR(100)',  constraint: 'NOT NULL' },
          { name: 'category',       type: 'VARCHAR(50)',   constraint: 'NOT NULL' },
          { name: 'price',          type: 'DECIMAL(10,2)', constraint: 'NOT NULL' },
          { name: 'stock_quantity', type: 'INT',           constraint: 'NOT NULL' },
          { name: 'is_available',   type: 'BOOLEAN',       constraint: 'NOT NULL' },
        ],
      },
    ],

    sampleData: {
      products: [
        { product_id: 1, name: 'Wireless Mouse',  category: 'Electronics', price: 29.99, stock_quantity: 150, is_available: true  },
        { product_id: 2, name: 'Office Chair',    category: 'Furniture',   price: 299.00,stock_quantity: 25,  is_available: true  },
        { product_id: 3, name: 'USB Hub',         category: 'Electronics', price: 19.99, stock_quantity: 200, is_available: false },
        { product_id: 4, name: 'Notebook Pack',   category: 'Stationery',  price: 8.99,  stock_quantity: 500, is_available: true  },
        { product_id: 5, name: 'Laptop Stand',    category: 'Electronics', price: 45.00, stock_quantity: 80,  is_available: true  },
      ],
    },

    expectedOutput: {
      columns: ['name', 'category', 'price'],
      rows: [
        ['Notebook Pack',  'Stationery',  '8.99'],
        ['Wireless Mouse', 'Electronics', '29.99'],
        ['Laptop Stand',   'Electronics', '45.00'],
        // USB Hub excluded: is_available = false
        // Office Chair excluded: price >= 50
      ],
    },

    correctSql:
`SELECT name, category, price
FROM products
WHERE price < 50.00
  AND is_available = true
ORDER BY price ASC;`,
  },

  // ── E-3 ──────────────────────────────────────────────────────────────────
  {
    id: 3,
    difficulty: 'Easy',
    title: 'New York Customer List',
    prompt:
      "Retrieve all customers whose city is 'New York'. " +
      "Return first_name, last_name, and email. " +
      "Order results alphabetically by last_name.",

    schema: [
      {
        tableName: 'customers',
        columns: [
          { name: 'customer_id', type: 'INT',           constraint: 'PK'       },
          { name: 'first_name',  type: 'VARCHAR(50)',   constraint: 'NOT NULL' },
          { name: 'last_name',   type: 'VARCHAR(50)',   constraint: 'NOT NULL' },
          { name: 'email',       type: 'VARCHAR(100)',  constraint: 'UNIQUE'   },
          { name: 'city',        type: 'VARCHAR(50)',   constraint: 'NOT NULL' },
          { name: 'country',     type: 'CHAR(3)',       constraint: 'NOT NULL' },
          { name: 'created_at',  type: 'TIMESTAMP',     constraint: 'NOT NULL' },
        ],
      },
    ],

    sampleData: {
      customers: [
        { customer_id: 1, first_name: 'Sarah',   last_name: 'Connor',  email: 's.connor@email.com', city: 'New York',    country: 'USA', created_at: '2023-01-15 08:00:00' },
        { customer_id: 2, first_name: 'James',   last_name: 'Brown',   email: 'j.brown@email.com',  city: 'Los Angeles', country: 'USA', created_at: '2023-02-20 10:30:00' },
        { customer_id: 3, first_name: 'Emma',    last_name: 'Davis',   email: 'e.davis@email.com',  city: 'New York',    country: 'USA', created_at: '2022-11-30 14:15:00' },
        { customer_id: 4, first_name: 'Michael', last_name: 'Chen',    email: 'm.chen@email.com',   city: 'Chicago',     country: 'USA', created_at: '2023-03-08 09:45:00' },
      ],
    },

    expectedOutput: {
      columns: ['first_name', 'last_name', 'email'],
      rows: [
        ['Sarah', 'Connor', 's.connor@email.com'],
        ['Emma',  'Davis',  'e.davis@email.com'],
      ],
    },

    correctSql:
`SELECT first_name, last_name, email
FROM customers
WHERE city = 'New York'
ORDER BY last_name;`,
  },

  // ── E-4 ──────────────────────────────────────────────────────────────────
  {
    id: 4,
    difficulty: 'Easy',
    title: 'Recent Pending Orders',
    prompt:
      "Retrieve all orders whose status is 'pending'. " +
      "Return order_id, customer_id, total_amount, and created_at. " +
      "Show the most recently created orders first.",

    schema: [
      {
        tableName: 'orders',
        columns: [
          { name: 'order_id',     type: 'INT',           constraint: 'PK'       },
          { name: 'customer_id',  type: 'INT',           constraint: 'NOT NULL' },
          { name: 'status',       type: 'VARCHAR(20)',   constraint: 'NOT NULL' },
          { name: 'total_amount', type: 'DECIMAL(10,2)', constraint: 'NOT NULL' },
          { name: 'created_at',   type: 'TIMESTAMP',     constraint: 'NOT NULL' },
        ],
      },
    ],

    sampleData: {
      orders: [
        { order_id: 1001, customer_id: 1, status: 'shipped',   total_amount: 149.99, created_at: '2023-10-01 09:15:00' },
        { order_id: 1002, customer_id: 2, status: 'pending',   total_amount: 89.50,  created_at: '2023-10-05 14:30:00' },
        { order_id: 1003, customer_id: 3, status: 'pending',   total_amount: 220.00, created_at: '2023-10-08 11:00:00' },
        { order_id: 1004, customer_id: 1, status: 'delivered', total_amount: 55.00,  created_at: '2023-09-28 16:45:00' },
      ],
    },

    expectedOutput: {
      columns: ['order_id', 'customer_id', 'total_amount', 'created_at'],
      rows: [
        ['1003', '3', '220.00', '2023-10-08 11:00:00'],
        ['1002', '2', '89.50',  '2023-10-05 14:30:00'],
      ],
    },

    correctSql:
`SELECT order_id, customer_id, total_amount, created_at
FROM orders
WHERE status = 'pending'
ORDER BY created_at DESC;`,
  },

  // ── E-5 ──────────────────────────────────────────────────────────────────
  {
    id: 5,
    difficulty: 'Easy',
    title: 'Well-Stocked Electronics',
    prompt:
      "Find all products in the 'Electronics' category that have more than " +
      "100 units in stock. Return the name, price, and stock_quantity. " +
      "Order by stock_quantity from highest to lowest.",

    schema: [
      {
        tableName: 'products',
        columns: [
          { name: 'product_id',     type: 'INT',           constraint: 'PK'       },
          { name: 'name',           type: 'VARCHAR(100)',  constraint: 'NOT NULL' },
          { name: 'category',       type: 'VARCHAR(50)',   constraint: 'NOT NULL' },
          { name: 'price',          type: 'DECIMAL(10,2)', constraint: 'NOT NULL' },
          { name: 'stock_quantity', type: 'INT',           constraint: 'NOT NULL' },
          { name: 'is_available',   type: 'BOOLEAN',       constraint: 'NOT NULL' },
        ],
      },
    ],

    sampleData: {
      products: [
        { product_id: 6, name: '4K Monitor',          category: 'Electronics', price: 599.00, stock_quantity: 45,  is_available: true },
        { product_id: 7, name: 'Mechanical Keyboard', category: 'Electronics', price: 149.99, stock_quantity: 120, is_available: true },
        { product_id: 8, name: 'Webcam HD',           category: 'Electronics', price: 79.99,  stock_quantity: 95,  is_available: true },
        { product_id: 9, name: 'Gaming Headset',      category: 'Electronics', price: 89.99,  stock_quantity: 200, is_available: true },
      ],
    },

    expectedOutput: {
      columns: ['name', 'price', 'stock_quantity'],
      rows: [
        ['Gaming Headset',      '89.99',  '200'],
        ['Mechanical Keyboard', '149.99', '120'],
        // Webcam HD (95) and 4K Monitor (45) excluded: stock_quantity <= 100
      ],
    },

    correctSql:
`SELECT name, price, stock_quantity
FROM products
WHERE category = 'Electronics'
  AND stock_quantity > 100
ORDER BY stock_quantity DESC;`,
  },


  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  MEDIUM  —  JOIN · GROUP BY · HAVING · subqueries                      ║
  // ╚══════════════════════════════════════════════════════════════════════════╝

  // ── M-1 ──────────────────────────────────────────────────────────────────
  {
    id: 6,
    difficulty: 'Medium',
    title: 'Revenue by Product Category',
    prompt:
      "Join order_items with products to calculate total revenue per category " +
      "(revenue = quantity × unit_price). Only include categories where total " +
      "revenue exceeds $500.00. Order by total_revenue descending.",

    schema: [
      {
        tableName: 'order_items',
        columns: [
          { name: 'order_item_id', type: 'INT',           constraint: 'PK'       },
          { name: 'order_id',      type: 'INT',           constraint: 'NOT NULL' },
          { name: 'product_id',    type: 'INT',           constraint: 'FK → products' },
          { name: 'quantity',      type: 'INT',           constraint: 'NOT NULL' },
          { name: 'unit_price',    type: 'DECIMAL(10,2)', constraint: 'NOT NULL' },
        ],
      },
      {
        tableName: 'products',
        columns: [
          { name: 'product_id', type: 'INT',           constraint: 'PK'       },
          { name: 'name',       type: 'VARCHAR(100)',  constraint: 'NOT NULL' },
          { name: 'category',   type: 'VARCHAR(50)',   constraint: 'NOT NULL' },
          { name: 'price',      type: 'DECIMAL(10,2)', constraint: 'NOT NULL' },
        ],
      },
    ],

    sampleData: {
      // Electronics total: 2×149.99 + 1×89.99 + 1×149.99 = 539.96  ✓ > 500
      // Furniture  total: 2×299.00 = 598.00                          ✓ > 500
      // Stationery total: 3×8.99  = 26.97                            ✗ < 500
      order_items: [
        { order_item_id: 1, order_id: 1001, product_id: 7,  quantity: 2, unit_price: 149.99 },
        { order_item_id: 2, order_id: 1001, product_id: 9,  quantity: 1, unit_price: 89.99  },
        { order_item_id: 3, order_id: 1002, product_id: 7,  quantity: 1, unit_price: 149.99 },
        { order_item_id: 4, order_id: 1002, product_id: 10, quantity: 2, unit_price: 299.00 },
        { order_item_id: 5, order_id: 1003, product_id: 4,  quantity: 3, unit_price: 8.99   },
      ],
      products: [
        { product_id: 4,  name: 'Notebook Pack',       category: 'Stationery',  price: 8.99   },
        { product_id: 7,  name: 'Mechanical Keyboard', category: 'Electronics', price: 149.99 },
        { product_id: 9,  name: 'Gaming Headset',      category: 'Electronics', price: 89.99  },
        { product_id: 10, name: 'Office Chair',        category: 'Furniture',   price: 299.00 },
      ],
    },

    expectedOutput: {
      columns: ['category', 'total_revenue'],
      rows: [
        ['Furniture',   '598.00'],
        ['Electronics', '539.96'],
        // Stationery (26.97) filtered by HAVING
      ],
    },

    correctSql:
`SELECT p.category,
       ROUND(SUM(oi.quantity * oi.unit_price), 2) AS total_revenue
FROM order_items oi
JOIN products p ON oi.product_id = p.product_id
GROUP BY p.category
HAVING SUM(oi.quantity * oi.unit_price) > 500
ORDER BY total_revenue DESC;`,
  },

  // ── M-2 ──────────────────────────────────────────────────────────────────
  {
    id: 7,
    difficulty: 'Medium',
    title: 'High-Frequency Customers',
    prompt:
      "Find customers who have placed more than 3 orders. " +
      "Return customer_id and their total order_count. " +
      "Order by order_count descending.",

    schema: [
      {
        tableName: 'orders',
        columns: [
          { name: 'order_id',     type: 'INT',           constraint: 'PK'       },
          { name: 'customer_id',  type: 'INT',           constraint: 'NOT NULL' },
          { name: 'status',       type: 'VARCHAR(20)',   constraint: 'NOT NULL' },
          { name: 'total_amount', type: 'DECIMAL(10,2)', constraint: 'NOT NULL' },
          { name: 'created_at',   type: 'TIMESTAMP',     constraint: 'NOT NULL' },
        ],
      },
    ],

    sampleData: {
      // customer 7 → 5 orders  ✓
      // customer 3 → 4 orders  ✓
      // customer 2 → 2 orders  ✗
      orders: [
        { order_id: 1001, customer_id: 7, status: 'delivered', total_amount: 330.00, created_at: '2023-06-15 10:00:00' },
        { order_id: 1002, customer_id: 7, status: 'delivered', total_amount: 110.00, created_at: '2023-07-03 14:00:00' },
        { order_id: 1003, customer_id: 3, status: 'delivered', total_amount: 149.99, created_at: '2023-07-20 09:30:00' },
        { order_id: 1004, customer_id: 7, status: 'delivered', total_amount: 75.50,  created_at: '2023-08-05 11:15:00' },
        { order_id: 1005, customer_id: 3, status: 'delivered', total_amount: 89.50,  created_at: '2023-08-15 16:00:00' },
        { order_id: 1006, customer_id: 7, status: 'shipped',   total_amount: 240.00, created_at: '2023-09-01 08:00:00' },
        { order_id: 1007, customer_id: 3, status: 'delivered', total_amount: 220.00, created_at: '2023-09-10 13:45:00' },
        { order_id: 1008, customer_id: 2, status: 'delivered', total_amount: 190.00, created_at: '2023-09-18 10:00:00' },
        { order_id: 1009, customer_id: 7, status: 'pending',   total_amount: 95.00,  created_at: '2023-10-02 09:00:00' },
        { order_id: 1010, customer_id: 3, status: 'pending',   total_amount: 55.00,  created_at: '2023-10-05 17:00:00' },
        { order_id: 1011, customer_id: 2, status: 'shipped',   total_amount: 80.00,  created_at: '2023-10-10 12:00:00' },
      ],
    },

    expectedOutput: {
      columns: ['customer_id', 'order_count'],
      rows: [
        ['7', '5'],
        ['3', '4'],
      ],
    },

    correctSql:
`SELECT customer_id, COUNT(*) AS order_count
FROM orders
GROUP BY customer_id
HAVING COUNT(*) > 3
ORDER BY order_count DESC;`,
  },

  // ── M-3 ──────────────────────────────────────────────────────────────────
  {
    id: 8,
    difficulty: 'Medium',
    title: 'Department Salary Analysis',
    prompt:
      "Calculate the average salary and headcount for each department. " +
      "Only include departments with at least 3 employees. " +
      "Round avg_salary to 2 decimal places. Order by avg_salary descending.",

    schema: [
      {
        tableName: 'employees',
        columns: [
          { name: 'employee_id', type: 'INT',           constraint: 'PK'       },
          { name: 'first_name',  type: 'VARCHAR(50)',   constraint: 'NOT NULL' },
          { name: 'last_name',   type: 'VARCHAR(50)',   constraint: 'NOT NULL' },
          { name: 'department',  type: 'VARCHAR(50)',   constraint: 'NOT NULL' },
          { name: 'salary',      type: 'DECIMAL(10,2)', constraint: 'NOT NULL' },
          { name: 'hire_date',   type: 'DATE',          constraint: 'NOT NULL' },
          { name: 'status',      type: 'VARCHAR(20)',   constraint: 'NOT NULL' },
        ],
      },
    ],

    sampleData: {
      // Engineering: 4 employees → avg 96250.00  ✓
      // Marketing:   3 employees → avg 78333.33  ✓
      // Sales:       2 employees → filtered      ✗
      employees: [
        { employee_id: 1,  first_name: 'Alice',   last_name: 'Johnson',  department: 'Engineering', salary: 95000.00, hire_date: '2021-03-15', status: 'active' },
        { employee_id: 2,  first_name: 'Bob',     last_name: 'Martinez', department: 'Sales',       salary: 72000.00, hire_date: '2020-07-22', status: 'active' },
        { employee_id: 3,  first_name: 'Carol',   last_name: 'White',    department: 'Engineering', salary: 88000.00, hire_date: '2022-01-10', status: 'active' },
        { employee_id: 4,  first_name: 'David',   last_name: 'Lee',      department: 'Engineering', salary: 102000.00,hire_date: '2019-11-05', status: 'active' },
        { employee_id: 5,  first_name: 'Elena',   last_name: 'Park',     department: 'Marketing',   salary: 81000.00, hire_date: '2021-06-01', status: 'active' },
        { employee_id: 6,  first_name: 'Frank',   last_name: 'Okafor',   department: 'Engineering', salary: 100000.00,hire_date: '2020-03-18', status: 'active' },
        { employee_id: 7,  first_name: 'Grace',   last_name: 'Tan',      department: 'Marketing',   salary: 76000.00, hire_date: '2022-09-05', status: 'active' },
        { employee_id: 8,  first_name: 'Henry',   last_name: 'Silva',    department: 'Sales',       salary: 68000.00, hire_date: '2023-01-20', status: 'active' },
        { employee_id: 9,  first_name: 'Isabel',  last_name: 'Nguyen',   department: 'Marketing',   salary: 78000.00, hire_date: '2021-11-14', status: 'active' },
      ],
    },

    expectedOutput: {
      // Engineering avg: (95000+88000+102000+100000)/4 = 385000/4 = 96250.00
      // Marketing avg:   (81000+76000+78000)/3 = 235000/3 = 78333.33
      columns: ['department', 'avg_salary', 'headcount'],
      rows: [
        ['Engineering', '96250.00', '4'],
        ['Marketing',   '78333.33', '3'],
      ],
    },

    correctSql:
`SELECT department,
       ROUND(AVG(salary), 2) AS avg_salary,
       COUNT(*)               AS headcount
FROM employees
GROUP BY department
HAVING COUNT(*) >= 3
ORDER BY avg_salary DESC;`,
  },

  // ── M-4 ──────────────────────────────────────────────────────────────────
  {
    id: 9,
    difficulty: 'Medium',
    title: 'Products Never Ordered',
    prompt:
      "Find all products that have never appeared in any order. " +
      "Use a LEFT JOIN between products and order_items. " +
      "Return product_id, name, and category. Order by name.",

    schema: [
      {
        tableName: 'products',
        columns: [
          { name: 'product_id',     type: 'INT',           constraint: 'PK'       },
          { name: 'name',           type: 'VARCHAR(100)',  constraint: 'NOT NULL' },
          { name: 'category',       type: 'VARCHAR(50)',   constraint: 'NOT NULL' },
          { name: 'price',          type: 'DECIMAL(10,2)', constraint: 'NOT NULL' },
          { name: 'stock_quantity', type: 'INT',           constraint: 'NOT NULL' },
        ],
      },
      {
        tableName: 'order_items',
        columns: [
          { name: 'order_item_id', type: 'INT', constraint: 'PK'              },
          { name: 'order_id',      type: 'INT', constraint: 'NOT NULL'        },
          { name: 'product_id',    type: 'INT', constraint: 'FK → products'   },
          { name: 'quantity',      type: 'INT', constraint: 'NOT NULL'        },
        ],
      },
    ],

    sampleData: {
      products: [
        { product_id: 1,  name: 'Wireless Mouse',  category: 'Electronics', price: 29.99,  stock_quantity: 150 },
        { product_id: 2,  name: 'Office Chair',    category: 'Furniture',   price: 299.00, stock_quantity: 25  },
        { product_id: 3,  name: 'Laptop Stand',    category: 'Electronics', price: 45.00,  stock_quantity: 80  },
        { product_id: 4,  name: 'Standing Desk',   category: 'Furniture',   price: 599.00, stock_quantity: 10  },
        { product_id: 5,  name: 'Webcam HD',       category: 'Electronics', price: 79.99,  stock_quantity: 95  },
      ],
      order_items: [
        { order_item_id: 1, order_id: 1001, product_id: 1, quantity: 2 },
        { order_item_id: 2, order_id: 1001, product_id: 2, quantity: 1 },
        { order_item_id: 3, order_id: 1002, product_id: 1, quantity: 1 },
        // products 3, 4, 5 have never been ordered
      ],
    },

    expectedOutput: {
      columns: ['product_id', 'name', 'category'],
      rows: [
        ['3', 'Laptop Stand',  'Electronics'],
        ['4', 'Standing Desk', 'Furniture'],
        ['5', 'Webcam HD',     'Electronics'],
      ],
    },

    correctSql:
`SELECT p.product_id, p.name, p.category
FROM products p
LEFT JOIN order_items oi ON p.product_id = oi.product_id
WHERE oi.product_id IS NULL
ORDER BY p.name;`,
  },

  // ── M-5 ──────────────────────────────────────────────────────────────────
  {
    id: 10,
    difficulty: 'Medium',
    title: 'Monthly Revenue Summary — 2023',
    prompt:
      "Summarise order activity for every month in 2023. " +
      "For each month return the truncated month date, order_count, and " +
      "monthly_revenue (rounded to 2 decimal places). Order chronologically.",

    schema: [
      {
        tableName: 'orders',
        columns: [
          { name: 'order_id',     type: 'INT',           constraint: 'PK'       },
          { name: 'customer_id',  type: 'INT',           constraint: 'NOT NULL' },
          { name: 'status',       type: 'VARCHAR(20)',   constraint: 'NOT NULL' },
          { name: 'total_amount', type: 'DECIMAL(10,2)', constraint: 'NOT NULL' },
          { name: 'created_at',   type: 'TIMESTAMP',     constraint: 'NOT NULL' },
        ],
      },
    ],

    sampleData: {
      // Jan: orders 1001+1002 → count 2, revenue 149.99+89.50 = 239.49
      // Feb: orders 1003+1004 → count 2, revenue 220.00+55.00 = 275.00
      // Mar: orders 1005+1006+1007 → count 3, revenue 330.00+110.00+75.50 = 515.50
      orders: [
        { order_id: 1001, customer_id: 1, status: 'delivered', total_amount: 149.99, created_at: '2023-01-12 10:00:00' },
        { order_id: 1002, customer_id: 2, status: 'delivered', total_amount: 89.50,  created_at: '2023-01-28 15:30:00' },
        { order_id: 1003, customer_id: 3, status: 'delivered', total_amount: 220.00, created_at: '2023-02-05 09:00:00' },
        { order_id: 1004, customer_id: 1, status: 'delivered', total_amount: 55.00,  created_at: '2023-02-19 14:00:00' },
        { order_id: 1005, customer_id: 4, status: 'delivered', total_amount: 330.00, created_at: '2023-03-03 11:00:00' },
        { order_id: 1006, customer_id: 2, status: 'shipped',   total_amount: 110.00, created_at: '2023-03-17 16:00:00' },
        { order_id: 1007, customer_id: 5, status: 'delivered', total_amount: 75.50,  created_at: '2023-03-29 08:30:00' },
      ],
    },

    expectedOutput: {
      columns: ['month', 'order_count', 'monthly_revenue'],
      rows: [
        ['2023-01-01', '2', '239.49'],
        ['2023-02-01', '2', '275.00'],
        ['2023-03-01', '3', '515.50'],
      ],
    },

    correctSql:
`SELECT DATE_TRUNC('month', created_at)  AS month,
       COUNT(*)                           AS order_count,
       ROUND(SUM(total_amount), 2)        AS monthly_revenue
FROM orders
WHERE created_at >= '2023-01-01'
  AND created_at  < '2024-01-01'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;`,
  },


  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  HARD  —  CTEs · window functions · LAG · CASE cohorts                 ║
  // ╚══════════════════════════════════════════════════════════════════════════╝

  // ── H-1 ──────────────────────────────────────────────────────────────────
  {
    id: 11,
    difficulty: 'Hard',
    title: 'Top 2 Earners per Department',
    prompt:
      "Using a CTE and RANK() window function, find the two highest-paid employees " +
      "in each department. Return first_name, last_name, department, salary, and " +
      "salary_rank. Order by department then rank.",

    schema: [
      {
        tableName: 'employees',
        columns: [
          { name: 'employee_id', type: 'INT',           constraint: 'PK'       },
          { name: 'first_name',  type: 'VARCHAR(50)',   constraint: 'NOT NULL' },
          { name: 'last_name',   type: 'VARCHAR(50)',   constraint: 'NOT NULL' },
          { name: 'department',  type: 'VARCHAR(50)',   constraint: 'NOT NULL' },
          { name: 'salary',      type: 'DECIMAL(10,2)', constraint: 'NOT NULL' },
          { name: 'hire_date',   type: 'DATE',          constraint: 'NOT NULL' },
          { name: 'status',      type: 'VARCHAR(20)',   constraint: 'NOT NULL' },
        ],
      },
    ],

    sampleData: {
      // Engineering: Carol(102000)→rank1, Frank(100000)→rank2, Alice(95000)→rank3(excluded)
      // Marketing:   Elena(81000)→rank1, Isabel(78000)→rank2, Grace(76000)→rank3(excluded)
      employees: [
        { employee_id: 1,  first_name: 'Alice',  last_name: 'Johnson', department: 'Engineering', salary: 95000.00,  hire_date: '2021-03-15', status: 'active' },
        { employee_id: 3,  first_name: 'Carol',  last_name: 'White',   department: 'Engineering', salary: 102000.00, hire_date: '2022-01-10', status: 'active' },
        { employee_id: 5,  first_name: 'Elena',  last_name: 'Park',    department: 'Marketing',   salary: 81000.00,  hire_date: '2021-06-01', status: 'active' },
        { employee_id: 6,  first_name: 'Frank',  last_name: 'Okafor',  department: 'Engineering', salary: 100000.00, hire_date: '2020-03-18', status: 'active' },
        { employee_id: 7,  first_name: 'Grace',  last_name: 'Tan',     department: 'Marketing',   salary: 76000.00,  hire_date: '2022-09-05', status: 'active' },
        { employee_id: 9,  first_name: 'Isabel', last_name: 'Nguyen',  department: 'Marketing',   salary: 78000.00,  hire_date: '2021-11-14', status: 'active' },
      ],
    },

    expectedOutput: {
      columns: ['first_name', 'last_name', 'department', 'salary', 'salary_rank'],
      rows: [
        ['Carol',  'White',  'Engineering', '102000.00', '1'],
        ['Frank',  'Okafor', 'Engineering', '100000.00', '2'],
        ['Elena',  'Park',   'Marketing',   '81000.00',  '1'],
        ['Isabel', 'Nguyen', 'Marketing',   '78000.00',  '2'],
      ],
    },

    correctSql:
`WITH ranked AS (
  SELECT first_name,
         last_name,
         department,
         salary,
         RANK() OVER (
           PARTITION BY department
           ORDER BY salary DESC
         ) AS salary_rank
  FROM employees
)
SELECT first_name, last_name, department, salary, salary_rank
FROM ranked
WHERE salary_rank <= 2
ORDER BY department, salary_rank;`,
  },

  // ── H-2 ──────────────────────────────────────────────────────────────────
  {
    id: 12,
    difficulty: 'Hard',
    title: 'Cumulative Revenue by Order Date',
    prompt:
      "For every order in October 2023, show order_id, order_date (cast to DATE), " +
      "total_amount, and a running_total — the cumulative revenue up to and including " +
      "that order. Use SUM() as a window function ordered by created_at.",

    schema: [
      {
        tableName: 'orders',
        columns: [
          { name: 'order_id',     type: 'INT',           constraint: 'PK'       },
          { name: 'customer_id',  type: 'INT',           constraint: 'NOT NULL' },
          { name: 'status',       type: 'VARCHAR(20)',   constraint: 'NOT NULL' },
          { name: 'total_amount', type: 'DECIMAL(10,2)', constraint: 'NOT NULL' },
          { name: 'created_at',   type: 'TIMESTAMP',     constraint: 'NOT NULL' },
        ],
      },
    ],

    sampleData: {
      orders: [
        { order_id: 2001, customer_id: 1, status: 'delivered', total_amount: 149.99, created_at: '2023-10-03 09:00:00' },
        { order_id: 2002, customer_id: 2, status: 'delivered', total_amount: 89.50,  created_at: '2023-10-07 14:00:00' },
        { order_id: 2003, customer_id: 3, status: 'shipped',   total_amount: 220.00, created_at: '2023-10-14 11:30:00' },
        { order_id: 2004, customer_id: 1, status: 'pending',   total_amount: 55.00,  created_at: '2023-10-21 16:00:00' },
      ],
    },

    expectedOutput: {
      // running totals: 149.99 → 239.49 → 459.49 → 514.49
      columns: ['order_id', 'order_date', 'total_amount', 'running_total'],
      rows: [
        ['2001', '2023-10-03', '149.99', '149.99'],
        ['2002', '2023-10-07', '89.50',  '239.49'],
        ['2003', '2023-10-14', '220.00', '459.49'],
        ['2004', '2023-10-21', '55.00',  '514.49'],
      ],
    },

    correctSql:
`SELECT order_id,
       created_at::DATE AS order_date,
       total_amount,
       SUM(total_amount) OVER (
         ORDER BY created_at
         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS running_total
FROM orders
WHERE created_at >= '2023-10-01'
  AND created_at  < '2023-11-01'
ORDER BY created_at;`,
  },

  // ── H-3 ──────────────────────────────────────────────────────────────────
  {
    id: 13,
    difficulty: 'Hard',
    title: 'Top 3 Products per Category',
    prompt:
      "Using a CTE and ROW_NUMBER(), find the three most expensive products in " +
      "each category. Return name, category, price, and price_rank. " +
      "Order by category then price_rank.",

    schema: [
      {
        tableName: 'products',
        columns: [
          { name: 'product_id',     type: 'INT',           constraint: 'PK'       },
          { name: 'name',           type: 'VARCHAR(100)',  constraint: 'NOT NULL' },
          { name: 'category',       type: 'VARCHAR(50)',   constraint: 'NOT NULL' },
          { name: 'price',          type: 'DECIMAL(10,2)', constraint: 'NOT NULL' },
          { name: 'stock_quantity', type: 'INT',           constraint: 'NOT NULL' },
          { name: 'is_available',   type: 'BOOLEAN',       constraint: 'NOT NULL' },
        ],
      },
    ],

    sampleData: {
      products: [
        { product_id: 11, name: 'Pro Laptop',         category: 'Electronics', price: 1299.00, stock_quantity: 30,  is_available: true },
        { product_id: 12, name: 'Wireless Mouse',     category: 'Electronics', price: 29.99,   stock_quantity: 150, is_available: true },
        { product_id: 13, name: 'Webcam HD',          category: 'Electronics', price: 79.99,   stock_quantity: 95,  is_available: true },
        { product_id: 14, name: 'Standing Desk',      category: 'Furniture',   price: 599.00,  stock_quantity: 10,  is_available: true },
        { product_id: 15, name: 'Office Chair',       category: 'Furniture',   price: 299.00,  stock_quantity: 25,  is_available: true },
        { product_id: 16, name: 'Desk Lamp',          category: 'Furniture',   price: 49.99,   stock_quantity: 200, is_available: true },
        { product_id: 17, name: 'Bookshelf',          category: 'Furniture',   price: 189.00,  stock_quantity: 40,  is_available: true },
        { product_id: 18, name: 'Premium Notebook',   category: 'Stationery',  price: 24.99,   stock_quantity: 300, is_available: true },
        { product_id: 19, name: 'Ballpoint Set',      category: 'Stationery',  price: 12.99,   stock_quantity: 500, is_available: true },
        { product_id: 20, name: 'Sticky Notes Pack',  category: 'Stationery',  price: 5.99,    stock_quantity: 800, is_available: true },
        { product_id: 21, name: 'Paperclip Box',      category: 'Stationery',  price: 3.99,    stock_quantity: 600, is_available: true },
      ],
    },

    expectedOutput: {
      // Electronics top 3: Pro Laptop, Webcam HD, Wireless Mouse
      // Furniture   top 3: Standing Desk, Office Chair, Bookshelf
      // Stationery  top 3: Premium Notebook, Ballpoint Set, Sticky Notes Pack
      columns: ['name', 'category', 'price', 'price_rank'],
      rows: [
        ['Pro Laptop',        'Electronics', '1299.00', '1'],
        ['Webcam HD',         'Electronics', '79.99',   '2'],
        ['Wireless Mouse',    'Electronics', '29.99',   '3'],
        ['Standing Desk',     'Furniture',   '599.00',  '1'],
        ['Office Chair',      'Furniture',   '299.00',  '2'],
        ['Bookshelf',         'Furniture',   '189.00',  '3'],
        ['Premium Notebook',  'Stationery',  '24.99',   '1'],
        ['Ballpoint Set',     'Stationery',  '12.99',   '2'],
        ['Sticky Notes Pack', 'Stationery',  '5.99',    '3'],
      ],
    },

    correctSql:
`WITH ranked_products AS (
  SELECT name,
         category,
         price,
         ROW_NUMBER() OVER (
           PARTITION BY category
           ORDER BY price DESC
         ) AS price_rank
  FROM products
)
SELECT name, category, price, price_rank
FROM ranked_products
WHERE price_rank <= 3
ORDER BY category, price_rank;`,
  },

  // ── H-4 ──────────────────────────────────────────────────────────────────
  {
    id: 14,
    difficulty: 'Hard',
    title: 'Days Between Customer Orders',
    prompt:
      "For each order, use LAG() to calculate how many days elapsed since that " +
      "customer's previous order. Return customer_id, order_id, order_date, " +
      "prev_order_date, and days_between (NULL for a customer's first order). " +
      "Order by customer_id, then order_date.",

    schema: [
      {
        tableName: 'orders',
        columns: [
          { name: 'order_id',     type: 'INT',           constraint: 'PK'       },
          { name: 'customer_id',  type: 'INT',           constraint: 'NOT NULL' },
          { name: 'status',       type: 'VARCHAR(20)',   constraint: 'NOT NULL' },
          { name: 'total_amount', type: 'DECIMAL(10,2)', constraint: 'NOT NULL' },
          { name: 'created_at',   type: 'TIMESTAMP',     constraint: 'NOT NULL' },
        ],
      },
    ],

    sampleData: {
      orders: [
        { order_id: 3001, customer_id: 2, status: 'delivered', total_amount: 190.00, created_at: '2023-09-01 10:00:00' },
        { order_id: 3002, customer_id: 3, status: 'delivered', total_amount: 149.99, created_at: '2023-08-01 09:00:00' },
        { order_id: 3003, customer_id: 3, status: 'delivered', total_amount: 89.50,  created_at: '2023-08-20 14:00:00' },
        { order_id: 3004, customer_id: 3, status: 'delivered', total_amount: 220.00, created_at: '2023-09-15 11:00:00' },
        { order_id: 3005, customer_id: 2, status: 'shipped',   total_amount: 80.00,  created_at: '2023-10-10 09:30:00' },
      ],
    },

    expectedOutput: {
      // customer 2: first order NULL, second order 39 days later
      // customer 3: first order NULL, then +19 days, then +26 days
      columns: ['customer_id', 'order_id', 'order_date', 'prev_order_date', 'days_between'],
      rows: [
        ['2', '3001', '2023-09-01', 'NULL',         'NULL'],
        ['2', '3005', '2023-10-10', '2023-09-01',   '39'],
        ['3', '3002', '2023-08-01', 'NULL',         'NULL'],
        ['3', '3003', '2023-08-20', '2023-08-01',   '19'],
        ['3', '3004', '2023-09-15', '2023-08-20',   '26'],
      ],
    },

    correctSql:
`SELECT customer_id,
       order_id,
       created_at::DATE AS order_date,
       LAG(created_at::DATE) OVER (
         PARTITION BY customer_id
         ORDER BY created_at
       ) AS prev_order_date,
       created_at::DATE - LAG(created_at::DATE) OVER (
         PARTITION BY customer_id
         ORDER BY created_at
       ) AS days_between
FROM orders
ORDER BY customer_id, created_at;`,
  },

  // ── H-5 ──────────────────────────────────────────────────────────────────
  {
    id: 15,
    difficulty: 'Hard',
    title: 'Employee Tenure Cohort Analysis',
    prompt:
      "Using a CTE, categorise every employee by tenure: " +
      "'Junior' (< 2 years), 'Mid-level' (2–5 years), 'Senior' (> 5 years). " +
      "For each cohort return employee_count and avg_salary (rounded to 2 dp). " +
      "Order by avg_salary descending.",

    schema: [
      {
        tableName: 'employees',
        columns: [
          { name: 'employee_id', type: 'INT',           constraint: 'PK'       },
          { name: 'first_name',  type: 'VARCHAR(50)',   constraint: 'NOT NULL' },
          { name: 'last_name',   type: 'VARCHAR(50)',   constraint: 'NOT NULL' },
          { name: 'department',  type: 'VARCHAR(50)',   constraint: 'NOT NULL' },
          { name: 'salary',      type: 'DECIMAL(10,2)', constraint: 'NOT NULL' },
          { name: 'hire_date',   type: 'DATE',          constraint: 'NOT NULL' },
          { name: 'status',      type: 'VARCHAR(20)',   constraint: 'NOT NULL' },
        ],
      },
    ],

    sampleData: {
      // As of 2026-04-14:
      //   Alice  2025-01-10 →  1.3 yrs → Junior    salary: 78000
      //   Bob    2022-11-05 →  3.5 yrs → Mid-level salary: 85000
      //   Carol  2021-06-20 →  4.8 yrs → Mid-level salary: 92000
      //   David  2017-03-15 →  9.1 yrs → Senior    salary: 105000
      //   Emma   2014-09-01 → 11.6 yrs → Senior    salary: 115000
      employees: [
        { employee_id: 10, first_name: 'Alice',  last_name: 'Kimura',   department: 'Sales',       salary: 78000.00,  hire_date: '2025-01-10', status: 'active' },
        { employee_id: 11, first_name: 'Bob',    last_name: 'Fletcher', department: 'Marketing',   salary: 85000.00,  hire_date: '2022-11-05', status: 'active' },
        { employee_id: 12, first_name: 'Carol',  last_name: 'Andrade',  department: 'Engineering', salary: 92000.00,  hire_date: '2021-06-20', status: 'active' },
        { employee_id: 13, first_name: 'David',  last_name: 'Osei',     department: 'Engineering', salary: 105000.00, hire_date: '2017-03-15', status: 'active' },
        { employee_id: 14, first_name: 'Emma',   last_name: 'Reyes',    department: 'Finance',     salary: 115000.00, hire_date: '2014-09-01', status: 'active' },
      ],
    },

    expectedOutput: {
      // Senior    → David+Emma    → avg (105000+115000)/2 = 110000.00
      // Mid-level → Bob+Carol     → avg (85000+92000)/2  =  88500.00
      // Junior    → Alice         → avg 78000.00
      columns: ['cohort', 'employee_count', 'avg_salary'],
      rows: [
        ['Senior',    '2', '110000.00'],
        ['Mid-level', '2', '88500.00'],
        ['Junior',    '1', '78000.00'],
      ],
    },

    correctSql:
`WITH tenure AS (
  SELECT salary,
         CASE
           WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, hire_date)) < 2  THEN 'Junior'
           WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, hire_date)) <= 5 THEN 'Mid-level'
           ELSE 'Senior'
         END AS cohort
  FROM employees
)
SELECT cohort,
       COUNT(*)              AS employee_count,
       ROUND(AVG(salary), 2) AS avg_salary
FROM tenure
GROUP BY cohort
ORDER BY avg_salary DESC;`,
  },

]

// ─── Convenience accessors ────────────────────────────────────────────────────

/** All question IDs in order. */
export const questionIds = questions.map(q => q.id)

/** Look up a single question by id. Returns undefined if not found. */
export const getQuestionById = (id) => questions.find(q => q.id === id)

/** Return all questions filtered by difficulty tier. */
export const getByDifficulty = (difficulty) =>
  questions.filter(q => q.difficulty === difficulty)

export default questions
