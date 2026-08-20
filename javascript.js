// ============================================================
// 0. HERO INTERACTIVO (frames, cursor)
// ============================================================
(function() {
    'use strict';

    var TOTAL = 60;
    var FPS = 30;

    function pad4(n) { return String(n).padStart(4, '0'); }
    function pad3(n) { return String(n).padStart(3, '0'); }

    var frameImg = document.getElementById('hero-frame');
    var loader = document.getElementById('loader');
    var loaderFill = document.getElementById('loader-fill');
    var loaderLabel = document.getElementById('loader-label');
    var gazeIndicator = document.getElementById('gaze-indicator');
    var interactionHint = document.getElementById('interaction-hint');
    var frameReadout = document.getElementById('frame-readout');

    var frames = [];
    var loaded = 0;
    var current = -1;
    var started = false;
    var lastProgress = -1;

    function mapMouseToFrame(progress) {
        var inverted = 1 - progress;
        var eased = easeInOutQuad(inverted);
        var frameIndex = Math.round(eased * (TOTAL - 1));
        return Math.max(0, Math.min(TOTAL - 1, frameIndex));
    }

    function easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    function finish() {
        if (started) return;
        started = true;
        loader.classList.add('is-done');
        frameReadout.classList.add('is-visible');
        setTimeout(function() {
            interactionHint.classList.add('fade-out');
        }, 4000);
        show(0);
    }

    function frameLoaded(src) {
        loaded++;
        var pct = Math.round((loaded / TOTAL) * 100);
        loaderFill.style.width = pct + '%';
        loaderLabel.textContent = loaded >= TOTAL
            ? 'Listo'
            : 'Cargando fotogramas… ' + pct + '%';
        if (loaded >= TOTAL) finish();
    }

    function preload() {
        var head = document.head;
        for (var i = 1; i <= TOTAL; i++) {
            var name = 'frame_' + pad4(i) + '.webp';

            var link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = 'frames/' + name;
            head.appendChild(link);

            (function (idx, src) {
                var img = new Image();
                img.onload = function () { frameLoaded(src); };
                img.onerror = function () { frameLoaded(src); };
                img.src = 'frames/' + src;
                frames[idx - 1] = img;
            })(i, name);
        }

        setTimeout(finish, 15000);
    }

    function show(idx) {
        if (idx === current) return;
        current = idx;
        var img = frames[idx];
        if (!img) return;
        if (img.complete && img.naturalWidth === 0) return;

        if (img.decode) {
            img.decode().then(function () {
                if (current === idx) {
                    frameImg.src = img.src;
                    frameImg.classList.add('is-ready');
                }
            }).catch(function () {
                frameImg.src = img.src;
                frameImg.classList.add('is-ready');
            });
        } else {
            frameImg.src = img.src;
            frameImg.classList.add('is-ready');
        }
    }

    function render(progress) {
        var frameIndex = mapMouseToFrame(progress);
        show(frameIndex);

        if (gazeIndicator) {
            var xPos = 50 + (1 - progress - 0.5) * 30;
            var yPos = 50 + Math.sin(progress * Math.PI) * 5;
            gazeIndicator.style.left = xPos + '%';
            gazeIndicator.style.top = yPos + '%';
            gazeIndicator.style.transform = 'translate(-50%, -50%) scale(' + (0.8 + Math.sin(progress * Math.PI * 2) * 0.1) + ')';
        }
    }

    var raf = null;

    function onMove(clientX) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
            raf = null;
            var w = window.innerWidth;
            var progress = w === 0 ? 0 : Math.max(0, Math.min(1, clientX / w));
            lastProgress = progress;
            render(progress);
        });
    }

    window.addEventListener('mousemove', function (e) {
        onMove(e.clientX);
    });

    window.addEventListener('touchmove', function (e) {
        var t = e.touches[0];
        if (t) onMove(t.clientX);
    }, { passive: true });

    setTimeout(function() {
        if (!started) return;
        if (lastProgress === -1) {
            render(0.5);
        }
    }, 2000);

    preload();

})();

