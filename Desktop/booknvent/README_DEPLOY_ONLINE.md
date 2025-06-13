# Online Event Booking System – Online Deployment Guide

This guide will help you deploy your PHP + MySQL event booking system on Replit or 000webhost, so you never have to deal with local PHP/extension issues again.

---

## 1. Prepare Your Database

- Go to your MySQL provider (Replit DB, db4free.net, 000webhost, etc.).
- Create a new database (e.g., `event_booking`).
- Use phpMyAdmin or the SQL console to import the contents of `db/init_mysql.sql`.

---

## 2. Update Database Credentials

Edit `includes/db_connect.php` and set:
```
$host = 'your-mysql-host';
$db   = 'your-database-name';
$user = 'your-database-username';
$pass = 'your-database-password';
```

---

## 3. Upload Your Project

- Upload all your project files (including the updated `db_connect.php`) to your chosen platform (Replit or 000webhost).

---

## 4. Run and Test

- **On Replit:** Click “Run” and open the web view.
- **On 000webhost:** Visit your site’s public URL.

---

## 5. Troubleshooting

- If you see a database connection error, double-check your credentials in `db_connect.php`.
- Make sure your database user has all privileges on the database.
- Use `phpinfo();` to check PHP version and loaded extensions if needed.

---

## 6. Features Checklist

- User registration, login, and session management
- Event listing, search, and details
- Booking cart and checkout
- Booking history and ticket download
- Admin panel for event and booking management

---

## 7. Need Help?

If you get stuck, check your database credentials, or use the platform’s support/forums. You can also use free MySQL hosts like [db4free.net](https://www.db4free.net/) if your platform doesn’t provide one.

---

**Enjoy your hassle-free, online event booking system!**
