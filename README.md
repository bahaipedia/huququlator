This is a Ḥuqúqu’lláh calculator, available at https://huququlator.com

Its primary functions include providing a public calculator and, for logged in users, tracking assets, debts, payments, and amounts due, as well as automatically categorizing expenses.

Below are the steps to install this project on a new Ubuntu server:

```bash
sudo apt install -y nodejs npm
sudo apt install -y mysql-server
sudo apt install -y git curl build-essential
```

```bash
cd /path/to/your/project
git clone https://github.com/bahaipedia/huququlator.git
npm install
cp .env.example .env
```

Log in to mysql:

```bash
CREATE DATABASE project_database;
CREATE USER 'project_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON project_database.* TO 'project_user'@'localhost';
FLUSH PRIVILEGES;
USE project_database_name;
```

```bash
CREATE TABLE transactions (
    id INT(11) NOT NULL AUTO_INCREMENT,
    user_id INT(11) DEFAULT NULL,
    date DATE DEFAULT NULL,
    account VARCHAR(255) DEFAULT NULL,
    description VARCHAR(255) DEFAULT NULL,
    category VARCHAR(255) DEFAULT NULL,
    tags VARCHAR(255) DEFAULT NULL,
    amount DECIMAL(10,2) DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    upload_id INT(11) DEFAULT NULL,
    status ENUM('hi', 'ne', 'un') DEFAULT 'ne',
    PRIMARY KEY (id)
);
CREATE TABLE filter_rules (
    id INT(11) NOT NULL AUTO_INCREMENT,
    user_id INT(11) NOT NULL,
    field VARCHAR(50) NOT NULL,
    value VARCHAR(255) NOT NULL,
    mark_as ENUM('ne', 'un', 'hi') NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    origin_status ENUM('ne', 'un', 'hi') NOT NULL,
    PRIMARY KEY (id)
);
CREATE TABLE upload_history (
    id INT(11) NOT NULL AUTO_INCREMENT,
    user_id INT(11) NOT NULL,
    filename VARCHAR(255) DEFAULT NULL,
    upload_date TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    rows_imported INT(11) DEFAULT NULL,
    status ENUM('success', 'error') DEFAULT 'success',
    PRIMARY KEY (id),
    KEY (user_id)
);
CREATE TABLE users (
    id INT(11) NOT NULL AUTO_INCREMENT,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);
CREATE TABLE financial_labels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category ENUM('Assets', 'Debts', 'Expenses') NOT NULL,
    label VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, category, label)
);
CREATE TABLE financial_summary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    start_date DATE DEFAULT NULL,
    end_date DATE NOT NULL,
    total_assets DECIMAL(10, 2) DEFAULT 0.00,
    total_debts DECIMAL(10, 2) DEFAULT 0.00,
    unnecessary_expenses DECIMAL(10, 2) DEFAULT 0.00,
    wealth_already_taxed DECIMAL(10, 2) DEFAULT 0.00,
    gold_rate DECIMAL(10, 2) DEFAULT NULL,
    huquq_payments_made DECIMAL(10, 2) DEFAULT 0.00,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE financial_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    label_id INT NOT NULL,
    reporting_date DATE NOT NULL,
    value DECIMAL(10, 2) DEFAULT 0.00,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (label_id) REFERENCES financial_labels(id),
    UNIQUE(user_id, label_id, reporting_date) 
);
```

In the project directory

```bash
nano .env (modify with your values)
npm start
```

Navigate to: http://localhost:3000