// ============================================================
// 1. MENÚ DE NAVEGACIÓN (toggle)
// ============================================================
(function() {
    'use strict';

    var nav = document.getElementById('site-nav');
    var toggle = document.getElementById('nav-toggle');
    var links = document.querySelectorAll('.nav__links a');

    if (nav && toggle) {
        toggle.addEventListener('click', function () {
            var open = nav.classList.toggle('open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
        });

        links.forEach(function (link) {
            link.addEventListener('click', function () {
                nav.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
                toggle.setAttribute('aria-label', 'Abrir menú');
            });
        });
    }
})();

// ============================================================
// 2. REVEAL (IntersectionObserver)
// ============================================================
(function() {
    'use strict';

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var revealEls = document.querySelectorAll('.reveal');

    if (!('IntersectionObserver' in window) || reduceMotion) {
        revealEls.forEach(function (el) { el.classList.add('in-view'); });
        return;
    }

    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                io.unobserve(entry.target);
                setTimeout(function () {
                    entry.target.classList.remove('reveal');
                    entry.target.classList.remove('in-view');
                }, 800);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) { io.observe(el); });
})();

// ============================================================
// 3. FORMULARIO DE CONTACTO + SIMULADOR
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // ============================================================
    // FORMULARIO DE CONTACTO (CON FORMSUBMIT)
    // ============================================================
    const nombreInput = document.getElementById('nombre');
    const correoInput = document.getElementById('correo');
    const servicioSelect = document.getElementById('servicio');
    const empresaInput = document.getElementById('empresa');
    const whatsappInput = document.getElementById('whatsapp');
    const mensajeTextarea = document.getElementById('mensaje');
    const btnWhatsapp = document.getElementById('btn-whatsapp');
    const btnGmail = document.getElementById('btn-gmail');
    const successMessage = document.getElementById('form-success');

    // Solo ejecutar si los botones existen
    if (btnWhatsapp && btnGmail) {
        
        // ===== FUNCIÓN PARA VALIDAR =====
        function validarFormulario() {
            let isValid = true;

            // Validar nombre
            if (!nombreInput.value.trim()) {
                const errorNombre = nombreInput.parentElement.querySelector('.field-error');
                if (errorNombre) errorNombre.style.display = 'block';
                nombreInput.style.borderColor = 'red';
                isValid = false;
            } else {
                const errorNombre = nombreInput.parentElement.querySelector('.field-error');
                if (errorNombre) errorNombre.style.display = 'none';
                nombreInput.style.borderColor = '';
            }

            // Validar correo
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!correoInput.value.trim() || !emailRegex.test(correoInput.value)) {
                const errorCorreo = correoInput.parentElement.querySelector('.field-error');
                if (errorCorreo) errorCorreo.style.display = 'block';
                correoInput.style.borderColor = 'red';
                isValid = false;
            } else {
                const errorCorreo = correoInput.parentElement.querySelector('.field-error');
                if (errorCorreo) errorCorreo.style.display = 'none';
                correoInput.style.borderColor = '';
            }

            return isValid;
        }

        // ===== FUNCIÓN PARA OBTENER DATOS =====
        function obtenerDatos() {
            const contactoSeleccionado = [];
            document.querySelectorAll('input[name="contacto"]:checked').forEach(cb => {
                contactoSeleccionado.push(cb.value);
            });

            return {
                nombre: nombreInput.value.trim(),
                correo: correoInput.value.trim(),
                servicio: servicioSelect.value,
                empresa: empresaInput.value.trim(),
                whatsapp: whatsappInput.value.trim(),
                mensaje: mensajeTextarea.value.trim(),
                contacto: contactoSeleccionado
            };
        }

        // ===== FUNCIÓN PARA MOSTRAR ÉXITO =====
        function mostrarExito() {
            if (successMessage) {
                successMessage.style.display = 'block';
                setTimeout(() => {
                    successMessage.style.display = 'none';
                }, 5000);
            }
        }

        // ============================================================
        // ===== BOTÓN 1: WHATSAPP =====
        // ============================================================
        btnWhatsapp.addEventListener('click', function() {
            if (!validarFormulario()) return;

            const datos = obtenerDatos();
            
            let mensaje = `*Nuevo mensaje de contacto*\n\n`;
            mensaje += `*Nombre:* ${datos.nombre}\n`;
            mensaje += `*Correo:* ${datos.correo}\n`;
            if (datos.empresa) mensaje += `*Empresa:* ${datos.empresa}\n`;
            if (datos.whatsapp) mensaje += `*Teléfono:* ${datos.whatsapp}\n`;
            mensaje += `*Servicio:* ${servicioSelect.options[servicioSelect.selectedIndex].text}\n`;
            if (datos.contacto.length > 0) {
                mensaje += `*Contacto preferido:* ${datos.contacto.join(', ')}\n`;
            }
            if (datos.mensaje) mensaje += `\n*Mensaje:*\n${datos.mensaje}`;

            const numeroWhatsApp = '5491136239969';
            window.open(`https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`, '_blank');
            mostrarExito();
        });

        // ============================================================
        // ===== BOTÓN 2: ENVIAR POR EMAIL (FORMSUBMIT) =====
        // ============================================================
        form.addEventListener('submit', function(e) {
            if (!validarFormulario()) {
                e.preventDefault();
                return;
            }
            console.log('✅ Formulario enviado correctamente a FormSubmit');
        });

        // ============================================================
        // ===== OCULTAR ERRORES MIENTRAS ESCRIBEN =====
        // ============================================================
        nombreInput.addEventListener('input', function() {
            if (this.value.trim()) {
                const error = this.parentElement.querySelector('.field-error');
                if (error) error.style.display = 'none';
                this.style.borderColor = '';
            }
        });

        correoInput.addEventListener('input', function() {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (this.value.trim() && emailRegex.test(this.value)) {
                const error = this.parentElement.querySelector('.field-error');
                if (error) error.style.display = 'none';
                this.style.borderColor = '';
            }
        });
    }

    // ============================================================
    // SIMULADOR DE PRESUPUESTOS
    // ============================================================
    const serviceType = document.getElementById('sim-service-type');
    const projectType = document.getElementById('sim-project-type');
    const checkboxes = document.querySelectorAll('#sim-extra-seo, #sim-extra-analytics, #sim-extra-crm, #sim-extra-mantenimiento');
    const priceEl = document.getElementById('sim-price');
    const baseEl = document.getElementById('sim-base');
    const extrasEl = document.getElementById('sim-extras');
    const totalEl = document.getElementById('sim-total');
    const simCta = document.getElementById('sim-cta');

    if (serviceType && projectType) {
        const PRICES = {
            programacion: {
                'landing-replica': 100000,
                'landing-nueva': 200000,
                'one-page': 240000,
                'web-institucional': 400000,
                'web-woocommerce': 530000
            },
            diseno: {
                'landing-replica': 150000,
                'landing-nueva': 230000,
                'one-page-funnel': 350000,
                'web-institucional': 600000,
                'web-compleja': 800000
            },
            plantilla: {
                'landing-plantilla': 140000,
                'one-page-plantilla': 230000,
                'web-institucional-plantilla': 340000,
                'web-woocommerce-plantilla': 450000
            },
            apps: {
                'movil-basico': 500000,
                'movil-database': 1200000,
                'movil-compleja': 2500000,
                'escritorio-basico': 600000,
                'escritorio-profesional': 1500000
            }
        };

        const PROJECT_NAMES = {
            programacion: {
                'landing-replica': 'Landing réplica (basada en web existente)',
                'landing-nueva': 'Landing nueva',
                'one-page': 'One Page',
                'web-institucional': 'Web institucional (hasta 6 subpáginas + Home + Contacto)',
                'web-woocommerce': 'Web institucional + WooCommerce'
            },
            diseno: {
                'landing-replica': 'Landing réplica',
                'landing-nueva': 'Landing nueva',
                'one-page-funnel': 'One Page estilo Funnel (5 bloques)',
                'web-institucional': 'Web institucional (hasta 6 subpáginas + Home + Contacto)',
                'web-compleja': 'Web compleja (Tienda + Pasarela de pago + Especiales)'
            },
            plantilla: {
                'landing-plantilla': 'Landing sobre plantilla',
                'one-page-plantilla': 'One Page sobre plantilla',
                'web-institucional-plantilla': 'Web institucional sobre plantilla',
                'web-woocommerce-plantilla': 'Web institucional + WooCommerce sobre plantilla'
            },
            apps: {
                'movil-basico': 'App Móvil (Catálogo) - Desde $500.000',
                'movil-database': 'App Móvil (Login / Base de Datos) - Desde $1.200.000',
                'movil-compleja': 'App Móvil Premium (Pagos / GPS) - Desde $2.500.000',
                'escritorio-basico': 'App Escritorio (Gestión básica) - Desde $600.000',
                'escritorio-profesional': 'App Escritorio Profesional - Desde $1.500.000'
            }
        };

        const EXTRA_PERCENTS = {
            seo: 0.15,
            analytics: 0.10,
            crm: 0.12,
            mantenimiento: 0.18
        };

        const EXTRA_NAMES = {
            seo: 'Optimización SEO avanzada',
            analytics: 'Google Analytics / Tag Manager',
            crm: 'Integración con CRM',
            mantenimiento: 'Mantenimiento 3 meses'
        };

        let currentTotal = 0;
        let currentProjectName = '';

        function formatPrice(value) {
            return '$' + value.toLocaleString('es-AR');
        }

        function updateProjectOptions() {
            const service = serviceType.value;
            const projects = PRICES[service];
            const names = PROJECT_NAMES[service];

            projectType.innerHTML = '';
            Object.keys(projects).forEach(key => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = names[key];
                projectType.appendChild(option);
            });

            updatePrice();
        }

        function updatePrice() {
            const service = serviceType.value;
            const projectKey = projectType.value;
            const basePrice = PRICES[service]?.[projectKey] || 0;

            const selectedOption = projectType.options[projectType.selectedIndex];
            currentProjectName = selectedOption ? selectedOption.textContent : '';

            let extraTotal = 0;
            let extrasList = [];
            checkboxes.forEach(cb => {
                if (cb.checked) {
                    const percent = EXTRA_PERCENTS[cb.value] || 0;
                    const extra = Math.round(basePrice * percent);
                    extraTotal += extra;
                    extrasList.push(EXTRA_NAMES[cb.value]);
                }
            });

            currentTotal = basePrice + extraTotal;

            priceEl.textContent = formatPrice(currentTotal);
            baseEl.textContent = formatPrice(basePrice);
            extrasEl.textContent = extraTotal > 0 ? formatPrice(extraTotal) : '$0';
            totalEl.textContent = formatPrice(currentTotal);

            if (simCta) {
                simCta.setAttribute('data-proyecto', currentProjectName);
                simCta.setAttribute('data-total', currentTotal);
                simCta.removeEventListener('click', handleSimCtaClick);
                simCta.addEventListener('click', handleSimCtaClick);
            }
        }

        function handleSimCtaClick(e) {
            e.preventDefault();

            const proyecto = this.getAttribute('data-proyecto') || 'Proyecto sin nombre';
            const total = this.getAttribute('data-total') || '0';

            if (mensajeTextarea) {
                mensajeTextarea.value = `Me interesa el siguiente proyecto:\n${proyecto}\nPresupuesto estimado: $${Number(total).toLocaleString('es-AR')}`;
            }

            const contactoSection = document.getElementById('contacto');
            if (contactoSection) {
                contactoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

        serviceType.addEventListener('change', updateProjectOptions);
        projectType.addEventListener('change', updatePrice);
        checkboxes.forEach(cb => cb.addEventListener('change', updatePrice));

        updateProjectOptions();
    }

    // ============================================================
    // RECIBIR PRESUPUESTO DESDE LA URL
    // ============================================================
    function getParamsFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const presupuesto = params.get('presupuesto');
        const total = params.get('total');
        if (presupuesto && mensajeTextarea) {
            setTimeout(() => {
                if (mensajeTextarea.value.trim() === '') {
                    mensajeTextarea.value = `Me interesa el siguiente proyecto:\n${decodeURIComponent(presupuesto)}\nPresupuesto estimado: ${total ? '$' + total : ''}`;
                }
            }, 500);
        }
    }
    getParamsFromUrl();

}); // <--- FIN DEL DOMContentLoaded

