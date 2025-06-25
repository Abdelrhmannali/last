<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class ModifyWeekendDaysColumnInGeneralSettingsTable extends Migration
{
    public function up()
    {
        Schema::table('general_settings', function (Blueprint $table) {
            $table->json('weekend_days')->change();
        });
    }

    public function down()
    {
        Schema::table('general_settings', function (Blueprint $table) {
            $table->text('weekend_days')->change();
        });
    }
}
