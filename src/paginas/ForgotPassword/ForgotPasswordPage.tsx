import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useForgotPassword } from '../../hooks/useForgotPassword';
import estilos from './ForgotPasswordPage.module.css';

interface ErroresValidacion {
  email?: string;
}

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const {
    correo,
    setCorreo,
    error,
    cargando,
    exito,
    solicitarRecuperacion
  } = useForgotPassword();
  
  const [erroresValidacion, setErroresValidacion] = useState<ErroresValidacion>({});
  const [touched, setTouched] = useState({ email: false });

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
  const handleSubmit = async (e: React.FormEvent) => {
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

    // Proceder con la solicitud
    solicitarRecuperacion(e);
  };

  // Carrusel de imágenes hardcodeadas (igual que Login)
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

  const [slideIndex, setSlideIndex] = useState(0);

  // Auto-avanzar el carrusel
  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);


  return (
    <div className={estilos.contenedorLogin}>
      <div className={estilos.loginWrapper}>
        {/* Formulario a la izquierda */}
        <div className={estilos.formularioContainer}>
          <div className={estilos.logoContainer}>
            <div className={estilos.logo}>
              <img src="/logo.png" alt="Olympus" style={{ width: 250 }} />
            </div>
          </div>

          <form className={estilos.formulario} onSubmit={handleSubmit}>
            <h2 className={estilos.titulo}>Recuperar Contraseña</h2>
            <p className={estilos.subtitulo}>
              Ingresa tu correo electrónico y te enviaremos las instrucciones para recuperar tu contraseña.
            </p>

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
              {error && !erroresValidacion.email && (
                <span className={estilos.errorMensaje}>{error}</span>
              )}
            </div>
            
            <button className={estilos.boton} type="submit" disabled={cargando}>
              {cargando ? 'Enviando...' : 'Recuperar'}
            </button>

            <p className={estilos.registerText}>
              ¿Recordaste tu contraseña? <Link to="/login" className={estilos.registerLink}>Volver al Login</Link>
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

      {/* Modal de éxito */}
      {exito && (
        <div className={estilos.modalOverlay} onClick={() => navigate('/login')}>
          <div className={estilos.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={estilos.modalSuccessContent}>
              <div className={estilos.successIconContainer}>
                <CheckCircle className={estilos.successIcon} size={64} />
              </div>
              <h3 className={estilos.modalSuccessTitle}>¡Correo enviado!</h3>
              <p className={estilos.modalSuccessMessage}>
                Hemos enviado las instrucciones para recuperar tu contraseña a <strong>{correo}</strong>. 
                Por favor, revisa tu bandeja de entrada.
              </p>
            </div>
            <div className={estilos.modalFooter}>
              <button className={estilos.modalButton} onClick={() => navigate('/login')}>
                Volver al Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ForgotPasswordPage;
