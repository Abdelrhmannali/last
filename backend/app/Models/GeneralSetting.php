<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GeneralSetting extends Model
{
 
    protected $fillable = [
        'employee_id',
        'deduction_type',
        'deduction_value',
        'overtime_type',
        'overtime_value',
        'weekend_days',
    ];
    protected $casts = [
    'weekend_days' => 'array',
];


    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}