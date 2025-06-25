<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class DropWeekendDaysFromEmployeesTable extends Migration
{
    public function up()
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn('weekend_days');
        });
    }

    public function down()
    {
        Schema::table('employees', function (Blueprint $table) {
            // لو عايز ترجع العمود تاني لو عملت rollback
            $table->string('weekend_days')->nullable();
        });
    }
}

