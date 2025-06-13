<?php
session_start();
require_once __DIR__ . '/../includes/db_connect.php';

if (!isset($_SESSION['user_id']) || !isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
    header('Location: ../login.php');
    exit;
}

if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    die('Invalid event ID.');
}
$event_id = (int)$_GET['id'];

// Fetch event details
$stmt = $pdo->prepare('SELECT * FROM events WHERE id = ?');
$stmt->execute([$event_id]);
$event = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$event) {
    die('Event not found.');
}

$message = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name']);
    $date = trim($_POST['date']);
    $time = trim($_POST['time']);
    $venue = trim($_POST['venue']);
    $organizer = trim($_POST['organizer']);
    $price = floatval($_POST['price']);
    $description = trim($_POST['description']);
    $image = trim($_POST['image']);

    if ($name && $date && $time && $venue && $organizer && $price) {
        $stmt = $pdo->prepare('UPDATE events SET name=?, date=?, time=?, venue=?, organizer=?, image=?, price=?, description=? WHERE id=?');
        $stmt->execute([$name, $date, $time, $venue, $organizer, $image, $price, $description, $event_id]);
        $message = 'Event updated successfully!';
        // Refresh event data
        $stmt = $pdo->prepare('SELECT * FROM events WHERE id = ?');
        $stmt->execute([$event_id]);
        $event = $stmt->fetch(PDO::FETCH_ASSOC);
    } else {
        $message = 'All fields except image and description are required.';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit Event - Admin Panel</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
</head>
<body class="bg-light">
<div class="container mt-5">
    <h2 class="mb-4 text-center">Edit Event</h2>
    <?php if ($message): ?>
        <div class="alert alert-info text-center"><?php echo $message; ?></div>
    <?php endif; ?>
    <form method="post">
        <div class="mb-3">
            <label for="name" class="form-label">Event Name</label>
            <input type="text" class="form-control" id="name" name="name" value="<?php echo htmlspecialchars($event['name']); ?>" required>
        </div>
        <div class="mb-3">
            <label for="date" class="form-label">Date</label>
            <input type="date" class="form-control" id="date" name="date" value="<?php echo htmlspecialchars($event['date']); ?>" required>
        </div>
        <div class="mb-3">
            <label for="time" class="form-label">Time</label>
            <input type="time" class="form-control" id="time" name="time" value="<?php echo htmlspecialchars($event['time']); ?>" required>
        </div>
        <div class="mb-3">
            <label for="venue" class="form-label">Venue</label>
            <input type="text" class="form-control" id="venue" name="venue" value="<?php echo htmlspecialchars($event['venue']); ?>" required>
        </div>
        <div class="mb-3">
            <label for="organizer" class="form-label">Organizer</label>
            <input type="text" class="form-control" id="organizer" name="organizer" value="<?php echo htmlspecialchars($event['organizer']); ?>" required>
        </div>
        <div class="mb-3">
            <label for="price" class="form-label">Price</label>
            <input type="number" step="0.01" class="form-control" id="price" name="price" value="<?php echo htmlspecialchars($event['price']); ?>" required>
        </div>
        <div class="mb-3">
            <label for="image" class="form-label">Image URL (optional)</label>
            <input type="text" class="form-control" id="image" name="image" value="<?php echo htmlspecialchars($event['image']); ?>">
        </div>
        <div class="mb-3">
            <label for="description" class="form-label">Description (optional)</label>
            <textarea class="form-control" id="description" name="description"><?php echo htmlspecialchars($event['description']); ?></textarea>
        </div>
        <button type="submit" class="btn btn-primary">Update Event</button>
        <a href="manage_events.php" class="btn btn-secondary">Back to Events</a>
    </form>
</div>
</body>
</html>
