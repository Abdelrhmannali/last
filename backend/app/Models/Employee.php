<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;

class Employee extends Model
{
    use HasFactory;
    use Notifiable;
    

    protected $fillable = [
        'first_name', 'last_name', 'email', 'phone', 'address', 'salary',
        'hire_date', 'default_check_in_time', 'default_check_out_time', 
        'gender', 'nationality', 'national_id', 'birthdate', 
        'department_id', 'working_hours_per_day',
     'salary_per_hour',
        'profile_picture' 
    ];

    protected $casts = [
     
        'hire_date' => 'date',
        'birthdate' => 'date',
    ];

    protected $attributes = [
   
        'salary_per_hour' => 0,
    ];

    protected $hidden = []; // Ensure no fields are hidden

protected $appends = ['general_setting_data', 'full_name'];


    // Relations
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendence::class);
    }

    public function payrolls()
    {
        return $this->hasMany(Payroll::class);
    }
    

    public function latestPayroll()
    {
        return $this->hasOne(Payroll::class, 'employee_id')->latestOfMany();
    }

    public function generalSetting()
    {
        return $this->hasOne(GeneralSetting::class, 'employee_id');
    }

    // Accessors
    public function getFullNameAttribute()
    {
        return $this->first_name . '' . $this->last_name;
    }

    public function getDeptNameAttribute()
    {
        return $this->department ? $this->department->dept_name : null;
    }

    public function getProfileImageUrlAttribute()
    {
        if (!$this->profile_picture) {
            return null;
        }
        return asset('employees/' . $this->profile_picture);
    }

    public function getGeneralSettingDataAttribute()
    {
        return [
            'deduction_type' => optional($this->generalSetting)->deduction_type ?? 'money',
            'deduction_value' => optional($this->generalSetting)->deduction_value ?? 0,
            'overtime_type' => optional($this->generalSetting)->overtime_type ?? 'money',
            'overtime_value' => optional($this->generalSetting)->overtime_value ?? 0,
            'weekend_days' => optional($this->generalSetting)->weekend_days ?? [],
        ];
    }
}