A Huququllah calculator, still in the process of being created. Available here: https://huququlator.com/

It's primary functions are categorizing expenses as necessary or unnecessary. 

Roadmap:
- Tracking of changes in assets over time
- Tracking of previous payments



Steps to install this project on a new ubuntu server. 

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
```

In the project directory

```bash
nano .env (modify with your values)
npm start
```

Navigate to: http://localhost:3000
