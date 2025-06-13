<?php
session_start();
require_once __DIR__ . '/includes/db_connect.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}
$user_id = $_SESSION['user_id'];

// Fetch cart items
$stmt = $pdo->prepare('SELECT cart.id, cart.quantity, events.id AS event_id, events.name, events.price FROM cart JOIN events ON cart.event_id = events.id WHERE cart.user_id = ?');
$stmt->execute([$user_id]);
$cart_items = $stmt->fetchAll(PDO::FETCH_ASSOC);
$total = 0;
foreach ($cart_items as $item) {
    $total += $item['price'] * $item['quantity'];
}

$message = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($cart_items)) {
    $attendee_name = trim($_POST['attendee_name']);
    $payment_info = trim($_POST['payment_info']); // Simulated
    if ($attendee_name && $payment_info) {
        // Simulate booking: move cart items to bookings
        $pdo->beginTransaction();
        try {
            foreach ($cart_items as $item) {
                $stmt = $pdo->prepare('INSERT INTO bookings (user_id, event_id, ticket_type, quantity, total_price) VALUES (?, ?, ?, ?, ?)');
                $stmt->execute([$user_id, $item['event_id'], 'Standard', $item['quantity'], $item['price'] * $item['quantity']]);
            }
            // Clear cart
            $stmt = $pdo->prepare('DELETE FROM cart WHERE user_id = ?');
            $stmt->execute([$user_id]);
            $pdo->commit();
            $message = 'Booking successful! Your tickets have been booked.';
        } catch (Exception $e) {
            $pdo->rollBack();
            $message = 'Booking failed: ' . $e->getMessage();
        }
    } else {
        $message = 'Please provide all required information.';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Checkout - Event Booking</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
</head>
<body class="bg-light">
<div class="container mt-5">
    <h2 class="mb-4 text-center">Checkout</h2>
    <?php if ($message): ?>
        <div class="alert alert-info text-center"><?php echo $message; ?></div>
    <?php endif; ?>
    <?php if (!empty($cart_items) && !$message): ?>
        <form method="post">
            <div class="mb-3">
                <label for="attendee_name" class="form-label">Attendee Name</label>
                <input type="text" class="form-control" id="attendee_name" name="attendee_name" required>
            </div>
            <div class="mb-3">
                <label for="payment_info" class="form-label">Payment Information</label>
                <input type="text" class="form-control" id="payment_info" name="payment_info" placeholder="Card Number (simulated)" required>
            </div>
            <h4>Total: $<?php echo number_format($total, 2); ?></h4>
            <button type="submit" class="btn btn-success w-100">Confirm Booking</button>
        </form>
    <?php elseif (empty($cart_items)): ?>
        <div class="alert alert-warning text-center">Your cart is empty. <a href="events.php">Browse events</a></div>
    <?php endif; ?>
    <div class="mt-3 text-center">
        <a href="cart.php" class="btn btn-secondary">Back to Cart</a>
    </div>
</div>
</body>
</html>
