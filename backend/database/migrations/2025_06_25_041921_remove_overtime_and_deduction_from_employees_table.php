<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up()
{
    Schema::table('employees', function (Blueprint $table) {
        $table->dropColumn(['deduction_value', 'overtime_value']);
    });
}

public function down()
{
    Schema::table('employees', function (Blueprint $table) {
        $table->decimal('deduction_value', 8, 2)->default(0.00);
        $table->decimal('overtime_value', 8, 2)->default(0.00);
    });
}

};
