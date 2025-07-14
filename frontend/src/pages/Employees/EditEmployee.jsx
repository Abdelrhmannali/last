import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as yup from "yup";
import { useFormik } from "formik";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Select from "react-select"; // ← NEW
import api from "../../api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Employee.css";

/* ---------------- reusable input ---------------- */
const Input = ({ label, name, type, formik }) => (
  <div className="col-md-6 mb-3">
    <label className="form-label">{label}</label>
    <input
      type={type}
      name={name}
      className={
        "form-control" +
        (formik.touched[name] && formik.errors[name] ? " is-invalid" : "")
      }
      value={formik.values[name]}
      onChange={formik.handleChange}
      onBlur={formik.handleBlur}
    />
    {formik.touched[name] && formik.errors[name] && (
      <div className="invalid-feedback">{formik.errors[name]}</div>
    )}
  </div>
);

/* --------------- shared react‑select styles --------------- */
const getSelectStyles = (hasError) => ({
  control: (base) => ({
    ...base,
    backgroundColor: "#fff",
    borderColor: hasError ? "#e74c3c" : "#ddd",
    borderWidth: "2px",
    borderRadius: "8px",
    padding: "2px 6px",
    fontSize: "0.875rem",
    minHeight: "38px",
    boxShadow: "none",
    "&:hover": {
      borderColor: hasError ? "#e74c3c" : "#ac70c6",
    },
  }),
  singleValue: (base) => ({
    ...base,
    color: "#333", // نفس لون النص في الانبتس
  }),
  input: (base) => ({
    ...base,
    color: "#333",
  }),
  placeholder: (base) => ({
    ...base,
    color: "#aaa",
  }),
  option: (base, { isFocused, isSelected }) => ({
    ...base,
    backgroundColor: isSelected
      ? "#d8b4f8" // موف فاتح عند التحديد
      : isFocused
      ? "#f9edfc" // خلفية أفتح عند hover
      : "#fff",
    color: "#6b48a3", // لون نص موف جميل
    fontSize: "0.875rem",
    padding: "10px 12px",
    cursor: "pointer",
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "8px",
    boxShadow: "0 4px 10px rgba(172, 112, 198, 0.1)",
  }),
});

