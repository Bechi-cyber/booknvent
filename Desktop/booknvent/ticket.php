<?php
session_start();
require_once __DIR__ . '/includes/db_connect.php';

if (!isset($_SESSION['user_id'])) {
    die('Unauthorized');
}
$user_id = $_SESSION['user_id'];

if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    die('Invalid ticket ID.');
}
$booking_id = (int)$_GET['id'];

// Fetch booking and event details
$stmt = $pdo->prepare('SELECT bookings.*, events.name AS event_name, events.date, events.time, events.venue FROM bookings JOIN events ON bookings.event_id = events.id WHERE bookings.id = ? AND bookings.user_id = ?');
$stmt->execute([$booking_id, $user_id]);
$booking = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$booking) {
    die('Ticket not found.');
}

header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="ticket_' . $booking_id . '.txt"');
echo "Event: " . $booking['event_name'] . "\n";
echo "Date: " . $booking['date'] . "\n";
echo "Time: " . $booking['time'] . "\n";
echo "Venue: " . $booking['venue'] . "\n";
echo "Tickets: " . $booking['quantity'] . "\n";
echo "Total Price: $" . number_format($booking['total_price'], 2) . "\n";
echo "Booking Date: " . $booking['booking_date'] . "\n";
echo "Attendee: User ID " . $booking['user_id'] . "\n";
// Placeholder for QR code or unique code
echo "Ticket Code: TKT-" . strtoupper(dechex($booking_id)) . "\n";
exit;
