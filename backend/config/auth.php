<?php

return [

    'defaults' => [
        'guard' => 'web',
        'passwords' => 'hrs',
    ],

    'guards' => [
        'web' => [
            'driver' => 'session',
            'provider' => 'hrs',
        ],

        'api' => [
            'driver' => 'token',
            'provider' => 'hrs',
            'hash' => false,
        ],
    ],

    'providers' => [
        'hrs' => [
            'driver' => 'eloquent',
            'model' => App\Models\HR::class,
        ],
    ],

    'passwords' => [
        'hrs' => [
            'provider' => 'hrs',
            'table' => 'password_reset_tokens', // أو password_resets حسب Laravel 8 أو أقل
            'expire' => 60,
            'throttle' => 60,
        ],
    ],

    'password_timeout' => 10800,

];
