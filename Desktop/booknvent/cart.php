<?php
session_start();
require_once __DIR__ . '/includes/db_connect.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}
$user_id = $_SESSION['user_id'];

// Add to cart
if (isset($_GET['add']) && is_numeric($_GET['add'])) {
    $event_id = (int)$_GET['add'];
    // Check if already in cart
    $stmt = $pdo->prepare('SELECT id, quantity FROM cart WHERE user_id = ? AND event_id = ?');
    $stmt->execute([$user_id, $event_id]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($item) {
        // Update quantity
        $stmt = $pdo->prepare('UPDATE cart SET quantity = quantity + 1 WHERE id = ?');
        $stmt->execute([$item['id']]);
    } else {
        // Add new item
        $stmt = $pdo->prepare('INSERT INTO cart (user_id, event_id, quantity) VALUES (?, ?, 1)');
        $stmt->execute([$user_id, $event_id]);
    }
    header('Location: cart.php');
    exit;
}

// Remove from cart
if (isset($_GET['remove']) && is_numeric($_GET['remove'])) {
    $cart_id = (int)$_GET['remove'];
    $stmt = $pdo->prepare('DELETE FROM cart WHERE id = ? AND user_id = ?');
    $stmt->execute([$cart_id, $user_id]);
    header('Location: cart.php');
    exit;
}

// Update quantities
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_cart'])) {
    foreach ($_POST['quantities'] as $cart_id => $quantity) {
        $quantity = max(1, (int)$quantity);
        $stmt = $pdo->prepare('UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?');
        $stmt->execute([$quantity, $cart_id, $user_id]);
    }
    header('Location: cart.php');
    exit;
}

// Fetch cart items
$stmt = $pdo->prepare('SELECT cart.id, cart.quantity, events.name, events.price FROM cart JOIN events ON cart.event_id = events.id WHERE cart.user_id = ?');
$stmt->execute([$user_id]);
$cart_items = $stmt->fetchAll(PDO::FETCH_ASSOC);
$total = 0;
foreach ($cart_items as $item) {
    $total += $item['price'] * $item['quantity'];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Cart - Event Booking</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
</head>
<body class="bg-light">
<div class="container mt-5">
    <h2 class="mb-4 text-center">Your Booking Cart</h2>
    <?php if (empty($cart_items)): ?>
        <div class="alert alert-info text-center">Your cart is empty.</div>
    <?php else: ?>
        <form method="post">
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>Event</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Subtotal</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($cart_items as $item): ?>
                        <tr>
                            <td><?php echo htmlspecialchars($item['name']); ?></td>
                            <td>$<?php echo htmlspecialchars($item['price']); ?></td>
                            <td>
                                <input type="number" name="quantities[<?php echo $item['id']; ?>]" value="<?php echo $item['quantity']; ?>" min="1" class="form-control" style="width: 80px;">
                            </td>
                            <td>$<?php echo number_format($item['price'] * $item['quantity'], 2); ?></td>
                            <td><a href="cart.php?remove=<?php echo $item['id']; ?>" class="btn btn-danger btn-sm">Remove</a></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            <div class="d-flex justify-content-between align-items-center">
                <button type="submit" name="update_cart" class="btn btn-primary">Update Cart</button>
                <h4>Total: $<?php echo number_format($total, 2); ?></h4>
                <a href="checkout.php" class="btn btn-success">Proceed to Checkout</a>
            </div>
        </form>
    <?php endif; ?>
    <div class="mt-3 text-center">
        <a href="events.php" class="btn btn-secondary">Continue Browsing Events</a>
    </div>
</div>
</body>
</html>
