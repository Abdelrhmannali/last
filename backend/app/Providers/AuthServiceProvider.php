<?php        
use Illuminate\Auth\Notifications\ResetPassword;

class AuthServiceProvider
{
    public function boot()
    {
        // ...

        ResetPassword::createUrlUsing(function ($notifiable, $token) {
            return url("/reset-password?token={$token}&email={$notifiable->getEmailForPasswordReset()}");
        });
    }
}
