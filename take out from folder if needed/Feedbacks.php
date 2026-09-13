<!-- PINEDA, ANGEL RAPHAELLE S. | WD 201 | PHP INTRO ACT Started: Nov 28 | -->
<?php
include 'header.php'; //HEADER 
$options = ['Nail Extension','Removal','Add ons'];
$nails = ['Customized Press-Ons','Acrylic Nail Extension'];
$addons = ['Magnet/Cats Eye','3D Art','Art Stones'];
$removal = ['Gel Polish Removal','Nail Extension'];
$default = "None"; 

?> 
<!-- Page Section to be improved (both html and css) --->
    <section class="feedback">
        <div class="feedback-content">
            <h1>We’d Love to Hear From You</h1>
            <label for="first-name">Full Name: <input id="first-name" name="first-name" type="text" required /></label>

                <label for="month">Month: <input id="month" name="month" type="month" required /></label>
                <label for="date">Day: <input id="date" type="number" name="age" min="1" max="31" /></label>
                <label for="time">Time: <input id="time" type="time" name="time"  /></label>

            <p><b>What service did you get?</b></p>
                    <select>
                        <option value=""><?= $options[0] ?> (select one)</option>
                        <option value="1"><?= $nails[0] ?></option>
                        <option value="2"><?= $nails[1] ?></option>
                        <option value="3"><?= $default ?></option>
                    </select>

                    <select>
                        <option value=""><?= $options[1] ?> (select one)</option>
                        <option value="1"><?= $removal[0] ?></option>
                        <option value="2"><?= $removal[1] ?></option>
                        <option value="3"><?= $default ?></option>
                    </select>

                <p><b><?= $options[2] ?>:</b></p>
                <label><input type="checkbox" name="Cateye"/> <?= $addons[0] ?></label>
                <label><input type="checkbox" name="3d art" /> <?= $addons[1] ?></label>
                <input type="checkbox" name="art stone"/> <?= $addons[2] ?>
                <fieldset>

                    <label for="bio">How was your experience?
                    <textarea id="bio" name="bio" rows="3" cols="30" placeholder="Type your message here..."></textarea>
                    </label>

                    <label for="bio">What are the things you want us to improve?
                    <textarea id="bio" name="bio" rows="3" cols="30" placeholder="Type your message here..."></textarea>
                    </label>

            <input type="submit" value="Submit" />
        </div>
    </section> 

<?php
include 'footer.php'; //FOOTER
?>