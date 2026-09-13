<!-- PINEDA, ANGEL RAPHAELLE S. | WD 201 | PHP INTRO ACT Started: Nov 28 Recent Changes: Dec 3| -->
<?php 
include 'header.php'; //HEADER 

//$po1 = 1300; //VARIABLES 
//$po2 = 1000; //$name = value
//$po3 = 1000; //Numeric Data Type

//Global Variables
$stock = 10;
$tax = 30;

$aurejiclaws_products = [ //variables to array
    'Amethyst Fang' => [1300.00, 10], 
    'SVT Thunder' => [1000.00, 26],  
    'Blue Deep Sea' => [1000.00, 8]  
];

//REORDER MESSAGE
function get_reorder_message(int $stock)
{
    //TERNARY OPERATOR
    return $stock < 10 ? 'Yes' : 'No';
}

//TOTAL VALUE 
function get_total_value(float $price, int $quantity): float
{
    return $price * $quantity; 
}

//GET TAX DUE
function get_tax_due(float $price, int $quantity, int $tax = 0): float
{
    $total_value = $price * $quantity;
    $multiply_tax = $tax / 100.0;
    return $total_value * $multiply_tax;
}
?>

<style>
    /*=====PRODUCT AVAILABILITY CSS=====*/

table {
  border-collapse: collapse; 
  width: 50%;
  margin: 20px auto;
}

th, td {
  border: 1px solid black; 
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f5dfdf;
}
</style>

<section class="presson">
    <table>
        <thead>
            <tr>
                <th>PRODUCT</th>
                <th>STOCK</th>
                <th>RE-ORDER</th>
                <th>TOTAL VALUE</th>
                <th>TAX DUE</th>
            </tr>
        </thead>

        <tbody>
            <?php
            foreach ($aurejiclaws_products as $product_name => $data) {

                $price = $data[0];
                $stock = $data[1];

                echo "<tr>";
                    echo "<td>" . htmlspecialchars($product_name) . "</td>";
                    echo "<td>" . htmlspecialchars((string)$stock) . "</td>";
                    echo "<td>" . get_reorder_message($stock) . "</td>";

                    $total_value = get_total_value($price, $stock);
                    echo "<td class='currency'>Php " . number_format($total_value, 2) . "</td>";

                    global $tax;
                    $tax_due = get_tax_due($price, $stock, $tax);
                    echo "<td class='currency'>Php " . number_format($tax_due, 2) . "</td>";
                echo "</tr>";
            }
            ?>
        </tbody>
    </table>
</section>

<?php
include 'footer.php'; //FOOTER
?>