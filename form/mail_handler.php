<style>    
body {
  display: flex;
}
.mail-sent {
  padding: 20px;
  color: white;
  background-color: #4caf50;
  display: flex;
  justify-content: center;
  align-self: center;
  width: 100%;
  font-weight: 800;
}
</style>

<?php 

if(isset($_POST['submit'])){

    $to = "askflow1111@gmail.com"; // this is your Email address

    $from = $_POST['email']; // this is the sender's Email address

    $name = $_POST['name'];

    $subject = "Form submission";

    $subject2 = "Copy of your form submission";

    $message = "Name: " . $name .  "\n\n" . "Email:" . $from . "\n\n" . "Message: " . $_POST['message'];

    $message2 = "Here is a copy of your message " . $name . "\n\n" . $_POST['message'];



    $headers = "From:" . $from;

    $headers2 = "From:" . $to;

    mail($to,$subject,$message,$headers);

    mail($from,$subject2,$message2,$headers2); // sends a copy of the message to the sender

    echo "<p class='mail-sent'>Mail Sent. Thank you " . $name . ", we will contact you shortly.</p>";

    // You can also use header('Location: thank_you.php'); to redirect to another page.

    // You cannot use header and echo together. It's one or the other.

    }

?>