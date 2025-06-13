<?php
session_start();
require_once __DIR__ . '/../includes/db_connect.php';

if (!isset($_SESSION['user_id']) || !isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
    header('Location: ../login.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel - Event Booking</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
</head>
<body class="bg-light">
<div class="container mt-5">
    <h2 class="mb-4 text-center">Admin Panel</h2>
    <div class="row justify-content-center">
        <div class="col-md-8">
            <div class="list-group">
                <a href="manage_events.php" class="list-group-item list-group-item-action">Manage Events</a>
                <a href="manage_bookings.php" class="list-group-item list-group-item-action">View All Bookings</a>
                <a href="reports.php" class="list-group-item list-group-item-action">Generate Reports</a>
                <a href="../dashboard.php" class="list-group-item list-group-item-action">Back to User Dashboard</a>
            </div>
        </div>
    </div>
</div>
</body>
</html>
