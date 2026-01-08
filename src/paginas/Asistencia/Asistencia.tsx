import { useState, useEffect } from 'react';
import { Clock, X, CheckCircle } from 'lucide-react';
import estilos from './Asistencia.module.css';

type TipoAsistencia = 'entrada' | 'inicio-almuerzo' | 'fin-almuerzo' | 'salida' | null;

function AsistenciaPage() {
  const [dni, setDni] = useState('');
  const [tipoAsistencia, setTipoAsistencia] = useState<TipoAsistencia>(null);
  const [hora, setHora] = useState('');
  const [fecha, setFecha] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [mostrarModalError, setMostrarModalError] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [slideIndex, setSlideIndex] = useState(0);

  // Actualizar hora y fecha en tiempo real
  useEffect(() => {
    const actualizarTiempo = () => {
      const ahora = new Date();
      
      // Formatear hora
      const horas = ahora.getHours();
      const minutos = ahora.getMinutes();
      const segundos = ahora.getSeconds();
      const ampm = horas >= 12 ? 'PM' : 'AM';
      const horas12 = horas % 12 || 12;
      const horaFormateada = `${String(horas12).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')} ${ampm}`;
      setHora(horaFormateada);

      // Formatear fecha
      const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      const diaSemana = diasSemana[ahora.getDay()];
      const dia = ahora.getDate();
      const mes = meses[ahora.getMonth()];
      const fechaFormateada = `${diaSemana}, ${String(dia).padStart(2, '0')} ${mes}`;
      setFecha(fechaFormateada);
    };

    actualizarTiempo();
    const interval = setInterval(actualizarTiempo, 1000);
    return () => clearInterval(interval);
  }, []);

  // Carrusel de imágenes
  const slides = [
    {
      title: "Control de asistencia",
      description: "Marca tu asistencia de forma rápida y sencilla. Registra tus entradas, salidas y tiempos de almuerzo con un solo clic.",
      image: (
        <svg width="400" height="300" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="300" fill="#ffffff" opacity="0.1"/>
          <rect x="50" y="50" width="300" height="200" rx="8" fill="#ffffff" opacity="0.2"/>
          <circle cx="200" cy="120" r="40" fill="#ffffff" opacity="0.3"/>
          <rect x="150" y="180" width="100" height="8" rx="4" fill="#ffffff" opacity="0.3"/>
          <rect x="170" y="200" width="60" height="8" rx="4" fill="#ffffff" opacity="0.3"/>
        </svg>
      )
    },
    {
      title: "Registro preciso",
      description: "Cada registro queda guardado con fecha y hora exacta, facilitando el seguimiento de tu asistencia laboral.",
      image: (
        <svg width="400" height="300" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="300" fill="#ffffff" opacity="0.1"/>
          <rect x="50" y="50" width="300" height="200" rx="8" fill="#ffffff" opacity="0.2"/>
          <rect x="80" y="80" width="240" height="30" rx="4" fill="#ffffff" opacity="0.3"/>
          <rect x="80" y="130" width="240" height="30" rx="4" fill="#ffffff" opacity="0.3"/>
          <rect x="80" y="180" width="240" height="30" rx="4" fill="#ffffff" opacity="0.3"/>
        </svg>
      )
    },
    {
      title: "Acceso rápido",
      description: "No necesitas iniciar sesión. Solo ingresa tu DNI y marca tu asistencia en segundos.",
      image: (
        <svg width="400" height="300" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="300" fill="#ffffff" opacity="0.1"/>
          <rect x="50" y="50" width="300" height="200" rx="8" fill="#ffffff" opacity="0.2"/>
          <rect x="100" y="100" width="200" height="40" rx="8" fill="#ffffff" opacity="0.3"/>
          <rect x="120" y="160" width="160" height="40" rx="8" fill="#ffffff" opacity="0.3"/>
        </svg>
      )
    }
  ];

  // Auto-avanzar el carrusel
  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Manejar cambio de DNI
  const handleDniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, ''); // Solo números
    setDni(valor);
  };

  // Limpiar DNI
  const limpiarDni = () => {
    setDni('');
  };

  // Manejar selección de tipo de asistencia
  const handleTipoAsistencia = (tipo: TipoAsistencia) => {
    setTipoAsistencia(tipo);
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!dni.trim()) {
      setMensajeError('Por favor ingresa tu DNI');
      setMostrarModalError(true);
      return;
    }

    if (!tipoAsistencia) {
      setMensajeError('Por favor selecciona un tipo de asistencia');
      setMostrarModalError(true);
      return;
    }

    setCargando(true);

    try {
      // TODO: Aquí iría la llamada a la API
      // const response = await fetch('/api/asistencia', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ dni, tipoAsistencia, fecha: new Date() })
      // });

      // Simulación de llamada API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Si todo está bien, mostrar modal de éxito
      setMostrarModalExito(true);
      setDni('');
      setTipoAsistencia(null);
    } catch (error) {
      setMensajeError('Error al marcar asistencia. Por favor intenta nuevamente.');
      setMostrarModalError(true);
    } finally {
      setCargando(false);
    }
  };

  // Cerrar modales
  const cerrarModalError = () => {
    setMostrarModalError(false);
    setMensajeError('');
  };

  const cerrarModalExito = () => {
    setMostrarModalExito(false);
  };

  return (
    <div className={estilos.contenedorAsistencia}>
      <div className={estilos.asistenciaWrapper}>
        {/* Contenido a la izquierda */}
        <div className={estilos.formularioContainer}>
          <div className={estilos.logoContainer}>
            <div className={estilos.logo}>
              <img src="/logo.png" alt="Olympus" style={{ width: 250 }} />
            </div>
          </div>

          <div className={estilos.tiempoContainer}>
            <div className={estilos.hora}>{hora}</div>
            <div className={estilos.fecha}>{fecha}</div>
          </div>

          <form className={estilos.formulario} onSubmit={handleSubmit}>
            <div className={estilos.inputGroup}>
              <label className={estilos.label}>Ingresa tu DNI:</label>
              <div className={estilos.inputContainer}>
                <input
                  className={estilos.input}
                  type="text"
                  placeholder="DNI"
                  value={dni}
                  onChange={handleDniChange}
                  maxLength={8}
                />
                {dni && (
                  <button
                    type="button"
                    className={estilos.clearButton}
                    onClick={limpiarDni}
                    aria-label="Limpiar DNI"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            <div className={estilos.botonesGrid}>
              <button
                type="button"
                className={`${estilos.botonTipo} ${tipoAsistencia === 'entrada' ? estilos.botonTipoActivo : ''}`}
                onClick={() => handleTipoAsistencia('entrada')}
              >
                <Clock size={20} />
                <span>Entrada</span>
              </button>

              <button
                type="button"
                className={`${estilos.botonTipo} ${tipoAsistencia === 'inicio-almuerzo' ? estilos.botonTipoActivo : ''}`}
                onClick={() => handleTipoAsistencia('inicio-almuerzo')}
              >
                <Clock size={20} />
                <span>Inicio Almuerzo</span>
              </button>

              <button
                type="button"
                className={`${estilos.botonTipo} ${tipoAsistencia === 'fin-almuerzo' ? estilos.botonTipoActivo : ''}`}
                onClick={() => handleTipoAsistencia('fin-almuerzo')}
              >
                <Clock size={20} />
                <span>Fin Almuerzo</span>
              </button>

              <button
                type="button"
                className={`${estilos.botonTipo} ${tipoAsistencia === 'salida' ? estilos.botonTipoActivo : ''}`}
                onClick={() => handleTipoAsistencia('salida')}
              >
                <Clock size={20} />
                <span>Salida</span>
              </button>
            </div>

            <button 
              className={estilos.botonPrincipal} 
              type="submit" 
              disabled={cargando}
            >
              {cargando ? 'Marcando...' : 'Marcar Asistencia'}
            </button>
          </form>
        </div>

        {/* Carrusel a la derecha */}
        <div className={estilos.carruselContainer}>
          <div className={estilos.carruselContent}>
            <div className={estilos.carruselSlides} style={{ transform: `translateX(-${slideIndex * 100}%)` }}>
              {slides.map((slide, index) => (
                <div key={index} className={estilos.slide}>
                  <div className={estilos.slideImage}>{slide.image}</div>
                  <h2 className={estilos.slideTitle}>{slide.title}</h2>
                  <p className={estilos.slideDescription}>{slide.description}</p>
                </div>
              ))}
            </div>
            <div className={estilos.pagination}>
              {slides.map((_, index) => (
                <button
                  key={index}
                  className={`${estilos.paginationDot} ${index === slideIndex ? estilos.active : ''}`}
                  onClick={() => setSlideIndex(index)}
                  aria-label={`Slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de error */}
      {mostrarModalError && (
        <div className={estilos.modalOverlay} onClick={cerrarModalError}>
          <div className={estilos.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={estilos.modalHeader}>
              <h3 className={estilos.modalTitle}>Error</h3>
              <button className={estilos.modalCloseButton} onClick={cerrarModalError} aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>
            <div className={estilos.modalBody}>
              <p className={estilos.modalMessage}>{mensajeError}</p>
            </div>
            <div className={estilos.modalFooter}>
              <button className={estilos.modalButton} onClick={cerrarModalError}>
                Volver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de éxito */}
      {mostrarModalExito && (
        <div className={estilos.modalOverlay} onClick={cerrarModalExito}>
          <div className={estilos.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={estilos.modalSuccessContent}>
              <div className={estilos.successIconContainer}>
                <CheckCircle className={estilos.successIcon} size={64} />
              </div>
              <h3 className={estilos.modalSuccessTitle}>¡Asistencia marcada!</h3>
              <p className={estilos.modalSuccessMessage}>
                Tu asistencia ha sido registrada exitosamente.
              </p>
            </div>
            <div className={estilos.modalFooter}>
              <button className={estilos.modalButton} onClick={cerrarModalExito}>
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AsistenciaPage;
