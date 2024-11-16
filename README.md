An experimental Huququllah calculator. It's primary functions are categorizing expenses as necessary or unnecessary. 

Roadmap:
- Tracking of changes in assets over time
- Tracking of previous payments



Installation on a new server. 

sudo apt install -y nodejs npm
sudo apt install -y mysql-server
sudo apt install -y git curl build-essential

cd /path/to/your/project
git clone https://github.com/bahaipedia/huququlator.git
npm install

nano .env with Database credentials (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET).

Create a database, then these tables:
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

