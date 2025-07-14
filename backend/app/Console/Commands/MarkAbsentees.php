<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Employee;
use App\Models\Attendence;
use App\Models\Holiday;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class MarkAbsentees extends Command
{
    // Command signature to run via artisan
    protected $signature = 'attendance:mark-absentees';

    // Command description
    protected $description = 'Mark employees as absent if they didn’t check in by the end of the work day.';

    public function handle()
    {
        // Get today's date
        $today = Carbon::today();
        // Get day name in English (e.g. Monday)
        $dayName = $today->englishDayOfWeek;

        // Get all employees with their general settings
        $employees = Employee::with('generalSetting')->get();

        foreach ($employees as $employee) {
            $settings = $employee->generalSetting;

            // Skip if no settings found
            if (!$settings) continue;

            // Get weekend days or default to Saturday & Sunday
            $weekendDays = $settings->weekend_days ?? ['Saturday', 'Sunday'];

            // Validate weekend days format
            if (!is_array($weekendDays)) {
                Log::warning("Invalid weekend_days for employee {$employee->id}");
                continue;
            }

            // Skip if today is weekend or official holiday
            if (in_array($dayName, $weekendDays) || Holiday::whereDate('date', $today)->exists()) {
                continue;
            }

            // Check if employee already checked in today
            $hasAttendance = Attendence::where('employee_id', $employee->id)
                ->whereDate('date', $today)
                ->exists();

            // If no attendance, mark as absent
            if (!$hasAttendance) {
                Attendence::create([
                    'employee_id' => $employee->id,
                    'date' => $today,
                    'status' => 'Absent',
                    'lateDurationInHours' => 0,
                    'overtimeDurationInHours' => 0,
                ]);

                $this->info("Marked employee {$employee->id} as absent.");
            }
        }

        $this->info('All absentees marked successfully.');
    }
}
