<?php
//removed topic unrelated
$hour = date("H");
if ($hour < 12) { //IF ELSE... IF or conditional statements
    $greeting = "Good Morning";
} elseif ($hour < 18) {
    $greeting = "Good Afternoon";
} else {
    $greeting = "Good Evening";
}
?>

<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="styles.css">
        <title>Aureji Claws</title>
    </head>
    <body> <!-- Referenced our past IntroWeb Lab Case Study in this Header --->
        <header>
            <h2 style="color: #f488a6"><?php echo $greeting; ?></h2> 
            <a href="#"><img src="photos/Logo.png" alt="Aureji Claws Logo" class="logo"></a>
            <div class="Line-separator"></div>
            <nav> <!-- Referenced the navigation part from my PRLM-HandsOn-Mod2 --->
                <a href="PressOn.php">PRESS-ON</a>
                <a href="About.php">ABOUT</a>
                <a href="Appointment.php">APPOINTMENT</a>
                <a href="Feedbacks.php">FEEDBACKS</a>
                <a href="Stocks.php">PRODUCT AVAILABILITY</a>
            </nav>
        </header>
        <div class="checkerboard"></div>