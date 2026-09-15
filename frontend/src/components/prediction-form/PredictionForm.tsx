import { useEffect, useState } from "react";

import type { PredictionFeatures } from "../../services/prediction-service";

interface Props {
  initialValues: PredictionFeatures;
  disabled: boolean;
  onSubmit: (values: PredictionFeatures) => void;
}

function PredictionForm({ initialValues, disabled, onSubmit }: Props) {
  const [values, setValues] = useState<PredictionFeatures>(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  function handleChange(field: keyof PredictionFeatures, value: string) {
    setValues((current) => ({ ...current, [field]: Number(value) }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        גיל
        <input
          type="number"
          min={1}
          max={120}
          required
          value={values.age}
          onChange={(e) => handleChange("age", e.target.value)}
        />
      </label>
      <label>
        מין
        <select
          required
          value={values.sex}
          onChange={(e) => handleChange("sex", e.target.value)}
        >
          <option value={0}>אישה</option>
          <option value={1}>גבר</option>
        </select>
      </label>
      <label>
        סוג כאב בחזה (cp)
        <select
          required
          value={values.cp}
          onChange={(e) => handleChange("cp", e.target.value)}
        >
          <option value={1}>1 - typical angina</option>
          <option value={2}>2 - atypical angina</option>
          <option value={3}>3 - non-anginal pain</option>
          <option value={4}>4 - asymptomatic</option>
        </select>
      </label>
      <label>
        לחץ דם במנוחה (trestbps)
        <input
          type="number"
          min={50}
          max={250}
          required
          value={values.trestbps}
          onChange={(e) => handleChange("trestbps", e.target.value)}
        />
      </label>
      <label>
        כולסטרול (chol)
        <input
          type="number"
          min={50}
          max={700}
          required
          value={values.chol}
          onChange={(e) => handleChange("chol", e.target.value)}
        />
      </label>
      <label>
        סוכר בצום מעל 120 (fbs)
        <select
          required
          value={values.fbs}
          onChange={(e) => handleChange("fbs", e.target.value)}
        >
          <option value={0}>לא</option>
          <option value={1}>כן</option>
        </select>
      </label>
      <label>
        תוצאת ECG במנוחה (restecg)
        <select
          required
          value={values.restecg}
          onChange={(e) => handleChange("restecg", e.target.value)}
        >
          <option value={0}>0 - תקין</option>
          <option value={1}>1 - ST-T abnormality</option>
          <option value={2}>2 - left ventricular hypertrophy</option>
        </select>
      </label>
      <label>
        דופק מקסימלי (thalach)
        <input
          type="number"
          min={50}
          max={250}
          required
          value={values.thalach}
          onChange={(e) => handleChange("thalach", e.target.value)}
        />
      </label>
      <label>
        תעוקה במאמץ (exang)
        <select
          required
          value={values.exang}
          onChange={(e) => handleChange("exang", e.target.value)}
        >
          <option value={0}>לא</option>
          <option value={1}>כן</option>
        </select>
      </label>
      <label>
        ST depression (oldpeak)
        <input
          type="number"
          step={0.1}
          min={0}
          max={10}
          required
          value={values.oldpeak}
          onChange={(e) => handleChange("oldpeak", e.target.value)}
        />
      </label>
      <button type="submit" disabled={disabled}>
        חשב סיכון
      </button>
    </form>
  );
}

export default PredictionForm;
