import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import { useFormik } from "formik";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Employee.css";

const Input = ({ label, name, type, formik, readOnly }) => (
  <div className="col-md-6 mb-3">
    <label className="form-label">{label}</label>
    <input
      type={type}
      name={name}
      className={
        "form-control employee-form-container" +
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

export default function AddEmployee() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [fileName, setFileName] = useState("No chosen file");

  const DEFAULT_AVATAR = null; // ضع مسار لصورة افتراضية إذا لزم الأمر

  const { data: departmentsData, isError } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get("/departments").then((r) => r.data),
  });
  const departments = Array.isArray(departmentsData)
    ? departmentsData
    : departmentsData?.data ?? [];

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
    working_hours_per_day: yup
      .number()
      .integer("Must be an integer")
      .min(1)
      .max(24)
      .required(),
    department_id: yup.number().required(),
  });

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

  // حساب ساعات العمل تلقائيًا
  useEffect(() => {
    const { default_check_in_time, default_check_out_time } = formik.values;
    if (default_check_in_time && default_check_out_time) {
      const [inHours, inMinutes] = default_check_in_time.split(":").map(Number);
      const [outHours, outMinutes] = default_check_out_time
        .split(":")
        .map(Number);

      let hoursDiff = outHours - inHours;
      let minutesDiff = outMinutes - inMinutes;

      // تحويل الفارق إلى ساعات
      if (minutesDiff < 0) {
        hoursDiff -= 1;
        minutesDiff += 60;
      }
      if (hoursDiff < 0) {
        hoursDiff += 24; // التعامل مع الانصراف في اليوم التالي
      }

      const totalHours = hoursDiff + minutesDiff / 60;
      formik.setFieldValue("working_hours_per_day", Math.round(totalHours));
    } else {
      formik.setFieldValue("working_hours_per_day", "");
    }
  }, [
    formik.values.default_check_in_time,
    formik.values.default_check_out_time,
  ]);

  // تحقق من الملف المرفوع
  const handleFileChange = (e) => {
    const file = e.currentTarget.files[0];
    if (file) {
      const validImageTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!validImageTypes.includes(file.type)) {
        toast.error("Please upload a valid image file (JPEG, PNG, or GIF).");
        return;
      }
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error("File size exceeds 5MB limit.");
        return;
      }
      formik.setFieldValue("profile_picture", file);
      setFileName(file.name);
    } else {
      formik.setFieldValue("profile_picture", null);
      setFileName("No chosen file");
    }
  };

  function handleSubmit(values, { setSubmitting }) {
    const fd = new FormData();

    if (!values.profile_picture && DEFAULT_AVATAR) {
      fd.append("default_avatar", DEFAULT_AVATAR);
    }

    Object.entries(values).forEach(([k, v]) => {
      if (k === "profile_picture" && v) {
        fd.append("profile_picture", v);
      } else if (k === "working_hours_per_day" && v !== "") {
        fd.append(k, Number(v)); // التأكد من إن working_hours_per_day يترسل كرقم صحيح
      } else {
        fd.append(k, v ?? "");
      }
    });

    api
      .post("/employees", fd)
      .then(() => {
        toast.success("Employee added successfully");
        qc.invalidateQueries({ queryKey: ["employees"] });
        navigate("/employees");
      })
      .catch((err) => {
        setSubmitting(false);
        if (err.response?.status === 422 && err.response.data.errors) {
          const errs = err.response.data.errors;
          formik.setErrors(errs);
          Object.keys(errs).forEach((field) =>
            formik.setFieldTouched(field, true, false)
          );
          if (errs.profile_picture) {
            toast.error(
              `Profile picture error: ${errs.profile_picture.join(", ")}`
            );
          } else if (errs.working_hours_per_day) {
            toast.error(
              `Working hours error: ${errs.working_hours_per_day.join(", ")}`
            );
          } else {
            toast.error("Please fix the highlighted errors");
          }
        } else {
          toast.error(`Failed to add employee: ${err.message}`);
        }
      });
  }

  if (isError)
    return <div className="alert alert-danger">Failed to load departments</div>;

  return (
    <div className="employee-page-wrapper">
      <ToastContainer position="bottom-end" autoClose={3000} />
      <div className="employee-header">
        <div className="employee-header-title ms-5">
          <span className="employee-header-icon">
            <i className="fa-solid fa-user-plus" />
          </span>
          <h2>Add Employee</h2>
        </div>
      </div>

      <div className="employee-form-container">
        <form
          noValidate
          onSubmit={formik.handleSubmit}
          encType="multipart/form-data"
        >
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
              <div className="col-md-6 mb-3">
                <label className="form-label">Gender</label>
                <select
                  name="gender"
                  className={
                    "form-select employee-form-container" +
                    (formik.touched.gender && formik.errors.gender
                      ? " is-invalid"
                      : "")
                  }
                  value={formik.values.gender}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                {formik.touched.gender && formik.errors.gender && (
                  <div className="invalid-feedback">{formik.errors.gender}</div>
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
                readOnly={true}
              />
              <div className="col-md-6 mb-3">
                <label className="form-label">Department</label>
                <select
                  name="department_id"
                  className={
                    "form-select employee-form-container" +
                    (formik.touched.department_id && formik.errors.department_id
                      ? " is-invalid"
                      : "")
                  }
                  value={formik.values.department_id}
                  onChange={(e) =>
                    formik.setFieldValue(
                      "department_id",
                      Number(e.target.value)
                    )
                  }
                  onBlur={formik.handleBlur}
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.dept_name}
                    </option>
                  ))}
                </select>
                {formik.touched.department_id &&
                  formik.errors.department_id && (
                    <div className="invalid-feedback">
                      {formik.errors.department_id}
                    </div>
                  )}
              </div>
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

          <div className="d-grid">
            <button
              type="submit"
              className="employee-form-button"
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