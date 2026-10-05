<?php 
// Contact Us Page of Aureji Claws

// Arrays for drop down options
$services = ['Nail Mani','Nail Extensions','Removal'];
$schedule = ['10:00 AM - 1:30 PM','2:30 PM - 6:00 PM','6:30 PM - 9:00 PM'];

// Default empty values in the input fields
$name = $email = $date = $slot = $service = $remarks = '';
$errors = [];
$success = false; 

// Will work and validate the form data when the form is submitted
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $name = trim($_POST['name'] ?? ''); // trim remove whitespace of the string (e.g. " Aureji " becomes "Aureji")
  $email = trim($_POST['email'] ?? ''); // '' empty string
  $date = trim($_POST['date'] ?? '');
  $slot = trim($_POST['slot'] ?? '');
  $service = trim($_POST['service'] ?? '');
  $remarks = trim($_POST['remarks'] ?? '');

  // Validate the form data
  if ($name === '') {
    $errors[] = 'Enter you name.';
  }
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Enter a valid email address.';
  }
  if ($date === '' || $date < date('Y-m-d')) {  // Checks if the date is empty or if the date is in the past
    $errors[] = 'Select a valid date';
  }
  if (!in_array($slot, $schedule, true)) { // Checks if the selected sched is in the array  (can be remove) 
    $errors[] = 'Select a valid time slot.';
  }
  if (!in_array($service, $services, true)) { // Checks if the selected service is in the array (can be remove)
    $errors[] = 'Select a valid service.';
  }

  if (empty($errors)) { // if information are valid, then the form is submitted successfully
    $success = true;
    $booked = ['name' => $name, 'date' => $date, 'slot' => $slot, 'service' => $service, 'remarks' => $remarks];

    // Clear the form after successful booking (Can register again with different information)
    $name = $email = $date = $slot = $service = $remarks = '';
  }
}

?>

<!-- HTML -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact Us | Aureji Claws</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>   <!-- browser connects in advance making the imported fonts load faster -->
  <link href="https://fonts.googleapis.com/css2?family=Alice&family=Outfit:wght@100..900&display=swap" rel="stylesheet">

  <!-- nav.css first, so contact.css can override it if needed -->
  <link rel="stylesheet" href="nav.css" />
  <link rel="stylesheet" href="style.css" />
  <link rel="stylesheet" href="contact.css" />
