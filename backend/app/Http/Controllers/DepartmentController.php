<?php
 
namespace App\Http\Controllers;
 
use App\Models\Department;

use App\Http\Requests\StoreDepartmentRequest;

use App\Http\Requests\UpdateDepartmentRequest;
 
class DepartmentController extends Controller

{

    public function index()

    {

        $departments = Department::all();
 
        return response()->json($departments, 200);

    }
 
    public function store(StoreDepartmentRequest $request)

    {

        $department = Department::create($request->validated());
 
        return response()->json([

            'message' => 'Department created successfully.',

            'data' => $department

        ], 201);

    }
 
    public function show(Department $department)

    {

        return response()->json([

            'message' => 'Department retrieved successfully.',

            'data' => $department

        ], 200);

    }
 
    public function update(UpdateDepartmentRequest $request, Department $department)

    {

        $department->update($request->validated());
 
        return response()->json([

            'message' => 'Department updated successfully.',

            'data' => $department

        ], 200);

    }
 
    public function destroy(Department $department)

    {

        if ($department->employees()->exists()) {

            return response()->json([

                'success' => false,

                'message' => 'Cannot delete department with assigned employees.'

            ], 400);

        }
 
        $department->delete();
 
        return response()->json([

            'success' => true,

            'message' => 'Department deleted successfully.'

        ], 200);

    }
 
    public function departmentsWithEmployees()

    {

        $departments = Department::with('employees')->get();
 
        return response()->json([

            'data' => $departments

        ], 200);

    }

}

 