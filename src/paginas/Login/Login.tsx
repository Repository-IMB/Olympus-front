import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff, X, CheckCircle } from 'lucide-react';
import { useLogin } from '../../hooks/useLogin';
import estilos from './Login.module.css';

interface ErroresValidacion {
  email?: string;
}

function LoginPage() {
  const location = useLocation();
  const {
    correo,
    password,
    setCorreo,
    setPassword,
    error,
    cargando,
    manejarLogin
  } = useLogin();

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [erroresValidacion, setErroresValidacion] = useState<ErroresValidacion>({});
  const [touched, setTouched] = useState({ email: false });
  const [mostrarModalError, setMostrarModalError] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);

  // Función para validar email
  const validarEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validar campo email en tiempo real
  const validarCampoEmail = (valor: string) => {
    if (!valor.trim()) {
      setErroresValidacion({ email: 'El correo electrónico es requerido' });
    } else if (!validarEmail(valor)) {
      setErroresValidacion({ email: 'Por favor ingresa un correo electrónico válido' });
    } else {
      setErroresValidacion({});
    }
  };

  // Manejar cambios en el input de email
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setCorreo(valor);
    if (touched.email) {
      validarCampoEmail(valor);
    }
  };

  // Manejar blur del email
  const handleEmailBlur = () => {
    setTouched({ email: true });
    validarCampoEmail(correo);
  };

  // Validar antes de enviar
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Marcar el campo como tocado
    setTouched({ email: true });

    // Validar solo el email
    if (!correo.trim()) {
      setErroresValidacion({ email: 'El correo electrónico es requerido' });
      return;
    }
    
    if (!validarEmail(correo)) {
      setErroresValidacion({ email: 'Por favor ingresa un correo electrónico válido' });
      return;
    }

    // Limpiar errores de validación antes de enviar
    setErroresValidacion({});

    // Proceder con el login
    manejarLogin(e);
  };

  // Carrusel de imágenes hardcodeadas
  const slides = [
    {
      title: "Gestiona tus oportunidades",
      description: "Administra y sigue el progreso de todas tus oportunidades de venta en un solo lugar.",
      image: (
        <svg width="400" height="300" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="300" fill="#ffffff" opacity="0.1"/>
          <rect x="50" y="50" width="300" height="200" rx="8" fill="#ffffff" opacity="0.2"/>
          <rect x="70" y="80" width="120" height="20" rx="4" fill="#ffffff" opacity="0.3"/>
          <rect x="70" y="120" width="200" height="15" rx="4" fill="#ffffff" opacity="0.25"/>
          <rect x="70" y="150" width="180" height="15" rx="4" fill="#ffffff" opacity="0.25"/>
          <circle cx="320" cy="90" r="30" fill="#ffffff" opacity="0.2"/>
        </svg>
      )
    },
    {
      title: "Analiza tu rendimiento",
      description: "Obtén insights detallados sobre tus ventas y métricas de rendimiento en tiempo real.",
      image: (
        <svg width="400" height="300" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="300" fill="#ffffff" opacity="0.1"/>
          <rect x="50" y="50" width="300" height="200" rx="8" fill="#ffffff" opacity="0.2"/>
          <path d="M80 220 L120 180 L160 200 L200 120 L240 160 L280 100 L320 140" stroke="#ffffff" strokeWidth="3" fill="none" opacity="0.4"/>
          <circle cx="80" cy="220" r="4" fill="#ffffff" opacity="0.5"/>
          <circle cx="320" cy="140" r="4" fill="#ffffff" opacity="0.5"/>
        </svg>
      )
    },
    {
      title: "Colabora con tu equipo",
      description: "Trabaja en conjunto con tu equipo para cerrar más ventas y alcanzar tus objetivos.",
      image: (
        <svg width="400" height="300" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="300" fill="#ffffff" opacity="0.1"/>
          <circle cx="150" cy="120" r="40" fill="#ffffff" opacity="0.2"/>
          <circle cx="250" cy="120" r="40" fill="#ffffff" opacity="0.2"/>
          <rect x="100" y="180" width="200" height="60" rx="8" fill="#ffffff" opacity="0.2"/>
          <rect x="120" y="200" width="160" height="8" rx="4" fill="#ffffff" opacity="0.3"/>
          <rect x="120" y="220" width="120" height="8" rx="4" fill="#ffffff" opacity="0.3"/>
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

  // Mostrar modal cuando hay error del servidor y limpiar campos
  useEffect(() => {
    if (error) {
      setMostrarModalError(true);
      // Limpiar errores de validación cuando hay un error del servidor
      setErroresValidacion({});
      // Limpiar campos cuando las credenciales son incorrectas
      setCorreo('');
      setPassword('');
      setTouched({ email: false });
    }
  }, [error]);

  // Mostrar modal de éxito si viene de reset password
  useEffect(() => {
    if (location.state?.message) {
      setMostrarModalExito(true);
      // Limpiar el estado de location después de mostrarlo
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Cerrar modal (sin limpiar campos nuevamente, ya se limpiaron cuando apareció el error)
  const cerrarModal = () => {
    setMostrarModalError(false);
  };

  const cerrarModalExito = () => {
    setMostrarModalExito(false);
  };

  return (
    <div className={estilos.contenedorLogin}>
      <div className={estilos.loginWrapper}>
        {/* Formulario a la izquierda */}
        <div className={estilos.formularioContainer}>
          <div className={estilos.logoContainer}>
            <div className={estilos.logo}>
              {/* <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="25" cy="25" r="23" stroke="#1f1f1f" strokeWidth="2"/>
                <path d="M20 15 L25 20 L30 15" stroke="#1f1f1f" strokeWidth="2" fill="none"/>
                <path d="M20 25 L25 30 L30 25" stroke="#1f1f1f" strokeWidth="2" fill="none"/>
                <path d="M20 35 L25 40 L30 35" stroke="#1f1f1f" strokeWidth="2" fill="none"/>
              </svg> */}
              <img src="/logo.png" alt="Olympus" style={{ width: 250 }} />
            </div>
            {/* <span className={estilos.logoText}>OLYMPUS</span> */}
          </div>

          <form className={estilos.formulario} onSubmit={handleSubmit}>
            <div className={estilos.inputGroup}>
              <label className={estilos.label}>Email</label>
              <input
                className={`${estilos.input} ${erroresValidacion.email ? estilos.inputError : ''}`}
                type="email"
                placeholder="Correo electrónico"
                value={correo}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
              />
              {erroresValidacion.email && (
                <span className={estilos.errorMensaje}>{erroresValidacion.email}</span>
              )}
            </div>

            <div className={estilos.inputGroup}>
              <label className={estilos.label}>Password</label>
              <div className={estilos.inputContainer}>
                <input
                  className={estilos.input}
                  type={mostrarPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className={estilos.eyeButton}
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* <div className={estilos.optionsRow}>
              <label className={estilos.checkboxLabel}>
                <input type="checkbox" className={estilos.checkbox} defaultChecked />
                <span>Remember me</span>
              </label>
              <a href="#" className={estilos.forgotLink}>Forgot Password?</a>
            </div> */}
            
            <button className={estilos.boton} type="submit" disabled={cargando}>
              {cargando ? 'Ingresando...' : 'Sign in'}
            </button>

            <p className={estilos.registerText}>
              <Link to="/forgot-password" className={estilos.forgotLink}>
                ¿Olvidaste tu contraseña?
              </Link>
            </p>
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

      {/* Modal de error de credenciales */}
      {mostrarModalError && (
        <div className={estilos.modalOverlay} onClick={cerrarModal}>
          <div className={estilos.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={estilos.modalHeader}>
              <h3 className={estilos.modalTitle}>Error de autenticación</h3>
              <button className={estilos.modalCloseButton} onClick={cerrarModal} aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>
            <div className={estilos.modalBody}>
              <p className={estilos.modalMessage}>
                Usuario o contraseña incorrectos. Por favor, verifica tus credenciales e intenta nuevamente.
              </p>
            </div>
            <div className={estilos.modalFooter}>
              <button className={estilos.modalButton} onClick={cerrarModal}>
                Volver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de éxito al restablecer contraseña */}
      {mostrarModalExito && (
        <div className={estilos.modalOverlay} onClick={cerrarModalExito}>
          <div className={estilos.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={estilos.modalSuccessContent}>
              <div className={estilos.successIconContainer}>
                <CheckCircle className={estilos.successIcon} size={64} />
              </div>
              <h3 className={estilos.modalSuccessTitle}>¡Contraseña actualizada!</h3>
              <p className={estilos.modalSuccessMessage}>
                Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.
              </p>
            </div>
            <div className={estilos.modalFooter}>
              <button className={estilos.modalButton} onClick={cerrarModalExito}>
                Iniciar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
