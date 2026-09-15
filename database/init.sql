CREATE TABLE IF NOT EXISTS predictions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  features_json JSON NOT NULL,
  status ENUM('pending', 'done', 'error') NOT NULL DEFAULT 'pending',
  label VARCHAR(64) NULL,
  probability FLOAT NULL,
  error_message VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
