<!-- PINEDA, ANGEL RAPHAELLE S. | WD 201 | PHP INTRO ACT Started: Nov 28 | Latest Update: September 6 2026 -->
<?php
include 'header.php'; //HEADER 
$storename = "Aureji Claws"; //VARIABLE -> String Data Type
?>

    <section class="about">

        <div class="about-content">
            <h1><b>About <?php echo $storename; ?></b></h1> <!--How PHP write to browser or display text-->
            <br>
            <p>The name <?php echo $storename; ?> comes from a special mix of love and identity of my beloved cat Uji and my own name, Angel. 
            This dream stayed with me for two years until it finally came to life in June 2025, starting as a simple hobby and 
            growing into something I truly cherish. What makes <?php echo $storename; ?> <!--How PHP write to browser or display text-->special is its focus on fun, creativity, and 
            self-expression—nails that aren't just accessories, but tiny works of art. Our mission is to make every set bring 
            confidence, joy, and a little sparkle to anyone who wears them.</p>
        </div>

        <img src="photos/about.png" alt="About">
    </section>

<?php
include 'footer.php'; //FOOTER
?>