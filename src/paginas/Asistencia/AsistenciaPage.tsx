import { useState, useEffect } from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import estilos from './Asistencia.module.css';

type TipoAsistencia = 'entrada' | 'inicioAlmuerzo' | 'finAlmuerzo' | 'salida';

interface ErroresValidacion {
    dni?: string;
}

function AsistenciaPage() {
    const [dni, setDni] = useState('');
    const [tipoAsistencia, setTipoAsistencia] = useState<TipoAsistencia>('entrada');
    const [hora, setHora] = useState('');
    const [fecha, setFecha] = useState('');
    const [erroresValidacion, setErroresValidacion] = useState<ErroresValidacion>({});
    const [cargando, setCargando] = useState(false);
    const [mostrarExito, setMostrarExito] = useState(false);
    const [slideIndex, setSlideIndex] = useState(0);

    // Actualizar hora y fecha en tiempo real
    useEffect(() => {
        const actualizarTiempo = () => {
            const ahora = new Date();
            const opcionesHora: Intl.DateTimeFormatOptions = {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
            };
            const opcionesFecha: Intl.DateTimeFormatOptions = {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
            };

            setHora(ahora.toLocaleTimeString('es-ES', opcionesHora));
            setFecha(ahora.toLocaleDateString('es-ES', opcionesFecha));
        };

        actualizarTiempo();
        const interval = setInterval(actualizarTiempo, 1000);

        return () => clearInterval(interval);
    }, []);

    // Carrusel de imágenes hardcodeadas
    const slides = [
        {
            title: "Control de asistencia",
            description: "Marca tu asistencia de forma rápida y sencilla. Registra tus entradas, salidas y tiempos de almuerzo con un solo clic.",
            image: (
                <svg width="400" height="300" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="400" height="300" fill="#ffffff" opacity="0.1" />
                    <rect x="50" y="50" width="300" height="200" rx="8" fill="#ffffff" opacity="0.2" />
                    <circle cx="200" cy="120" r="40" fill="#ffffff" opacity="0.2" />
                    <rect x="120" y="180" width="160" height="12" rx="4" fill="#ffffff" opacity="0.3" />
                    <rect x="120" y="210" width="120" height="12" rx="4" fill="#ffffff" opacity="0.3" />
                </svg>
            )
        },
        {
            title: "Registro preciso",
            description: "Sistema de registro de asistencia con precisión de segundos. Mantén un control detallado de tus horarios laborales.",
            image: (
                <svg width="400" height="300" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="400" height="300" fill="#ffffff" opacity="0.1" />
                    <rect x="50" y="50" width="300" height="200" rx="8" fill="#ffffff" opacity="0.2" />
                    <circle cx="200" cy="120" r="50" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.4" />
                    <line x1="200" y1="120" x2="200" y2="80" stroke="#ffffff" strokeWidth="3" opacity="0.4" />
                    <line x1="200" y1="120" x2="230" y2="130" stroke="#ffffff" strokeWidth="3" opacity="0.4" />
                </svg>
            )
        },
        {
            title: "Fácil de usar",
            description: "Interfaz intuitiva diseñada para que cualquier empleado pueda marcar su asistencia sin complicaciones.",
            image: (
                <svg width="400" height="300" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="400" height="300" fill="#ffffff" opacity="0.1" />
                    <rect x="50" y="50" width="300" height="200" rx="8" fill="#ffffff" opacity="0.2" />
                    <rect x="100" y="100" width="200" height="40" rx="6" fill="#ffffff" opacity="0.3" />
                    <rect x="100" y="160" width="200" height="40" rx="6" fill="#ffffff" opacity="0.3" />
                    <rect x="100" y="220" width="200" height="40" rx="6" fill="#ffffff" opacity="0.3" />
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

    // Validar DNI
    const validarDNI = (valor: string): boolean => {
        // DNI debe tener entre 8 y 12 caracteres numéricos
        const dniRegex = /^\d{8,12}$/;
        return dniRegex.test(valor);
    };

    const handleDNIChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valor = e.target.value.replace(/\D/g, ''); // Solo números
        setDni(valor);
        if (erroresValidacion.dni) {
            if (!valor.trim()) {
                setErroresValidacion({ dni: 'El DNI es requerido' });
            } else if (!validarDNI(valor)) {
                setErroresValidacion({ dni: 'El DNI debe tener entre 8 y 12 dígitos' });
            } else {
                setErroresValidacion({});
            }
        }
    };

    const handleDNIBlur = () => {
        if (!dni.trim()) {
            setErroresValidacion({ dni: 'El DNI es requerido' });
        } else if (!validarDNI(dni)) {
            setErroresValidacion({ dni: 'El DNI debe tener entre 8 y 12 dígitos' });
        } else {
            setErroresValidacion({});
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validar DNI
        if (!dni.trim()) {
            setErroresValidacion({ dni: 'El DNI es requerido' });
            return;
        }

        if (!validarDNI(dni)) {
            setErroresValidacion({ dni: 'El DNI debe tener entre 8 y 12 dígitos' });
            return;
        }

        setErroresValidacion({});
        setCargando(true);

        // Simular envío (aquí iría la llamada a la API)
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Mostrar mensaje de éxito
            setMostrarExito(true);
            setDni('');

            // Ocultar mensaje después de 3 segundos
            setTimeout(() => {
                setMostrarExito(false);
            }, 3000);
        } catch (error) {
            console.error('Error al marcar asistencia:', error);
        } finally {
            setCargando(false);
        }
    };

    const tiposAsistencia = [
        { id: 'entrada' as TipoAsistencia, label: 'Entrada', icon: Clock },
        { id: 'inicioAlmuerzo' as TipoAsistencia, label: 'Inicio Almuerzo', icon: Clock },
        { id: 'finAlmuerzo' as TipoAsistencia, label: 'Fin Almuerzo', icon: Clock },
        { id: 'salida' as TipoAsistencia, label: 'Salida', icon: Clock },
    ];

    return (
        <div className={estilos.contenedorAsistencia}>
            <div className={estilos.asistenciaWrapper}>
                {/* Formulario a la izquierda */}
                <div className={estilos.formularioContainer}>
                    <div className={estilos.logoContainer}>
                        <div className={estilos.logo}>
                            <img src="/logo.png" alt="Olympus" className={estilos.logoImage} />
                        </div>
                    </div>

                    {/* Hora y Fecha */}
                    <div className={estilos.tiempoContainer}>
                        <div className={estilos.hora}>{hora}</div>
                        <div className={estilos.fecha}>{fecha}</div>
                    </div>

                    <form className={estilos.formulario} onSubmit={handleSubmit}>
                        <div className={`${estilos.inputGroup} ${estilos.animateGroup}`} style={{ animationDelay: '0.1s' }}>
                            <label className={estilos.label}>Ingresa tu DNI:</label>
                            <input
                                className={`${estilos.input} ${erroresValidacion.dni ? estilos.inputError : ''}`}
                                type="text"
                                placeholder="DNI"
                                value={dni}
                                onChange={handleDNIChange}
                                onBlur={handleDNIBlur}
                                maxLength={12}
                            />
                            {erroresValidacion.dni && (
                                <span className={estilos.errorMensaje}>{erroresValidacion.dni}</span>
                            )}
                        </div>

                        {/* Botones de tipo de asistencia */}
                        <div className={`${estilos.tiposContainer} ${estilos.animateGroup}`} style={{ animationDelay: '0.2s' }}>
                            {tiposAsistencia.map((tipo, index) => {
                                const Icon = tipo.icon;
                                return (
                                    <button
                                        key={tipo.id}
                                        type="button"
                                        className={`${estilos.tipoButton} ${tipoAsistencia === tipo.id ? estilos.tipoButtonActive : ''}`}
                                        onClick={() => setTipoAsistencia(tipo.id)}
                                        style={{ animationDelay: `${0.25 + index * 0.05}s` }}
                                    >
                                        <Icon size={18} />
                                        <span>{tipo.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Mensaje de éxito */}
                        {mostrarExito && (
                            <div className={estilos.mensajeExito}>
                                <CheckCircle size={20} />
                                <span>Asistencia marcada exitosamente</span>
                            </div>
                        )}

                        <button
                            className={`${estilos.boton} ${cargando ? estilos.botonCargando : ''} ${estilos.animateGroup}`}
                            style={{ animationDelay: '0.4s' }}
                            type="submit"
                            disabled={cargando}
                        >
                            {cargando ? (
                                <>
                                    <span className={estilos.spinner}></span>
                                    <span>Marcando...</span>
                                </>
                            ) : (
                                <>
                                    <Clock size={20} />
                                    <span>Marcar Asistencia</span>
                                </>
                            )}
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
        </div>
    );
}

export default AsistenciaPage;
