-- Hook-A-Fish 钓鱼去 - 数据库初始化脚本
-- 在宝塔 phpMyAdmin 中执行此 SQL

-- 创建数据库 (如果未通过宝塔创建)
-- CREATE DATABASE IF NOT EXISTS hook_a_fish DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE hook_a_fish;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 分数表
CREATE TABLE IF NOT EXISTS scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  username VARCHAR(50) NOT NULL,
  score INT NOT NULL DEFAULT 0,
  fish_count INT NOT NULL DEFAULT 0,
  duration INT NOT NULL DEFAULT 60,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_score (score DESC),
  INDEX idx_created_at (created_at DESC),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入测试用户 (可选，密码：test123)
-- INSERT INTO users (username, password_hash) VALUES 
-- ('test', '$2a$10$YourHashedPasswordHere');

-- 查看表结构
-- DESCRIBE users;
-- DESCRIBE scores;