// ============================================================
// 4. MODAL CV (Quién soy)
// ============================================================
(function() {
    'use strict';

    var modal = document.getElementById('modal-cv');
    var btnCerrar = document.getElementById('modal-cerrar');
    var btnQuienSoyHero = document.getElementById('btn-quien-soy');
    var btnQuienSoyNav = document.getElementById('btn-quien-soy-nav');

    function abrirModal(e) {
        if (e) e.preventDefault();

        var nav = document.getElementById('site-nav');
        if (nav && nav.classList.contains('open')) {
            nav.classList.remove('open');
            var toggle = document.getElementById('nav-toggle');
            if (toggle) {
                toggle.setAttribute('aria-expanded', 'false');
                toggle.setAttribute('aria-label', 'Abrir menú');
            }
        }

        modal.style.display = 'flex';
        void modal.offsetWidth;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function cerrarModal() {
        modal.classList.remove('active');
        setTimeout(function() {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }

    if (btnQuienSoyHero) btnQuienSoyHero.addEventListener('click', abrirModal);
    if (btnQuienSoyNav) btnQuienSoyNav.addEventListener('click', abrirModal);
    if (btnCerrar) btnCerrar.addEventListener('click', cerrarModal);

    modal.addEventListener('click', function(e) {
        if (e.target === modal) cerrarModal();
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            cerrarModal();
        }
    });
})();

// ============================================================
// 5. MODALES DE PROYECTOS
// ============================================================
(function() {
    'use strict';

    function abrirModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.warn('Modal no encontrado:', modalId);
            return;
        }

        document.querySelectorAll('.modal-overlay.active').forEach(m => {
            m.classList.remove('active');
            m.style.display = 'none';
        });

        modal.style.display = 'flex';
        void modal.offsetWidth;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        console.log('Modal abierto:', modalId);
    }

    function cerrarModal(modal) {
        modal.classList.remove('active');
        setTimeout(function() {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }

    document.querySelectorAll('.project-card').forEach(function(card) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function(e) {
            if (e.target.closest('a')) return;
            const modalId = this.getAttribute('data-modal');
            if (modalId) {
                abrirModal(modalId);
            }
        });
    });

    document.querySelectorAll('.modal-close').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal-overlay');
            if (modal) cerrarModal(modal);
        });
    });

    document.querySelectorAll('.modal-overlay').forEach(function(modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) cerrarModal(this);
        });
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(function(modal) {
                cerrarModal(modal);
            });
        }
    });

    document.querySelectorAll('[data-modal-close]').forEach(function(el) {
        el.addEventListener('click', function(e) {
            const modal = this.closest('.modal-overlay');
            if (modal) cerrarModal(modal);
        });
    });

    console.log('✅ Script de modales de proyectos cargado correctamente');
    console.log('📦 Tarjetas encontradas:', document.querySelectorAll('.project-card').length);
    console.log('📦 Modales encontrados:', document.querySelectorAll('.modal-overlay[id^="modal-proyecto-"]').length);
})();

