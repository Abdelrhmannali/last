import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import { useFormik } from "formik";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Select from "react-select"; // ← NEW
import api from "../../api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Employee.css";

/* ----------------- reusable text/number input ----------------- */
const Input = ({ label, name, type, formik, readOnly }) => (
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
      readOnly={readOnly}
    />
    {formik.touched[name] && formik.errors[name] && (
      <div className="invalid-feedback">{formik.errors[name]}</div>
    )}
  </div>
);

/* ----------------- react‑select shared styles ----------------- */
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

/* -------------------------------------------------------------- */
export default function AddEmployee() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [fileName, setFileName] = useState("No chosen file");

  /* ---------- load departments ---------- */
  const { data: departmentsData, isError } = useQuery({
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
    working_hours_per_day: yup.number().integer().min(1).max(24).required(),
    department_id: yup.number().required(),
  });

  /* ---------- formik ---------- */
  const today = new Date().toISOString().slice(0, 10);
  const formik = useFormik({
    initialValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      address: "",
      salary: "",
      hire_date: today,
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
    validationSchema: schema,
    onSubmit: handleSubmit,
  });

  /* ---------- auto‑calc working hours ---------- */
  useEffect(() => {
    const { default_check_in_time, default_check_out_time } = formik.values;
    if (default_check_in_time && default_check_out_time) {
      const [inH, inM] = default_check_in_time.split(":").map(Number);
      const [outH, outM] = default_check_out_time.split(":").map(Number);
      let hours = outH - inH + (outM - inM) / 60;
      if (hours < 0) hours += 24;
      formik.setFieldValue("working_hours_per_day", Math.round(hours));
    } else {
      formik.setFieldValue("working_hours_per_day", "");
    }
  }, [
    formik.values.default_check_in_time,
    formik.values.default_check_out_time,
  ]);

  /* ---------- file validation ---------- */
  const handleFileChange = (e) => {
    const file = e.currentTarget.files[0];
    if (!file) {
      formik.setFieldValue("profile_picture", null);
      setFileName("No chosen file");
      return;
    }
    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast.error("Only JPEG, PNG, GIF allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max size 5 MB");
      return;
    }
    formik.setFieldValue("profile_picture", file);
    setFileName(file.name);
  };

  /* ---------- submit ---------- */
  function handleSubmit(values, { setSubmitting }) {
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (k === "profile_picture" && v) fd.append(k, v);
      else fd.append(k, v ?? "");
    });

    api
      .post("/employees", fd)
      .then(() => {
        toast.success("Employee added");
        qc.invalidateQueries({ queryKey: ["employees"] });
        navigate("/employees");
      })
      .catch((err) => {
        setSubmitting(false);
        if (err.response?.status === 422) {
          formik.setErrors(err.response.data.errors || {});
          toast.error("Check validation errors");
        } else toast.error("Failed to add");
      });
  }

  if (isError)
    return <div className="alert alert-danger">Failed to load departments</div>;

  /* ---------- options ---------- */
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
            <i className="fa-solid fa-user-plus" />
          </span>
          <h2>Add Employee</h2>
        </div>
      </div>

      {/* form */}
      <div className="employee-form-container">
        <form
          noValidate
          onSubmit={formik.handleSubmit}
          encType="multipart/form-data"
        >
          {/* === Personal Info === */}
          <fieldset className="border p-3 mb-4 rounded">
            <legend className="float-none w-auto px-3">Personal Info</legend>
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

          {/* === Job Settings === */}
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
              <Input
                label="Working Hours/Day"
                name="working_hours_per_day"
                type="number"
                formik={formik}
                readOnly
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
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handleFileChange}
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
              disabled={
                formik.isSubmitting || Object.keys(formik.errors).length > 0
              }
            >
              {formik.isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Submitting…
                </>
              ) : (
                "Add Employee"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}