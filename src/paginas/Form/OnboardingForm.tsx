import React, { useState } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Upload, message } from "antd";
import type { UploadProps } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import "./OnboardingForm.css";

const OnboardingForm = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    apellidos: "",
    fechaNacimiento: "",
    dni: "",
    correo: "",
    fechaInicio: "",
    puesto: "",
    turno: "",
    direccion: "",
    ciudad: "",
    region: "",
    referenceContact: "",
    trainingArea: "",
    educationLevel: "",
    studyCenter: "",
    bankName: "",
    accountNumber: "",
  });
  const [celular, setCelular] = useState("");
  const [cvFile, setCvFile] = useState<any>(null);

  const { Dragger } = Upload;

  const uploadProps: UploadProps = {
    name: "file",
    multiple: false,
    accept: ".pdf,.doc,.docx",
    maxCount: 1,
    beforeUpload: (file) => {
      const isPDF = file.type === "application/pdf";
      const isDoc =
        file.type === "application/msword" ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      if (!isPDF && !isDoc) {
        message.error("Solo puedes subir archivos PDF o Word");
        return Upload.LIST_IGNORE;
      }

      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error("El archivo debe ser menor a 5MB");
        return Upload.LIST_IGNORE;
      }

      setCvFile(file);
      return false; // Prevent automatic upload
    },
    onRemove: () => {
      setCvFile(null);
    },
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!cvFile) {
      message.warning("Por favor, sube tu CV antes de enviar el formulario");
      return;
    }

    console.log("Form data:", formData);
    console.log("CV File:", cvFile);
    console.log("Celular:", celular);

    // Aquí puedes hacer el envío del formulario con FormData
    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      formDataToSend.append(key, formData[key as keyof typeof formData]);
    });
    formDataToSend.append("celular", celular);
    formDataToSend.append("cv", cvFile);

    message.success("Formulario enviado correctamente");
  };

  return (
    <>
      {/* HERO SECTION */}
      <div className="onboarding-hero">
        <div className="onboarding-hero-content">
          <h1>Bienvenido</h1>
          <p>
            Te saludamos del área de Recursos Humanos de IMB Institute,
            requerimos tus datos para formalizar tu incorporación
          </p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="onboarding-container">
        {/* FORM SECTION */}
        <div className="onboarding-form-panel">
          <h2>Ficha de datos</h2>

          <form onSubmit={handleSubmit}>
            <div className="onboarding-form-row">
              <div className="onboarding-form-group">
                <label>
                  Nombre <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="onboarding-form-group">
                <label>&nbsp;</label>
                <input
                  type="text"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="onboarding-form-group">
              <label>
                Fecha de nacimiento <span className="required">*</span>
              </label>
              <input
                type="date"
                name="fechaNacimiento"
                value={formData.fechaNacimiento}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="onboarding-form-group">
              <label>
                DNI <span className="required">*</span>
              </label>
              <input
                type="text"
                name="dni"
                value={formData.dni}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* CONTACTO */}
            <div className="onboarding-form-group">
              <label>
                Correo <span className="required">*</span>
              </label>
              <input
                type="email"
                name="correo"
                value={formData.correo}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="onboarding-form-group">
              <label>
                Celular <span className="required">*</span>
              </label>
              <PhoneInput
                international
                defaultCountry="PE"
                value={celular}
                onChange={(value) => setCelular(value || "")}
                placeholder="321 1234567"
                className="phone-input-field"
              />
            </div>

            <div className="onboarding-form-group">
              <label>Fecha inicio</label>
              <input
                type="date"
                name="fechaInicio"
                value={formData.fechaInicio}
                onChange={handleInputChange}
              />
            </div>

            <div className="onboarding-form-group">
              <label>Puesto</label>
              <input
                type="text"
                name="puesto"
                value={formData.puesto}
                onChange={handleInputChange}
              />
            </div>

            <div className="onboarding-form-group">
              <label>Turno</label>
              <select
                name="turno"
                value={formData.turno}
                onChange={handleInputChange}
              >
                <option value="">Seleccionar turno</option>
                <option value="mañana">Turno mañana</option>
                <option value="tarde">Turno tarde</option>
                <option value="completo">Tiempo completo</option>
              </select>
            </div>

            {/* DIRECCIÓN */}
            <div className="onboarding-form-group">
              <label>Dirección</label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
              />
            </div>

            <div className="onboarding-form-grid">
              <div className="onboarding-form-group">
                <label>Ciudad</label>
                <input
                  type="text"
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={handleInputChange}
                />
              </div>

              <div className="onboarding-form-group">
                <label>Departamento / Provincia</label>
                <input
                  type="text"
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* INFORMACIÓN ADICIONAL */}
            <div className="onboarding-form-group">
              <label>Contacto de referencia (Nombre + Teléfono)</label>
              <input
                type="text"
                name="referenceContact"
                value={formData.referenceContact}
                onChange={handleInputChange}
              />
            </div>

            <div className="onboarding-form-group">
              <label>Área de formación</label>
              <input
                type="text"
                name="trainingArea"
                value={formData.trainingArea}
                onChange={handleInputChange}
              />
            </div>

            <div className="onboarding-form-group">
              <label>Nivel de formación</label>
              <input
                type="text"
                name="educationLevel"
                value={formData.educationLevel}
                onChange={handleInputChange}
              />
            </div>

            <div className="onboarding-form-group">
              <label>Centro de estudios</label>
              <input
                type="text"
                name="studyCenter"
                value={formData.studyCenter}
                onChange={handleInputChange}
              />
            </div>

            <div className="onboarding-form-group">
              <label>Entidad bancaria</label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
              />
            </div>

            <div className="onboarding-form-group">
              <label>Número de cuenta</label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
              />
            </div>

            {/* CV UPLOAD */}
            <div className="onboarding-form-group cv-upload-section">
              <label className="cv-upload-title">CV Documentado</label>
              <Dragger {...uploadProps} className="cv-dragger">
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                  Haz clic o arrastra un archivo a esta área para subirlo.
                </p>
              </Dragger>
            </div>

            <button type="submit" className="onboarding-submit-btn">
              Enviar
            </button>
          </form>
        </div>

        {/* CONSULTAS PANEL */}
        <div className="onboarding-consultas-panel">
          <h3>CONSULTAS</h3>
          <p>
            De requerir apoyo o tener alguna duda sobre alguna pregunta puedes
            escribir a nuestros canales de Whatsapp:
          </p>
          <a
            href="https://wa.me/51941328673"
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-link"
          >
            +51 941 328 673
          </a>
        </div>
      </div>
    </>
  );
};

export default OnboardingForm;
