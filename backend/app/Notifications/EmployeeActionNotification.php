<?php
namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class EmployeeActionNotification extends Notification
{
    protected $employee;
    protected $action;

    public function __construct($employee, $action)
    {
        $this->employee = $employee;
        $this->action = $action;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

 public function toMail($notifiable)
{
    $fullName = "{$this->employee->first_name} {$this->employee->last_name}";

    if ($this->action === 'added') {
        return (new MailMessage)
            ->subject('Welcome to SmartHR!')
            ->greeting("Hello {$fullName},")
            ->line('We are excited to welcome you to SmartHR.')
            ->line('Your employee account has been successfully created.')
            ->action('Login to your account', url('/login'))
            ->line('We look forward to working with you.');
    } elseif ($this->action === 'deleted') {
        return (new MailMessage)
            ->subject('Account Removal Notice – SmartHR')
            ->greeting("Dear {$fullName},")
            ->line('We would like to inform you that your account has been removed from the SmartHR system.')
            ->line('If you have any questions or believe this was a mistake, please contact HR.')
            ->line('Thank you for being a part of SmartHR.');
    }

    return (new MailMessage)->line('Invalid action.');
}

}