import React, { useState } from "react";
import { Mail, Phone } from "lucide-react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "./EnrollmentForm.css";

const EnrollmentForm = () => {
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  return (
    <>
      {/* HERO SECTION */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>Bienvenido a IMB Institute</h1>
          <p>Nos esmeramos cada día por superar tus expectativas.</p>
          <p>
            Te invitamos a completar tu ficha de matrícula para poder crear tus
            accesos e iniciar tu crecimiento profesional.
          </p>
        </div>
      </div>

      <div className="enrollment-container">
        {/* FORM */}
        <div className="form-panel">
        <h2>Ficha de Inscripción</h2>

        <div className="form-group">
          <label>Programa de Capacitación <span className="required">*</span></label>
          <input type="text" />
        </div>

        <div className="form-group">
          <label>Clases de Inglés</label>
          <select>
            <option>Ninguno</option>
            <option>Básico</option>
            <option>Intermedio</option>
            <option>Avanzado</option>
          </select>
        </div>

        <div className="form-group">
          <label>Nombres y Apellidos completos <span className="required">*</span></label>
          <input type="text" />
        </div>

        <div className="form-group">
          <label>Número de Documento / Cédula / Carnet <span className="required">*</span></label>
          <input type="text" maxLength={25} />
          <small>0 de 25 caracteres máximos.</small>
        </div>

        <div className="form-group">
          <label>Fecha de Nacimiento</label>
          <input type="date" />
        </div>

        <div className="form-group">
          <label>
            Nivel de familiaridad con el uso de tecnología (WhatsApp, Zoom, correo electrónico, plataforma Moodle) <span className="required">*</span>
          </label>
          <select>
            <option>No tengo experiencia previa</option>
            <option>Básico (uso limitado, con apoyo)</option>
            <option>Intermedio (uso habitual de herramientas digitales)</option>
            <option>Avanzado (uso frecuente y autónomo)</option>
          </select>
        </div>

        {/* NEW FIELDS */}

        <div className="form-group">
          <label>Correo electrónico <span className="required">*</span></label>
          <input type="email" />
        </div>

        <div className="form-group">
          <label>Número de WhatsApp <span className="required">*</span></label>
          <PhoneInput
            international
            defaultCountry="PE"
            value={phoneNumber}
            onChange={(value) => setPhoneNumber(value || "")}
            placeholder="987 654 321"
            className="phone-input-field"
          />
        </div>

        <div className="form-group">
          <label>País <span className="required">*</span></label>
          <input type="text" />
        </div>

        <div className="form-group">
          <label>Área de Formación</label>
          <input type="text" />
        </div>

        <div className="form-group">
          <label>Empresa <span className="required">*</span></label>
          <input type="text" />
        </div>

        <div className="form-group">
          <label>Cargo <span className="required">*</span></label>
          <input type="text" />
        </div>

        <div className="form-group">
          <label>Facturación <span className="required">*</span></label>
          <select>
            <option>Boleta</option>
            <option>Factura</option>
          </select>
        </div>

        {/* DATOS DE FACTURACIÓN */}
        <div className="form-group">
          <label>Razón social o Nombre completo para facturación <span className="required">*</span></label>
          <input type="text" maxLength={25} />
          <small>0 de 25 caracteres máximos.</small>
        </div>

        <div className="form-group">
          <label>Número de facturación (RUC/RUT/RFC/NIT/otros) <span className="required">*</span></label>
          <input type="text" maxLength={25} />
          <small>0 de 25 caracteres máximos.</small>
        </div>

        <button className="submit-btn">Matricularme ahora</button>
      </div>

      {/* SUPPORT PANEL */}
      <div className="support-panel">
        <h3>SOPORTE</h3>
        <p>
          Hola, te saludamos desde el área de Soporte Académico y Administrativo
          de IMB Institute, de tener inconvenientes con el llenado de tu ficha o
          si alguna consulta adicional, puedes comunicarte con nosotros a:
        </p>

        <div className="support-item">
          <Mail size={18} className="support-icon" />
          <span>academicsupport@imbinstitute.com</span>
        </div>
        <div className="support-item">
          <Phone size={18} className="support-icon" />
          <a
            href="https://wa.me/51964391595"
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-link"
          >
            +51 964 391 595
          </a>
        </div>
      </div>
      </div>
    </>
  );
};

export default EnrollmentForm;
