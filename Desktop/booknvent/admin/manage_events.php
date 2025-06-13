<?php
session_start();
require_once __DIR__ . '/../includes/db_connect.php';

if (!isset($_SESSION['user_id']) || !isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
    header('Location: ../login.php');
    exit;
}

// Handle event deletion
if (isset($_GET['delete']) && is_numeric($_GET['delete'])) {
    $event_id = (int)$_GET['delete'];
    $stmt = $pdo->prepare('DELETE FROM events WHERE id = ?');
    $stmt->execute([$event_id]);
    header('Location: manage_events.php');
    exit;
}

// Fetch all events
$stmt = $pdo->query('SELECT * FROM events ORDER BY date, time');
$events = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manage Events - Admin Panel</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
</head>
<body class="bg-light">
<div class="container mt-5">
    <h2 class="mb-4 text-center">Manage Events</h2>
    <div class="mb-3 text-end">
        <a href="add_event.php" class="btn btn-success">Add New Event</a>
        <a href="index.php" class="btn btn-secondary">Back to Admin Panel</a>
    </div>
    <table class="table table-bordered">
        <thead>
            <tr>
                <th>Name</th>
                <th>Date</th>
                <th>Time</th>
                <th>Venue</th>
                <th>Organizer</th>
                <th>Price</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($events as $event): ?>
                <tr>
                    <td><?php echo htmlspecialchars($event['name']); ?></td>
                    <td><?php echo htmlspecialchars($event['date']); ?></td>
                    <td><?php echo htmlspecialchars($event['time']); ?></td>
                    <td><?php echo htmlspecialchars($event['venue']); ?></td>
                    <td><?php echo htmlspecialchars($event['organizer']); ?></td>
                    <td>$<?php echo htmlspecialchars($event['price']); ?></td>
                    <td>
                        <a href="edit_event.php?id=<?php echo $event['id']; ?>" class="btn btn-primary btn-sm">Edit</a>
                        <a href="manage_events.php?delete=<?php echo $event['id']; ?>" class="btn btn-danger btn-sm" onclick="return confirm('Are you sure you want to delete this event?');">Delete</a>
                    </td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>
</body>
</html>
