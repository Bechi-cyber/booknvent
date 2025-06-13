<?php
session_start();
require_once __DIR__ . '/includes/db_connect.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}
$user_id = $_SESSION['user_id'];

// Fetch bookings for the user
$stmt = $pdo->prepare('SELECT bookings.id, bookings.booking_date, bookings.quantity, bookings.total_price, events.name, events.date, events.time, events.venue FROM bookings JOIN events ON bookings.event_id = events.id WHERE bookings.user_id = ? ORDER BY bookings.booking_date DESC');
$stmt->execute([$user_id]);
$bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking History - Event Booking</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
</head>
<body class="bg-light">
<div class="container mt-5">
    <h2 class="mb-4 text-center">Your Booking History</h2>
    <?php if (empty($bookings)): ?>
        <div class="alert alert-info text-center">You have no bookings yet.</div>
    <?php else: ?>
        <table class="table table-bordered">
            <thead>
                <tr>
                    <th>Event</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Venue</th>
                    <th>Tickets</th>
                    <th>Total Price</th>
                    <th>Booking Date</th>
                    <th>Ticket</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($bookings as $booking): ?>
                    <tr>
                        <td><?php echo htmlspecialchars($booking['name']); ?></td>
                        <td><?php echo htmlspecialchars($booking['date']); ?></td>
                        <td><?php echo htmlspecialchars($booking['time']); ?></td>
                        <td><?php echo htmlspecialchars($booking['venue']); ?></td>
                        <td><?php echo htmlspecialchars($booking['quantity']); ?></td>
                        <td>$<?php echo number_format($booking['total_price'], 2); ?></td>
                        <td><?php echo htmlspecialchars($booking['booking_date']); ?></td>
                        <td><a href="ticket.php?id=<?php echo $booking['id']; ?>" class="btn btn-outline-primary btn-sm">Download</a></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>
    <div class="mt-3 text-center">
        <a href="events.php" class="btn btn-secondary">Browse Events</a>
    </div>
</div>
</body>
</html>
