import React, { useState, useEffect } from "react";
import { Mail, Phone } from "lucide-react";
import PhoneInput, { parsePhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "./EnrollmentForm.css";
import { obtenerTipos, obtenerMetodosPago } from "../../servicios/TipoService";
import { fetchProductOptions } from "../../servicios/ProductoService";
import { obtenerPaises } from "../../config/rutasApi";
import { obtenerSesiones, insertarAlumno } from "../../servicios/AlumnoService";
import type { IAlumnoInsertar } from "../../servicios/AlumnoService";

interface DropdownOption {
  id: string | number;
  label: string;
}

const EnrollmentForm = () => {
  // State for form fields
  const [formData, setFormData] = useState({
    programaCapacitacion: "",
    clasesIngles: "",
    nombres: "",
    apellidos: "",
    numeroDocumento: "",
    fechaNacimiento: "",
    nivelTecnologia: "",
    email: "",
    phoneNumber: "",
    idPais: "", // Changed from pais to idPais
    areaFormacion: "",
    empresa: "",
    cargo: "",
    tipoFacturacion: "",
    razonSocial: "",
    numeroFacturacion: "",
    metodoPago: "",
  });

  // State for dynamic dropdown options
  const [englishOptions, setEnglishOptions] = useState<DropdownOption[]>([]);
  const [techLevelOptions, setTechLevelOptions] = useState<DropdownOption[]>([]);
  const [billingOptions, setBillingOptions] = useState<DropdownOption[]>([]);
  const [productOptions, setProductOptions] = useState<DropdownOption[]>([]);
  const [paymentMethodOptions, setPaymentMethodOptions] = useState<DropdownOption[]>([]);
  const [countryOptions, setCountryOptions] = useState<DropdownOption[]>([]);
  const [addonOptions, setAddonOptions] = useState<DropdownOption[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);


  // Fetch options from API
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // Fetch options in parallel
        // Assuming categories: 'ClaseIngles', 'NivelTecnologia', 'TipoFacturacion'
        const [inglesRes, techRes, facturacionRes, metodoPagoRes, productosRes, paisesRes, sesionesRes] = await Promise.all([
          obtenerTipos("Nivel Ingles"),
          obtenerTipos("Nivel Tecnologia"),
          obtenerTipos("Tipo Facturacion"),
          obtenerMetodosPago(),
          fetchProductOptions(),
          obtenerPaises(),
          obtenerSesiones()
        ]);

        setEnglishOptions(inglesRes.map(item => ({ id: item.id, label: item.nombre })));
        setTechLevelOptions(techRes.map(item => ({ id: item.id, label: item.nombre })));
        setBillingOptions(facturacionRes.map(item => ({ id: item.id, label: item.nombre })));
        setPaymentMethodOptions(metodoPagoRes.map(item => ({ id: item.id, label: item.nombre })));
        setCountryOptions(paisesRes.map(item => ({ id: item.id, label: item.nombre }))); // Now using ID
        setAddonOptions(sesionesRes.map(item => ({ id: item.idSesion, label: item.nombre })));

        if (productosRes && productosRes.productos) {
          setProductOptions(productosRes.productos.map(p => ({
            id: p.idProducto,
            label: p.nombre
          })));
        }

      } catch (error) {
        console.error("Error fetching dropdown options:", error);
      }
    };

    fetchOptions();
  }, []);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddonChange = (id: string | number) => {
    const idStr = String(id);
    setSelectedAddons(prev => {
      if (prev.includes(idStr)) {
        return prev.filter(item => item !== idStr);
      } else {
        return [...prev, idStr];
      }
    });
  };

  const handlePhoneChange = (value: string | undefined) => {
    setFormData(prev => ({
      ...prev,
      phoneNumber: value || ""
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    // Prevent standard submission if wrapped in form
    e.preventDefault();

    // Validation Logic
    const newErrors: string[] = [];

    // 1. Validate General Required Fields
    // 1. Validate General Required Fields
    if (!formData.programaCapacitacion) newErrors.push("Programa de Capacitación es requerido.");
    if (!formData.nombres) newErrors.push("Nombres son requeridos.");
    if (!formData.apellidos) newErrors.push("Apellidos son requeridos.");
    if (!formData.numeroDocumento) newErrors.push("Número de Documento es requerido.");
    if (!formData.nivelTecnologia) newErrors.push("Nivel de familiaridad tecnológica es requerido.");
    if (!formData.email) newErrors.push("Correo electrónico es requerido.");
    if (!formData.phoneNumber) newErrors.push("Número de WhatsApp es requerido.");
    if (!formData.idPais) newErrors.push("País es requerido.");
    if (!formData.empresa) newErrors.push("Empresa es requerida.");
    if (!formData.cargo) newErrors.push("Cargo es requerido.");
    if (!formData.tipoFacturacion) newErrors.push("Tipo de Facturación es requerido.");
    if (!formData.metodoPago) newErrors.push("Método de Pago es requerido.");

    // 2. Validate Conditional Billing Fields
    // Find the label for the selected billing type
    const selectedBillingOption = billingOptions.find(opt => String(opt.id) === String(formData.tipoFacturacion));

    if (selectedBillingOption?.label === "Factura") {
      if (!formData.razonSocial) newErrors.push("Razón social es requerida para Factura.");
      if (!formData.numeroFacturacion) newErrors.push("Número de facturación es requerido para Factura.");
    }

    if (newErrors.length > 0) {
      alert("Por favor complete los siguientes campos:\n\n" + newErrors.join("\n"));
      return;
    }

      // Parse phone number
      const parsedPhone = formData.phoneNumber ? parsePhoneNumber(formData.phoneNumber) : undefined;
      const prefijoCelular = parsedPhone?.countryCallingCode ? `+${parsedPhone.countryCallingCode}` : "";
      const celular = parsedPhone?.nationalNumber ? parsedPhone.nationalNumber : formData.phoneNumber;

      const payload: IAlumnoInsertar = {
        // ... (rest of payload construction logic remains similar, updating just celular and prefijoCelular)
        idProducto: [Number(formData.programaCapacitacion)],
        idModulo: null,
        idSesiones: selectedAddons.length > 0 ? selectedAddons.join(",") : null,
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        dni: formData.numeroDocumento,
        fechaNacimiento: formData.fechaNacimiento || null,
        idPais: Number(formData.idPais),
        correo: formData.email,
        celular: celular, 
        prefijoCelular: prefijoCelular,
        prefijo: null,
        idTipoIngles: formData.clasesIngles ? Number(formData.clasesIngles) : null,
        idTipoTec: formData.nivelTecnologia ? Number(formData.nivelTecnologia) : null,
        idTipoFacturacion: formData.tipoFacturacion ? Number(formData.tipoFacturacion) : null,
        idMetodoPago: formData.metodoPago ? Number(formData.metodoPago) : null,
        areaFormacion: formData.areaFormacion || null,
        areaTrabajo: null,
        cargo: formData.cargo,
        empresa: formData.empresa,
        industria: null,
        razonSocial: formData.razonSocial || null,
        numeroFactura: formData.numeroFacturacion || null,
        estadoFormulario: true,
        estadoPago: false,
        usuarioAlumno: null,
        passwordAlumno: null,
        usuarioCreacion: "System",
        usuarioModificacion: null
      };

    try {
      await insertarAlumno(payload);
      console.log("Form Data Submitted:", { ...payload, selectedAddons });
      alert("Matrícula realizada con éxito.");
      // Optional: Redirect or clear form
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Error al realizar la matrícula. Por favor intente nuevamente.");
    }
  };

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
            <select
              name="programaCapacitacion"
              value={formData.programaCapacitacion}
              onChange={handleInputChange}
            >
              <option value="">Seleccione una opción</option>
              {productOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Checkboxes for Addons */}
          <div className="form-group">
            <label>Sesiones Extra</label>
            <div className="checkbox-group">
              {addonOptions.map(opt => (
                <label key={opt.id} className="checkbox-label">
                  <input
                    type="checkbox"
                    value={opt.id}
                    checked={selectedAddons.includes(String(opt.id))}
                    onChange={() => handleAddonChange(opt.id)}
                  />
                  <span>{" " + opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Nivel de Inglés</label>
            <select
              name="clasesIngles"
              value={formData.clasesIngles}
              onChange={handleInputChange}
            >
              <option value="">Seleccione una opción</option>
              {englishOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group form-row">
            <div>
              <label>Nombres <span className="required">*</span></label>
              <input
                type="text"
                name="nombres"
                value={formData.nombres}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label>Apellidos <span className="required">*</span></label>
              <input
                type="text"
                name="apellidos"
                value={formData.apellidos}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Número de Documento / Cédula / Carnet <span className="required">*</span></label>
            <input
              type="text"
              name="numeroDocumento"
              maxLength={25}
              value={formData.numeroDocumento}
              onChange={handleInputChange}
            />
            <small>{formData.numeroDocumento.length} de 25 caracteres máximos.</small>
          </div>

          <div className="form-group">
            <label>Fecha de Nacimiento</label>
            <input
              type="date"
              name="fechaNacimiento"
              value={formData.fechaNacimiento}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label>
              Nivel de familiaridad con el uso de tecnología (WhatsApp, Zoom, correo electrónico, plataforma Moodle) <span className="required">*</span>
            </label>
            <select
              name="nivelTecnologia"
              value={formData.nivelTecnologia}
              onChange={handleInputChange}
            >
              <option value="">Seleccione una opción</option>
              {techLevelOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* NEW FIELDS */}

          <div className="form-group">
            <label>Correo electrónico <span className="required">*</span></label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label>Número de WhatsApp <span className="required">*</span></label>
            <PhoneInput
              international
              defaultCountry="PE"
              value={formData.phoneNumber}
              onChange={handlePhoneChange}
              placeholder="987 654 321"
              className="phone-input-field"
            />
          </div>

          <div className="form-group">
            <label>País <span className="required">*</span></label>
            <select
              name="idPais"
              value={formData.idPais}
              onChange={handleInputChange}
            >
              <option value="">Seleccione una opción</option>
              {countryOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Área de Formación</label>
            <input
              type="text"
              name="areaFormacion"
              value={formData.areaFormacion}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label>Empresa <span className="required">*</span></label>
            <input
              type="text"
              name="empresa"
              value={formData.empresa}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label>Cargo <span className="required">*</span></label>
            <input
              type="text"
              name="cargo"
              value={formData.cargo}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label>Facturación <span className="required">*</span></label>
            <select
              name="tipoFacturacion"
              value={formData.tipoFacturacion}
              onChange={handleInputChange}
            >
              <option value="">Seleccione una opción</option>
              {billingOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* DATOS DE FACTURACIÓN - Only if "Factura" is selected */}
          {billingOptions.find(opt => String(opt.id) === String(formData.tipoFacturacion))?.label === "Factura" && (
            <>
              <div className="form-group">
                <label>Razón social o Nombre completo para facturación <span className="required">*</span></label>
                <input
                  type="text"
                  name="razonSocial"
                  maxLength={25}
                  value={formData.razonSocial}
                  onChange={handleInputChange}
                />
                <small>{formData.razonSocial.length} de 25 caracteres máximos.</small>
              </div>

              <div className="form-group">
                <label>Número de facturación (RUC/RUT/RFC/NIT/otros) <span className="required">*</span></label>
                <input
                  type="text"
                  name="numeroFacturacion"
                  maxLength={25}
                  value={formData.numeroFacturacion}
                  onChange={handleInputChange}
                />
                <small>{formData.numeroFacturacion.length} de 25 caracteres máximos.</small>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Método de Pago <span className="required">*</span></label>
            <select
              name="metodoPago"
              value={formData.metodoPago}
              onChange={handleInputChange}
            >
              <option value="">Seleccione una opción</option>
              {paymentMethodOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          <button className="submit-btn" onClick={handleSubmit}>Matricularme ahora</button>
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
