<?php
session_start();
require_once __DIR__ . '/includes/db_connect.php';

// Fetch all events
$stmt = $pdo->query('SELECT * FROM events ORDER BY date, time');
$events = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Listings - Event Booking</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
</head>
<body class="bg-light">
<div class="container mt-5">
    <h2 class="mb-4 text-center">Available Events</h2>
    <div class="row">
        <?php if (empty($events)): ?>
            <div class="col-12">
                <div class="alert alert-info text-center">No events available at the moment.</div>
            </div>
        <?php else: ?>
            <?php foreach ($events as $event): ?>
                <div class="col-md-4 mb-4">
                    <div class="card h-100">
                        <?php if ($event['image']): ?>
                            <img src="<?php echo htmlspecialchars($event['image']); ?>" class="card-img-top" alt="Event Image">
                        <?php endif; ?>
                        <div class="card-body">
                            <h5 class="card-title"><?php echo htmlspecialchars($event['name']); ?></h5>
                            <p class="card-text">
                                <strong>Date:</strong> <?php echo htmlspecialchars($event['date']); ?><br>
                                <strong>Time:</strong> <?php echo htmlspecialchars($event['time']); ?><br>
                                <strong>Venue:</strong> <?php echo htmlspecialchars($event['venue']); ?><br>
                                <strong>Organizer:</strong> <?php echo htmlspecialchars($event['organizer']); ?><br>
                                <strong>Price:</strong> $<?php echo htmlspecialchars($event['price']); ?>
                            </p>
                            <a href="event_details.php?id=<?php echo $event['id']; ?>" class="btn btn-primary w-100">View Details</a>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>
</div>
</body>
</html>
