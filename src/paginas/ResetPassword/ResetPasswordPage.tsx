import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useResetPassword } from '../../hooks/useResetPassword';
import estilos from './ResetPasswordPage.module.css';

interface ErroresValidacion {
  password?: string;
  confirmPassword?: string;
  general?: string;
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    cargando,
    validandoToken,
    datosUsuario,
    errorToken,
    validarToken,
    cambiarPassword
  } = useResetPassword();

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmPassword, setMostrarConfirmPassword] = useState(false);
  const [erroresValidacion, setErroresValidacion] = useState<ErroresValidacion>({});

  // Validar token al montar el componente
  useEffect(() => {
    if (token) {
      validarToken(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Validar campos
  const validarCampos = (): boolean => {
    const errores: ErroresValidacion = {};

    if (!password.trim()) {
      errores.password = 'La contraseña es requerida';
    } else if (password.length < 6) {
      errores.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!confirmPassword.trim()) {
      errores.confirmPassword = 'Por favor confirma tu contraseña';
    } else if (password !== confirmPassword) {
      errores.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErroresValidacion(errores);
    return Object.keys(errores).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarCampos()) {
      return;
    }

    setErroresValidacion({});
    cambiarPassword(token, e);
  };

  // Si está validando el token, mostrar loading
  if (validandoToken) {
    return (
      <div className={estilos.container}>
        <div className={estilos.modalOverlay}>
          <div className={estilos.modal}>
            <div className={estilos.loadingContainer}>
              <p>Validando token...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si hay error con el token, mostrar mensaje
  if (errorToken || !datosUsuario) {
    return (
      <div className={estilos.container}>
        <div className={estilos.modalOverlay}>
          <div className={estilos.modal}>
            <div className={estilos.errorContainer}>
              <h2 className={estilos.errorTitle}>Error</h2>
              <p className={estilos.errorMessage}>
                {errorToken || 'Token no válido'}
              </p>
              <button 
                className={estilos.button} 
                onClick={() => navigate('/login')}
              >
                Volver al Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={estilos.container}>
      <div className={estilos.modalOverlay}>
        <div className={estilos.modal}>
        <div className={estilos.modalContent}>
          <h2 className={estilos.title}>
            Hola {datosUsuario.nombre}, ingresa tu nueva contraseña
          </h2>

          {(erroresValidacion.general || error) && (
            <div className={estilos.errorGeneral}>
              {erroresValidacion.general || error}
            </div>
          )}

          <form className={estilos.form} onSubmit={handleSubmit}>
            <div className={estilos.inputGroup}>
              <label className={estilos.label}>Nueva contraseña</label>
              <div className={estilos.inputContainer}>
                <input
                  className={`${estilos.input} ${erroresValidacion.password ? estilos.inputError : ''}`}
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
              {erroresValidacion.password && (
                <span className={estilos.errorMensaje}>{erroresValidacion.password}</span>
              )}
            </div>

            <div className={estilos.inputGroup}>
              <label className={estilos.label}>Confirmar contraseña</label>
              <div className={estilos.inputContainer}>
                <input
                  className={`${estilos.input} ${erroresValidacion.confirmPassword ? estilos.inputError : ''}`}
                  type={mostrarConfirmPassword ? "text" : "password"}
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className={estilos.eyeButton}
                  onClick={() => setMostrarConfirmPassword(!mostrarConfirmPassword)}
                  aria-label={mostrarConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {mostrarConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {erroresValidacion.confirmPassword && (
                <span className={estilos.errorMensaje}>{erroresValidacion.confirmPassword}</span>
              )}
            </div>

            <button className={estilos.button} type="submit" disabled={cargando}>
              {cargando ? 'Actualizando...' : 'Actualizar'}
            </button>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
