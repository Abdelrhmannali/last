import React, { useState } from "react";
import { useNavigate } from "react-router";
import * as yup from "yup";
import { useFormik } from "formik";
import { useQuery } from "@tanstack/react-query";
import api from "../../api";
import "./Employee.css";
import { toast, ToastContainer } from "react-toastify"; // Import Toastify
import "react-toastify/dist/ReactToastify.css"; // Import Toastify CSS

export default function AddEmployee() {
  const navigate = useNavigate();
  const [isLoadingSent, setIsLoadingSent] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get("/departments").then((res) => res.data),
  });

  const validationSchema = yup.object({
    first_name: yup
      .string()
      .required("First name is required")
      .matches(/^[a-zA-Z]{3,}$/, "Minimum 3 letters"),
    last_name: yup
      .string()
      .required("Last name is required")
      .matches(/^[a-zA-Z]{3,}$/, "Minimum 3 letters"),
    email: yup.string().email("Invalid email").required("Email is required"),
    phone: yup
      .string()
      .required("Phone is required")
      .matches(/^\d{11,15}$/, "Phone must be 11-15 digits"),
    address: yup.string().nullable(),
    salary: yup
      .number()
      .min(0, "Salary cannot be negative")
      .required("Salary is required"),
    hire_date: yup
      .date()
      .min("2008-01-01", "Hire date must be after 2008")
      .required("Hire date is required"),
    default_check_in_time: yup.string().nullable(),
    default_check_out_time: yup.string().nullable(),
    gender: yup
      .string()
      .oneOf(["Male", "Female"], "Invalid gender")
      .required("Gender is required"),
    nationality: yup.string().required("Nationality is required"),
    national_id: yup
      .string()
      .matches(/^\d{14}$/, "Must be 14 digits")
      .required("National ID is required"),
    birthdate: yup
      .date()
      .max(
        new Date(new Date().setFullYear(new Date().getFullYear() - 20)),
        "Must be at least 20 years old"
      )
      .required("Birthdate is required"),
    department_id: yup.number().nullable(),
    working_hours_per_day: yup
      .number()
      .min(1, "Minimum 1 hour")
      .max(24, "Maximum 24 hours")
      .required("Working hours per day is required"),
    profile_picture: yup.mixed().nullable(),
  });

  const formik = useFormik({
    initialValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      address: "",
      salary: "",
      hire_date: new Date().toISOString().split("T")[0],
      default_check_in_time: "",
      default_check_out_time: "",
      gender: "",
      nationality: "",
      national_id: "",
      birthdate: "",
      department_id: "",
      working_hours_per_day: "",
      profile_picture: null,
    },
    validationSchema,
    onSubmit: handleAddEmployee,
  });

  function handleAddEmployee(values) {
    setIsLoadingSent(true);
    const formData = new FormData();

    const fields = [
      "first_name",
      "last_name",
      "email",
      "phone",
      "address",
      "salary",
      "hire_date",
      "default_check_in_time",
      "default_check_out_time",
      "gender",
      "nationality",
      "national_id",
      "birthdate",
      "department_id",
      "working_hours_per_day",
    ];

    fields.forEach((field) => {
      if (values[field] !== "" && values[field] !== null) {
        formData.append(field, values[field]);
      }
    });

    if (values.profile_picture) {
      formData.append("profile_picture", values.profile_picture);
    }

    api
      .post("/employees", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then(() => {
        toast.success("Employee added successfully"); // Replace alert with toast
        navigate("/employees");
      })
      .catch((error) => {
        if (error.response?.status === 422) {
          const backendErrors = error.response.data.errors;
          const formikFormattedErrors = {};
          for (const key in backendErrors) {
            formikFormattedErrors[key] = backendErrors[key][0];
          }
          formik.setErrors(formikFormattedErrors);
          toast.error("Please check the form for errors"); // Notify about form errors
        } else {
          console.error("Upload error", error);
          toast.error("Something went wrong"); // Replace alert with toast
        }
      })
      .finally(() => setIsLoadingSent(false));
  }

  if (isLoading) return <div>Loading departments...</div>;
  if (isError) return <div>Failed to load departments</div>;

  const departments = Array.isArray(data) ? data : data?.data || [];

  return (
    <div className="add-employee-container">
      <ToastContainer position="bottom-end" className="p-3" autoClose={3000} /> {/* Add ToastContainer */}
      <h2 className="text-primary mb-4">
        <i className="fa-solid fa-pen-to-square"></i> Add Employee
      </h2>

      <form
        onSubmit={formik.handleSubmit}
        encType="multipart/form-data"
        className="row gx-3 gy-2"
      >
        {[
          { label: "First Name", name: "first_name", type: "text" },
          { label: "Last Name", name: "last_name", type: "text" },
          { label: "Email", name: "email", type: "email" },
          { label: "Phone", name: "phone", type: "text" },
          { label: "Address", name: "address", type: "text" },
          { label: "Salary", name: "salary", type: "number" },
          { label: "Hire Date", name: "hire_date", type: "date" },
          { label: "Check In", name: "default_check_in_time", type: "time" },
          { label: "Check Out", name: "default_check_out_time", type: "time" },
          { label: "Nationality", name: "nationality", type: "text" },
          { label: "National ID", name: "national_id", type: "text" },
          { label: "Birthdate", name: "birthdate", type: "date" },
          { label: "Working Hours/Day", name: "working_hours_per_day", type: "number" },
        ].map((field) => (
          <div key={field.name} className="col-md-6">
            <label htmlFor={field.name} className="form-label">
              {field.label}
            </label>
            <input
              type={field.type}
              className="form-control"
              id={field.name}
              name={field.name}
              value={formik.values[field.name]}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched[field.name] && formik.errors[field.name] && (
              <div className="alert alert-danger p-1 mt-1">{formik.errors[field.name]}</div>
            )}
          </div>
        ))}

        <div className="col-md-6">
          <label className="form-label">Gender</label>
          <select
            className="form-control"
            name="gender"
            value={formik.values.gender}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          {formik.touched.gender && formik.errors.gender && (
            <div className="alert alert-danger p-1 mt-1">{formik.errors.gender}</div>
          )}
        </div>

        <div className="col-md-6">
          <label className="form-label">Department</label>
          <select
            className="form-control"
            name="department_id"
            value={formik.values.department_id}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          >
            <option value="">Select</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.dept_name}
              </option>
            ))}
          </select>
          {formik.touched.department_id && formik.errors.department_id && (
            <div className="alert alert-danger p-1 mt-1">{formik.errors.department_id}</div>
          )}
        </div>

        <div className="col-md-6">
          <label className="form-label">Profile Picture</label>
          <input
            type="file"
            name="profile_picture"
            className="form-control"
            onChange={(e) =>
              formik.setFieldValue("profile_picture", e.currentTarget.files[0])
            }
            onBlur={formik.handleBlur}
          />
          {formik.errors.profile_picture && (
            <div className="alert alert-danger p-1 mt-1">{formik.errors.profile_picture}</div>
          )}
        </div>

        <div className="col-12">
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={!formik.isValid || isLoadingSent}
          >
            {isLoadingSent ? <i className="fas fa-spinner fa-spin"></i> : "Add Employee"}
          </button>
        </div>
      </form>
    </div>
  );
}