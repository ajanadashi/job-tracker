const STATUSES = ['wishlist', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn'];

// DTO field -> database column (whitelist used by the data layer)
const COLUMN_MAP = {
  company: 'company',
  position: 'position',
  status: 'status',
  url: 'url',
  location: 'location',
  salaryRange: 'salary_range',
  notes: 'notes',
  notifyEmail: 'notify_email',
  appliedAt: 'applied_at',
};

function toApplication(row) {
  return {
    id: row.id,
    company: row.company,
    position: row.position,
    status: row.status,
    url: row.url,
    location: row.location,
    salaryRange: row.salary_range,
    notes: row.notes,
    notifyEmail: row.notify_email,
    appliedAt: row.applied_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = { STATUSES, COLUMN_MAP, toApplication };
