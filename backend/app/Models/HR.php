<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use App\Notifications\HRResetPasswordNotification;

use Illuminate\Contracts\Auth\CanResetPassword;
use Illuminate\Auth\Passwords\CanResetPassword as CanResetPasswordTrait;
class HR extends Authenticatable implements CanResetPassword
{

use HasApiTokens, HasFactory, Notifiable, HasRoles, CanResetPasswordTrait;


    protected $table = 'hrs';

    protected $fillable = [
        'name',
        'email',
        'password',
        'profile_picture',  
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

  
    protected $appends = ['profile_picture_url'];

    public function getProfilePictureUrlAttribute()
    {
        if ($this->profile_picture) {
            return asset('storage/' . $this->profile_picture);
        }
        return null;
    }




public function sendPasswordResetNotification($token)
{
    $this->notify(new HRResetPasswordNotification($token));
}

}
