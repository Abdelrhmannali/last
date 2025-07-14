<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],
    'openrouter' => [
        'api_key' => env('OPENROUTER_API_KEY'),
        'api_url' => env('OPENROUTER_API_URL', 'https://openrouter.ai/api/v1'),
        'model' => env('OPENROUTER_DEFAULT_MODEL', 'deepseek/deepseek-r1:free'),
        'max_tokens' => (int) env('OPENROUTER_MAX_TOKENS', 2000),
        'temperature' => (float) env('OPENROUTER_TEMPERATURE', 0.7),
        'timeout' => (int) env('OPENROUTER_TIMEOUT', 60),
        'max_retries' => (int) env('OPENROUTER_MAX_RETRIES', 3),
        'log_interactions' => env('CHAT_LOG_INTERACTIONS', true),
    ],

];



