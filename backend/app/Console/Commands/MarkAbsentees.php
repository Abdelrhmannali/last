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
    protected $signature = 'attendance:mark-absentees';
    protected $description = 'Mark employees as absent if they didn’t check in by the end of the work day.';

    public function handle()
    {
        $today = Carbon::today();
        $dayName = $today->englishDayOfWeek;

        $employees = Employee::with('generalSetting')->get();

        foreach ($employees as $employee) {
            $settings = $employee->generalSetting;

            if (!$settings) continue;

            $weekendDays = $settings->weekend_days ?? ['Saturday', 'Sunday'];
            if (!is_array($weekendDays)) {
                Log::warning("Invalid weekend_days for employee {$employee->id}");
                continue;
            }

            // عطلة رسمية أو ويك اند؟ تجاهل الموظف
            if (in_array($dayName, $weekendDays) || Holiday::whereDate('date', $today)->exists()) {
                continue;
            }

            // بالفعل سجل حضور؟ تجاهل
            $hasAttendance = Attendence::where('employee_id', $employee->id)
                ->whereDate('date', $today)
                ->exists();

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

        $this->info('✅ All absentees marked successfully.');
    }
}