</head>
<body>

  <!-- Header with Navigation -->
  <header class="navbar">
    <div class="logo">
      <a href="index.html#home">
        <img src="photos/Logo.png" alt="Aureji Claws Logo" />
      </a>
    </div>

    <input type="checkbox" id="menu-toggle" class="menu-checkbox" />
    <label for="menu-toggle" class="hamburger-btn" aria-label="Toggle navigation">
      <span></span><span></span><span></span>
    </label>

    <nav class="nav-links">
      <a href="index.html#home">HOME</a>
      <a href="About.php">ABOUT</a>
      <a href="PressOn.php">PRESS-ON</a>
      <a href="Appointment.php">APPOINTMENT</a>
      <a href="Contact.php" class="active">CONTACT US</a>
    </nav>

    <div class="cart-icon">
      <a href="cart.html" aria-label="Shopping Cart">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" 
        stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
      </a>
    </div>
  </header>

  <main class="contact-page">
    <div class="contact-card">

      <!-- Left Side: Get in Touch -->
      <section class="contact-info">
        <h2>Get in touch</h2>
        <p class="intro">Questions, custom requests, or booth bookings, we're just a message away. Send us an email and we'll get back to you as soon as we can.</p>

        <ul class="contact-list">
          <li>
            <span class="icon" aria-hidden="true"> <!-- Email Icon -->
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" 
              stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z"/><path d="M22 6L12 13 2 6"/></svg>
            </span>
            <div><strong>Email Us</strong><a href="mailto:aureji2025@gmail.com">aureji2025@gmail.com</a></div>
          </li>

          <li>
            <span class="icon" aria-hidden="true"> <!-- Telephone Icon -->
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" 
              stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 
              2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg> 
            </span>
            <div><strong>Contact Us</strong><span>969-514-7202</span></div>
          </li>

          <li>
            <span class="icon" aria-hidden="true">  <!-- Instagram Icon -->
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" 
              stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="0.6"/></svg>
            </span>
            <div><strong>Book via Direct Message</strong><a href="https://instagram.com/aurejiclaws" target="_blank" rel="noopener">@aurejiclaws</a></div>
          </li>
        </ul>

        <p class="tagline">Because Basic Nails Aren't Your Thing - Aureji Claws</p>
      </section>

      <!-- Right Side: Book A Service -->
      <section class="contact-form"> 
        <h2>Book a Service</h2>
        
        <?php if ($success): ?>
          <div class="notice success" role="status">
            Thanks, <?= htmlspecialchars($booked['name']) ?>! We received your request for <?= htmlspecialchars($booked['service']) ?> o
            n <?= (date('F j, Y', strtotime($booked['date']))) ?> (<?= htmlspecialchars($booked['slot']) ?>). We'll confirm by email.
          </div>
        <?php endif; ?>

        <?php if (!empty($errors)): ?>
          <div class="notice error" role="alert">
            <ul>
              <?php foreach ($errors as $error): ?>
                <li><?= htmlspecialchars($error) ?></li>
              <?php endforeach; ?>
            </ul>
          </div>
        <?php endif; ?>

        <form action="Contact.php" method="POST" class="form-grid">
          <label>Full Name:
            <input type="text" name="name" value="<?= htmlspecialchars($name) ?>" required />
          </label>

          <label>Email:
            <input type="email" name="email" value="<?= htmlspecialchars($email) ?>" required />
          </label>

          <label>Date:
            <input type="date" name="date" min="<?= date('Y-m-d') ?>" value="<?= htmlspecialchars($date) ?>" required />
          </label>

          <label>Time:
            <select name="slot" required>
              <option value="" disabled <?= empty($slot) ? 'selected' : '' ?>>Select Schedule</option>
              <?php foreach ($schedule as $s): ?>
                <option value="<?= htmlspecialchars($s) ?>" <?= $s === $slot ? 'selected' : '' ?>><?= htmlspecialchars($s) ?></option>
              <?php endforeach; ?>
            </select>
          </label>

          <label class="full">Service:
            <select name="service" required>
              <option value="" disabled <?= empty($service) ? 'selected' : '' ?>>Select</option>
              <?php foreach ($services as $srv): ?>
                <option value="<?= htmlspecialchars($srv) ?>" <?= $srv === $service ? 'selected' : '' ?>><?= htmlspecialchars($srv) ?></option>
              <?php endforeach; ?>
            </select>
          </label>

          <label class="full">Remark/s: 
            <textarea name="remarks" rows="4"><?= htmlspecialchars($remarks) ?></textarea>
          </label>

          <div class="full submit-row">
            <button type="submit" class="btn btn-primary">Submit</button>
          </div>
        </form>
      </section>

    </div>            
  </main>

  <footer class="site-footer" id="contact">
    <div class="footer-top">
      <div class="footer-col brand-col">
        <img src="photos/Logo.png" alt="Aureji Claws" class="footer-logo">
        <ul class="footer-links">
          <li><a href="#terms">Terms &amp; Conditions</a></li>
          <li><a href="#privacy">Privacy Policy</a></li>
          <li><a href="#refund">Refund Policy</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <h3 class="footer-heading">LOCATION</h3>
        <p>City of San Fernando,<br>Pampanga</p>
      </div>

      <div class="footer-col">
        <h3 class="footer-heading">CONTACT</h3>
        <p><a href="mailto:aureji2025@gmail.com">aureji2025@gmail.com</a></p>
        <p>Tel: 969-514-7202</p>
      </div>
      <div class="footer-col">
        <h3 class="footer-heading">HOURS</h3>
        <p>10:00 AM - 10:00 PM</p>
      </div>
    </div>

    <div class="footer-bottom">
      <p>&copy; 2026 by Angel Pineda | Justine Enriquez | Franchesca Sison | Bianca Zepeda</p>
    </div>
  </footer>

</body>
</html>