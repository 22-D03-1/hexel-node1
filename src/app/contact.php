<?php
// ==========================================
// contact.php - HEXEL 2025 - PHPMailer + SMTP + dotenv
// ==========================================

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use Dotenv\Dotenv;

// Composer Autoloader laden
require 'vendor/autoload.php';

// .env laden
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

// CORS Header setzen
header("Access-Control-Allow-Origin: *"); // In Produktion: besser deine Domain angeben!
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Preflight-Request behandeln
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Nur POST erlauben
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Nur POST-Anfragen sind erlaubt."]);
    exit();
}

// Eingehende Daten holen
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Fehler bei JSON
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(["error" => "Ungültige JSON-Daten."]);
    exit();
}

// Pflichtfelder prüfen
if (empty($data['name']) || empty($data['email']) || empty($data['message'])) {
    http_response_code(400);
    echo json_encode(["error" => "Alle Felder (Name, E-Mail, Nachricht) müssen ausgefüllt sein."]);
    exit();
}

// Felder säubern
$name = htmlspecialchars(trim($data['name']));
$email = filter_var(trim($data['email']), FILTER_VALIDATE_EMAIL);
$message = htmlspecialchars(trim($data['message']));

// E-Mail validieren
if (!$email) {
    http_response_code(400);
    echo json_encode(["error" => "Ungültige E-Mail-Adresse."]);
    exit();
}

// SMTP Zugangsdaten aus .env holen
$smtpHost = $_ENV['EMAIL_HOST'];
$smtpPort = $_ENV['EMAIL_PORT'];
$smtpUser = $_ENV['EMAIL_USER'];
$smtpPass = $_ENV['EMAIL_PASS'];
$emailTo  = $_ENV['EMAIL_TO'];

try {
    $mail = new PHPMailer(true);
    
    // Servereinstellungen
    $mail->isSMTP();
    $mail->Host       = $smtpHost;
    $mail->SMTPAuth   = true;
    $mail->Username   = $smtpUser;
    $mail->Password   = $smtpPass;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = $smtpPort;
    
    // Absender und Empfänger
    $mail->setFrom($smtpUser, 'HEXEL Website');
    $mail->addAddress($emailTo);  // Empfänger
    $mail->addReplyTo($email, $name); // Antwort an den Benutzer
    
    // Inhalt
    $mail->isHTML(true);
    $mail->Subject = "Neue Kontaktanfrage von $name";
    $mail->Body    = "
        <h2>Neue Kontaktanfrage</h2>
        <p><strong>Name:</strong> {$name}</p>
        <p><strong>E-Mail:</strong> {$email}</p>
        <p><strong>Nachricht:</strong><br>{$message}</p>
    ";
    
    $mail->send();
    
    http_response_code(200);
    echo json_encode(["success" => "Nachricht erfolgreich gesendet."]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Nachricht konnte nicht gesendet werden. Fehler: {$mail->ErrorInfo}"]);
}
?>
