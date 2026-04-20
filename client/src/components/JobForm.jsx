import { useEffect, useState } from 'react';

const defaultValues = {
  title: '',
  department: '',
  location: '',
  employmentType: '',
  description: '',
  requiredSkills: '',
};

const getValidationError = (values) => {
  const normalizedValues = {
    title: values.title.trim(),
    department: values.department.trim(),
    location: values.location.trim(),
    employmentType: values.employmentType.trim(),
    description: values.description.trim(),
  };

  if (!normalizedValues.title) {
    return 'Job title is required.';
  }

  if (!normalizedValues.department) {
    return 'Department is required.';
  }

  if (!normalizedValues.location) {
    return 'Location is required.';
  }

  if (!normalizedValues.employmentType) {
    return 'Employment type is required.';
  }

  if (!normalizedValues.description) {
    return 'Description is required.';
  }

  return '';
};

function JobForm({ initialValues = defaultValues, onSubmit, isSubmitting, submitLabel, error }) {
  const [formData, setFormData] = useState({
    ...defaultValues,
    ...initialValues,
  });
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    setFormData({
      ...defaultValues,
      ...initialValues,
    });
    setValidationError('');
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValidationError('');
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const nextValidationError = getValidationError(formData);

    if (nextValidationError) {
      setValidationError(nextValidationError);
      return;
    }

    const payload = {
      title: formData.title.trim(),
      department: formData.department.trim(),
      location: formData.location.trim(),
      employmentType: formData.employmentType.trim(),
      description: formData.description.trim(),
      requiredSkills: formData.requiredSkills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean),
    };

    onSubmit(payload);
  };

  return (
    <form className="panel space-y-6" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-6">
        <p className="kicker">Role Setup</p>
        <div>
          <h2 className="title-lg">Job information</h2>
          <p className="body-muted mt-2">
            Add the role details, hiring context, and core skill requirements for this opening.
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="field-label">Job title</span>
          <input
            className="input-field"
            type="text"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            placeholder="Senior Frontend Developer"
          />
        </label>

        <label className="block">
          <span className="field-label">Department</span>
          <input
            className="input-field"
            type="text"
            name="department"
            required
            value={formData.department}
            onChange={handleChange}
            placeholder="Engineering"
          />
        </label>

        <label className="block">
          <span className="field-label">Location</span>
          <input
            className="input-field"
            type="text"
            name="location"
            required
            value={formData.location}
            onChange={handleChange}
            placeholder="Bengaluru"
          />
        </label>

        <label className="block">
          <span className="field-label">Employment type</span>
          <input
            className="input-field"
            type="text"
            name="employmentType"
            required
            value={formData.employmentType}
            onChange={handleChange}
            placeholder="Full-time"
          />
        </label>
      </div>

      <label className="block">
        <span className="field-label">Required skills</span>
        <input
          className="input-field"
          type="text"
          name="requiredSkills"
          value={formData.requiredSkills}
          onChange={handleChange}
          placeholder="React, Tailwind CSS, REST APIs"
        />
        <span className="mt-2 block text-xs text-slate-500">
          Enter skills as comma-separated values. These will be used during candidate screening.
        </span>
      </label>

      <label className="block">
        <span className="field-label">Description</span>
        <textarea
          className="input-field min-h-44 resize-y"
          name="description"
          required
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe the role, expectations, and responsibilities."
        />
      </label>

      {validationError ? <p className="alert-error">{validationError}</p> : null}
      {error ? <p className="alert-error">{error}</p> : null}

      <div className="flex justify-stretch border-t border-slate-200 pt-2 sm:justify-end">
        <button
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default JobForm;
