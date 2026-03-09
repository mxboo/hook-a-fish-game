import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

// 数据库连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hook_a_fish',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// 测试数据库连接
export async function testConnection() {
  try {
    const connection = await pool.getConnection()
    console.log('✅ 数据库连接成功！')
    connection.release()
    return true
  } catch (error) {
    console.error('❌ 数据库连接失败:', error)
    return false
  }
}

// 初始化数据库表
export async function initializeDatabase() {
  try {
    const connection = await pool.getConnection()
    
    // 创建用户表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    console.log('✅ 用户表创建成功')

    // 创建分数表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS scores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        score INT NOT NULL DEFAULT 0,
        fish_count INT NOT NULL DEFAULT 0,
        duration INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_score (score),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    console.log('✅ 分数表创建成功')

    connection.release()
    return true
  } catch (error) {
    console.error('❌ 数据库表创建失败:', error)
    return false
  }
}

// 数据库查询辅助函数
export const db = {
  async createUser(username: string, email: string, passwordHash: string) {
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    )
    return result
  },

  async findUserByUsername(username: string) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    )
    return (rows as any[])[0]
  },

  async findUserByEmail(email: string) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    )
    return (rows as any[])[0]
  },

  async findUserById(id: number) {
    const [rows] = await pool.query(
      'SELECT id, username, email, created_at FROM users WHERE id = ?',
      [id]
    )
    return (rows as any[])[0]
  },

  async createScore(userId: number, score: number, fishCount: number, duration: number) {
    const [result] = await pool.query(
      'INSERT INTO scores (user_id, score, fish_count, duration) VALUES (?, ?, ?, ?)',
      [userId, score, fishCount, duration]
    )
    return result
  },

  async getLeaderboard(limit: number = 100) {
    const [rows] = await pool.query(`
      SELECT 
        s.id,
        s.score,
        s.fish_count,
        s.duration,
        s.created_at,
        u.id as user_id,
        u.username
      FROM scores s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.score DESC, s.created_at ASC
      LIMIT ?
    `, [limit])
    return rows
  },

  async getUserBestScore(userId: number) {
    const [rows] = await pool.query(
      `SELECT MAX(score) as best_score, COUNT(*) as total_games 
       FROM scores 
       WHERE user_id = ?`,
      [userId]
    )
    return (rows as any[])[0]
  },

  async getUserScores(userId: number, limit: number = 10) {
    const [rows] = await pool.query(
      `SELECT * FROM scores WHERE user_id = ? ORDER BY score DESC LIMIT ?`,
      [userId, limit]
    )
    return rows
  },

  async getUserRank(userId: number) {
    const [bestScoreResult] = await pool.query(
      `SELECT MAX(score) as best_score FROM scores WHERE user_id = ?`,
      [userId]
    )
    const bestScore = (bestScoreResult as any[])[0]?.best_score || 0

    if (bestScore === 0) return null

    const [rankResult] = await pool.query(
      `SELECT COUNT(DISTINCT user_id) as rank 
       FROM scores 
       WHERE score > ?`,
      [bestScore]
    )
    const rank = (rankResult as any[])[0]?.rank || 0
    return rank + 1
  },
}

export default pool
