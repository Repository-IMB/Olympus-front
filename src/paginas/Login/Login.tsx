import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, X, CheckCircle } from 'lucide-react';
import { useLogin } from '../../hooks/useLogin';
import estilos from './Login.module.css';

// IMPORTS NECESARIOS
import { jwtDecode } from 'jwt-decode';
import { setCookie } from '../../utils/cookies';
import { loginService } from '../../servicios/AutenticacionServicio';
import { permisosService } from '../../servicios/PermisosService';

interface ErroresValidacion {
  email?: string;
}

function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Del hook usamos solo los estados de los inputs
  const {
    correo,
    password,
    setCorreo,
    setPassword,
  } = useLogin();

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [erroresValidacion, setErroresValidacion] = useState<ErroresValidacion>({});
  const [touched, setTouched] = useState({ email: false });

  // Estados locales para control manual
  const [cargandoManual, setCargandoManual] = useState(false);
  const [mostrarModalError, setMostrarModalError] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);

  // --- Validaciones ---
  const validarEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validarCampoEmail = (valor: string) => {
    if (!valor.trim()) {
      setErroresValidacion({ email: 'El correo electrónico es requerido' });
    } else if (!validarEmail(valor)) {
      setErroresValidacion({ email: 'Por favor ingresa un correo electrónico válido' });
    } else {
      setErroresValidacion({});
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setCorreo(valor);
    if (touched.email) {
      validarCampoEmail(valor);
    }
  };

  const handleEmailBlur = () => {
    setTouched({ email: true });
    validarCampoEmail(correo);
  };

  // =========================================================
  // LOGICA PRINCIPAL DE LOGIN + REDIRECCION CORREGIDA
  // =========================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Validaciones UI
    setTouched({ email: true });
    if (!correo.trim()) {
      setErroresValidacion({ email: 'El correo electrónico es requerido' });
      return;
    }
    if (!validarEmail(correo)) {
      setErroresValidacion({ email: 'Por favor ingresa un correo electrónico válido' });
      return;
    }
    setErroresValidacion({});

    // 2. Iniciar proceso
    setCargandoManual(true);

    try {
        // A) Login Base (Obtener Token)
        const loginRes = await loginService.login({ correo, password });
        
        if (loginRes.token) {
            setCookie("token", loginRes.token);

            // B) Decodificar para sacar ID Usuario
            const decoded: any = jwtDecode(loginRes.token);
            const idUsuario = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] 
                              || decoded.sub 
                              || decoded.IdUsuario;

            // C) Obtener Contexto (Rol y Área reales)
            const dataUsuario = await permisosService.obtenerContexto(idUsuario, loginRes.token);

            if (dataUsuario) {
                 console.log("🕵️ DATOS CONTEXTO:", dataUsuario);

                 // D) Mapeo de Roles (String -> Number)
                 const ROLES_MAP: Record<string, number> = {
                    "Asesor": 1, 
                    "Supervisor": 2, 
                    "Gerente": 3, 
                    "Administrador": 4, 
                    "Desarrollador": 5, 
                    "Administrativo": 7 
                 };

                 const idRol = ROLES_MAP[dataUsuario.rol] || 0;
                 const idArea = dataUsuario.idAreaTrabajo || 0;

                 // E) Guardar Cookies
                 setCookie("idRol", idRol.toString());
                 setCookie("idAreaTrabajo", idArea.toString());

                 // F) REDIRECCIÓN INTELIGENTE (CORREGIDA) 🟢
                 // Prioridad 1: Área Ventas (8) -> Oportunidades
                 if (idArea === 8) {
                    navigate("/leads/Opportunities");
                 } 
                 // Prioridad 2: Área Desarrollo (2) -> Departamentos
                 else if (idArea === 2) {
                    navigate("/producto/departamentos");
                 } 
                 // Prioridad 3: Resto -> Dashboard
                 else {
                    navigate("/dashboard");
                 }

            } else {
                // Fallback si falla el contexto
                navigate("/dashboard");
            }
        } else {
            throw new Error("No se recibió token");
        }

    } catch (error) {
        console.error("Error en login:", error);
        setMostrarModalError(true);
        setCorreo('');
        setPassword('');
        setTouched({ email: false });
    } finally {
        setCargandoManual(false);
    }
  };

  // --- Configuración Carrusel ---
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

  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  useEffect(() => {
    if (location.state?.message) {
      setMostrarModalExito(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const cerrarModal = () => {
    setMostrarModalError(false);
  };

  const cerrarModalExito = () => {
    setMostrarModalExito(false);
  };

  return (
    <div className={estilos.contenedorLogin}>
      <div className={estilos.loginWrapper}>
        <div className={estilos.formularioContainer}>
          <div className={estilos.logoContainer}>
            <div className={estilos.logo}>
              <img src="/logo.png" alt="Olympus" style={{ width: 250 }} />
            </div>
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
            
            <button className={estilos.boton} type="submit" disabled={cargandoManual}>
              {cargandoManual ? 'Ingresando...' : 'Sign in'}
            </button>

            <p className={estilos.registerText}>
              <Link to="/forgot-password" className={estilos.forgotLink}>
                ¿Olvidaste tu contraseña?
              </Link>
            </p>
          </form>
        </div>

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