/* ---------------------------------------------------------- */
export default function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [fileName, setFileName] = useState("No chosen file");

  /* ---------- fetch employee + departments ---------- */
  const { data: emp, isError: empError } = useQuery({
    queryKey: ["employee", id],
    queryFn: () => api.get(`/employees/${id}`).then((r) => r.data),
  });
  const { data: departmentsData, isError: depError } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get("/departments").then((r) => r.data),
  });
  const departments = Array.isArray(departmentsData)
    ? departmentsData
    : departmentsData?.data ?? [];
  const departmentOptions = departments.map((d) => ({
    value: d.id,
    label: d.dept_name,
  }));

  useEffect(() => {
    if (emp?.profile_picture) {
      const original = emp.profile_picture.split("/").pop();
      setFileName(original || "Current file");
    }
  }, [emp]);

  /* ---------- validation ---------- */
  const schema = yup.object({
    first_name: yup
      .string()
      .required()
      .matches(/^[a-zA-Z]{3,}$/, "Min 3 letters"),
    last_name: yup
      .string()
      .required()
      .matches(/^[a-zA-Z]{3,}$/, "Min 3 letters"),
    email: yup.string().email().required(),
    phone: yup
      .string()
      .matches(/^\d{11,15}$/, "11‑15 digits")
      .required(),
    salary: yup.number().typeError("Number").min(0).required(),
    hire_date: yup.date().min("2008-01-01").required(),
    gender: yup.string().oneOf(["Male", "Female"]).required(),
    nationality: yup.string().required(),
    national_id: yup
      .string()
      .matches(/^\d{14}$/)
      .required(),
    birthdate: yup
      .date()
      .max(new Date(new Date().setFullYear(new Date().getFullYear() - 20)))
      .required(),
    working_hours_per_day: yup.number().min(1).max(24).required(),
    department_id: yup.number().required(),
  });

  /* ---------- formik ---------- */
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      first_name: emp?.first_name ?? "",
      last_name: emp?.last_name ?? "",
      email: emp?.email ?? "",
      phone: emp?.phone ?? "",
      address: emp?.address ?? "",
      salary: emp?.salary ?? "",
      hire_date: emp?.hire_date?.slice(0, 10) ?? "",
      default_check_in_time: emp?.default_check_in_time?.slice(0, 5) ?? "",
      default_check_out_time: emp?.default_check_out_time?.slice(0, 5) ?? "",
      gender: emp?.gender ?? "",
      nationality: emp?.nationality ?? "",
      national_id: emp?.national_id ?? "",
      birthdate: emp?.birthdate?.slice(0, 10) ?? "",
      department_id: emp?.department_id ?? "",
      working_hours_per_day: emp?.working_hours_per_day ?? "",
      profile_picture: null,
    },
    validationSchema: schema,
    onSubmit: handleSave,
  });

  /* ---------- submit ---------- */
  function handleSave(values) {
    const fd = new FormData();

    for (const [k, v] of Object.entries(values)) {
      if (k === "profile_picture") {
        // أضف الصورة فقط لو المستخدم اختار ملفًا جديدًا
        if (v) fd.append("profile_picture", v);
      } else {
        fd.append(k, v ?? "");
      }
    }

    fd.append("_method", "PUT");

    api
      .post(`/employees/${id}`, fd)
      .then(() => {
        toast.success("Employee updated");
        qc.invalidateQueries({ queryKey: ["employee", id] });
        qc.invalidateQueries({ queryKey: ["employees"] });
        navigate("/employees");
      })
      .catch((err) => {
        if (err.response?.status === 422) {
          formik.setErrors(err.response.data.errors || {});
          toast.error("Fix validation errors");
        } else toast.error("Update failed");
      });
  }

  if (empError || depError)
    return <div className="alert alert-danger">Failed to load data</div>;

  const genderOptions = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
  ];

  /* ---------- UI ---------- */
  return (
    <div className="employee-page-wrapper">
      <ToastContainer position="bottom-end" autoClose={3000} />
      {/* header */}
      <div className="employee-header">
        <div className="employee-header-title ms-5">
          <span className="employee-header-icon">
            <i className="fa-solid fa-user-pen" />
          </span>
          <h2>Edit Employee</h2>
        </div>
      </div>

      {/* form */}
      <div className="employee-form-container">
        <form
          noValidate
          onSubmit={formik.handleSubmit}
          encType="multipart/form-data"
        >
          {/* --- Personal Info --- */}
          <fieldset className="border p-3 mb-4 rounded">
            <legend className="float-none w-auto px-3">
              Personal Information
            </legend>
            <div className="row g-3">
              <Input
                label="First Name"
                name="first_name"
                type="text"
                formik={formik}
              />
              <Input
                label="Last Name"
                name="last_name"
                type="text"
                formik={formik}
              />
              <Input label="Email" name="email" type="email" formik={formik} />
              <Input label="Phone" name="phone" type="tel" formik={formik} />
              <Input
                label="Nationality"
                name="nationality"
                type="text"
                formik={formik}
              />
              <Input
                label="National ID"
                name="national_id"
                type="text"
                formik={formik}
              />
              <Input
                label="Birthdate"
                name="birthdate"
                type="date"
                formik={formik}
              />

              {/* Gender select */}
              <div className="col-md-6 mb-3">
                <label className="form-label">Gender</label>
                <Select
                  name="gender"
                  options={genderOptions}
                  value={genderOptions.find(
                    (o) => o.value === formik.values.gender
                  )}
                  onChange={(o) => formik.setFieldValue("gender", o.value)}
                  onBlur={() => formik.setFieldTouched("gender", true)}
                  styles={getSelectStyles(
                    formik.touched.gender && formik.errors.gender
                  )}
                  placeholder="Select Gender"
                />
                {formik.touched.gender && formik.errors.gender && (
                  <div className="invalid-feedback d-block">
                    {formik.errors.gender}
                  </div>
                )}
              </div>

              <Input
                label="Address"
                name="address"
                type="text"
                formik={formik}
              />
            </div>
          </fieldset>

          {/* --- Job Settings --- */}
          <fieldset className="border p-3 mb-4 rounded">
            <legend className="float-none w-auto px-3">Job Settings</legend>
            <div className="row g-3">
              <Input
                label="Hire Date"
                name="hire_date"
                type="date"
                formik={formik}
              />
              <Input
                label="Salary"
                name="salary"
                type="number"
                formik={formik}
              />
              <Input
                label="Working Hours/Day"
                name="working_hours_per_day"
                type="number"
                formik={formik}
              />
              <Input
                label="Check In Time"
                name="default_check_in_time"
                type="time"
                formik={formik}
              />
              <Input
                label="Check Out Time"
                name="default_check_out_time"
                type="time"
                formik={formik}
              />

              {/* Department select */}
              <div className="col-md-6 mb-3">
                <label className="form-label">Department</label>
                <Select
                  name="department_id"
                  options={departmentOptions}
                  value={departmentOptions.find(
                    (o) => o.value === formik.values.department_id
                  )}
                  onChange={(o) =>
                    formik.setFieldValue("department_id", o.value)
                  }
                  onBlur={() => formik.setFieldTouched("department_id", true)}
                  styles={getSelectStyles(
                    formik.touched.department_id && formik.errors.department_id
                  )}
                  placeholder="Select Department"
                />
                {formik.touched.department_id &&
                  formik.errors.department_id && (
                    <div className="invalid-feedback d-block">
                      {formik.errors.department_id}
                    </div>
                  )}
              </div>

              {/* File upload */}
              <div className="col-md-6 mb-3">
                <label className="form-label">Profile Picture</label>
                <input
                  type="file"
                  id="profile_picture"
                  name="profile_picture"
                  className="file-input"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.currentTarget.files[0];
                    formik.setFieldValue("profile_picture", file || null);
                    setFileName(file ? file.name : "No chosen file");
                  }}
                />
                <label htmlFor="profile_picture" className="custom-file-button">
                  {fileName}
                </label>
              </div>
            </div>
          </fieldset>

          {/* submit */}
          <div className="d-grid">
            <button
              type="submit"
              className="employee-form-button-addEdit"
              disabled={!formik.isValid || !formik.dirty || formik.isSubmitting}
            >
              {formik.isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}