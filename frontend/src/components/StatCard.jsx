// components/StatCard.js
export default function StatCard({ icon, title, value, description }) {
  return (
    <div
      className="card text-dark bg-light"
      style={{
        minWidth: "18rem",
        borderRadius: "20px",
        boxShadow: "0 4px 10px rgba(172, 112, 198, 0.2)",
        flex: "1 1 auto",
        borderTop: "4px solid #9b59b6",
        margin: "1rem",
      }}
    >
      <div className="card-body d-flex flex-column align-items-start">
        <div className="d-flex align-items-center mb-2">
          <i className={`fa-solid ${icon} fa-3x me-3`} style={{ color: "#9b59b6" }}></i>
          <div>
            <p className="mb-1 fw-semibold text-muted">{title}</p>
            <h5 className="card-title mb-0" style={{ color: "#9b59b6" }}>{value}</h5>
          </div>
        </div>
        <p className="card-text small text-muted text-center w-100 mt-2">
          {description}
        </p>
      </div>
    </div>
  );
}