// ============================================================
// 6. REPRODUCTOR DE VIDEO
// ============================================================
(function() {
    'use strict';

    const modalVideo = document.getElementById('modal-video');
    const videoElement = document.getElementById('video-reproductor');

    function abrirVideo(videoSrc) {
        if (!modalVideo || !videoElement) {
            console.warn('Modal o video no encontrado');
            return;
        }

        document.querySelectorAll('.modal-overlay.active').forEach(m => {
            m.classList.remove('active');
            m.style.display = 'none';
        });

        document.querySelectorAll('video').forEach(v => v.pause());

        videoElement.src = videoSrc;
        videoElement.load();

        modalVideo.style.display = 'flex';
        void modalVideo.offsetWidth;
        modalVideo.classList.add('active');
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            videoElement.play().catch(function(error) {
                console.log('Autoplay bloqueado por el navegador:', error);
            });
        }, 300);
    }

    function cerrarVideo(modal) {
        if (videoElement) {
            videoElement.pause();
            videoElement.src = '';
            videoElement.load();
        }
        modal.classList.remove('active');
        setTimeout(function() {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }

    document.querySelectorAll('[data-video]').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const videoSrc = this.getAttribute('data-video');
            console.log('▶️ Reproduciendo video:', videoSrc);
            if (videoSrc) {
                abrirVideo(videoSrc);
            }
        });
    });

    document.querySelectorAll('#modal-video .modal-close').forEach(function(btn) {
        btn.addEventListener('click', function() {
            cerrarVideo(modalVideo);
        });
    });

    if (modalVideo) {
        modalVideo.addEventListener('click', function(e) {
            if (e.target === this) {
                cerrarVideo(this);
            }
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modalVideo && modalVideo.classList.contains('active')) {
            cerrarVideo(modalVideo);
        }
    });

    console.log('✅ Script de video cargado correctamente');
    console.log('📹 Botones "Ver demo" encontrados:', document.querySelectorAll('[data-video]').length);
})();
