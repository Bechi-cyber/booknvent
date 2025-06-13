<?php
session_start();
require_once __DIR__ . '/../includes/db_connect.php';

if (!isset($_SESSION['user_id']) || !isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
    header('Location: ../login.php');
    exit;
}

// Fetch all bookings
$stmt = $pdo->query('SELECT bookings.id, bookings.booking_date, bookings.quantity, bookings.total_price, users.username, events.name AS event_name, events.date, events.time, events.venue FROM bookings JOIN users ON bookings.user_id = users.id JOIN events ON bookings.event_id = events.id ORDER BY bookings.booking_date DESC');
$bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manage Bookings - Admin Panel</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
</head>
<body class="bg-light">
<div class="container mt-5">
    <h2 class="mb-4 text-center">All Bookings</h2>
    <div class="mb-3 text-end">
        <a href="index.php" class="btn btn-secondary">Back to Admin Panel</a>
    </div>
    <table class="table table-bordered">
        <thead>
            <tr>
                <th>User</th>
                <th>Event</th>
                <th>Date</th>
                <th>Time</th>
                <th>Venue</th>
                <th>Tickets</th>
                <th>Total Price</th>
                <th>Booking Date</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($bookings as $booking): ?>
                <tr>
                    <td><?php echo htmlspecialchars($booking['username']); ?></td>
                    <td><?php echo htmlspecialchars($booking['event_name']); ?></td>
                    <td><?php echo htmlspecialchars($booking['date']); ?></td>
                    <td><?php echo htmlspecialchars($booking['time']); ?></td>
                    <td><?php echo htmlspecialchars($booking['venue']); ?></td>
                    <td><?php echo htmlspecialchars($booking['quantity']); ?></td>
                    <td>$<?php echo number_format($booking['total_price'], 2); ?></td>
                    <td><?php echo htmlspecialchars($booking['booking_date']); ?></td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>
</body>
</html>
