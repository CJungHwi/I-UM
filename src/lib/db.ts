import "server-only"
import type { ConnectionOptions, Pool } from "mysql2/promise"

// DATABASE 연결 정보 생성 함수
function getDatabaseConfig(): ConnectionOptions {
    // DATABASE_URL이 직접 설정되어 있으면 파싱
    if (process.env.DATABASE_URL) {
        const url = new URL(process.env.DATABASE_URL)
        return {
            host: url.hostname,
            port: parseInt(url.port) || 3306,
            user: url.username,
            password: decodeURIComponent(url.password),
            database: url.pathname.slice(1), // 첫 번째 '/' 제거
        }
    }

    // 분리된 환경 변수로부터 설정 생성
    return {
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "3306"),
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || process.env.DATABASE_NAME || "",
    }
}

let pool: Pool | null = null

async function getPool(): Promise<Pool> {
    if (pool) return pool

    const mysql = await import("mysql2/promise")
    pool = mysql.createPool({
        ...getDatabaseConfig(),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
    })

    return pool
}

export async function callProcedure<T = any>(
    procedureName: string,
    ...params: any[]
): Promise<T[]> {
    const dbPool = await getPool()
    const connection = await dbPool.getConnection()
    try {
        const placeholders = params.map(() => "?").join(", ")
        const query = `CALL ${procedureName}(${placeholders})`

        const [results] = await connection.query(query, params)

        const resultArray = results as any[]
        if (Array.isArray(resultArray) && resultArray.length > 0 && Array.isArray(resultArray[0])) {
            return resultArray[0] as T[]
        }
        return resultArray as T[]
    } finally {
        connection.release()
    }
}

export async function executeQuery<T = any>(
    query: string,
    params?: any[]
): Promise<T[]> {
    const dbPool = await getPool()
    const connection = await dbPool.getConnection()
    try {
        const [results] = await connection.query(query, params || [])
        return results as T[]
    } finally {
        connection.release()
    }
}

export async function closePool(): Promise<void> {
    if (!pool) return
    await pool.end()
    pool = null
}
