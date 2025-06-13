<?php
session_start();
require_once __DIR__ . '/../includes/db_connect.php';

if (!isset($_SESSION['user_id']) || !isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
    header('Location: ../login.php');
    exit;
}

// Filters
$where = [];
$params = [];
if (!empty($_GET['date'])) {
    $where[] = 'events.date = ?';
    $params[] = $_GET['date'];
}
if (!empty($_GET['event_id'])) {
    $where[] = 'events.id = ?';
    $params[] = $_GET['event_id'];
}
if (!empty($_GET['user_id'])) {
    $where[] = 'users.id = ?';
    $params[] = $_GET['user_id'];
}
$where_sql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

// Fetch events and users for filter dropdowns
$events = $pdo->query('SELECT id, name FROM events ORDER BY name')->fetchAll(PDO::FETCH_ASSOC);
$users = $pdo->query('SELECT id, username FROM users ORDER BY username')->fetchAll(PDO::FETCH_ASSOC);

// Fetch filtered bookings
$sql = "SELECT bookings.id, bookings.booking_date, bookings.quantity, bookings.total_price, users.username, events.name AS event_name, events.date, events.time, events.venue FROM bookings JOIN users ON bookings.user_id = users.id JOIN events ON bookings.event_id = events.id $where_sql ORDER BY bookings.booking_date DESC";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reports - Admin Panel</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
</head>
<body class="bg-light">
<div class="container mt-5">
    <h2 class="mb-4 text-center">Generate Reports</h2>
    <form method="get" class="row g-3 mb-4">
        <div class="col-md-3">
            <label for="date" class="form-label">Event Date</label>
            <input type="date" class="form-control" id="date" name="date" value="<?php echo isset($_GET['date']) ? htmlspecialchars($_GET['date']) : ''; ?>">
        </div>
        <div class="col-md-3">
            <label for="event_id" class="form-label">Event</label>
            <select class="form-select" id="event_id" name="event_id">
                <option value="">All Events</option>
                <?php foreach ($events as $event): ?>
                    <option value="<?php echo $event['id']; ?>" <?php if (isset($_GET['event_id']) && $_GET['event_id'] == $event['id']) echo 'selected'; ?>><?php echo htmlspecialchars($event['name']); ?></option>
                <?php endforeach; ?>
            </select>
        </div>
        <div class="col-md-3">
            <label for="user_id" class="form-label">User</label>
            <select class="form-select" id="user_id" name="user_id">
                <option value="">All Users</option>
                <?php foreach ($users as $user): ?>
                    <option value="<?php echo $user['id']; ?>" <?php if (isset($_GET['user_id']) && $_GET['user_id'] == $user['id']) echo 'selected'; ?>><?php echo htmlspecialchars($user['username']); ?></option>
                <?php endforeach; ?>
            </select>
        </div>
        <div class="col-md-3 align-self-end">
            <button type="submit" class="btn btn-primary w-100">Filter</button>
        </div>
    </form>
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
    <div class="mt-3 text-center">
        <a href="index.php" class="btn btn-secondary">Back to Admin Panel</a>
    </div>
</div>
</body>
</html>
