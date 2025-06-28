import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as yup from "yup";
import { useFormik } from "formik";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Employee.css";

const Input = ({ label, name, type, formik }) => (
  <div className="col-md-6">
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
    />
    {formik.touched[name] && formik.errors[name] && (
      <div className="invalid-feedback">{formik.errors[name]}</div>
    )}
  </div>
);

export default function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const {
    data: emp,
    isLoading: empLoading,
    isError: empError,
  } = useQuery({
    queryKey: ["employee", id],
    queryFn: () => api.get(`/employees/${id}`).then((r) => r.data),
  });

  const {
    data: departmentsData,
    isLoading: depLoading,
    isError: depError,
  } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get("/departments").then((r) => r.data),
  });

  const schema = yup.object({
    first_name: yup
      .string()
      .required()
      .matches(/^[a-zA-Z]{3,}$/i, "Min 3 letters"),
    last_name: yup
      .string()
      .required()
      .matches(/^[a-zA-Z]{3,}$/i, "Min 3 letters"),
    email: yup.string().email().required(),
    phone: yup
      .string()
      .matches(/^\d{11,15}$/)
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
      .typeError("Number")
      .min(1)
      .max(24)
      .required(),
  });

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

  function handleSave(values) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(values)) {
      if (k === "profile_picture") {
        if (v) fd.append("profile_picture", v);
        continue;
      }
      fd.append(k, v ?? "");
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
        if (err.response?.status === 422 && err.response.data.errors) {
          formik.setErrors(err.response.data.errors);
          toast.error("Validation errors");
        } else toast.error("Update failed");
      });
  }

  if (empLoading || depLoading) return <div>Loading…</div>;
  if (empError || depError)
    return <div className="alert alert-danger">Failed to load data</div>;

  const departments = Array.isArray(departmentsData)
    ? departmentsData
    : departmentsData?.data ?? [];

  return (
    <div className="employee-page-wrapper">
      <ToastContainer position="bottom-end" autoClose={3000} />

      <div className="employee-header">
        <div className="employee-header-title">
          <span className="employee-header-icon">
            <i className="fa-solid fa-user-pen" />
          </span>
          <h2>Edit Employee</h2>
        </div>
      </div>

      <div className="employee-form-container">
        <form
          noValidate
          onSubmit={formik.handleSubmit}
          encType="multipart/form-data"
        >
          <fieldset className="border p-3 mb-4 rounded">
            <legend className="float-none w-auto px-3">Personal Information</legend>
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
              <Input label="Email" name="email" type="text" formik={formik} />
              <Input label="Phone" name="phone" type="text" formik={formik} />
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

              <div className="col-md-6">
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
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
                {formik.touched.gender && formik.errors.gender && (
                  <div className="invalid-feedback">{formik.errors.gender}</div>
                )}
              </div>

              <Input label="Address" name="address" type="text" formik={formik} />
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
              <Input label="Salary" name="salary" type="number" formik={formik} />
              <Input
                label="Working Hours/Day"
                name="working_hours_per_day"
                type="number"
                formik={formik}
              />
              <Input
                label="Check In"
                name="default_check_in_time"
                type="time"
                formik={formik}
              />
              <Input
                label="Check Out"
                name="default_check_out_time"
                type="time"
                formik={formik}
              />

              <div className="col-md-6">
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
                    formik.setFieldValue("department_id", Number(e.target.value))
                  }
                  onBlur={formik.handleBlur}
                >
                  <option value="">Select</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.dept_name}
                    </option>
                  ))}
                </select>
                {formik.touched.department_id && formik.errors.department_id && (
                  <div className="invalid-feedback">
                    {formik.errors.department_id}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label">Profile Picture</label>
                <input
                  type="file"
                  className="file-input"
                  name="profile_picture"
                  id="profile_picture"
                  accept="image/*"
                  onChange={(e) =>
                    formik.setFieldValue(
                      "profile_picture",
                      e.currentTarget.files[0] || null
                    )
                  }
                />
                <label htmlFor="profile_picture" className="custom-file-button">
                  Choose File
                </label>
              </div>
            </div>
          </fieldset>

          <div className="d-grid">
            <button
              type="submit"
              className="employee-form-button"
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