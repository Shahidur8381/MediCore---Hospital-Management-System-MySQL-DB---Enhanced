/**
 * Database Initialization Script for MySQL (Aiven / Localhost)
 * Reads database/mysql_schema.sql and database/mysql_seed.sql and applies them to the connected database.
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runInit() {
    console.log('--- MediCore MySQL Database Initialization ---');
    const host = process.env.DB_HOST || 'localhost';
    const isAiven = host.includes('aivencloud.com') || process.env.DB_SSL === 'true';

    const config = {
        host: host,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'medicore',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        multipleStatements: true,
        timezone: 'Z'
    };

    if (isAiven || process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false') {
        config.ssl = { rejectUnauthorized: false };
    }

    console.log(`Connecting to MySQL database on ${config.host}:${config.port}/${config.database}...`);

    let connection;
    try {
        connection = await mysql.createConnection(config);
        console.log('Connected to MySQL successfully!\n');

        // 1. Read & Execute Schema
        const schemaPath = path.join(__dirname, '..', 'database', 'mysql_schema.sql');
        console.log(`Executing schema from: ${schemaPath}`);
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await connection.query(schemaSql);
        console.log('Schema created successfully! (9 core tables ready)\n');

        // 2. Read & Execute Seed Data
        const seedPath = path.join(__dirname, '..', 'database', 'mysql_seed.sql');
        console.log(`Executing seed data from: ${seedPath}`);
        const seedSql = fs.readFileSync(seedPath, 'utf8');
        await connection.query(seedSql);
        console.log('Seed data inserted successfully!\n');

        console.log('==============================================');
        console.log('Database initialization completed successfully!');
        console.log('Admin account:  admin / MediCore');
        console.log('Doctor account: Doctor1 / MediCore');
        console.log('Patient account: Patient1 / MediCore');
        console.log('Lab account:    lab / MediCore');
        console.log('==============================================');
    } catch (err) {
        console.error('Database initialization failed:', err.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runInit();
