<?php
// Initialize SQLite database with schema from init.sql
$db_file = __DIR__ . '/database.sqlite';
$sql_file = __DIR__ . '/init.sql';

try {
    $pdo = new PDO('sqlite:' . $db_file);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $schema = file_get_contents($sql_file);
    $pdo->exec($schema);
    echo "Database initialized successfully.";
} catch (PDOException $e) {
    die('Database initialization failed: ' . $e->getMessage());
}
