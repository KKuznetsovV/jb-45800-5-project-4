import PatientModel from "../../models/PatientModel";

interface Props {
  patients: PatientModel[];
  onSelect: (patient: PatientModel) => void;
}

function SamplePatients({ patients, onSelect }: Props) {
  return (
    <section className="samples">
      <span>10 patients for Shahar:</span>
      <div id="sample-buttons">
        {patients.map((patient) => (
          <button
            key={patient.id}
            type="button"
            title={patient.name}
            className={
              patient.expected_label === "high risk" ? "sample-high" : "sample-low"
            }
            onClick={() => onSelect(patient)}
          >
            {patient.id}. {patient.expected_label}
          </button>
        ))}
      </div>
    </section>
  );
}

export default SamplePatients;
