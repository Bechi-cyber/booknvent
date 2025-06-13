<?php
session_start();
require_once __DIR__ . '/includes/db_connect.php';

if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    die('Invalid event ID.');
}
$event_id = (int)$_GET['id'];
$stmt = $pdo->prepare('SELECT * FROM events WHERE id = ?');
$stmt->execute([$event_id]);
$event = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$event) {
    die('Event not found.');
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Details - <?php echo htmlspecialchars($event['name']); ?></title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
</head>
<body class="bg-light">
<div class="container mt-5">
    <div class="row justify-content-center">
        <div class="col-md-8">
            <div class="card mb-4">
                <?php if ($event['image']): ?>
                    <img src="<?php echo htmlspecialchars($event['image']); ?>" class="card-img-top" alt="Event Image">
                <?php endif; ?>
                <div class="card-body">
                    <h3 class="card-title"><?php echo htmlspecialchars($event['name']); ?></h3>
                    <p class="card-text">
                        <strong>Date:</strong> <?php echo htmlspecialchars($event['date']); ?><br>
                        <strong>Time:</strong> <?php echo htmlspecialchars($event['time']); ?><br>
                        <strong>Venue:</strong> <?php echo htmlspecialchars($event['venue']); ?><br>
                        <strong>Organizer:</strong> <?php echo htmlspecialchars($event['organizer']); ?><br>
                        <strong>Price:</strong> $<?php echo htmlspecialchars($event['price']); ?><br>
                        <strong>Description:</strong> <?php echo nl2br(htmlspecialchars($event['description'])); ?><br>
                    </p>
                    <!-- Placeholder for map and organizer contact -->
                    <div class="mb-3">
                        <strong>Map:</strong> <span class="text-muted">[Map integration here]</span><br>
                        <strong>Organizer Contact:</strong> <span class="text-muted">[Contact info here]</span>
                    </div>
                    <a href="cart.php?add=<?php echo $event['id']; ?>" class="btn btn-success">Book Ticket</a>
                    <a href="events.php" class="btn btn-secondary">Back to Events</a>
                </div>
            </div>
        </div>
    </div>
</div>
</body>
</html>
