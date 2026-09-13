<!-- PINEDA, ANGEL RAPHAELLE S. | WD 201 | PHP INTRO ACT Started: Nov 28 | Latest Update: September 6 2026 -->
<?php 
include 'header.php'; //HEADER 
$po1 = 1300; //VARIABLES 
$po2 = 1000; //$name = value
$po3 = 1000; //Numeric Data Type

$day = 'Thursday';
$offer = match($day){ //MATCH
    'Friday' => '10% Off on all nail services!',
    'Saturday' => '5% Off before 11AM!',
    default => ' Book with a friend! 10% OFF each!'
};

for ($i = 0; $i < 6; $i++) { // FOR LOOP
    echo "<span style='color:#f488a6; font-weight:bold; margin: 10px;'>$offer </span>";
}
?>

    <section class="pressons">
        <div class="box container">
            <img src="photos/Amethyst.png" alt="Amethyst Fang">
            <p><b>Amethyst Fang</b></p>
            <p><em><?php echo $po1; ?> php </em></p> <!--How PHP write to browser or display text-->
        </div>
        <div class="box container">
            <img src="photos/Svt.png" alt="SVT Thunder">
            <p><b>SVT Thunder</b></p>
            <p><em><?php echo $po2; ?> php </em></p>
        </div>
        <div class="box container">
            <img src="photos/Blue.png" alt="Blue Deep Sea">
            <p><b>Blue Deep Sea</b></p>
            <p><em><?php echo $po3; ?> php </em></p>
        </div>
    </section>

<?php
include 'footer.php'; //FOOTER
?>