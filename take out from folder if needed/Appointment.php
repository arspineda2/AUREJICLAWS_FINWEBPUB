<!-- PINEDA, ANGEL RAPHAELLE S. | WD 201 | PHP INTRO ACT Started: Nov 28 | -->
<?php
include 'header.php'; //HEADER 
$options = ['Nail Extension','Removal','Add ons'];  //Array List
$nails = ['Customized Press-Ons','Acrylic Nail Extension'];
$addons = ['Magnet/Cats Eye','3D Art','Art Stones']; 
$removal = ['Gel Polish Removal','Nail Extension']; 
$default = "None";  //None or Null

$latefee = 100; //Numeric or Integer
$sample = $latefee + $latefee; //Expressions  Operators

$services = ["Nail Extension", "Removal", "Add Ons"];
$prices = [1300, 100, 200];
$i = 0; 
?> 
<!-- Page Section to be improved (both html and css) --->
    <section class="appointment">

        <div class="appointment-content">
            <h2>Prices:</h2>
                <?php while ($i < count($services)): ?> <!--Used WHILE LOOP to display services and prices -->
                    <p style="color:#f488a6; font-weight:bold;">
                        <?php echo $services[$i] . " - ₱" . $prices[$i] . " to 1500"; ?> <!--Made use of CONCATENATION between a string and a php statement -->
                    </p>
                    <?php $i++; ?>
                <?php endwhile; ?>
            <br>
            <h1>Booking: Terms and Conditions</h1>
                    <p>To ensure a smooth and organized booking experience for all clients, please read the following terms and conditions before scheduling an appointment.</p>
                        <ul>
                            <li>All bookings are strictly per person only. No companions are allowed if the appointment is for one only.</li>
                            <li>Clients who arrive late >>> ₱100 charge for every hour of delay. Ex. 2 hours late: <?= $sample ?> Please plan accordingly to avoid late fees and ensure you receive your full service.</li>
                            <li>Cancellations >>> ₱50 cancellation fee. This is to avoid disruptions to the schedule and to ensure fairness to all clients. Please notify us as early as possible if you need to cancel or reschedule.</li>
                            <li>Please arrive on time and ensure you are ready for your appointment.</li>
                            <li>Follow our Instagram <b>@aurejiclaws</b> for further updates, announcements, and booking assistance.</li>
                        </ul>
                        <p>By booking an appointment, you agree to all terms and conditions listed above.</p>
                        <input class="inline" name="terms" id="terms-and-conditions" type="checkbox" required /><b>I accept the terms and conditions</b></label>
                        <p>Thank you for choosing Aureji Claws!</p>
        </div> 

        <fieldset>   
                <fieldset>
                    <p><b>FILL OUT TO BOOK</b></p>
                    <label for="first-name">Full Name: <input id="first-name" name="first-name" type="text" required /></label>
                    <label for="email">Email: <input id="email" name="email" type="email" required /></label>
                </fieldset>

                <fieldset> 
                    <p><b>SELECT TO AVAIL:</b></p>
                    <label>
                        <select>
                            <option value=""><?= $options[0] ?> (select one)</option> <!-- shorthand for echo --->
                            <option value="1"><?= $nails[0] ?></option>
                            <option value="2"><?= $nails[1] ?></option>
                            <option value="3"><?= $default ?></option>
                        </select>
                    </label>

                    <label>
                        <select>
                            <option value=""><?= $options[1] ?> (select one)</option>
                            <option value="1"><?= $removal[0] ?></option>
                            <option value="2"><?= $removal[1] ?></option>
                            <option value="3"><?= $default; ?></option>
                        </select>
                    </label>
                    <p><?= $options[2] ?>: </p>
                    <label><input type="checkbox" name="Cateye"/> <?= $addons[0] ?></label>
                    <label><input type="checkbox" name="3d art" /> <?= $addons[1] ?></label>
                    <label><input type="checkbox" name="art stone"/> <?= $addons[2] ?></label>

                </fieldset>

                <fieldset>
                    <label for="month">Month:<input id="month" name="month" type="month" required /></label>
                    <label for="date">Day: <input id="date" type="number" name="age" min="1" max="31" /></label>
                    <label for="time">Time: <input id="time" type="time" name="time"  /></label>

                    <label for="bio">Message:
                    <textarea id="bio" name="bio" rows="3" cols="30" placeholder="Type your message here..."></textarea>
                    </label>
                </fieldset>
            <input type="submit" value="Submit" />
        </fieldset>
    </section> 

<?php
include 'footer.php'; //FOOTER
?>